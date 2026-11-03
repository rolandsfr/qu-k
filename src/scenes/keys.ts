export const SceneKeys = {
  Menu: 'Menu',
  Game: 'Game',
  GameOver: 'GameOver',
} as const;

export interface GameOverData {
  readonly score: number;
  readonly wave: number;
  /** Whether the run beat the best score held when it started. */
  readonly isRecord: boolean;
}
