import Phaser from 'phaser';
import { COLORS, textStyle } from './theme.ts';

interface ButtonOptions {
  width?: number;
  height?: number;
  color?: number;
}

export class Button extends Phaser.GameObjects.Container {
  private readonly frame: Phaser.GameObjects.Rectangle;
  private enabled = true;

  constructor(scene: Phaser.Scene, x: number, y: number, label: string, onClick: () => void, options: ButtonOptions = {}) {
    super(scene, x, y);
    const { width = 240, height = 48, color = COLORS.accent } = options;

    this.frame = scene.add.rectangle(0, 0, width, height, color, 0.12).setStrokeStyle(2, color);
    const text = scene.add.text(0, 0, label, textStyle(18, color, { fontStyle: 'bold' })).setOrigin(0.5);
    this.add([this.frame, text]);

    this.frame
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        if (this.enabled) this.frame.setFillStyle(color, 0.28);
      })
      .on('pointerout', () => this.frame.setFillStyle(color, 0.12))
      .on('pointerdown', () => {
        if (this.enabled) onClick();
      });

    scene.add.existing(this);
  }

  setEnabled(enabled: boolean): this {
    this.enabled = enabled;
    return this.setAlpha(enabled ? 1 : 0.35);
  }
}
