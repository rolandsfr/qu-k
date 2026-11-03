import type Phaser from 'phaser';
import departureMonoUrl from '../assets/fonts/DepartureMono-Regular.woff2';
import silkscreenBoldUrl from '../assets/fonts/Silkscreen-Bold.woff2';
import type { GateId } from '../game/gates.ts';
import { getRenderScale } from './layout.ts';

export const COLORS = {
  space: 0x050b06,
  panel: 0x0c1a10,
  panelEdge: 0x2b4a2d,
  bezel: 0x1d2c20,
  bezelLight: 0x3a5240,
  hairline: 0x56775a,
  lane: 0x0a150c,
  laneEdge: 0x22402a,
  cell: 0x10241a,
  cellHover: 0x1f3d26,
  text: 0xeaf5df,
  textDim: 0x9db594,
  accent: 0xc6ef7c,
  good: 0x3ddc84,
  warn: 0xffc145,
  danger: 0xff4d6d,
} as const;

export const GATE_COLORS: Readonly<Record<GateId, number>> = {
  X: 0xff6b81,
  H: 0xffc145,
  Z: 0x9d7bff,
  S: 0x4cc9f0,
  T: 0x2ee6b0,
};

/** One colour per Bloch-sphere axis direction; enemies blend them by where their state points. */
export const STATE_COLORS = {
  zero: 0x3ddc84,
  one: 0xff4d6d,
  plus: 0xffd166,
  minus: 0xb388ff,
  plusI: 0x4cc9f0,
  minusI: 0xff9f43,
  mixed: 0x8a90a8,
} as const;

const FONT_NAME = 'Departure Mono';
const FONT_FAMILY = `"${FONT_NAME}", Menlo, Consolas, "DejaVu Sans Mono", monospace`;
/** Chunky pixel face for titles only; body text stays in Departure Mono. */
const DISPLAY_FONT_NAME = 'Silkscreen';
const DISPLAY_FONT_FAMILY = `"${DISPLAY_FONT_NAME}", ${FONT_FAMILY}`;

async function loadFont(name: string, url: string, descriptors?: FontFaceDescriptors): Promise<void> {
  try {
    document.fonts.add(await new FontFace(name, `url(${url})`, descriptors).load());
  } catch (error) {
    // The fallback monospace stack still works, just without the pixel look.
    console.warn(`${name} failed to load`, error);
  }
}

/** Phaser rasterises text as soon as it is created, so await this before starting the game. */
export async function loadFonts(): Promise<void> {
  await Promise.all([
    loadFont(FONT_NAME, departureMonoUrl),
    loadFont(DISPLAY_FONT_NAME, silkscreenBoldUrl, { weight: '700' }),
  ]);
}

export const css = (color: number): string => `#${color.toString(16).padStart(6, '0')}`;

export function textStyle(
  size: number,
  color: number = COLORS.text,
  extra: Phaser.Types.GameObjects.Text.TextStyle = {},
): Phaser.Types.GameObjects.Text.TextStyle {
  // Text is rasterised to a texture, so it must match the camera zoom to stay sharp.
  return { fontFamily: FONT_FAMILY, fontSize: `${size}px`, color: css(color), resolution: getRenderScale(), ...extra };
}

/** Like textStyle, but in the bold display face for titles. */
export function displayStyle(
  size: number,
  color: number = COLORS.text,
  extra: Phaser.Types.GameObjects.Text.TextStyle = {},
): Phaser.Types.GameObjects.Text.TextStyle {
  return textStyle(size, color, { fontFamily: DISPLAY_FONT_FAMILY, fontStyle: 'bold', ...extra });
}
