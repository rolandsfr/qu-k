import { describe, expect, it } from 'vitest';
import { Board } from './board.ts';
import { SPAWN_POSITION } from './config.ts';
import { forecastWave, killChance } from './forecast.ts';
import { gateStock } from './progression.ts';
import { Run } from './run.ts';
import { SHOWCASES } from './showcase.ts';
import { WaveSim } from './waveSim.ts';
import { customWave, generateWave, type WaveSpec } from './waves.ts';

describe('Board', () => {
  it('limits placement to the available stock and returns gates on removal', () => {
    const board = new Board(2, 3);
    const stock = { X: 1, H: 0, Z: 0, S: 0, T: 0 };
    expect(board.place(0, 0, 'X', stock)).toBe(true);
    expect(board.place(1, 0, 'X', stock)).toBe(false);
    expect(board.place(0, 1, 'H', stock)).toBe(false);
    expect(board.remove(0, 0)).toBe('X');
    expect(board.available('X', stock)).toBe(1);
  });

  it('reads a lane circuit in walking order', () => {
    const board = new Board(1, 4);
    const stock = { X: 1, H: 1, Z: 1, S: 0, T: 0 };
    board.place(0, 3, 'X', stock);
    board.place(0, 0, 'Z', stock);
    board.place(0, 2, 'H', stock);
    expect(board.circuit(0)).toEqual(['Z', 'H', 'X']);
  });
});

describe('forecast', () => {
  it('reflects interference and gate order', () => {
    expect(killChance('one', ['X'])).toBeCloseTo(1);
    expect(killChance('plus', [])).toBeCloseTo(0.5);
    expect(killChance('plus', ['H'])).toBeCloseTo(1);
    expect(killChance('minus', ['H'])).toBeCloseTo(0);
    expect(killChance('minus', ['Z', 'H'])).toBeCloseTo(1);
    expect(killChance('minus', ['H', 'Z'])).toBeCloseTo(0);
    expect(killChance('plusT', ['T', 'S', 'H', 'X'])).toBeCloseTo(1);
  });

  it('cannot clear a lane that mixes |0⟩ and |1⟩, whatever the circuit', () => {
    const wave: WaveSpec = {
      number: 1,
      enemies: [
        { lane: 0, preset: 'zero', spawnAt: 0 },
        { lane: 0, preset: 'one', spawnAt: 1 },
      ],
    };
    const board = new Board(1, 2);
    const stock = { X: 2, H: 2, Z: 2, S: 2, T: 2 };
    for (const circuit of [[], ['X'], ['H'], ['H', 'X'], ['S', 'H']] as const) {
      circuit.forEach((gate, cell) => board.place(0, cell, gate, stock));
      expect(forecastWave(wave, board).expectedLeaks).toBeGreaterThanOrEqual(1 - 1e-9);
      board.remove(0, 0);
      board.remove(0, 1);
    }
  });
});

describe('waves', () => {
  it('are deterministic per seed so the preview matches the real wave', () => {
    expect(generateWave(7, 1234)).toEqual(generateWave(7, 1234));
    expect(generateWave(7, 1234)).not.toEqual(generateWave(7, 4321));
  });

  it('introduce each new state on its unlock wave', () => {
    expect(generateWave(1, 99).enemies.every((e) => e.preset === 'one' || e.preset === 'zero')).toBe(true);
    expect(generateWave(3, 99).enemies.some((e) => e.preset === 'plus')).toBe(true);
    expect(generateWave(5, 99).enemies.some((e) => e.preset === 'minus')).toBe(true);
  });

  it('only use gates and states that are unlocked', () => {
    expect(gateStock(1)).toMatchObject({ X: 2, H: 0, Z: 0 });
    expect(gateStock(4).H).toBe(2);
    expect(generateWave(4, 7).enemies.every((e) => ['zero', 'one', 'plus'].includes(e.preset))).toBe(true);
  });
});

describe('WaveSim', () => {
  const singleEnemy = (preset: 'one' | 'plus'): WaveSpec => ({
    number: 1,
    enemies: [{ lane: 0, preset, spawnAt: 0 }],
  });

  it('applies traps as the enemy passes them, then measures at the detector', () => {
    const board = new Board(1, 3);
    board.place(0, 1, 'X', { X: 1, H: 0, Z: 0, S: 0, T: 0 });
    const sim = new WaveSim(singleEnemy('one'), board, () => 0.5);

    const events = [];
    while (!sim.finished) events.push(...sim.step(0.25));

    expect(events.map((e) => e.kind)).toEqual(['spawn', 'gate', 'measure']);
    expect(events.at(-1)).toMatchObject({ kind: 'measure', outcome: 0, destroyed: true });
  });

  it('resolves everything an enemy crossed even in one large step', () => {
    const board = new Board(1, 3);
    board.place(0, 0, 'H', { X: 0, H: 1, Z: 0, S: 0, T: 0 });
    const sim = new WaveSim(singleEnemy('plus'), board, () => 0.99);
    sim.step(0);
    const events = sim.step((3 - SPAWN_POSITION) / 0.5);
    expect(events.map((e) => e.kind)).toEqual(['gate', 'measure']);
    expect(events.at(-1)).toMatchObject({ destroyed: true });
  });

  it('lets an unhandled superposition through on an unlucky roll', () => {
    const sim = new WaveSim(singleEnemy('plus'), new Board(1, 3), () => 0.99);
    while (!sim.finished) sim.step(0.5);
    expect(sim.enemies[0].status).toBe('leaked');
  });
});

describe('Run debug controls', () => {
  it('jumps to a wave without scoring and keeps traps the new stock still covers', () => {
    const run = new Run(42);
    run.board.place(0, 0, 'X', run.stock);
    run.jumpTo(5);
    expect(run).toMatchObject({ wave: 5, score: 0 });
    expect(run.waveSpec).toEqual(generateWave(5, 42));
    expect(run.board.get(0, 0)).toBe('X');
  });

  it('plays a custom challenge with its own stock, then returns to generated waves', () => {
    const run = new Run(42, 5);
    run.board.place(0, 0, 'Z', run.stock);
    run.setChallenge([['plusI', 'plusI'], [], ['one']], { X: 1, H: 0, Z: 0, S: 4, T: 0 });
    expect(run.stock.S).toBe(4);
    expect(run.board.get(0, 0)).toBeNull();
    expect(run.waveSpec.enemies.map((e) => [e.lane, e.preset])).toEqual([[0, 'plusI'], [2, 'one'], [0, 'plusI']]);

    run.completeWave();
    expect(run.wave).toBe(6);
    expect(run.stock).toEqual(gateStock(6));
    expect(run.waveSpec.custom).toBeUndefined();
  });
});

describe('Showcase waves', () => {
  it.each(SHOWCASES)('$id is cleared by its listed solution within its stock', (showcase) => {
    const board = new Board();
    showcase.solution.forEach((circuit, lane) =>
      circuit.forEach((gate, cell) => expect(board.place(lane, cell, gate, showcase.stock)).toBe(true)),
    );
    const forecast = forecastWave(customWave(1, showcase.lanes), board);
    // The mixed lane exists to show that no circuit catches both |+⟩ and |−⟩.
    expect(forecast.expectedLeaks).toBeCloseTo(showcase.id === 'mixed' ? 3 : 0);
  });
});
