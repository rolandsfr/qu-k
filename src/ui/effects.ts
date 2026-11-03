import type Phaser from 'phaser';
import backdropUrl from '../assets/menu-bg.avif';
import { HEIGHT, WIDTH } from './layout.ts';
import { COLORS, textStyle } from './theme.ts';

const BACKDROP_KEY = 'backdrop';

/** Call from a scene's preload() before drawBackdrop; the texture is shared once loaded. */
export function preloadBackdrop(scene: Phaser.Scene): void {
  if (!scene.textures.exists(BACKDROP_KEY)) scene.load.image(BACKDROP_KEY, backdropUrl);
}

/** The dusk-sky photo, cropped to cover the screen, under a dark wash of `shade` opacity. */
export function drawBackdrop(scene: Phaser.Scene, shade = 0): void {
  const bg = scene.add.image(WIDTH / 2, 0, BACKDROP_KEY).setOrigin(0.5, 0).setDepth(-10);
  const scale = Math.max(WIDTH / bg.width, HEIGHT / bg.height);
  // Crop the top so the saucer and treeline stay in frame.
  bg.setScale(scale).setY(-0.13 * bg.height * scale);
  if (shade > 0) scene.add.rectangle(0, 0, WIDTH, HEIGHT, COLORS.space, shade).setOrigin(0).setDepth(-10);
}

/** Small label that drifts up and fades, e.g. points gained. */
export function floatText(scene: Phaser.Scene, x: number, y: number, text: string, color: number): void {
  const label = scene.add.text(x, y, text, textStyle(16, color, { fontStyle: 'bold' })).setOrigin(0.5).setDepth(50);
  scene.tweens.add({
    targets: label,
    y: y - 36,
    alpha: 0,
    duration: 900,
    ease: 'Cubic.easeOut',
    onComplete: () => label.destroy(),
  });
}

/** Large centred message over the board for phase changes. */
export function banner(scene: Phaser.Scene, x: number, y: number, text: string, color: number): void {
  const label = scene.add.text(x, y, text, textStyle(40, color, { fontStyle: 'bold' })).setOrigin(0.5).setDepth(60);
  label.setScale(0.8).setAlpha(0);
  scene.tweens.chain({
    targets: label,
    tweens: [
      { scale: 1, alpha: 1, duration: 220, ease: 'Back.easeOut' },
      { alpha: 0, duration: 400, delay: 700 },
    ],
    onComplete: () => label.destroy(),
  });
}
