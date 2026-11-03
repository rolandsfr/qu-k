# Qu-k (Quantum Kick)

## Running the game locally

### What you need installed

| Tool | Version | Notes |
| --- | --- | --- |
| [Node.js](https://nodejs.org/) | **22.12 or newer** (22 LTS or 24 LTS recommended) | Older versions (18, 20) will not work. |
| npm | comes with Node.js | No need to install Yarn or pnpm. |
| A modern web browser | Chrome, Firefox, Edge or Safari | The game runs in the browser. |

Everything else (Phaser, TypeScript, Vite, Vitest) is installed automatically in step 3.

### Step by step

1. **Install Node.js.** Download the LTS installer from <https://nodejs.org/> and run it.
   Then open a new terminal (Terminal on macOS/Linux, PowerShell or Command Prompt on Windows)
   and check the versions:

   ```sh
   node -v    # should print v22.12.0 or higher
   npm -v     # any version is fine
   ```

2. **Open the project folder in the terminal.** Unzip or clone the project, then move into it:

   ```sh
   cd path/to/quantum-kick
   ```

   The folder is correct when it contains `package.json`.

3. **Install the dependencies** (only needed once, takes under a minute):

   ```sh
   npm install
   ```

4. **Start the game:**

   ```sh
   npm run dev
   ```

   The terminal prints an address, usually `http://localhost:5173/`.

5. **Open that address in your browser.** The main menu appears and the game is playable.

6. **Stop the game** by pressing `Ctrl + C` in the terminal.

### Optional commands

```sh
npm test           # run the unit tests for the quantum simulator and game rules
npm run build      # type-check and build a production version into dist/
npm run preview    # serve the production build locally (run after npm run build)
```

### Troubleshooting

- **`npm: command not found` / `'npm' is not recognized`:** Node.js is not installed, or the
  terminal was opened before installing it. Close the terminal and open a new one.
- **Errors mentioning the Node version or `engines`:** your Node.js is too old. Install the
  current LTS from <https://nodejs.org/>.
- **Port 5173 is already in use:** Vite picks the next free port automatically. Use the
  address it prints.

### URL parameters for testing

`?seed=123` replays the same run; `?wave=8` (dev server only)
starts at a later wave; `?debug` adds a DEBUG button (bottom left) that opens a list of
showcase waves for presentations (basis states, interference, phase and gate order, S, T,
a mixed lane, a full wave), each with its solution. They live in `src/game/showcase.ts`.

