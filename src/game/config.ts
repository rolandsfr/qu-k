import type { Bit } from '../quantum/state.ts';

export const LANE_COUNT = 4;
export const CELLS_PER_LANE = 6;

/** Measurement outcome the detector destroys; anything else leaks through. */
export const TARGET_OUTCOME: Bit = 0;

export const START_HEALTH = 20;
export const DAMAGE_PER_LEAK = 1;

/** Track coordinates: cell c is centred at c, the portal sits at −1, the detector after the last cell. */
export const SPAWN_POSITION = -1;
/** Track units per second. */
export const ENEMY_SPEED = 0.9;
/** Seconds between two enemies of the same lane. */
export const SPAWN_INTERVAL = 1.2;

export const POINTS_PER_KILL = 10;
/** Flat points for every wave survived. */
export const WAVE_CLEAR_POINTS = 100;
