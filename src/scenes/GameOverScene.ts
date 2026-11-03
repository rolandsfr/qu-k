import Phaser from 'phaser';
import { loadHighScore, submitHighScore } from '../game/highScore.ts';
import { Button } from '../ui/Button.ts';
import { drawBackdrop, preloadBackdrop } from '../ui/effects.ts';
import { fitCamera, WIDTH } from '../ui/layout.ts';
import { COLORS, textStyle } from '../ui/theme.ts';
import { SceneKeys, type GameOverData } from './keys.ts';

export class GameOverScene extends Phaser.Scene {
  private result: GameOverData = { score: 0, wave: 1, isRecord: false };

  constructor() {
    super(SceneKeys.GameOver);
  }

  init(data: GameOverData): void {
    this.result = data;
  }

  preload(): void {
    preloadBackdrop(this);
  }

  create(): void {
    fitCamera(this);
    const cx = WIDTH / 2;
    const { score, wave, isRecord } = this.result;
    submitHighScore(score);
    drawBackdrop(this, 0.7);

    this.add.text(cx, 170, 'BASE OVERRUN', textStyle(56, COLORS.danger, { fontStyle: 'bold' })).setOrigin(0.5);
    this.add.text(cx, 270, `SCORE ${score}`, textStyle(32)).setOrigin(0.5);
    this.add.text(cx, 320, `fell on wave ${wave}`, textStyle(17, COLORS.textDim)).setOrigin(0.5);
    this.add
      .text(cx, 370, isRecord ? 'NEW HIGH SCORE' : `BEST ${loadHighScore()}`, textStyle(18, isRecord ? COLORS.good : COLORS.textDim, { fontStyle: 'bold' }))
      .setOrigin(0.5);

    new Button(this, cx, 470, 'PLAY AGAIN', () => this.scene.start(SceneKeys.Game));
    new Button(this, cx, 534, 'MENU', () => this.scene.start(SceneKeys.Menu), { color: COLORS.textDim });

    this.input.keyboard?.once('keydown-SPACE', () => this.scene.start(SceneKeys.Game));
    this.input.keyboard?.once('keydown-ESC', () => this.scene.start(SceneKeys.Menu));
  }
}
