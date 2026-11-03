import { complex, type Complex } from './complex.ts';
import type { Matrix2 } from './gates.ts';

export type Bit = 0 | 1;

/** Bloch vector of one qubit: length 1 for a pure state, shorter when it is entangled. */
export interface BlochVector {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

/**
 * State vector of an n-qubit register. Bit k of a basis index is qubit k, so a
 * lone enemy is a 1-qubit register and an entangled pair shares a 2-qubit one.
 */
export class QuantumState {
  readonly numQubits: number;
  private readonly re: Float64Array;
  private readonly im: Float64Array;

  private constructor(numQubits: number, re: Float64Array, im: Float64Array) {
    this.numQubits = numQubits;
    this.re = re;
    this.im = im;
  }

  /** Computational basis state |index⟩ on `numQubits` qubits. */
  static basis(numQubits: number, index = 0): QuantumState {
    const dimension = 1 << numQubits;
    if (!Number.isInteger(index) || index < 0 || index >= dimension) {
      throw new RangeError(`basis index ${index} out of range`);
    }
    const re = new Float64Array(dimension);
    re[index] = 1;
    return new QuantumState(numQubits, re, new Float64Array(dimension));
  }

  /** Builds a state from amplitudes, normalising them; the count must be a power of two. */
  static fromAmplitudes(amplitudes: readonly Complex[]): QuantumState {
    const numQubits = Math.log2(amplitudes.length);
    if (!Number.isInteger(numQubits) || numQubits < 1) {
      throw new RangeError('amplitude count must be a power of two of at least 2');
    }
    const norm = Math.sqrt(amplitudes.reduce((sum, a) => sum + a.re * a.re + a.im * a.im, 0));
    if (norm === 0) throw new RangeError('the zero vector is not a quantum state');
    const re = Float64Array.from(amplitudes, (a) => a.re / norm);
    const im = Float64Array.from(amplitudes, (a) => a.im / norm);
    return new QuantumState(numQubits, re, im);
  }

  get dimension(): number {
    return this.re.length;
  }

  amplitude(index: number): Complex {
    return complex(this.re[index], this.im[index]);
  }

  clone(): QuantumState {
    return new QuantumState(this.numQubits, this.re.slice(), this.im.slice());
  }

  /** Applies a single-qubit gate to `qubit` in place. */
  apply(gate: Matrix2, qubit: number): this {
    const bit = this.bitOf(qubit);
    const [[a, b], [c, d]] = gate;
    const { re, im } = this;
    for (let i = 0; i < re.length; i++) {
      if (i & bit) continue;
      const j = i | bit;
      const r0 = re[i], i0 = im[i], r1 = re[j], i1 = im[j];
      re[i] = a.re * r0 - a.im * i0 + b.re * r1 - b.im * i1;
      im[i] = a.re * i0 + a.im * r0 + b.re * i1 + b.im * r1;
      re[j] = c.re * r0 - c.im * i0 + d.re * r1 - d.im * i1;
      im[j] = c.re * i0 + c.im * r0 + d.re * i1 + d.im * r1;
    }
    return this;
  }

  /** Flips `target` on every basis state where `control` is 1. */
  applyCNOT(control: number, target: number): this {
    if (control === target) throw new RangeError('CNOT control and target must differ');
    const controlBit = this.bitOf(control);
    const targetBit = this.bitOf(target);
    const { re, im } = this;
    for (let i = 0; i < re.length; i++) {
      if (!(i & controlBit) || i & targetBit) continue;
      const j = i | targetBit;
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
    return this;
  }

  /** Probability that measuring `qubit` yields `outcome`. */
  probability(qubit: number, outcome: Bit): number {
    const bit = this.bitOf(qubit);
    let p = 0;
    for (let i = 0; i < this.re.length; i++) {
      if (((i & bit) !== 0) === (outcome === 1)) p += this.re[i] ** 2 + this.im[i] ** 2;
    }
    return p;
  }

  /** Measures `qubit` in the computational basis and collapses the register onto the outcome. */
  measure(qubit: number, random: () => number): Bit {
    const outcome: Bit = random() < this.probability(qubit, 0) ? 0 : 1;
    const scale = 1 / Math.sqrt(this.probability(qubit, outcome));
    const bit = this.bitOf(qubit);
    const { re, im } = this;
    for (let i = 0; i < re.length; i++) {
      const kept = ((i & bit) !== 0) === (outcome === 1);
      re[i] = kept ? re[i] * scale : 0;
      im[i] = kept ? im[i] * scale : 0;
    }
    return outcome;
  }

  /** Reduced Bloch vector of `qubit`, tracing out the rest of the register. */
  bloch(qubit: number): BlochVector {
    const bit = this.bitOf(qubit);
    const { re, im } = this;
    let z = 0;
    // ρ01 = Σ a_i · conj(a_j) over pairs that differ only in this qubit.
    let rhoRe = 0;
    let rhoIm = 0;
    for (let i = 0; i < re.length; i++) {
      if (i & bit) continue;
      const j = i | bit;
      z += re[i] ** 2 + im[i] ** 2 - re[j] ** 2 - im[j] ** 2;
      rhoRe += re[i] * re[j] + im[i] * im[j];
      rhoIm += im[i] * re[j] - re[i] * im[j];
    }
    return { x: 2 * rhoRe, y: -2 * rhoIm, z };
  }

  private bitOf(qubit: number): number {
    if (!Number.isInteger(qubit) || qubit < 0 || qubit >= this.numQubits) {
      throw new RangeError(`qubit ${qubit} out of range`);
    }
    return 1 << qubit;
  }
}
