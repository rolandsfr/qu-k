const STORAGE_KEY = 'quantum-kick.highScore';

// Storage can be unavailable (private mode, blocked site data); the game works without it.

export function loadHighScore(): number {
  try {
    const value = Number(localStorage.getItem(STORAGE_KEY));
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
}

/** Stores `score` if it beats the record; returns whether it did. */
export function submitHighScore(score: number): boolean {
  if (score <= loadHighScore()) return false;
  try {
    localStorage.setItem(STORAGE_KEY, String(score));
  } catch {
    // Keep the result for this session's game-over screen even if it cannot persist.
  }
  return true;
}
