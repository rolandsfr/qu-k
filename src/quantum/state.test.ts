import { describe, expect, it } from 'vitest';
import { H, S, T, X, Z } from './gates.ts';
import { ketLabel, presetState } from './presets.ts';
import { QuantumState } from './state.ts';

const always = (value: number) => () => value;

describe('single-qubit gates', () => {
  it('X flips |0⟩ to |1⟩', () => {
    const state = QuantumState.basis(1).apply(X, 0);
    expect(state.probability(0, 1)).toBeCloseTo(1);
  });

  it('H turns |0⟩ into a 50/50 superposition', () => {
    const state = QuantumState.basis(1).apply(H, 0);
    expect(state.probability(0, 0)).toBeCloseTo(0.5);
    expect(ketLabel(state.bloch(0))).toBe('|+⟩');
  });

  it('interference: H turns |+⟩ into a certain |0⟩ and |−⟩ into a certain |1⟩', () => {
    expect(presetState('plus').apply(H, 0).probability(0, 0)).toBeCloseTo(1);
    expect(presetState('minus').apply(H, 0).probability(0, 1)).toBeCloseTo(1);
  });

  it('Z alone changes no probabilities but flips the outcome of a following H', () => {
    const zOnly = presetState('plus').apply(Z, 0);
    expect(zOnly.probability(0, 0)).toBeCloseTo(0.5);

    const zThenH = presetState('plus').apply(Z, 0).apply(H, 0);
    const hThenZ = presetState('plus').apply(H, 0).apply(Z, 0);
    expect(zThenH.probability(0, 0)).toBeCloseTo(0);
    expect(hThenZ.probability(0, 0)).toBeCloseTo(1);
  });

  it('S cycles |+⟩ → |i⟩ → |−⟩ → |−i⟩ → |+⟩', () => {
    const state = presetState('plus');
    const labels = [0, 1, 2, 3].map(() => ketLabel(state.apply(S, 0).bloch(0)));
    expect(labels).toEqual(['|i⟩', '|−⟩', '|−i⟩', '|+⟩']);
  });

  it('two T gates equal one S', () => {
    const viaT = presetState('plus').apply(T, 0).apply(T, 0);
    expect(ketLabel(viaT.bloch(0))).toBe('|i⟩');
  });

  it('gates are reversible: H·H and X·X are the identity', () => {
    const start = presetState('plusT');
    const roundTrip = start.clone().apply(H, 0).apply(H, 0).apply(X, 0).apply(X, 0);
    expect(roundTrip.bloch(0)).toEqual({
      x: expect.closeTo(start.bloch(0).x),
      y: expect.closeTo(start.bloch(0).y),
      z: expect.closeTo(start.bloch(0).z),
    });
  });
});

describe('measurement', () => {
  it('collapses a superposition onto the sampled outcome', () => {
    const state = presetState('plus');
    expect(state.measure(0, always(0.9))).toBe(1);
    expect(state.probability(0, 1)).toBeCloseTo(1);
    expect(ketLabel(state.bloch(0))).toBe('|1⟩');
  });

  it('never yields an impossible outcome', () => {
    expect(QuantumState.basis(1, 0).measure(0, always(0.999999))).toBe(0);
    expect(QuantumState.basis(1, 1).measure(0, always(0))).toBe(1);
  });
});

describe('entanglement', () => {
  const bellPair = () => QuantumState.basis(2).apply(H, 0).applyCNOT(0, 1);

  it('H then CNOT makes a Bell pair whose halves look maximally mixed', () => {
    const pair = bellPair();
    expect(pair.probability(1, 0)).toBeCloseTo(0.5);
    expect(Math.hypot(...Object.values(pair.bloch(0)))).toBeCloseTo(0);
    expect(ketLabel(pair.bloch(1))).toBe('ρ');
  });

  it('measuring one half decides the other', () => {
    for (const roll of [0.1, 0.9]) {
      const pair = bellPair();
      const first = pair.measure(0, always(roll));
      expect(pair.probability(1, first)).toBeCloseTo(1);
    }
  });

  it('CNOT does nothing when the control is |0⟩', () => {
    const state = QuantumState.basis(2, 0b10).applyCNOT(0, 1);
    expect(state.amplitude(0b10).re).toBeCloseTo(1);
  });
});
