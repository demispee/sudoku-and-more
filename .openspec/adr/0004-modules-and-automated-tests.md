# ADR-0004: Game logic in modules, tested with Vitest

**Status:** Accepted
**Date:** 2026-10-09
**Supersedes:** ADR-0001

## Context

The games had no automated tests; every spec requirement was checked by hand. Tests need
to import the code they test, which is not possible while all JavaScript sits inline in
the HTML pages (ADR-0001).

The aim is the same way of working as in other projects: the standard test tool of the
language, tests run on every push by CI, and at least 80% coverage.

## Decision

- **Split logic from pages.** The rules of each game (generator, solver, physics, hit
  detection, scene drawing) live in ES modules in `src/`. The HTML pages keep the
  interface: layout, styling, rendering and input, in an inline `<script type="module">`
  that imports from `src/`. Modules in `src/` MUST NOT touch the DOM, so they run in
  Node.js.
- **Vitest** is the test runner, with tests in `tests/*.test.js`. `npm test` runs all
  tests with coverage.
- **Coverage of `src/` must be at least 80%** for lines, statements, functions and
  branches. Below that, `npm test` fails.
- **Vite** is the dev server (`npm run dev`), from the same makers as Vitest.
- **No build step.** GitHub Pages serves the files as they are; browsers load the modules
  directly.
- **CI** (GitHub Actions) runs `npm test` on every push and pull request.

## Consequences

- A page is no longer a single file: it needs its modules in `src/`. Sharing works through
  the GitHub Pages link.
- Opening a page straight from disk (`file://`) no longer works, because browsers block
  module imports there. Use `npm run dev` locally.
- Node.js is needed for development, but not for playing.
- Shared styling is still copied into each page; that part of ADR-0001 stands.
