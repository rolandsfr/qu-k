import Phaser from 'phaser';
import { GameOverScene } from './scenes/GameOverScene.ts';
import { GameScene } from './scenes/GameScene.ts';
import { MenuScene } from './scenes/MenuScene.ts';
import { HEIGHT, initRenderScale, trackRenderScale, WIDTH } from './ui/layout.ts';
import { COLORS, css, loadFonts } from './ui/theme.ts';

const parent = document.getElementById('game');
if (!parent) throw new Error('#game container missing from index.html');
const scale = initRenderScale(parent);
await loadFonts();

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent,
  width: Math.round(WIDTH * scale),
  height: Math.round(HEIGHT * scale),
  backgroundColor: css(COLORS.space),
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [MenuScene, GameScene, GameOverScene],
});

trackRenderScale(game, parent);
