import type Phaser from 'phaser';
import { COLORS, textStyle } from './theme.ts';

/** A flat panel with its title in the top-left corner. */
export function drawFrame(scene: Phaser.Scene, x: number, y: number, width: number, height: number, title?: string): void {
  scene.add.rectangle(x, y, width, height, COLORS.panel, 0.85).setOrigin(0);
  if (title) drawTitle(scene, x, y, title);
}

/** Plain section title, also used on its own where a section has no panel. */
export function drawTitle(scene: Phaser.Scene, x: number, y: number, title: string): void {
  scene.add.text(x + 10, y + 8, title, textStyle(11, COLORS.textDim));
}
