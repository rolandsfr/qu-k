import Phaser from 'phaser';
import { TARGET_OUTCOME } from '../game/config.ts';
import type { LiveEnemy } from '../game/waveSim.ts';
import { ketLabel } from '../quantum/presets.ts';
import { laneY, trackX } from './layout.ts';
import { blochColor } from './stateColor.ts';
import { COLORS, textStyle } from './theme.ts';

const RADIUS = 20;
const BAR_WIDTH = 40;

/** An alien qubit: its colour, ket label and odds bar always mirror its quantum state. */
export class EnemyView extends Phaser.GameObjects.Container {
  readonly enemy: LiveEnemy;
  private readonly shell: Phaser.GameObjects.Arc;
  private readonly ket: Phaser.GameObjects.Text;
  private readonly odds: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, enemy: LiveEnemy) {
    super(scene, trackX(enemy.position), laneY(enemy.spec.lane));
    this.enemy = enemy;

    const antennae = scene.add.graphics();
    antennae.lineStyle(2, 0xd3e6c6).lineBetween(-8, -16, -14, -30).lineBetween(8, -16, 14, -30);
    antennae.fillStyle(0xd3e6c6).fillCircle(-14, -30, 3).fillCircle(14, -30, 3);

    this.shell = scene.add.circle(0, 0, RADIUS, 0xffffff).setStrokeStyle(2, 0xffffff, 0.7);

    const eyes = scene.add.graphics();
    eyes.fillStyle(0xffffff).fillCircle(-7, -3, 6).fillCircle(7, -3, 6);
    eyes.fillStyle(0x0b160d).fillCircle(-6, -2, 3).fillCircle(8, -2, 3);

    this.ket = scene.add.text(0, -46, '', textStyle(15, COLORS.text, { fontStyle: 'bold' })).setOrigin(0.5);

    // Green share of the bar is P(target), the red remainder is the chance to leak.
    const leakBar = scene.add.rectangle(-BAR_WIDTH / 2, 31, BAR_WIDTH, 5, COLORS.danger, 0.85).setOrigin(0, 0.5);
    this.odds = scene.add.rectangle(-BAR_WIDTH / 2, 31, BAR_WIDTH, 5, COLORS.good).setOrigin(0, 0.5);

    this.add([antennae, this.shell, eyes, this.ket, leakBar, this.odds]);
    scene.add.existing(this);
    this.refresh();
  }

  /** Re-reads the quantum state after a gate or a measurement. */
  refresh(): void {
    const bloch = this.enemy.state.bloch(0);
    this.shell.setFillStyle(blochColor(bloch));
    this.ket.setText(ketLabel(bloch));
    this.odds.setScale(this.enemy.state.probability(0, TARGET_OUTCOME), 1);
  }
}
