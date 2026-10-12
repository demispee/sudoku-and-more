---
domain: site
version: 2.0.0
status: accepted
date: 2026-10-09
---

# 000 — Site

What every page shares: how pages are built, how you move between them, how they look,
how they are tested and where they are published.

---

### Requirement 1: Pages and modules, no external resources [MUST]

Each page MUST be one HTML file with its styling inline and its interface code in an
inline `<script type="module">`. The rules of each game MUST live in ES modules in `src/`
that do not touch the DOM. Pages MUST NOT load anything from the internet, and MUST NOT
need a build step. The only optional extra is the `fonts/` folder (see Requirement 4).
See ADR-0004.

**Implementation:** `index.html`, `sudoku.html`, `spot-the-difference.html`, `balls.html`,
`src/`

#### Scenario: Playing offline

- GIVEN the repository on a computer without an internet connection
- WHEN `npm run dev` is running and a game is opened
- THEN the game works fully, only with a fallback font

**Tests:** `tests/site.test.js` (no external URLs; modules in `src/` load in Node.js)

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

### Requirement 5: Published on GitHub Pages [SHOULD]

The site SHOULD be published with GitHub Pages from the `main` branch, so that every
merged pull request is live within minutes at https://demispee.github.io/sudoku-and-more/.

**Implementation:** repository settings on GitHub

#### Scenario: A change goes live

- GIVEN a pull request merged into `main`
- WHEN the Pages build has finished
- THEN the online page shows the change

**Check:** `gh api repos/demispee/sudoku-and-more/pages/builds/latest` shows `built` for
the latest commit.

---

### Requirement 6: Dev server [MUST]

`npm run dev` MUST start a local dev server that serves every page and reloads the page
when a file changes. `npm run dev:phone` MUST do the same and also make the server
reachable from other devices on the same network, to test on a phone.

**Implementation:** `package.json` scripts, Vite

#### Scenario: Seeing a change before it goes live

- GIVEN `npm run dev` is running and `sudoku.html` is open in the browser
- WHEN the file is changed and saved
- THEN the browser shows the change without a push

**Check:** run `npm run dev`, open the address it prints, edit a page.

---

### Requirement 7: Automated tests with coverage [MUST]

`npm test` MUST run all tests in `tests/` with Vitest and measure the coverage of `src/`.
It MUST fail when a test fails or when the coverage of lines, statements, functions or
branches is below 80%.

**Implementation:** `package.json`, `vitest.config.js`, `tests/`

#### Scenario: Coverage drops

- GIVEN new code in `src/` without tests, bringing coverage below 80%
- WHEN `npm test` runs
- THEN it fails and names the coverage that is too low

**Check:** `npm test` passes on `main`.

---

### Requirement 8: Continuous integration [MUST]

GitHub Actions MUST run `npm test` on every pull request and every push to `main`. `main` MUST be
protected: changes only arrive through a pull request whose test check has passed. See
ADR-0005.

**Implementation:** `.github/workflows/ci.yml`, branch protection on GitHub

#### Scenario: A failing pull request

- GIVEN a pull request that breaks a test
- WHEN CI has run
- THEN the pull request shows a failed check and cannot be merged

**Check:** the pull request page on GitHub shows the `test` check.
