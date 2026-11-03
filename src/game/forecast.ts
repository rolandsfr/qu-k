import { presetState, type PresetId } from '../quantum/presets.ts';
import type { Bit } from '../quantum/state.ts';
import type { Board } from './board.ts';
import { TARGET_OUTCOME } from './config.ts';
import { GATES, type GateId } from './gates.ts';
import type { WaveSpec } from './waves.ts';

export interface StateForecast {
  readonly preset: PresetId;
  readonly count: number;
  /** Probability that one such enemy collapses to the target. */
  readonly killChance: number;
}

export interface LaneForecast {
  readonly lane: number;
  readonly states: readonly StateForecast[];
  readonly expectedLeaks: number;
}

export interface WaveForecast {
  readonly lanes: readonly LaneForecast[];
  readonly enemyCount: number;
  readonly expectedLeaks: number;
}

/** Runs a spawn state through a lane's circuit and returns P(target) at the detector. */
export function killChance(preset: PresetId, circuit: readonly GateId[], target: Bit = TARGET_OUTCOME): number {
  const state = presetState(preset);
  for (const gate of circuit) state.apply(GATES[gate].matrix, 0);
  return state.probability(0, target);
}

/** Expected outcome of the upcoming wave against the board as it stands. */
export function forecastWave(wave: WaveSpec, board: Board): WaveForecast {
  const lanes: LaneForecast[] = [];
  for (let lane = 0; lane < board.lanes; lane++) {
    const counts = new Map<PresetId, number>();
    for (const enemy of wave.enemies) {
      if (enemy.lane === lane) counts.set(enemy.preset, (counts.get(enemy.preset) ?? 0) + 1);
    }
    if (counts.size === 0) continue;

    const circuit = board.circuit(lane);
    const states = [...counts].map(([preset, count]) => ({ preset, count, killChance: killChance(preset, circuit) }));
    const expectedLeaks = states.reduce((sum, s) => sum + s.count * (1 - s.killChance), 0);
    lanes.push({ lane, states, expectedLeaks });
  }

  return {
    lanes,
    enemyCount: wave.enemies.length,
    expectedLeaks: lanes.reduce((sum, lane) => sum + lane.expectedLeaks, 0),
  };
}
