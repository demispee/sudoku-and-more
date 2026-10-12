# Claude Code instructions — sudoku-and-more

Three browser games (sudoku, spot the difference, bouncing balls). The game rules are in
Rust, compiled to WebAssembly; the pages are HTML and JavaScript (ADR-0006). The
site is built and published to GitHub Pages by CI from `main`.

## Commands

```sh
npm run dev        # builds the WASM, then a dev server with live reload (localhost:5173)
npm run dev:phone  # same, reachable from a phone on the same wifi
npm test           # Rust tests + coverage, then the WASM build, then Vitest + coverage
npm run build      # the complete site in dist/
```

Rust is installed with rustup through Homebrew. If `cargo` is not found, the shell needs
`export PATH="/opt/homebrew/opt/rustup/bin:$HOME/.cargo/bin:$PATH"` (it is in
`~/.zprofile`).

In `game-core/`, run `cargo clippy --all-targets` and `cargo fmt` before committing.

## Layout

- `*.html`: the pages. Styling and interface code (rendering, input) live inline, in a
  `<script type="module">` that imports from `game-core/pkg/` or `src/`.
- `game-core/`: the game rules in Rust (`src/sudoku.rs`, `spot.rs`, `balls.rs`) and the
  bridge to JavaScript (`src/lib.rs`, with `#[wasm_bindgen]`). No DOM access. Unit tests at the bottom of each
  file, named after the spec requirement (`requirement_6_…`). Randomness goes through the
  seeded `random::Rng`, so tests are repeatable.
- `game-core/pkg/`: built by `wasm-pack`; never edit or commit it.
- `src/`: the spot-the-difference scene drawings (SVG strings). No DOM access.
- `tests/`: Vitest tests, one file per spec or bridge, grouped by requirement
  (`describe("Requirement N: …")`). Use `seedRandom()` from `tests/random.js` for anything
  random. `tests/wasm.test.js` checks the WebAssembly bridge.
- `.openspec/`: specs (`specs/NNN-name/spec.md`) and ADRs (`adr/NNNN-title.md`).

## How to work here

1. **Spec first.** Before changing behavior, update the requirement in the matching spec,
   or add an ADR for a design decision. Show the spec change before building.
2. **Branch.** Never commit to `main`; it is protected. Use `feat/…`, `fix/…`, `docs/…`,
   `refactor/…` or `chore/…`.
3. **Build and test.** Put game rules in `game-core/` and test every requirement you add or
   change. Run `npm test`; it must pass with at least 80% coverage in both languages.
4. **Check in the browser.** Run `npm run dev` and try the change in the page itself; tests
   don't cover how a page looks or feels, or mistakes in the Rust–JavaScript bridge.
5. **Pull request.** Push the branch and open a PR with `gh pr create`. Say which spec
   requirements changed and how the change was checked. Never merge; the owner does.

Keep the spec's `**Implementation:**` and `**Tests:**` lines up to date when code moves.

## Rules

- No frameworks, runtime dependencies or network requests. The only Rust dependency is
  `wasm-bindgen`; packages in `package.json` are for development only (ADR-0006).
- Values cross the bridge as plain numbers, strings and arrays. Notes are a bitmask per
  cell (bit n = note n). Free returned objects with `.free()` once read.
- Shared styling is copied into every page (ADR-0001, ADR-0002); a design change must be
  made in all pages.
- Never commit font files; `fonts/` is licensed and ignored. Don't change the logos.
- Opening a page from disk (`file://`) doesn't work; use the dev server.
