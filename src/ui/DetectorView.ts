import type Phaser from 'phaser';
import type { Bit } from '../quantum/state.ts';
import { CELL_SIZE } from './layout.ts';
import { COLORS, css, textStyle } from './theme.ts';

/** The detector is drawn smaller than a trap cell. */
export const DETECTOR_SCALE = 0.7;

/** A lane's measurement device: shows the last outcome it read, green for a kill, red for a leak. */
export class DetectorView {
  private readonly label: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    const size = CELL_SIZE * DETECTOR_SCALE;
    scene.add.rectangle(x, y, size, size, COLORS.panel);
    this.label = scene.add.text(x, y, 'M', textStyle(20, COLORS.textDim)).setOrigin(0.5);
  }

  measure(outcome: Bit, destroyed: boolean): void {
    this.label.setText(`${outcome}`).setColor(css(destroyed ? COLORS.good : COLORS.danger));
  }
}
