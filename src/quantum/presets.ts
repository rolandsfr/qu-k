import { complex, type Complex } from './complex.ts';
import { QuantumState, type BlochVector } from './state.ts';

/** Named single-qubit states that enemies can spawn in. */
export type PresetId = 'zero' | 'one' | 'plus' | 'minus' | 'plusI' | 'minusI' | 'plusT';

export interface Preset {
  readonly id: PresetId;
  readonly ket: string;
  readonly amplitudes: readonly [Complex, Complex];
}

const R = Math.SQRT1_2;

export const PRESETS: Readonly<Record<PresetId, Preset>> = {
  zero: { id: 'zero', ket: '|0⟩', amplitudes: [complex(1), complex(0)] },
  one: { id: 'one', ket: '|1⟩', amplitudes: [complex(0), complex(1)] },
  plus: { id: 'plus', ket: '|+⟩', amplitudes: [complex(R), complex(R)] },
  minus: { id: 'minus', ket: '|−⟩', amplitudes: [complex(R), complex(-R)] },
  plusI: { id: 'plusI', ket: '|i⟩', amplitudes: [complex(R), complex(0, R)] },
  minusI: { id: 'minusI', ket: '|−i⟩', amplitudes: [complex(R), complex(0, -R)] },
  // T|+⟩ = (|0⟩ + e^{iπ/4}|1⟩)/√2
  plusT: { id: 'plusT', ket: 'T|+⟩', amplitudes: [complex(R), complex(0.5, 0.5)] },
};

export function presetState(id: PresetId): QuantumState {
  return QuantumState.fromAmplitudes(PRESETS[id].amplitudes);
}

const PRESET_BLOCH = Object.values(PRESETS).map((preset) => ({
  ket: preset.ket,
  bloch: presetState(preset.id).bloch(0),
}));

/**
 * Display label for a qubit: the matching preset ket (global phase is invisible on
 * the Bloch sphere), ρ when it is entangled with something else, otherwise |ψ⟩.
 */
export function ketLabel(b: BlochVector, tolerance = 1e-6): string {
  if (Math.hypot(b.x, b.y, b.z) < 1 - tolerance) return 'ρ';
  const match = PRESET_BLOCH.find(
    ({ bloch }) =>
      Math.abs(bloch.x - b.x) < tolerance &&
      Math.abs(bloch.y - b.y) < tolerance &&
      Math.abs(bloch.z - b.z) < tolerance,
  );
  return match?.ket ?? '|ψ⟩';
}
