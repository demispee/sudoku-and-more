# Claude Code instructions — sudoku-and-more

Browser games (sudoku, spot the difference, bouncing balls, the Ministry of Odd Forms,
shy squares, reverse snake, Mastermind).
The game rules are in Rust, compiled to WebAssembly (ADR-0006); the interface is Vue 3
with TypeScript (ADR-0007). The site is built with Vite and published to GitHub Pages by
CI from `main`.

## Commands

```sh
npm run dev        # builds the WASM, then Vite's dev server (localhost:5173)
npm run dev:phone  # same, reachable from a phone on the same wifi
npm test           # Rust tests + coverage, WASM build, vue-tsc, then Vitest + coverage
npm run typecheck  # only the type check
npm run lint:rust  # cargo fmt --check and cargo clippy -D warnings (CI runs it too)
npm run build      # the complete site in dist/
npm run mutants    # by hand: mutation testing of game-core/ (cargo-mutants, ~8 min)
npm run bench      # by hand: how long the sudoku generator takes per level
```

Rust is installed with rustup through Homebrew. If `cargo` is not found, the shell needs
`export PATH="/opt/homebrew/opt/rustup/bin:$HOME/.cargo/bin:$PATH"` (it is in
`~/.zprofile`).

Before committing Rust code, run `cargo fmt` in `game-core/` and `npm run lint:rust`;
CI fails on formatting or clippy warnings.

## Layout

- `web/`: the interface; Vite's root.
  - `web/*.html`: one entry per page, so the addresses stay the same. A Vue page's entry
    only mounts `web/src/main-<page>.ts`.
  - `web/src/pages/`: one component per page; `web/src/components/`: shared pieces
    (`BackLink`, `SlashMark`, `SiteFooter`).
  - `web/src/sudoku/`, `web/src/spot/`, `web/src/ministry/`, `web/src/shy/`,
    `web/src/snake/` and `web/src/mastermind/`: each game's state and actions
    (`useSudoku.ts`, `useSpot.ts`, `useMinistry.ts`, `useShy.ts`, `useSnake.ts`,
    `useMastermind.ts`, composables that the tests can drive without a browser) and its
    components. `mastermind/scene.ts` draws the 3D board with three.js; jsdom has no
    WebGL, so it is left out of coverage and checked in the browser (ADR-0009). The bouncing balls are small enough to live in `BallsPage.vue`.
  - `web/src/scenes/`: the spot-the-difference drawings as SVG strings, one file per scene,
    with shared drawing helpers in `helpers.ts` and the list in `index.ts`. Every scene must
    pass the fairness tests in `tests/scenes.test.ts`.
  - `web/src/styles/lab271.css`: the Lab271 design system, shared by all Vue pages.
  - `web/src/wasm.ts`: loads the WebAssembly (`loadWasm()`) and re-exports its functions.
  - `web/public/fonts/`: the licensed fonts, ignored by git.
- `game-core/`: the game rules in Rust (`src/sudoku.rs`, `spot.rs`, `balls.rs`, `ministry.rs`,
  `shy.rs`, `snake.rs`, `mastermind.rs`) and the
  bridge to JavaScript (`src/lib.rs`, with `#[wasm_bindgen]`). No DOM access. Unit tests at
  the bottom of each file, named after the spec requirement (`requirement_6_…`).
  Randomness goes through the seeded `random::Rng`, so tests are repeatable.
- `game-core/pkg/`: built by `wasm-pack`; never edit or commit it. Its `.d.ts` gives the
  bridge its types: slices are typed arrays (`Uint8Array`, `Uint16Array`, `Float64Array`).
- `tests/`: Vitest tests, grouped by spec requirement (`describe("Requirement N: …")`).
  `tests/helpers.ts` has `seedRandom()`, `memoryStore()` and `runUntil()` for games
  that use randomness, localStorage and timers (with `vi.useFakeTimers()`).
  Component tests start with `// @vitest-environment jsdom` and load the real WASM with
  `loadWasmForTests()` from `tests/wasm-setup.ts`. In jsdom, build file paths with
  `node:path` `resolve()`, not `new URL()`.
- `.openspec/`: specs (`specs/NNN-name/spec.md`) and ADRs (`adr/NNNN-title.md`).

## How to work here

1. **Spec first.** Before changing behavior, update the requirement in the matching spec,
   or add an ADR for a design decision. Show the spec change before building.
2. **Branch.** Never commit to `main`; it is protected. Use `feat/…`, `fix/…`, `docs/…`,
   `refactor/…` or `chore/…`.
3. **Build and test.** Put game rules in `game-core/` and interface code in Vue components;
   test every requirement you add or change. Run `npm test`; it must pass, with at least
   80% coverage of Rust and of `web/src/`. Every bug fix gets a test that fails without
   the fix, with `regression` in its name (`regression_…` in Rust, `"regression: …"` in
   Vitest). After a larger change to the rules, run `npm run mutants`; after changing the
   generator or solver, `npm run bench` (ADR-0008).
4. **Check in the browser.** Run `npm run dev` and try the change in the page itself; tests
   don't cover how a page looks or feels.
5. **Pull request.** Push the branch and open a PR with `gh pr create`. Say which spec
   requirements changed and how the change was checked. Never merge; the owner does.

Keep the spec's `**Implementation:**` and `**Tests:**` lines up to date when code moves.

## Rules

- The runtime packages are Vue and, only for the Mastermind board, three.js (ADR-0009);
  `wasm-bindgen` is the only Rust dependency; no network requests. Everything else in
  `package.json` is for development (ADR-0007).
- Components show state and send actions; game decisions stay in Rust.
- Values cross the bridge as numbers, strings and typed arrays. Notes are a bitmask per
  cell (bit n = note n). Free returned objects with `.free()` once read.
- TypeScript is pinned to 6.x: `vue-tsc` needs its JavaScript API, which TypeScript 7
  doesn't have.
- Styling lives in `web/src/styles/lab271.css` and the shared components; page-specific
  styles go in the component's `<style scoped>`.
- Never commit font files; `web/public/fonts/` is licensed and ignored. CI refuses to
  publish a site that contains fonts. Don't change the logos.
- Opening a page from disk (`file://`) doesn't work; use the dev server.
