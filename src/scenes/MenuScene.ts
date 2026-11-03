import Phaser from 'phaser';
import { loadHighScore } from '../game/highScore.ts';
import { Button } from '../ui/Button.ts';
import { drawBackdrop, preloadBackdrop } from '../ui/effects.ts';
import { fitCamera, HEIGHT, WIDTH } from '../ui/layout.ts';
import { COLORS, css, displayStyle, textStyle } from '../ui/theme.ts';
import { SceneKeys } from './keys.ts';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.Menu);
  }

  preload(): void {
    preloadBackdrop(this);
  }

  create(): void {
    fitCamera(this);
    drawBackdrop(this);

    // Darken the lower half so the title reads cleanly over the ground.
    this.add
      .graphics()
      .fillGradientStyle(COLORS.space, COLORS.space, COLORS.space, COLORS.space, 0, 0, 0.85, 0.85)
      .fillRect(0, HEIGHT * 0.45, WIDTH, HEIGHT * 0.55);

    const cx = WIDTH / 2;

    this.add
      .text(cx, 470, 'QUANTUM KICK', displayStyle(76, COLORS.text, { letterSpacing: 4 }))
      .setOrigin(0.5)
      .setShadow(0, 0, css(COLORS.accent), 18, false, true);

    new Button(this, cx, 572, 'PLAY', () => this.startRun(), { width: 220, height: 52 });

    this.add.text(cx, 640, `BEST ${loadHighScore()}`, textStyle(14, COLORS.text)).setOrigin(0.5);
    this.add.text(cx, 662, 'SPACE / ENTER to play', textStyle(12, COLORS.textDim)).setOrigin(0.5);

    this.input.keyboard?.once('keydown-SPACE', () => this.startRun());
    this.input.keyboard?.once('keydown-ENTER', () => this.startRun());
  }

  private startRun(): void {
    this.scene.start(SceneKeys.Game);
  }
}
