import type Phaser from 'phaser';
import { CELLS_PER_LANE, LANE_COUNT } from '../game/config.ts';
import { GATE_ORDER } from '../game/gates.ts';

export const WIDTH = 1280;
export const HEIGHT = 720;

/** Caps the canvas at 3840 × 2160 so huge displays don't cost more fill rate than they show. */
const MAX_RENDER_SCALE = 3;
/** Wait for a window drag to settle before re-rasterising; FIT stretches the old canvas meanwhile. */
const RESCALE_DELAY_MS = 150;

/**
 * Canvas pixels per layout pixel. Phaser 4 has no resolution setting, so the canvas is
 * sized to the physical pixels it covers on screen and every scene's camera zooms in to
 * match (see fitCamera); all layout code keeps using WIDTH × HEIGHT coordinates.
 */
let renderScale = 1;

export const getRenderScale = (): number => renderScale;

/** The scale at which the layout, fitted into a CSS box of this size, maps 1:1 onto device pixels. */
function idealRenderScale(boxWidth: number, boxHeight: number): number {
  const fit = Math.min(boxWidth / WIDTH, boxHeight / HEIGHT) * (window.devicePixelRatio || 1);
  return Math.min(MAX_RENDER_SCALE, Math.max(1, Math.round(fit * 100) / 100));
}

/** Picks the render scale for the game's parent element; call before creating the game. */
export function initRenderScale(parent: HTMLElement): number {
  renderScale = idealRenderScale(parent.clientWidth, parent.clientHeight);
  return renderScale;
}

/**
 * Keeps the canvas resolution matched to the screen as the window is resized, zoomed, or
 * dragged onto a monitor with a different pixel density. Scenes follow via fitCamera.
 */
export function trackRenderScale(game: Phaser.Game, parent: HTMLElement): void {
  let timer = 0;
  const rescale = (): void => {
    const next = idealRenderScale(parent.clientWidth, parent.clientHeight);
    if (next === renderScale) return;
    renderScale = next;
    game.scale.setGameSize(Math.round(WIDTH * next), Math.round(HEIGHT * next));
  };
  const schedule = (): void => {
    window.clearTimeout(timer);
    timer = window.setTimeout(rescale, RESCALE_DELAY_MS);
  };
  window.addEventListener('resize', schedule);

  // Moving between monitors doesn't always fire 'resize', so also watch the pixel ratio itself.
  const watchPixelRatio = (): void => {
    window
      .matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`)
      .addEventListener('change', () => { schedule(); watchPixelRatio(); }, { once: true });
  };
  watchPixelRatio();
}

/** Text is rasterised to a texture, so it must be redrawn at the new zoom to stay sharp. */
function sharpenTexts(objects: Phaser.GameObjects.GameObject[]): void {
  for (const object of objects) {
    if (object.type === 'Text') (object as Phaser.GameObjects.Text).setResolution(renderScale);
    else if (object.type === 'Container') sharpenTexts((object as Phaser.GameObjects.Container).list);
  }
}

/** Call first in each scene's create() so the layout area fills the canvas, now and after rescales. */
export function fitCamera(scene: Phaser.Scene): void {
  const fit = (): void => {
    scene.cameras.main.setZoom(renderScale).centerOn(WIDTH / 2, HEIGHT / 2);
  };
  // Registered after the CameraManager's own listener, so the camera is already resized here.
  const onResize = (): void => {
    fit();
    sharpenTexts(scene.children.list);
  };
  fit();
  scene.scale.on('resize', onResize);
  scene.events.once('shutdown', () => scene.scale.off('resize', onResize));
}
export const HUD_HEIGHT = 56;

/** Top of the board and forecast frames; the forecast runs down to FRAME_BOTTOM. */
export const FRAME_TOP = 64;
export const FRAME_BOTTOM = HEIGHT - 16;

export const BOARD_LEFT = 24;
/** Lane number and incoming count sit in a column left of each row's spawn slot. */
export const LANE_LABEL_X = BOARD_LEFT + 24;
export const LANE_TOP = 96;
export const CELL_PITCH = 90;
export const CELL_SIZE = 76;
/** Square cells spaced evenly both ways, so the lanes read as one grid. */
export const LANE_HEIGHT = CELL_PITCH;
/** Leaves an 80px label column between LANE_LABEL_X and the spawn slot. */
const FIRST_CELL_X = LANE_LABEL_X + 80 + CELL_SIZE / 2 + CELL_PITCH;

export const laneY = (lane: number): number => LANE_TOP + LANE_HEIGHT * (lane + 0.5);

/** Screen x of a track coordinate: cell c at c, the portal at −1, the detector at CELLS_PER_LANE. */
export const trackX = (position: number): number => FIRST_CELL_X + position * CELL_PITCH;

export const DETECTOR_X = trackX(CELLS_PER_LANE);
export const BOARD_RIGHT = DETECTOR_X + CELL_SIZE / 2 + 24;
/** Where leaking aliens slip off the grid, just past the detectors. */
export const BASE_X = BOARD_RIGHT - 12;

export const PANEL_X = BOARD_RIGHT + 20;
export const PANEL_WIDTH = WIDTH - PANEL_X - 20;

/** The board frame wraps the grid tightly. */
export const BOARD_BOTTOM = LANE_TOP + LANE_COUNT * LANE_HEIGHT + 24;

/** Gate palette: its own frame under the board, only as wide as its buttons. */
export const GATE_SIZE = CELL_SIZE;
export const GATE_PITCH = CELL_PITCH;
const GATES_PADDING = 24;
/** Extra room above the buttons for the frame's title tab. */
const GATES_TOP_PADDING = 32;
export const GATES_TOP = BOARD_BOTTOM + 16;
export const GATES_WIDTH = 2 * GATES_PADDING + GATE_ORDER.length * GATE_PITCH - (GATE_PITCH - GATE_SIZE);
export const GATES_HEIGHT = GATES_TOP_PADDING + GATE_SIZE + GATES_PADDING;
export const PALETTE_LEFT = BOARD_LEFT + GATES_PADDING;
export const PALETTE_Y = GATES_TOP + GATES_TOP_PADDING + GATE_SIZE / 2;
