import type Phaser from 'phaser';
import type { Board } from '../game/board.ts';
import { SPAWN_POSITION, TARGET_OUTCOME } from '../game/config.ts';
import type { Bit } from '../quantum/state.ts';
import ufoUrl from '../assets/ufo.png';
import { DETECTOR_SCALE, DetectorView } from './DetectorView.ts';
import { CELL_SIZE, DETECTOR_X, LANE_LABEL_X, laneY, trackX } from './layout.ts';
import { COLORS, css, GATE_COLORS, textStyle } from './theme.ts';

const UFO_KEY = 'ufo';

/** Call from the scene's preload() before creating a BoardView. */
export function preloadBoard(scene: Phaser.Scene): void {
  if (!scene.textures.exists(UFO_KEY)) scene.load.image(UFO_KEY, ufoUrl);
}

/** Called on a cell press; `secondary` is a right-click. */
export type CellHandler = (lane: number, cell: number, secondary: boolean) => void;

interface CellView {
  readonly slot: Phaser.GameObjects.Rectangle;
  readonly tile: Phaser.GameObjects.Rectangle;
  readonly letter: Phaser.GameObjects.Text;
}

/** One grid, a row per lane: portal → trap cells → detector. */
export class BoardView {
  private readonly scene: Phaser.Scene;
  private readonly cells: CellView[][] = [];
  private readonly portals: Phaser.GameObjects.Image[] = [];
  private readonly incoming: Phaser.GameObjects.Text[] = [];
  private readonly detectors: DetectorView[] = [];
  private editable = true;

  constructor(scene: Phaser.Scene, board: Board, onCell: CellHandler) {
    this.scene = scene;
    const g = scene.add.graphics();

    // Every detector destroys the same outcome, so it is labelled once above the column.
    const headerY = laneY(0) - (CELL_SIZE / 2) * DETECTOR_SCALE - 16;
    scene.add.text(DETECTOR_X, headerY, `KILLS |${TARGET_OUTCOME}⟩`, textStyle(12, COLORS.good, { fontStyle: 'bold' })).setOrigin(0.5);

    for (let lane = 0; lane < board.lanes; lane++) {
      const y = laneY(lane);
      const top = y - CELL_SIZE / 2;
      const portalX = trackX(SPAWN_POSITION);

      // Lane name and how many aliens are coming this wave, left of the grid.
      scene.add.text(LANE_LABEL_X, y - 9, `LANE ${lane + 1}`, textStyle(12, COLORS.textDim)).setOrigin(0, 0.5);
      this.incoming.push(
        scene.add.text(LANE_LABEL_X, y + 9, '', textStyle(11, COLORS.accent, { fontStyle: 'bold' })).setOrigin(0, 0.5),
      );

      // Spawn slot: the saucer beaming the aliens down.
      g.fillStyle(COLORS.lane).fillRect(portalX - CELL_SIZE / 2, top, CELL_SIZE, CELL_SIZE);
      g.lineStyle(1, COLORS.laneEdge).strokeRect(portalX - CELL_SIZE / 2, top, CELL_SIZE, CELL_SIZE);
      const ufo = scene.add.image(portalX, y, UFO_KEY);
      ufo.setScale((0.6 * (CELL_SIZE - 14)) / ufo.width);
      this.portals.push(ufo);

      this.detectors.push(new DetectorView(scene, DETECTOR_X, y));

      const row: CellView[] = [];
      for (let cell = 0; cell < board.cells; cell++) {
        const x = trackX(cell);
        const slot = scene.add
          .rectangle(x, y, CELL_SIZE, CELL_SIZE, COLORS.cell)
          .setStrokeStyle(1, COLORS.laneEdge)
          .setInteractive({ useHandCursor: true })
          .on('pointerover', () => this.hover(slot, true))
          .on('pointerout', () => this.hover(slot, false))
          .on('pointerdown', (pointer: Phaser.Input.Pointer) => onCell(lane, cell, pointer.rightButtonDown()));
        const tile = scene.add.rectangle(x, y, CELL_SIZE - 18, CELL_SIZE - 18).setVisible(false);
        const letter = scene.add.text(x, y, '', textStyle(30, COLORS.text, { fontStyle: 'bold' })).setOrigin(0.5);
        row.push({ slot, tile, letter });
      }
      this.cells.push(row);
    }
  }

  /** `incoming[lane]` is the number of enemies the next wave sends down that lane. */
  refresh(board: Board, editable: boolean, incoming: readonly number[]): void {
    this.editable = editable;
    this.portals.forEach((portal, lane) => {
      portal.setTint(incoming[lane] > 0 ? COLORS.accent : COLORS.textDim).setAlpha(incoming[lane] > 0 ? 1 : 0.35);
    });
    this.incoming.forEach((label, lane) => {
      label.setText(incoming[lane] > 0 ? `${incoming[lane]} incoming` : '');
    });
    for (let lane = 0; lane < this.cells.length; lane++) {
      for (let cell = 0; cell < this.cells[lane].length; cell++) {
        const { slot, tile, letter } = this.cells[lane][cell];
        const gate = board.get(lane, cell);
        slot.setFillStyle(COLORS.cell).setAlpha(editable ? 1 : 0.7);
        tile.setVisible(gate !== null);
        letter.setText(gate ?? '');
        if (gate === null) continue;
        tile.setFillStyle(GATE_COLORS[gate], 0.16).setStrokeStyle(3, GATE_COLORS[gate]);
        letter.setColor(css(GATE_COLORS[gate]));
      }
    }
  }

  /** Flash a trap when it fires. */
  pulseTrap(lane: number, cell: number): void {
    const { tile } = this.cells[lane][cell];
    this.scene.tweens.add({ targets: tile, scale: 1.15, duration: 80, yoyo: true });
  }

  /** Show a lane's detector reading out a measurement. */
  measure(lane: number, outcome: Bit, destroyed: boolean): void {
    this.detectors[lane].measure(outcome, destroyed);
  }

  private hover(slot: Phaser.GameObjects.Rectangle, over: boolean): void {
    slot.setFillStyle(over && this.editable ? COLORS.cellHover : COLORS.cell);
  }
}
