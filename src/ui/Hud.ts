import type Phaser from 'phaser';
import { START_HEALTH } from '../game/config.ts';
import type { Run } from '../game/run.ts';
import { HUD_HEIGHT, WIDTH } from './layout.ts';
import { COLORS, textStyle } from './theme.ts';

const HEALTH_BAR_WIDTH = 180;

export class Hud {
  private readonly healthFill: Phaser.GameObjects.Rectangle;
  private readonly health: Phaser.GameObjects.Text;
  private readonly wave: Phaser.GameObjects.Text;
  private readonly score: Phaser.GameObjects.Text;
  private readonly best: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    const mid = HUD_HEIGHT / 2;
    scene.add.rectangle(0, 0, WIDTH, HUD_HEIGHT, COLORS.panel, 0.9).setOrigin(0);
    scene.add.rectangle(0, HUD_HEIGHT, WIDTH, 1, COLORS.panelEdge).setOrigin(0);
    scene.add.text(24, mid, 'QU-K', textStyle(18, COLORS.accent, { letterSpacing: 4 })).setOrigin(0, 0.5);

    scene.add.rectangle(130, mid, HEALTH_BAR_WIDTH, 12, COLORS.danger, 0.2).setOrigin(0, 0.5);
    this.healthFill = scene.add.rectangle(130, mid, HEALTH_BAR_WIDTH, 12, COLORS.danger).setOrigin(0, 0.5);
    this.health = scene.add.text(130 + HEALTH_BAR_WIDTH + 12, mid, '', textStyle(15)).setOrigin(0, 0.5);

    this.wave = scene.add.text(500, mid, '', textStyle(16, COLORS.text, { fontStyle: 'bold' })).setOrigin(0, 0.5);
    this.score = scene.add.text(760, mid, '', textStyle(16)).setOrigin(0, 0.5);
    this.best = scene.add.text(WIDTH - 24, mid, '', textStyle(14, COLORS.textDim)).setOrigin(1, 0.5);
  }

  refresh(run: Run, best: number): void {
    this.healthFill.setScale(run.health / START_HEALTH, 1);
    this.health.setText(`♥ ${run.health}`);
    this.wave.setText(`WAVE ${run.wave}`);
    this.score.setText(`SCORE ${run.score}`);
    this.best.setText(`BEST ${Math.max(best, run.score)}`);
  }
}
