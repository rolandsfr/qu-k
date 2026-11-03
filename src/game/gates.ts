import { H, S, T, X, Z, type Matrix2 } from '../quantum/gates.ts';

/** Gates the player can place as traps. CNOT is not here yet: it spans two lanes. */
export type GateId = 'X' | 'H' | 'Z' | 'S' | 'T';

export interface GateInfo {
  readonly id: GateId;
  readonly name: string;
  readonly matrix: Matrix2;
  readonly blurb: string;
}

export const GATE_ORDER: readonly GateId[] = ['X', 'H', 'Z', 'S', 'T'];

export const GATES: Readonly<Record<GateId, GateInfo>> = {
  X: {
    id: 'X',
    name: 'Pauli-X',
    matrix: X,
    blurb: 'Bit flip. Swaps |0⟩ and |1⟩, and leaves |+⟩ and |−⟩ alone.',
  },
  H: {
    id: 'H',
    name: 'Hadamard',
    matrix: H,
    blurb: 'Swaps |0⟩ ↔ |+⟩ and |1⟩ ↔ |−⟩. Interference turns a 50/50 state into a certain one.',
  },
  Z: {
    id: 'Z',
    name: 'Pauli-Z',
    matrix: Z,
    blurb: 'Phase flip. |+⟩ ↔ |−⟩. Changes no odds on its own, but changes what a later H does.',
  },
  S: {
    id: 'S',
    name: 'Phase S',
    matrix: S,
    blurb: 'Quarter-turn of phase: |+⟩ → |i⟩ → |−⟩ → |−i⟩ → |+⟩. Two S make a Z.',
  },
  T: {
    id: 'T',
    name: 'Phase T',
    matrix: T,
    blurb: 'Eighth-turn of phase (45°). Two T make an S.',
  },
};
