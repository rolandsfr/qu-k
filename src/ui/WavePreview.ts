import type Phaser from 'phaser';
import type { WaveForecast } from '../game/forecast.ts';
import type { Run } from '../game/run.ts';
import { PRESETS } from '../quantum/presets.ts';
import { Button } from './Button.ts';
import { FRAME_TOP, HEIGHT, PANEL_WIDTH, PANEL_X } from './layout.ts';
import { COLORS, textStyle } from './theme.ts';

const PADDING = 18;
const INNER_WIDTH = PANEL_WIDTH - 2 * PADDING;
const START_Y = HEIGHT - 58;
const START_HEIGHT = 48;
const TEXT_TOP = FRAME_TOP + 2 * PADDING;
const TEXT_HEIGHT = START_Y - START_HEIGHT / 2 - PADDING - TEXT_TOP;
const FONT_SIZE = 14;
const LINE_HEIGHT = 1.4;

interface Line {
  readonly text: string;
  /** Kill chance shown after the text, coloured by how sure the kill is. */
  readonly killChance?: number;
}

/** Right-hand panel contents: what the next wave sends down each lane and how the current circuit fares. */
export class WavePreview {
  private readonly scene: Phaser.Scene;
  private readonly content: Phaser.GameObjects.Container;
  private readonly start: Button;

  constructor(scene: Phaser.Scene, onStart: () => void) {
    this.scene = scene;
    // The frame itself is drawn by the scene; this fills its inside.
    this.content = scene.add.container(PANEL_X + PADDING, TEXT_TOP);
    this.start = new Button(scene, PANEL_X + PANEL_WIDTH / 2, START_Y, 'START WAVE  ▶', onStart, {
      width: INNER_WIDTH,
      height: START_HEIGHT,
    });
  }

  refresh(run: Run, forecast: WaveForecast, editable: boolean): void {
    const lines: Line[] = [{ text: `Wave ${run.wave}${run.waveSpec.custom ? ' (custom)' : ''}` }, { text: '' }];
    for (const lane of forecast.lanes) {
      lines.push({ text: `Lane ${lane.lane + 1}: ${lane.expectedLeaks.toFixed(1)} leaks` });
      for (const { preset, count, killChance } of lane.states) {
        lines.push({ text: `${PRESETS[preset].ket} x ${count} - `, killChance });
      }
    }
    lines.push({ text: '' }, { text: `Expected leaks: ${forecast.expectedLeaks.toFixed(1)} / ${forecast.enemyCount}` });

    this.draw(lines);
    this.start.setEnabled(editable);
  }

  private draw(lines: readonly Line[]): void {
    this.content.removeAll(true);
    // Late waves list many states, so the text shrinks to stay clear of the button.
    const size = Math.min(FONT_SIZE, Math.floor(TEXT_HEIGHT / lines.length / LINE_HEIGHT));
    lines.forEach((line, i) => {
      const y = i * size * LINE_HEIGHT;
      const label = this.scene.add.text(0, y, line.text, textStyle(size));
      this.content.add(label);
      if (line.killChance !== undefined) {
        const chance = `${Math.round(line.killChance * 100)}% kill`;
        this.content.add(this.scene.add.text(label.width, y, chance, textStyle(size, chanceColor(line.killChance))));
      }
    });
  }
}

const chanceColor = (p: number): number => (p > 0.995 ? COLORS.good : p < 0.005 ? COLORS.danger : COLORS.warn);
