import type { BlochVector } from '../quantum/state.ts';
import { STATE_COLORS } from './theme.ts';

/**
 * Colour of a qubit from its Bloch vector. The squared components weight the axis
 * colours (they sum to 1 for a pure state); whatever length an entangled qubit's
 * vector is missing fades it towards grey.
 */
export function blochColor({ x, y, z }: BlochVector): number {
  const weights: [color: number, weight: number][] = [
    [STATE_COLORS.plus, x > 0 ? x * x : 0],
    [STATE_COLORS.minus, x < 0 ? x * x : 0],
    [STATE_COLORS.plusI, y > 0 ? y * y : 0],
    [STATE_COLORS.minusI, y < 0 ? y * y : 0],
    [STATE_COLORS.zero, z > 0 ? z * z : 0],
    [STATE_COLORS.one, z < 0 ? z * z : 0],
    [STATE_COLORS.mixed, Math.max(0, 1 - (x * x + y * y + z * z))],
  ];
  let r = 0, g = 0, b = 0, total = 0;
  for (const [color, weight] of weights) {
    r += ((color >> 16) & 0xff) * weight;
    g += ((color >> 8) & 0xff) * weight;
    b += (color & 0xff) * weight;
    total += weight;
  }
  return (Math.round(r / total) << 16) | (Math.round(g / total) << 8) | Math.round(b / total);
}
