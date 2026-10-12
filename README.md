# sudoku-and-more

Three small browser games in plain HTML and JavaScript, with no runtime dependencies and no
build step.

**Play online:** <https://demispee.github.io/sudoku-and-more/>

| Page | What it is |
|------|------------|
| [`sudoku.html`](sudoku.html) | Sudoku with difficulty levels 1 to 10, notes, hints, and a solver that explains each step |
| [`spot-the-difference.html`](spot-the-difference.html) | Spot the difference with five hand-drawn SVG scenes |
| [`balls.html`](balls.html) | Bouncing balls: click to add balls, toggle gravity |
| [`index.html`](index.html) | Start page with links to the three games |

## Running it

Play online at <https://demispee.github.io/sudoku-and-more/>.

To work on it locally you need [Node.js](https://nodejs.org/) (on a Mac: `brew install node`):

```sh
git clone https://github.com/demispee/sudoku-and-more.git
cd sudoku-and-more
npm install        # once: installs the dev server and test tools
npm run dev        # dev server at http://localhost:5173, reloads on every change
npm test           # all tests, with coverage
```

`npm run dev:phone` also makes the dev server reachable from a phone on the same wifi; it
prints the address to open. Opening the HTML files straight from disk does not work,
because browsers block the modules in `src/` there.

## Project layout

| Path | What's in it |
|------|--------------|
| `*.html` | The pages: layout, styling, and the code that draws and handles input |
| `src/` | The rules of each game, without any page code, so they can be tested |
| `tests/` | Tests for `src/` and the pages ([Vitest](https://vitest.dev/)); coverage must stay at 80% or more |
| `.openspec/` | Specs and design decisions |
| `.github/workflows/ci.yml` | Runs the tests on every pull request |

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

- **Step** applies one logical step and explains it on the board. **Solve** keeps stepping
  until the puzzle is done.
- The next puzzle is generated in the background while you play.

Keyboard: `1` to `9` fill in, `Backspace` erases, arrow keys move, `N` toggles notes,
`T` gives a hint, `S` takes a step.

## Spot the difference

Five scenes (champagne and diamonds, a peacock, a vanity table with perfume and pearls, a
crowned swan on a moonlit lake, and a cocktail bar with a disco ball), each with 10 to 12
possible differences. Every round picks 5, 7, or 10 of them at random, and the changed
picture is randomly on the left or the right.

- **Misses and hints cost time** (5 and 10 seconds), so clicking around at random doesn't pay.
- **Show solution** marks the differences you didn't find.
- **Records** are kept per scene and number of differences, in your browser.

All artwork is drawn in code as SVG.

## Specs

What each page must do, and why it is built the way it is, lives in
[`.openspec/`](.openspec/README.md): one spec per page plus architectural decision records.
Change the spec first, then the code. Every change goes through a pull request, and `main`
only accepts pull requests whose tests pass.

## Fonts and logos

All pages use the [Lab271](https://github.com/Lab271) design system of Schuberg
Philis.

- **Fonts:** TT Interphases is a licensed font and is **not** part of this repository. The
  pages load it from a local `fonts/` folder if present (ignored by git) and otherwise fall
  back to Avenir Next, Poppins, Inter, or the system sans serif.
- **Logos:** the Lab271 and Schuberg Philis logos are trademarks of Schuberg Philis. They
  are **not** covered by the license below and may not be reused outside this project.

## License

The code is licensed under the [Apache License 2.0](LICENSE). Copyright 2026 demispee.

Contributions are welcome; see [CONTRIBUTING.md](CONTRIBUTING.md). Report security issues
as described in [SECURITY.md](SECURITY.md).
