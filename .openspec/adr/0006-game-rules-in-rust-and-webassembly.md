# ADR-0006: Game rules in Rust, compiled to WebAssembly

**Status:** Accepted
**Date:** 2026-10-12
**Supersedes:** ADR-0004 in part (where the game rules live, and "no build step")

## Context

The project is a way to learn the workflow used in other projects at Lab271: game logic
in Rust, compiled to WebAssembly (WASM) for the browser, with a web framework for the
interface, all with at least 80% test coverage.

ADR-0004 already split the rules of each game from its page: they live in `src/*.js`
without DOM access, with their own tests. That split is the starting point here: the rules
move to Rust, the pages stay. Moving the pages to Vue.js is a later, separate step with
its own ADR.

## Decision

- **One Rust crate, `game-core/`**, with a module per game (`sudoku`, `spot`, `balls`).
  It is compiled to WASM with `wasm-pack build --target web`, which also writes the
  JavaScript glue the pages import. The build output (`game-core/pkg/`) is not committed.
- **What moves to Rust:** the sudoku generator, solver, rating, hint and step solver; the
  spot-the-difference rules (scene order, picking differences, hit detection, penalties);
  the ball physics.
- **What stays in JavaScript:** the pages (rendering and input), the timers that keep the
  sudoku generator responsive, and the spot-the-difference scene drawings. The drawings are
  SVG markup and belong with the interface, so they move to Vue later instead of to Rust.
- **Randomness:** Rust uses its own small seeded random generator. JavaScript passes a seed
  (from `Math.random`), so tests can use fixed seeds and get the same result every run.
- **Dependencies:** only `wasm-bindgen` (the bridge between Rust and JavaScript), which is
  compiled into the WASM file. No other runtime dependencies.
- **Tests:** Rust unit tests sit at the bottom of each module (`#[cfg(test)] mod tests`)
  and run with `cargo test`. Coverage is measured with `cargo llvm-cov` and must be at
  least 80% of lines. The remaining JavaScript keeps its Vitest tests and its 80%
  threshold. `npm test` runs both.
- **Build and publish:** the site now has a build step. `npm run build` compiles the WASM
  and puts the site in `dist/`. GitHub Pages is published by a GitHub Actions workflow
  from `dist/`, after the tests pass on `main`, instead of serving the branch as it is.
- **Dev server:** `npm run dev` compiles the WASM first, then starts Vite.
- **Order:** the sudoku moves first (one pull request), then spot the difference and the
  balls (a second one). After each step the site works and all tests pass.

## Consequences

- Rust (`rustup`), the `wasm32-unknown-unknown` target, `wasm-pack` and `cargo-llvm-cov`
  are needed for development. CI installs them too. Playing still needs only a browser.
- Tests run in two languages; a pull request is green only when both pass with 80%
  coverage.
- The specs 001–003 describe behavior, which does not change. Only their
  `**Implementation:**` and `**Tests:**` lines change as code moves to Rust.
- The JavaScript in `src/` shrinks to the scene drawings; the other `src/*.js` files and
  their tests are removed once their Rust version and tests are in place.
- A mistake in the Rust–JavaScript bridge shows up only in the browser, so every step is
  also checked in the browser through the dev server.
