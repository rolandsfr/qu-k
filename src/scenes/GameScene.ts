import Phaser from 'phaser';
import { CELLS_PER_LANE, START_HEALTH } from '../game/config.ts';
import { forecastWave } from '../game/forecast.ts';
import { GATE_ORDER, type GateId } from '../game/gates.ts';
import { loadHighScore, submitHighScore } from '../game/highScore.ts';
import { Run } from '../game/run.ts';
import type { Showcase } from '../game/showcase.ts';
import { WaveSim, type SimEvent } from '../game/waveSim.ts';
import { BoardView, preloadBoard } from '../ui/BoardView.ts';
import { DebugPanel, debugEnabled } from '../ui/DebugPanel.ts';
import { banner, drawBackdrop, floatText, preloadBackdrop } from '../ui/effects.ts';
import { EnemyView } from '../ui/EnemyView.ts';
import { drawFrame, drawTitle } from '../ui/frame.ts';
import { GatePalette } from '../ui/GatePalette.ts';
import { Hud } from '../ui/Hud.ts';
import {
  BOARD_BOTTOM,
  BOARD_LEFT,
  BOARD_RIGHT,
  fitCamera,
  FRAME_BOTTOM,
  FRAME_TOP,
  GATES_TOP,
  LANE_HEIGHT,
  LANE_TOP,
  laneY,
  PANEL_WIDTH,
  PANEL_X,
  trackX,
} from '../ui/layout.ts';
import { COLORS } from '../ui/theme.ts';
import { WavePreview } from '../ui/WavePreview.ts';
import { SceneKeys, type GameOverData } from './keys.ts';

/** build: the player edits traps · wave: the sim runs · resolving: short pause between phases. */
type Phase = 'build' | 'wave' | 'resolving';

const BOARD_CENTER_X = trackX((CELLS_PER_LANE - 1) / 2);
const BOARD_CENTER_Y = LANE_TOP + 2 * LANE_HEIGHT;

export class GameScene extends Phaser.Scene {
  private run!: Run;
  private phase: Phase = 'build';
  private selected: GateId | null = null;
  private sim: WaveSim | null = null;
  private debugPanel: DebugPanel | null = null;
  private readonly enemyViews = new Map<number, EnemyView>();
  private bestScore = 0;

  private boardView!: BoardView;
  private palette!: GatePalette;
  private hud!: Hud;
  private preview!: WavePreview;

  constructor() {
    super(SceneKeys.Game);
  }

  preload(): void {
    preloadBackdrop(this);
    preloadBoard(this);
  }

  create(): void {
    fitCamera(this);
    const params = new URLSearchParams(window.location.search);
    this.run = new Run(runSeed(params), debugStartWave(params));
    this.phase = 'build';
    this.selected = 'X';
    this.sim = null;
    this.enemyViews.clear();
    this.bestScore = loadHighScore();

    drawBackdrop(this, 0.6);
    drawFrame(this, BOARD_LEFT, FRAME_TOP, BOARD_RIGHT - BOARD_LEFT, BOARD_BOTTOM - FRAME_TOP, 'PERIMETER');
    drawTitle(this, BOARD_LEFT, GATES_TOP, 'GATES');
    drawFrame(this, PANEL_X, FRAME_TOP, PANEL_WIDTH, FRAME_BOTTOM - FRAME_TOP, 'FORECAST');
    this.boardView = new BoardView(this, this.run.board, (lane, cell, secondary) => this.onCell(lane, cell, secondary));
    this.palette = new GatePalette(this, (gate) => this.select(gate));
    this.hud = new Hud(this);
    this.preview = new WavePreview(this, () => this.startWave());

    this.input.mouse?.disableContextMenu();
    const keyboard = this.input.keyboard;
    keyboard?.on('keydown-SPACE', () => this.startWave());
    keyboard?.on('keydown-ENTER', () => this.startWave());
    keyboard?.on('keydown-ESC', () => this.select(null));
    keyboard?.on('keydown', (event: KeyboardEvent) => {
      const gate = GATE_ORDER[Number(event.key) - 1];
      if (gate) this.select(gate);
    });

    if (debugEnabled(params)) {
      const panel = new DebugPanel((showcase) => this.loadShowcase(showcase));
      this.debugPanel = panel;
      this.events.once('shutdown', () => panel.destroy());
    }

    this.refresh();
    banner(this, BOARD_CENTER_X, BOARD_CENTER_Y, `WAVE ${this.run.wave}`, COLORS.accent);
  }

  update(_time: number, deltaMs: number): void {
    const sim = this.sim;
    if (this.phase !== 'wave' || !sim) return;

    // Clamped so a frame hitch does not make enemies jump visibly; the sim itself handles any step size.
    const speed = this.debugPanel?.speed ?? 1;
    for (const event of sim.step((Math.min(deltaMs, 100) / 1000) * speed)) {
      this.handle(event);
      if (this.phase !== 'wave') return;
    }
    for (const view of this.enemyViews.values()) {
      if (view.enemy.status === 'walking') view.x = trackX(view.enemy.position);
    }
    if (sim.finished) this.finishWave();
  }

