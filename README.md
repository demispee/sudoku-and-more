# sudoku-and-more

Small browser games. The game rules are written in Rust and compiled to
WebAssembly; the pages are Vue 3 components in TypeScript.

**Play online:** <https://demispee.github.io/sudoku-and-more/>

| Page | What it is |
|------|------------|
| [`sudoku.html`](web/sudoku.html) | Sudoku with difficulty levels 1 to 10, notes, and a solver that explains each number it fills in |
| [`spot-the-difference.html`](web/spot-the-difference.html) | Spot the difference with scenes drawn in code |
| [`balls.html`](web/balls.html) | Bouncing balls: click to add balls, toggle gravity |
| [`ministry.html`](web/ministry.html) | The Ministry of Odd Forms: stamp absurd forms by a rulebook that grows every day |
| [`shy-squares.html`](web/shy-squares.html) | Shy squares: herd squares that flee from your cursor into a pen |
| [`mastermind.html`](web/mastermind.html) | Mastermind: break a secret code on a realistic 3D board |
| [`index.html`](web/index.html) | Start page with links to the games |

## Running it

Play online at <https://demispee.github.io/sudoku-and-more/>.

To work on it locally you need [Node.js](https://nodejs.org/) and [Rust](https://rustup.rs/)
with the WebAssembly tools. On a Mac:

```sh
brew install node rustup wasm-pack cargo-llvm-cov
rustup default stable
rustup target add wasm32-unknown-unknown
rustup component add llvm-tools-preview
```

Then:

```sh
git clone https://github.com/demispee/sudoku-and-more.git
cd sudoku-and-more
npm install        # once: installs the dev server and test tools
npm run dev        # builds the WebAssembly, then a dev server at http://localhost:5173
npm test           # Rust tests, type check and component tests, all with coverage
npm run build      # the complete site in dist/
```

`npm run dev:phone` also makes the dev server reachable from a phone on the same wifi; it
prints the address to open. A changed Vue component updates in the browser right away;
after a change to the Rust code, start `npm run dev` again.
Opening the HTML files straight from disk does not work, because browsers block modules
there.

## Project layout

| Path | What's in it |
|------|--------------|
| `web/` | The interface: one entry page per game, and in `web/src/` the Vue components, the shared Lab271 stylesheet, the spot-the-difference drawings and the bridge to the WebAssembly |
| `game-core/` | The game rules in Rust, with their tests at the bottom of each file; compiled to WebAssembly in `game-core/pkg/` |
| `tests/` | [Vitest](https://vitest.dev/) tests: Vue components (in a simulated browser), the WebAssembly bridge and the site |
| `vite.config.ts` | Builds `web/` into `dist/` |
| `.openspec/` | Specs and design decisions |
| `.github/workflows/ci.yml` | Runs all tests on every pull request, and publishes the site from `main` |

Coverage must stay at 80% or more, in Rust and in `web/src/`, and the type check must pass.

## Sudoku

- **Puzzles are generated in the browser** and always have exactly one solution.
- **Difficulty is measured, not guessed.** Each puzzle is solved the way a person would,
  and its level is set by the hardest technique it needs:

  | Level | What it takes |
  |-------|---------------|
  | 1 to 3 | Singles only, with 42, 34, or 30 given numbers |
  | 4 | Pointing pairs or box-line reduction |
  | 5 | Naked or hidden pairs |
  | 6 | Triples, X-Wing, XY-Wing, or Swordfish |
  | 7 to 10 | Those techniques run out; chains or trial and error are needed. The earlier they run out, the higher the level |

- **Step** fills in one number and explains which techniques lead to it, highlighting
  their cells; your notes lose what those techniques rule out. When the techniques run
  out, it tries a cell with two options and shows why one of them leads to a
  contradiction. **Solve** keeps stepping until the puzzle is done.
- The next puzzle is generated in the background while you play.

Keyboard: `1` to `9` fill in, `Backspace` erases, arrow keys move, `N` toggles notes,
`S` takes a step.

## Spot the difference

Scenes in all kinds of themes, from champagne and diamonds or a coral reef to a city at
night or a winter village, each with 10 to 12 possible differences. Every round picks 5, 7, or 10 of them at random, and the changed
picture is randomly on the left or the right.

- **Misses and hints cost time** (5 and 10 seconds), so clicking around at random doesn't pay.
- **Show solution** marks the differences you didn't find.
- **Records** are kept per scene and number of differences, in your browser.

All artwork is drawn in code as SVG.

## The Ministry of Odd Forms

- Each form has an applicant with a name, a species, a hat or not, a favourite number, a
  weekday and a doodle. Stamp it with `A` (approve) or `R` (reject).
- You start with one rule and get a new one every day of 10 forms. The newest rule that
  fits decides; "do the opposite" rules turn the older ones around; no rule means approve.
- Every form has a time limit: 12 seconds on day 1, a second less every day, down to 5.
  Run out and the applicant leaves.
- A wrong stamp spills tea and tells you which rule you missed; so does running out of
  time. Three times and you're fired.

## Shy squares

- Squares within 120 pixels of your mouse or finger run away from it; the closer you get,
  the harder they run. Use that to drive them into the pen on the right.
- Every level has 2 more squares (up to 20), and they get a little faster (up to level 11). `R` restarts
  the level; the best time per level is kept in your browser.

## Mastermind

- Break a secret code in at most 10 rows: **classic** is 4 pegs from 6 colours, **hard**
  5 pegs from 8. A colour can be in the code more than once.
- Click a colour (or press its number) and it goes in the first empty hole; click a peg
  to take it out again. `Backspace` takes the last peg out and `Enter` checks the row. A
  black answer peg is a right colour in the right hole, a white one a right colour in
  another hole.
- `colours` switches the palette: vivid, warm, cool or tropical.
- The board is a modern 3D object in a studio, drawn with three.js. It floats, the pegs
  bounce in, and the light follows your mouse; drag it and it springs back. Everything on
  it is made in code, without image or model files (ADR-0009).

## Specs

What each page must do, and why it is built the way it is, lives in
[`.openspec/`](.openspec/README.md): one spec per page plus architectural decision records.
Change the spec first, then the code. Every change goes through a pull request, and `main`
only accepts pull requests whose tests pass.

## Fonts and logos

All pages use the [Lab271](https://github.com/Lab271) design system of Schuberg
Philis.

- **Fonts:** TT Interphases is a licensed font and is **not** part of this repository. The
  pages load it from a local `web/public/fonts/` folder if present (ignored by git) and otherwise fall
  back to Avenir Next, Poppins, Inter, or the system sans serif.
- **Logos:** the Lab271 and Schuberg Philis logos are trademarks of Schuberg Philis. They
  are **not** covered by the license below and may not be reused outside this project.

## License

The code is licensed under the [Apache License 2.0](LICENSE). Copyright 2026 demispee.

Contributions are welcome; see [CONTRIBUTING.md](CONTRIBUTING.md). Report security issues
as described in [SECURITY.md](SECURITY.md).
