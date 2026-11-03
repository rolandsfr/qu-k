import { SHOWCASES, type Showcase } from '../game/showcase.ts';

/** `?debug` in the URL adds a DEBUG button that opens the panel. */
export const debugEnabled = (params: URLSearchParams): boolean => params.has('debug');

const SPEEDS = [1, 2, 4];

const solutionText = (showcase: Showcase): string =>
  showcase.solution.map((circuit, lane) => `L${lane + 1}: ${circuit.join(' ') || '—'}`).join(' · ');

/** A plain HTML overlay on top of the canvas listing the showcase waves for a presentation. */
export class DebugPanel {
  private readonly root = document.createElement('div');
  private readonly overlay: HTMLElement;
  /** Multiplier on wave sim time, cycled by the speed button. */
  speed = SPEEDS[0];

  constructor(load: (showcase: Showcase) => void) {
    this.root.className = 'debug';
    this.root.innerHTML = `
      <div class="debug-bar">
        <button class="debug-toggle">DEBUG</button>
        <button class="debug-speed">SPEED ${this.speed}×</button>
      </div>
      <div class="debug-overlay" hidden>
        <div class="debug-box">
          <h3>Showcase waves</h3>
          ${SHOWCASES.map(
            (showcase, i) => `
            <button class="debug-showcase" data-showcase="${i}">
              <b>${i + 1}. ${showcase.title}</b>
              <small>${solutionText(showcase)}</small>
            </button>`,
          ).join('')}
        </div>
      </div>`;
    document.body.append(this.root);

    this.overlay = this.find('.debug-overlay');
    this.find('.debug-toggle').addEventListener('click', () => {
      this.overlay.hidden = !this.overlay.hidden;
    });
    const speedButton = this.find('.debug-speed');
    speedButton.addEventListener('click', () => {
      this.speed = SPEEDS[(SPEEDS.indexOf(this.speed) + 1) % SPEEDS.length];
      speedButton.textContent = `SPEED ${this.speed}×`;
    });
    this.overlay.addEventListener('click', (event) => {
      if (event.target === this.overlay) this.overlay.hidden = true;
    });
    for (const button of this.root.querySelectorAll<HTMLElement>('[data-showcase]')) {
      button.addEventListener('click', () => {
        this.overlay.hidden = true;
        load(SHOWCASES[Number(button.dataset.showcase)]);
      });
    }

    // Phaser listens on window, so without this clicks land on the board cells underneath the overlay.
    for (const type of ['keydown', 'keyup', 'mousedown', 'pointerdown', 'touchstart'] as const) {
      this.root.addEventListener(type, (event) => event.stopPropagation());
    }
  }

  destroy(): void {
    this.root.remove();
  }

  private find<T extends HTMLElement = HTMLElement>(selector: string): T {
    const element = this.root.querySelector<T>(selector);
    if (!element) throw new Error(`debug panel: ${selector} missing`);
    return element;
  }
}
