---
domain: site
version: 4.2.0
status: accepted
date: 2026-10-12
---

# 000 — Site

What every page shares: how pages are built, how you move between them, how they look,
how they are tested and published.

Requirements 1 and 4 were changed by ADR-0007 (Vue and TypeScript for the pages) and are
being implemented one page at a time; their status says how far it is.

---

### Requirement 1: Vue pages, Rust core and no external resources [MUST]

**Status:** in progress (ADR-0007): the start page and the bouncing balls are in Vue; the
sudoku and spot the difference are in `web/` but still plain HTML and JavaScript

Every page MUST have a small entry file in `web/` (`index.html`, `sudoku.html`,
`spot-the-difference.html`, `balls.html`), so the addresses stay the same, and its
interface MUST be Vue 3 components in TypeScript in `web/src/`. The components show state
and send actions; the rules of each game MUST live in the Rust crate `game-core/`,
compiled to WebAssembly, which does not touch the DOM. Pages MUST NOT load anything from
the internet. The only optional extra is the fonts folder (see Requirement 4). See
ADR-0006 and ADR-0007.

**Implementation:** `web/`, `game-core/`

#### Scenario: Playing offline

- GIVEN the repository on a computer without an internet connection
- WHEN `npm run dev` is running and a game is opened
- THEN the game works fully, only with a fallback font

**Tests:** `tests/site.test.ts` (no external URLs; every page has its entry file)

---

### Requirement 2: Start page [MUST]

The start page MUST link to every game, with its name and a one-line description.

**Implementation:** `web/index.html`, `web/src/pages/IndexPage.vue`

#### Scenario: Choosing a game

- GIVEN the start page
- WHEN the player clicks a game card
- THEN that game opens

**Tests:** `tests/site.test.ts`

---

### Requirement 3: Back to the start page [MUST]

Every game page MUST show a `← back` link to `index.html`, visible at all times.

**Implementation:** `web/src/components/BackLink.vue`; the `.back` link in
`web/sudoku.html` and `web/spot-the-difference.html`

#### Scenario: Going back

- GIVEN any game page
- WHEN the player clicks `← back`
- THEN the start page opens

#### Scenario: Bouncing balls with the panel collapsed

- GIVEN the bouncing balls page with the panel collapsed (key `H`)
- THEN the `← back` link is still visible

**Tests:** `tests/site.test.ts`, `tests/balls-page.test.ts` (the link is present; clicking it is checked by hand)

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

**Status:** in progress (ADR-0007): the styling lives in one shared stylesheet and shared
layout components, used by the start page and the bouncing balls; the sudoku and spot
the difference still have their own copy until they move to Vue. The fonts folder is
`web/public/fonts/`.

**Implementation:** `web/src/styles/lab271.css`, `web/src/components/SlashMark.vue`,
`web/src/components/SiteFooter.vue`; the `<style>` block of `web/sudoku.html` and
`web/spot-the-difference.html`

#### Scenario: Fonts not available

- GIVEN a computer without the `fonts/` folder
- WHEN any page is opened
- THEN it uses the fallback fonts and the layout still fits (for example the sudoku
  heading stays on one line on a wide screen)

**Check:** compare the pages side by side; `git ls-files` lists no font files, and CI
refuses to publish a site with font files in it.

---

### Requirement 5: Built and published on GitHub Pages [SHOULD]

`npm run build` MUST compile the WASM and then build `web/` with Vite into `dist/`, so
that it works under `/sudoku-and-more/`. After every push to `main` whose tests pass, a
GitHub Actions workflow SHOULD publish `dist/` with GitHub Pages, so that every merged
pull request is live within minutes at https://demispee.github.io/sudoku-and-more/.
Build output MUST NOT be committed.

**Implementation:** `package.json` (`build`), `vite.config.ts`, `.github/workflows/ci.yml`
(deploy job), GitHub Pages set to "GitHub Actions"

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

`npm run dev` MUST compile the WASM and then start Vite's dev server for `web/`, which
updates a changed component in the browser without reloading the page. `npm run dev:phone`
MUST do the same and also make the server reachable from other devices on the same
network, to test on a phone.

**Implementation:** `package.json` scripts, `wasm-pack`, Vite with `@vitejs/plugin-vue`

#### Scenario: Seeing a change before it goes live

- GIVEN `npm run dev` is running and the sudoku is open in the browser
- WHEN a component is changed and saved
- THEN the browser shows the change without a push

#### Scenario: Changing Rust code

- GIVEN a change to `game-core/`
- WHEN `npm run dev` is started again
- THEN the pages use the new WASM

**Check:** run `npm run dev`, open the address it prints, edit a component.

---

### Requirement 7: Automated tests, type checks and coverage [MUST]

`npm test` MUST run:

- the Rust unit tests in `game-core/` with `cargo llvm-cov`; it MUST fail when a test
  fails or when line coverage is below 80%;
- the type check, `vue-tsc --noEmit`, over all TypeScript and Vue files; it MUST fail on
  any type error;
- the Vitest tests in `tests/`: component tests with Vue Test Utils in `jsdom`, with the
  real WebAssembly module, and the bridge and site tests; it MUST fail when a test fails
  or when the coverage of lines, statements, functions or branches of `web/src/` is below
  80%.

**Implementation:** `package.json`, `vitest.config.ts`, `tsconfig.json`, `tests/`,
`game-core/src/`

#### Scenario: Coverage drops

- GIVEN a new component without tests, bringing coverage of `web/src/` below 80%
- WHEN `npm test` runs
- THEN it fails and names the coverage that is too low

#### Scenario: A type error

- GIVEN a component that passes a string where the Rust bridge expects a number
- WHEN `npm test` runs
- THEN the type check fails and names the file and line

**Check:** `npm test` passes on `main`.

---

### Requirement 8: Continuous integration [MUST]

GitHub Actions MUST install Rust, the WASM target, `wasm-pack` and `cargo-llvm-cov`, check
the Rust code with `cargo fmt --check` and `cargo clippy -D warnings` (`npm run lint:rust`),
and run `npm test` (including the type check, ADR-0007) on every pull request and every
push to `main`. `main` MUST be protected:
changes only arrive through a pull request whose test check has passed. See ADR-0005.

**Implementation:** `.github/workflows/ci.yml`, branch protection on GitHub

#### Scenario: A failing pull request

- GIVEN a pull request that breaks a Rust test, a component test, the type check, or
  Rust formatting or lints
- WHEN CI has run
- THEN the pull request shows a failed check and cannot be merged

**Check:** the pull request page on GitHub shows the `test` check.
