import type { PresetId } from '../quantum/presets.ts';
import type { GateId } from './gates.ts';

/** A hand-made wave that demonstrates one idea from the proposal, loaded from the debug panel. */
export interface Showcase {
  readonly id: string;
  readonly title: string;
  /** What the wave demonstrates, shown in the panel. */
  readonly concept: string;
  /** `lanes[l]` lists that lane's enemies in spawn order. */
  readonly lanes: readonly (readonly PresetId[])[];
  readonly stock: Readonly<Record<GateId, number>>;
  /** A circuit per lane that clears the wave with `stock`, shown to the presenter. */
  readonly solution: readonly (readonly GateId[])[];
}

const repeat = (preset: PresetId, count: number): PresetId[] => Array<PresetId>(count).fill(preset);
const stock = (gates: Partial<Record<GateId, number>>): Record<GateId, number> => ({ X: 0, H: 0, Z: 0, S: 0, T: 0, ...gates });

export const SHOWCASES: readonly Showcase[] = [
  {
    id: 'basis',
    title: 'Basis states',
    concept: '|0⟩ already collapses to the target, |1⟩ needs a bit flip. An X on the |0⟩ lane would undo it.',
    lanes: [repeat('one', 4), repeat('zero', 4)],
    stock: stock({ X: 1 }),
    solution: [['X'], []],
  },
  {
    id: 'interference',
    title: 'Superposition',
    concept: '|+⟩ is a 50/50 coin. X leaves the odds at 50%; H interferes it into a certain |0⟩.',
    lanes: [repeat('plus', 5)],
    stock: stock({ X: 1, H: 1 }),
    solution: [['H']],
  },
  {
    id: 'phase',
    title: 'Phase and gate order',
    concept: '|+⟩ and |−⟩ have the same odds but need different circuits. Z then H kills |−⟩; H then Z never does.',
    lanes: [repeat('plus', 4), repeat('minus', 4)],
    stock: stock({ H: 2, Z: 1 }),
    solution: [['H'], ['Z', 'H']],
  },
  {
    id: 'complex',
    title: 'Complex phase (S)',
    concept: 'S turns the phase a quarter: rotate |i⟩ and |−i⟩ back onto |−⟩ and |+⟩ before the H.',
    lanes: [repeat('plusI', 4), repeat('minusI', 4)],
    stock: stock({ H: 2, Z: 1, S: 2 }),
    solution: [['S', 'Z', 'H'], ['S', 'H']],
  },
  {
    id: 't',
    title: 'T gate',
    concept: 'T is half an S. T + S brings T|+⟩ to |−⟩, then H and X finish it: a four-gate circuit.',
    lanes: [repeat('plusT', 5)],
    stock: stock({ X: 1, H: 1, S: 1, T: 1 }),
    solution: [['T', 'S', 'H', 'X']],
  },
  {
    id: 'mixed',
    title: 'Mixed lane',
    concept: 'Gates are reversible, so no circuit catches both |+⟩ and |−⟩: every option leaks half the lane.',
    lanes: [['plus', 'minus', 'plus', 'minus', 'plus', 'minus']],
    stock: stock({ X: 1, H: 1, Z: 1 }),
    solution: [['H']],
  },
  {
    id: 'full',
    title: 'Full wave',
    concept: 'Four lanes, four states, one shared stock: plan the whole board before starting.',
    lanes: [repeat('one', 3), repeat('plus', 3), repeat('minus', 3), repeat('minusI', 3)],
    stock: stock({ X: 2, H: 3, Z: 1, S: 1 }),
    solution: [['X'], ['H'], ['H', 'X'], ['S', 'H']],
  },
];
