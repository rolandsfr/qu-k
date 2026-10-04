# Qu-k (Quantum kick)

**Proposal**

Developer: Rolands Frīdemanis rf23009

## Game concept

Quantum Kick is a puzzle–tower defense game where enemy waves behave like qubits. During a build phase, the player places quantum gates along the enemies' path to transform their states so that they collapse to the target state when measured at the finish line and are destroyed. Enemies that slip through damage the player.

## Theme

The game has an alien wave defense theme, similar to the popular genre title Plants vs. Zombies: instead of plants and zombies, the player defends against alien enemies using quantum traps with a space-tech look.

## Quantum concepts

**Quantum states and superposition:** Each enemy is a qubit. It spawns in a quantum state, either a basis state like |0⟩ or |1⟩ or a superposition such as |+⟩, which determines its probability of each measurement outcome.
 
**Measurement:** At the finish line, every enemy is measured and collapses to a single outcome. Collapsing to the target state destroys it; any other outcome lets it through and damages the player. Superposed enemies make this outcome probabilistic.
 
**Quantum gates:** The player defends by placing gate traps (X, H, Z, and others) along the enemies' path. Each gate transforms the state of passing enemies, and the player must combine them into a circuit that steers the wave toward the target outcome.
 
**Interference:** Gates affect not only probabilities but also phase. A Z gate has no visible effect alone, but placed before an H gate it changes the final outcome, so gate order matters.
 
**Entanglement:** In later waves, enemies come in entangled pairs across two paths. Measuring one instantly determines the other, and the player needs two-qubit gates such as CNOT to handle them.
 
## Quantum Game Mechanics
 
### How quantum concepts affect gameplay
 
Each enemy is a qubit whose state changes only when it passes a trap in its lane. Traps are quantum gates (X, H, Z, S, T, later CNOT) applied to every enemy that passes them. At the end of the lane, a detector measures the enemy: collapsing to the target state destroys it, any other outcome damages the player. The player's strategy is building a circuit, choosing gates and their order, that steers incoming states toward the target outcome.
 
### What the player can do because of quantum mechanics
 
- Turn a 50/50 enemy into a certain outcome through interference (H turns |+⟩ into |0⟩).
- Use phase gates such as Z, which change nothing visible alone but change the result once another gate follows.
- Exploit gate order (Z then H differs from H then Z).
- Optimize a circuit for a whole wave to minimize damage.
- Handle entangled pairs, where measuring one decides the other, with two-lane CNOT traps.

### Why this is different from classical randomness
 
Classical probabilities can never cancel. Quantum amplitudes carry phase and can interfere, so the right gate turns a probabilistic state into a guaranteed result, and two enemies with identical odds (|+⟩ and |−⟩) can need opposite solutions. Gates are reversible, so no fixed circuit can reduce the randomness of a fully mixed wave - only measurement can. Entangled pairs add correlations that classical random enemies cannot reproduce.
 
### How quantum states and gates change the game state
 
Each enemy stores its state as amplitudes. A trap multiplies this state by its gate matrix, and the enemy's label, probability and color update immediately. The detector samples an outcome from the squared amplitudes, deciding whether the enemy is destroyed or reduces the player's health. The wave preview uses the same states to show the expected leakage of the current circuit before the wave arrives.
 
## Gameplay and Rules
 
The game is played as an endless run of waves. Every wave starts with a build phase: the player sees a preview of how many enemies will arrive in each lane and in which states, then places, moves or removes gate traps without time pressure. In the wave phase that follows, enemies walk in a straight line along their lanes, each trap applies its gate to every enemy that passes it, and the detector at the end measures them.

An enemy that collapses to the target state is destroyed, any other outcome reduces the player's health. Traps can only be placed during the build phase, each lane has a limited number of cells and the player has a limited set of gates available.

CNOT traps span two adjacent lanes and are required for entangled pairs in later waves. The run starts with simple waves, such as |1⟩ enemies solved by an X trap, and new gates and enemy types unlock as it progresses, gradually introducing superpositions, phase states, mixed distributions and entanglement, forcing the player to adapt the circuit after each wave. The run ends when health reaches zero.

## Winning / Losing / Game Objectives
 
The player's objective is to protect their health throughout the attack waves and achieve the highest possible score. The game has no final level as waves keep coming and grow more difficult, and the run ends when the player's health reaches zero. The player earns points for every enemy destroyed, a bonus for clearing a wave without losing health, and a multiplier that grows with the wave number, so surviving longer and building efficient circuits both raise the score. The final score is recorded as a high score for the player to beat in future runs.

## Platform and Development Tools
 
Quantum Kick will be a web game. It will be written in **TypeScript** using the **Phaser 4** game framework, and with **Vite** for building and bundling. The project has no need to store data remotely or provide multiplayer or other on-line activities, so it will be mostly client-side stack of technologies.

## Existing games

Existing quantum games, such as **Quantum Odyssey**, **Hello Quantum** and **QPong**, are mostly circuit puzzles or quantum versions of classic arcade games, while the many tower defense games with "quantum" in their name use it only as a theme or a source of randomness. **Quantum Kick** adapts lane-based tower defense and replaces its core mechanic with quantum computation.

Its quantum contribution is that the player designs circuits against a *distribution* of incoming states, and because gates are reversible, no single circuit handles every wave, so the player must adapt the circuit to each wave. From social perspective, this game teaches the players how to use quantum gates in meaningful and intended ways.