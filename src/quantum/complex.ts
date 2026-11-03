/** Minimal immutable complex number used for amplitudes and gate entries. */
export interface Complex {
  readonly re: number;
  readonly im: number;
}

export const complex = (re: number, im = 0): Complex => ({ re, im });

/** e^{iθ} */
export const expi = (theta: number): Complex => complex(Math.cos(theta), Math.sin(theta));
