import { complex, expi, type Complex } from './complex.ts';

/** Single-qubit unitary in row-major order: [[m00, m01], [m10, m11]]. */
export type Matrix2 = readonly [readonly [Complex, Complex], readonly [Complex, Complex]];

const ZERO = complex(0);
const ONE = complex(1);
const R = Math.SQRT1_2;

export const X: Matrix2 = [
  [ZERO, ONE],
  [ONE, ZERO],
];

export const Z: Matrix2 = [
  [ONE, ZERO],
  [ZERO, complex(-1)],
];

export const H: Matrix2 = [
  [complex(R), complex(R)],
  [complex(R), complex(-R)],
];

export const S: Matrix2 = [
  [ONE, ZERO],
  [ZERO, complex(0, 1)],
];

export const T: Matrix2 = [
  [ONE, ZERO],
  [ZERO, expi(Math.PI / 4)],
];
