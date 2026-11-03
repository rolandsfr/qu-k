import type { PresetId } from '../quantum/presets.ts';
import { LANE_COUNT, SPAWN_INTERVAL } from './config.ts';
import { unlockAt, unlockedStates, type Unlock } from './progression.ts';
import { mulberry32, pick, pickWeighted, shuffle, type Random } from './rng.ts';

export interface EnemySpec {
  readonly lane: number;
  readonly preset: PresetId;
  /** Seconds after the wave starts. */
  readonly spawnAt: number;
}

export interface WaveSpec {
  readonly number: number;
  /** Sorted by spawn time. */
  readonly enemies: readonly EnemySpec[];
  /** Set when this wave introduces a new gate and new states. */
  readonly unlock?: Unlock;
  /** Hand-made in the debug panel rather than generated. */
  readonly custom?: boolean;
}

/**
 * Deterministically builds wave `wave` of a run. Each active lane gets a dominant
 * state; from wave 5 on, a growing share of enemies is drawn from other unlocked
 * states, so no single circuit per lane can catch everything.
 */
export function generateWave(wave: number, runSeed: number): WaveSpec {
  const random = mulberry32(runSeed ^ Math.imul(wave, 0x9e3779b1));
  const unlock = unlockAt(wave);
  const states = unlockedStates(wave);

  const laneCount = Math.min(LANE_COUNT, Math.ceil(wave / 2));
  const lanes = shuffle(random, [...Array(LANE_COUNT).keys()])
    .slice(0, laneCount)
    .sort((a, b) => a - b);
  const total = 3 + Math.floor(wave * 1.5);
  const impurity = Math.min(0.35, Math.max(0, (wave - 4) * 0.05));

  const enemies: EnemySpec[] = [];
  lanes.forEach((lane, i) => {
    const count = Math.floor(total / laneCount) + (i < total % laneCount ? 1 : 0);
    // The first lane of an unlock wave always shows off the new state.
    const dominant = unlock && i === 0 ? newestState(random, unlock) : dominantState(random, states);
    const others = states.filter((state) => state !== dominant);
    const offset = random() * SPAWN_INTERVAL;
    for (let k = 0; k < count; k++) {
      const preset = others.length > 0 && random() < impurity ? pick(random, others) : dominant;
      enemies.push({ lane, preset, spawnAt: offset + k * SPAWN_INTERVAL });
    }
  });
  enemies.sort((a, b) => a.spawnAt - b.spawnAt);

  return { number: wave, enemies, unlock };
}

/** A hand-made wave: `lanes[l]` lists that lane's enemies in spawn order. */
export function customWave(wave: number, lanes: readonly (readonly PresetId[])[]): WaveSpec {
  const enemies = lanes.flatMap((presets, lane) =>
    presets.map((preset, k) => ({ lane, preset, spawnAt: k * SPAWN_INTERVAL })),
  );
  enemies.sort((a, b) => a.spawnAt - b.spawnAt);
  return { number: wave, enemies, custom: true };
}

function newestState(random: Random, unlock: Unlock): PresetId {
  const interesting = unlock.states.filter((state) => state !== 'zero');
  return pick(random, interesting.length > 0 ? interesting : unlock.states);
}

/** Newer states are likelier; |0⟩ is already the target, so it rarely leads a lane. */
function dominantState(random: Random, states: readonly PresetId[]): PresetId {
  return pickWeighted(random, states, (state) => (state === 'zero' ? 0.2 : 1 + 0.5 * states.indexOf(state)));
}