  private select(gate: GateId | null): void {
    if (gate !== null && this.run.stock[gate] === 0) return;
    this.selected = gate;
    this.refresh();
  }

  private onCell(lane: number, cell: number, secondary: boolean): void {
    if (this.phase !== 'build') return;
    const board = this.run.board;
    const existing = board.get(lane, cell);
    if (existing !== null) {
      board.remove(lane, cell);
      // Left-click picks the trap up so it can be placed elsewhere; right-click just removes it.
      if (!secondary) this.selected = existing;
    } else if (!secondary && this.selected !== null) {
      if (!board.place(lane, cell, this.selected, this.run.stock)) {
        floatText(this, trackX(cell), laneY(lane), `no ${this.selected} left`, COLORS.danger);
      }
    }
    this.refresh();
  }

  private startWave(): void {
    if (this.phase !== 'build') return;
    this.phase = 'wave';
    this.sim = new WaveSim(this.run.waveSpec, this.run.board, this.run.measureRandom);
    this.refresh();
  }

  private handle(event: SimEvent): void {
    const { enemy } = event;
    switch (event.kind) {
      case 'spawn':
        this.enemyViews.set(enemy.id, new EnemyView(this, enemy));
        break;

      case 'gate': {
        const view = this.enemyViews.get(enemy.id);
        view?.refresh();
        this.boardView.pulseTrap(enemy.spec.lane, event.cell);
        break;
      }

      case 'measure': {
        this.enemyViews.get(enemy.id)?.destroy();
        this.enemyViews.delete(enemy.id);
        this.boardView.measure(enemy.spec.lane, event.outcome, event.destroyed);
        if (event.destroyed) this.run.recordKill();
        else this.run.recordLeak();
        this.saveScore();
        this.hud.refresh(this.run, this.bestScore);
        if (this.run.isOver) this.endRun();
        break;
      }
    }
  }

  private finishWave(): void {
    this.phase = 'resolving';
    this.sim = null;
    this.time.delayedCall(600, () => {
      const cleared = this.run.wave;
      const points = this.run.completeWave();
      this.saveScore();
      banner(this, BOARD_CENTER_X, BOARD_CENTER_Y, `WAVE ${cleared} SURVIVED  +${points}`, COLORS.text);
      this.phase = 'build';
      this.refresh();
    });
  }

  private endRun(): void {
    this.phase = 'resolving';
    this.sim = null;
    banner(this, BOARD_CENTER_X, BOARD_CENTER_Y, 'BASE OVERRUN', COLORS.danger);
    const result: GameOverData = { score: this.run.score, wave: this.run.wave, isRecord: this.run.score > this.bestScore };
    this.time.delayedCall(1400, () => this.scene.start(SceneKeys.GameOver, result));
  }

  /** Debug panel: drops any wave in progress and sets up `showcase` as the next wave, at full health. */
  private loadShowcase(showcase: Showcase): void {
    if (this.phase === 'resolving') return;
    for (const view of this.enemyViews.values()) view.destroy();
    this.enemyViews.clear();
    this.sim = null;
    this.phase = 'build';
    this.run.setChallenge(showcase.lanes, showcase.stock);
    this.run.health = START_HEALTH;
    if (this.selected !== null && this.run.stock[this.selected] === 0) this.selected = null;
    this.refresh();
    banner(this, BOARD_CENTER_X, BOARD_CENTER_Y, showcase.title.toUpperCase(), COLORS.accent);
  }

  /** Persists the score as it grows, so a refresh mid-run keeps the record. */
  private saveScore(): void {
    submitHighScore(this.run.score);
  }

  private refresh(): void {
    const editable = this.phase === 'build';
    this.hud.refresh(this.run, this.bestScore);
    const incoming = Array.from({ length: this.run.board.lanes }, (_, lane) =>
      this.run.waveSpec.enemies.filter((enemy) => enemy.lane === lane).length,
    );
    this.boardView.refresh(this.run.board, editable, incoming);
    this.palette.refresh(this.run, this.selected, editable);
    this.preview.refresh(this.run, forecastWave(this.run.waveSpec, this.run.board), editable);
  }
}

/** `?seed=123` in the URL replays the same run, which helps when tuning waves. */
function runSeed(params: URLSearchParams): number {
  const seed = params.get('seed');
  return seed !== null && /^\d+$/.test(seed) ? Number(seed) : Math.floor(Math.random() * 2 ** 32);
}

/** `?wave=8` jumps straight to a later wave, in dev builds only. */
function debugStartWave(params: URLSearchParams): number {
  const wave = Number(params.get('wave'));
  return import.meta.env.DEV && Number.isInteger(wave) && wave > 1 ? wave : 1;
}
