import { CELLS_PER_LANE, LANE_COUNT } from './config.ts';
import type { GateId } from './gates.ts';

/** Trap grid: each lane is a circuit wire read left to right, one gate per cell. */
export class Board {
  readonly lanes: number;
  readonly cells: number;
  private readonly grid: (GateId | null)[][];

  constructor(lanes = LANE_COUNT, cells = CELLS_PER_LANE) {
    this.lanes = lanes;
    this.cells = cells;
    this.grid = Array.from({ length: lanes }, () => Array<GateId | null>(cells).fill(null));
  }

  get(lane: number, cell: number): GateId | null {
    return this.grid[lane][cell];
  }

  /** Gates of a lane in the order an enemy passes them. */
  circuit(lane: number): GateId[] {
    return this.grid[lane].filter((gate): gate is GateId => gate !== null);
  }

  placedCount(gate: GateId): number {
    return this.grid.reduce((sum, row) => sum + row.filter((g) => g === gate).length, 0);
  }

  available(gate: GateId, stock: Readonly<Record<GateId, number>>): number {
    return stock[gate] - this.placedCount(gate);
  }

  /** Puts `gate` into an empty cell if the stock allows it; returns whether it was placed. */
  place(lane: number, cell: number, gate: GateId, stock: Readonly<Record<GateId, number>>): boolean {
    if (this.grid[lane][cell] !== null || this.available(gate, stock) <= 0) return false;
    this.grid[lane][cell] = gate;
    return true;
  }

  /** Empties a cell and returns the gate that was in it. */
  remove(lane: number, cell: number): GateId | null {
    const gate = this.grid[lane][cell];
    this.grid[lane][cell] = null;
    return gate;
  }

  clear(): void {
    for (const row of this.grid) row.fill(null);
  }
}
