# ADR-0007: Vue and TypeScript for the pages

**Status:** Accepted
**Date:** 2026-10-12
**Supersedes:** ADR-0001 (single-file pages); ADR-0006 in part (pages in plain HTML and
JavaScript, "no frameworks")

## Context

Phase 1 (ADR-0006) moved all game rules to Rust. The pages are still hand-written HTML
with inline JavaScript: each page updates the screen by hand (`render()`), and the Lab271
styling, back link and footer are copied into all four pages.

The aim of this project is to learn the workflow used in other Lab271 projects, where the
interface is Vue 3 with TypeScript on top of a Rust/WebAssembly core, built with Vite
(algo-synth, ADR-0003 there).

## Decision

- **Vue 3 with TypeScript** for the interface, in single-file components (`.vue`). The
  components show state and send actions to the Rust core; they make no game decisions.
- **One folder, `web/`,** for everything that is the interface:
  - `web/index.html`, `web/sudoku.html`, `web/spot-the-difference.html`,
    `web/balls.html`: one small entry page per game, so the URLs stay the same;
  - `web/src/pages/`: one component per page (`SudokuPage.vue`, …);
  - `web/src/components/`: the pieces (the sudoku board, a picture, the number pad) and
    the shared layout (back link, header, footer, slash);
  - `web/src/styles/lab271.css`: the Lab271 design system, written once and shared by
    all pages, instead of copied into each;
  - `web/src/scenes.ts`: the spot-the-difference drawings, moved from `src/spot-scenes.js`
    to TypeScript. A scene component shows the SVG they return. Rewriting every drawing as
    a Vue template is not part of this ADR.
- **TypeScript 6, pinned, in strict mode.** `vue-tsc` checks the types of `.ts` and `.vue`
  files and needs TypeScript's JavaScript API, which the native TypeScript 7 does not
  have yet (as in algo-synth). The types of the Rust bridge come from the `.d.ts` file
  that `wasm-pack` writes.
- **Vite builds the site.** `npm run build` compiles the WebAssembly, then `vite build`
  turns `web/` into `dist/` (with `base: "./"`, so it works under `/sudoku-and-more/`).
  This replaces `scripts/build.js`. `npm run dev` is Vite's dev server, which updates a
  component in the browser without reloading the page.
- **Dependencies:** `vue` is the one runtime dependency. Development only: `typescript`,
  `vue-tsc`, `@vitejs/plugin-vue`, `@vue/test-utils` and `jsdom`.
- **Tests:**
  - Rust keeps its unit tests and 80% line coverage (ADR-0006).
  - Components get tests with Vitest and Vue Test Utils in `jsdom` (a browser
    simulated in Node.js), next to the bridge tests in `tests/`. The real WebAssembly
    module is loaded in the tests, so a component test also checks the bridge.
  - Coverage of `web/src/` must be at least 80% for lines, statements, functions and
    branches.
  - `npm run typecheck` (`vue-tsc --noEmit`) must pass. `npm test` runs it, and so
    does CI.
- **Fonts:** the licensed TT Interphases files move to `web/public/fonts/`, still ignored
  by git, so Vite serves them when they are present.
- **Order, one pull request each, the site working after every one:**
  1. Set-up: `web/`, Vite with Vue and TypeScript, the shared styles and layout
     components, type checks and component tests in CI. The start page and the bouncing
     balls move to Vue; the other two pages move into `web/` unchanged.
  2. The sudoku in Vue.
  3. Spot the difference in Vue, with the drawings in TypeScript.

## Consequences

- The Lab271 styling lives in one place; a design change is made once.
- Screens update themselves from state, so the pages lose their hand-written `render()`
  code.
- There is one more language in the repository (TypeScript) and more development
  packages to keep up to date.
- The site always needs `vite build` before it can be published; GitHub Pages serves the
  output, as since ADR-0006.
- The specs 001–003 describe behavior, which does not change; their `**Implementation:**`
  lines change as the pages move.
