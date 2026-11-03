import type { PresetId } from '../quantum/presets.ts';
import type { GateId } from './gates.ts';

export interface Unlock {
  readonly wave: number;
  readonly gate: GateId;
  readonly states: readonly PresetId[];
  /** Shown during the build phase of the wave that introduces it. */
  readonly hint: string;
}

export const UNLOCKS: readonly Unlock[] = [
  {
    wave: 1,
    gate: 'X',
    states: ['zero', 'one'],
    hint: '|0⟩ aliens already collapse to the target. Flip |1⟩ aliens with an X trap.',
  },
  {
    wave: 3,
    gate: 'H',
    states: ['plus'],
    hint: '|+⟩ is a 50/50 superposition. An H trap interferes it into a certain |0⟩.',
  },
  {
    wave: 5,
    gate: 'Z',
    states: ['minus'],
    hint: '|−⟩ has the same odds as |+⟩ but the opposite phase. Try Z before H, or H before X.',
  },
  {
    wave: 8,
    gate: 'S',
    states: ['plusI', 'minusI'],
    hint: 'Complex phase: S turns |+⟩ → |i⟩ → |−⟩ → |−i⟩. Rotate them back onto |+⟩ or |−⟩.',
  },
  {
    wave: 11,
    gate: 'T',
    states: ['plusT'],
    hint: 'T is half an S. Add phase until T|+⟩ lands on a state you already handle.',
  },
];

/** Stock of each gate when it unlocks; it then grows by one every STOCK_GROWTH_WAVES waves. */
const BASE_STOCK: Readonly<Record<GateId, number>> = { X: 2, H: 2, Z: 1, S: 1, T: 1 };
const STOCK_GROWTH_WAVES = 2;
const MAX_STOCK = 8;

export function unlocksUpTo(wave: number): Unlock[] {
  return UNLOCKS.filter((unlock) => unlock.wave <= wave);
}

export function unlockAt(wave: number): Unlock | undefined {
  return UNLOCKS.find((unlock) => unlock.wave === wave);
}

export function unlockedStates(wave: number): PresetId[] {
  return unlocksUpTo(wave).flatMap((unlock) => unlock.states);
}

/** How many traps of each gate the player owns in `wave` (placed ones included). */
export function gateStock(wave: number): Record<GateId, number> {
  const stock: Record<GateId, number> = { X: 0, H: 0, Z: 0, S: 0, T: 0 };
  for (const unlock of unlocksUpTo(wave)) {
    const growth = Math.floor((wave - unlock.wave) / STOCK_GROWTH_WAVES);
    stock[unlock.gate] = Math.min(MAX_STOCK, BASE_STOCK[unlock.gate] + growth);
  }
  return stock;
}
