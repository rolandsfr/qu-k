import { presetState } from '../quantum/presets.ts';
import type { Bit, QuantumState } from '../quantum/state.ts';
import type { Board } from './board.ts';
import { ENEMY_SPEED, SPAWN_POSITION, TARGET_OUTCOME } from './config.ts';
import { GATES, type GateId } from './gates.ts';
import type { Random } from './rng.ts';
import type { EnemySpec, WaveSpec } from './waves.ts';

export type EnemyStatus = 'waiting' | 'walking' | 'destroyed' | 'leaked';

export interface LiveEnemy {
  readonly id: number;
  readonly spec: EnemySpec;
  readonly state: QuantumState;
  /** Track coordinate, see SPAWN_POSITION. */
  position: number;
  status: EnemyStatus;
  /** First cell whose trap this enemy has not passed yet. */
  nextCell: number;
}

export type SimEvent =
  | { readonly kind: 'spawn'; readonly enemy: LiveEnemy }
  | { readonly kind: 'gate'; readonly enemy: LiveEnemy; readonly gate: GateId; readonly cell: number }
  | { readonly kind: 'measure'; readonly enemy: LiveEnemy; readonly outcome: Bit; readonly destroyed: boolean };

/**
 * Plays one wave out against a board: enemies walk their lane, every trap they
 * cross applies its gate, and the detector after the last cell measures them.
 * The board must not change while the wave runs.
 */
export class WaveSim {
  readonly enemies: readonly LiveEnemy[];
  private readonly board: Board;
  private readonly random: Random;
  private time = 0;

  constructor(wave: WaveSpec, board: Board, random: Random) {
    this.board = board;
    this.random = random;
    this.enemies = wave.enemies.map((spec, id) => ({
      id,
      spec,
      state: presetState(spec.preset),
      position: SPAWN_POSITION,
      status: 'waiting',
      nextCell: 0,
    }));
  }

  get finished(): boolean {
    return this.enemies.every((enemy) => enemy.status === 'destroyed' || enemy.status === 'leaked');
  }

  /** Advances the wave by `dt` seconds and returns what happened, in order. */
  step(dt: number): SimEvent[] {
    this.time += dt;
    const events: SimEvent[] = [];
    for (const enemy of this.enemies) {
      if (enemy.status === 'waiting') {
        if (this.time < enemy.spec.spawnAt) continue;
        enemy.status = 'walking';
        enemy.position = SPAWN_POSITION + (this.time - enemy.spec.spawnAt) * ENEMY_SPEED;
        events.push({ kind: 'spawn', enemy });
      } else if (enemy.status === 'walking') {
        enemy.position += ENEMY_SPEED * dt;
      } else {
        continue;
      }
      this.resolve(enemy, events);
    }
    return events;
  }

  private resolve(enemy: LiveEnemy, events: SimEvent[]): void {
    while (enemy.nextCell < this.board.cells && enemy.position >= enemy.nextCell) {
      const cell = enemy.nextCell++;
      const gate = this.board.get(enemy.spec.lane, cell);
      if (gate === null) continue;
      enemy.state.apply(GATES[gate].matrix, 0);
      events.push({ kind: 'gate', enemy, gate, cell });
    }
    if (enemy.position >= this.board.cells) {
      const outcome = enemy.state.measure(0, this.random);
      const destroyed = outcome === TARGET_OUTCOME;
      enemy.status = destroyed ? 'destroyed' : 'leaked';
      events.push({ kind: 'measure', enemy, outcome, destroyed });
    }
  }
}
