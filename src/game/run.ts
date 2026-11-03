import { Board } from './board.ts';
import { DAMAGE_PER_LEAK, POINTS_PER_KILL, START_HEALTH, WAVE_CLEAR_POINTS } from './config.ts';
import type { PresetId } from '../quantum/presets.ts';
import { GATE_ORDER, type GateId } from './gates.ts';
import { gateStock } from './progression.ts';
import { mulberry32, type Random } from './rng.ts';
import { customWave, generateWave, type WaveSpec } from './waves.ts';

/** State of one endless run: health, score, the current wave and the trap board. */
export class Run {
  readonly seed: number;
  readonly board = new Board();
  /** Drives detector measurements; separate from wave generation so previews stay stable. */
  readonly measureRandom: Random;
  wave = 1;
  health = START_HEALTH;
  score = 0;
  waveSpec: WaveSpec;
  /** Replaces the wave's usual stock while a custom challenge is up. */
  private stockOverride: Record<GateId, number> | null = null;

  constructor(seed: number, startWave = 1) {
    this.seed = seed >>> 0;
    this.wave = startWave;
    this.measureRandom = mulberry32(this.seed ^ 0x5bd1e995);
    this.waveSpec = generateWave(this.wave, this.seed);
  }

  get stock(): Record<GateId, number> {
    return this.stockOverride ?? gateStock(this.wave);
  }

  get isOver(): boolean {
    return this.health <= 0;
  }

  /** Returns the points awarded. */
  recordKill(): number {
    this.score += POINTS_PER_KILL;
    return POINTS_PER_KILL;
  }

  recordLeak(): void {
    this.health = Math.max(0, this.health - DAMAGE_PER_LEAK);
  }

  /** Closes the current wave and prepares the next one; returns the points paid for surviving it. */
  completeWave(): number {
    this.score += WAVE_CLEAR_POINTS;
    this.jumpTo(this.wave + 1);
    return WAVE_CLEAR_POINTS;
  }

  /** Moves to `wave` without playing or scoring anything in between. */
  jumpTo(wave: number): void {
    this.wave = Math.max(1, Math.floor(wave));
    this.stockOverride = null;
    this.waveSpec = generateWave(this.wave, this.seed);
    this.dropOverflowingTraps();
  }

  /** Replaces the upcoming wave with a hand-made one, played with `stock` gates. */
  setChallenge(lanes: readonly (readonly PresetId[])[], stock: Readonly<Record<GateId, number>>): void {
    this.stockOverride = { ...stock };
    this.waveSpec = customWave(this.wave, lanes);
    this.dropOverflowingTraps();
  }

  /** Clears the board when the stock no longer covers the traps already on it. */
  private dropOverflowingTraps(): void {
    if (GATE_ORDER.some((gate) => this.board.available(gate, this.stock) < 0)) this.board.clear();
  }
}
