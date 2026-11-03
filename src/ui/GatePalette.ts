import type Phaser from 'phaser';
import { GATE_ORDER, type GateId } from '../game/gates.ts';
import type { Run } from '../game/run.ts';
import { GATE_PITCH, GATE_SIZE, PALETTE_LEFT, PALETTE_Y } from './layout.ts';
import { COLORS, css, GATE_COLORS, textStyle } from './theme.ts';

interface GateButton {
  readonly frame: Phaser.GameObjects.Rectangle;
  readonly letter: Phaser.GameObjects.Text;
  readonly count: Phaser.GameObjects.Text;
}

/** Gate inventory along the bottom; gates not unlocked yet are shown disabled. */
export class GatePalette {
  private readonly buttons = new Map<GateId, GateButton>();

  constructor(scene: Phaser.Scene, onSelect: (gate: GateId) => void) {
    GATE_ORDER.forEach((gate, i) => {
      const x = PALETTE_LEFT + GATE_SIZE / 2 + i * GATE_PITCH;
      const frame = scene.add
        .rectangle(x, PALETTE_Y, GATE_SIZE, GATE_SIZE, COLORS.panel)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => onSelect(gate));
      const letter = scene.add.text(x, PALETTE_Y - 7, gate, textStyle(30, COLORS.text, { fontStyle: 'bold' })).setOrigin(0.5);
      const count = scene.add.text(x, PALETTE_Y + 24, '', textStyle(12, COLORS.textDim)).setOrigin(0.5);
      this.buttons.set(gate, { frame, letter, count });
    });
  }

  refresh(run: Run, selected: GateId | null, editable: boolean): void {
    const stock = run.stock;
    for (const [gate, { frame, letter, count }] of this.buttons) {
      const color = GATE_COLORS[gate];
      if (stock[gate] === 0) {
        frame.setFillStyle(COLORS.panel).setAlpha(0.5).disableInteractive();
        letter.setColor(css(COLORS.textDim)).setAlpha(0.4);
        count.setText('');
        continue;
      }
      const isSelected = gate === selected;
      frame
        .setFillStyle(color, isSelected ? 0.35 : 0.08)
        .setAlpha(editable ? 1 : 0.5)
        .setInteractive();
      letter.setColor(css(color)).setAlpha(editable ? 1 : 0.5);
      count.setText(`${run.board.available(gate, stock)} / ${stock[gate]}`);
    }
  }
}
