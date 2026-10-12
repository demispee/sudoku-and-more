---
domain: site
version: 3.2.0
status: accepted
date: 2026-10-12
---

# 000 — Site

What every page shares: how pages are built, how you move between them, how they look,
how they are tested and published.

---

### Requirement 1: Pages, Rust core and no external resources [MUST]

Each page MUST be one HTML file with its styling inline and its interface code in an
inline `<script type="module">`. The rules of each game MUST live in the Rust crate
`game-core/`, compiled to WebAssembly, and MUST NOT touch the DOM. JavaScript outside the
pages (`src/`) is limited to code that belongs with the interface, such as the
spot-the-difference drawings. Pages MUST NOT load anything from the internet. The only
optional extra is the `fonts/` folder (see Requirement 4). See ADR-0006.

**Implementation:** `index.html`, `sudoku.html`, `spot-the-difference.html`, `balls.html`,
`game-core/`, `src/`

#### Scenario: Playing offline

- GIVEN the repository on a computer without an internet connection
- WHEN `npm run dev` is running and a game is opened
- THEN the game works fully, only with a fallback font

**Tests:** `tests/site.test.js` (no external URLs; the pages import the WASM module)

---

### Requirement 2: Start page [MUST]

`index.html` MUST link to every game, with its name and a one-line description.

**Implementation:** `index.html`

#### Scenario: Choosing a game

- GIVEN the start page
- WHEN the player clicks a game card
- THEN that game opens

**Tests:** `tests/site.test.js`

---

### Requirement 3: Back to the start page [MUST]

Every game page MUST show a `← back` link to `index.html`, visible at all times.

**Implementation:** `.back` link in `sudoku.html`, `spot-the-difference.html`, `balls.html`

#### Scenario: Going back

- GIVEN any game page
- WHEN the player clicks `← back`
- THEN the start page opens

#### Scenario: Bouncing balls with the panel collapsed

- GIVEN the bouncing balls page with the panel collapsed (key `H`)
- THEN the `← back` link is still visible

**Tests:** `tests/site.test.js` (the link is present; clicking it is checked by hand)

---

### Requirement 4: Lab271 design system [MUST]

All pages MUST use the Lab271 dark theme: the same color tokens (`--c-canvas`,
`--c-tq`, `--c-orange`, `--c-magenta`, …), TT Interphases with its fallbacks, pill
buttons, rounded labels with a square bottom-left corner, and the `\` separator. Pages
with a scrolling layout MUST show the refracted slash top right and the Lab271 \
Schuberg Philis footer. See ADR-0002.

TT Interphases MUST load from a local `fonts/` folder when present and otherwise fall
back to Avenir Next, Poppins, Inter or the system sans serif. The font files MUST NOT be
committed.

**Implementation:** the `<style>` block of each page

#### Scenario: Fonts not available

- GIVEN a computer without the `fonts/` folder
- WHEN any page is opened
- THEN it uses the fallback fonts and the layout still fits (for example the sudoku
  heading stays on one line on a wide screen)

**Check:** compare the pages side by side; `git ls-files` lists no font files.

---

### Requirement 5: Built and published on GitHub Pages [SHOULD]

`npm run build` MUST compile the WASM and put the complete site in `dist/`. After every
push to `main` whose tests pass, a GitHub Actions workflow SHOULD build the site and
publish `dist/` with GitHub Pages, so that every merged pull request is live within
minutes at https://demispee.github.io/sudoku-and-more/. Build output MUST NOT be
committed.

**Implementation:** `package.json` (`build`), `.github/workflows/ci.yml` (deploy job),
GitHub Pages set to "GitHub Actions"

#### Scenario: A change goes live

- GIVEN a pull request merged into `main`
- WHEN the tests and the deploy job have finished
- THEN the online page shows the change

#### Scenario: Broken main

- GIVEN a push to `main` whose tests fail
- THEN nothing is published and the previous version stays online

**Check:** the latest run on `main` shows a successful deploy job.

---

### Requirement 6: Dev server [MUST]

`npm run dev` MUST compile the WASM and then start a local dev server that serves every
page and reloads the page when a file changes. `npm run dev:phone` MUST do the same and
also make the server reachable from other devices on the same network, to test on a phone.

**Implementation:** `package.json` scripts, `wasm-pack`, Vite

#### Scenario: Seeing a change before it goes live

- GIVEN `npm run dev` is running and `sudoku.html` is open in the browser
- WHEN the file is changed and saved
- THEN the browser shows the change without a push

#### Scenario: Changing Rust code

- GIVEN a change to `game-core/`
- WHEN `npm run dev` is started again
- THEN the pages use the new WASM

**Check:** run `npm run dev`, open the address it prints, edit a page.

---

### Requirement 7: Automated tests with coverage, in both languages [MUST]

`npm test` MUST run both test suites:

- the Rust unit tests in `game-core/` with `cargo test`, measuring coverage with
  `cargo llvm-cov`; it MUST fail when a test fails or when line coverage is below 80%;
- the Vitest tests in `tests/` for the JavaScript in `src/` and the pages; it MUST fail
  when a test fails or when the coverage of lines, statements, functions or branches of
  `src/` is below 80%.

**Implementation:** `package.json`, `vitest.config.js`, `tests/`, `game-core/src/`

#### Scenario: Coverage drops

- GIVEN new Rust code without tests, bringing line coverage below 80%
- WHEN `npm test` runs
- THEN it fails and names the coverage that is too low

**Check:** `npm test` passes on `main`.

---

### Requirement 8: Continuous integration [MUST]

GitHub Actions MUST install Rust, the WASM target, `wasm-pack` and `cargo-llvm-cov`, and
run `npm test` on every pull request and every push to `main`. `main` MUST be protected:
changes only arrive through a pull request whose test check has passed. See ADR-0005.

**Implementation:** `.github/workflows/ci.yml`, branch protection on GitHub

#### Scenario: A failing pull request

- GIVEN a pull request that breaks a Rust or a JavaScript test
- WHEN CI has run
- THEN the pull request shows a failed check and cannot be merged

**Check:** the pull request page on GitHub shows the `test` check.
