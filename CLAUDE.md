# Claude Code instructions — sudoku-and-more

Three browser games (sudoku, spot the difference, bouncing balls) in plain HTML and
JavaScript, published with GitHub Pages from `main`.

## Commands

```sh
npm run dev        # dev server with live reload (http://localhost:5173)
npm run dev:phone  # same, reachable from a phone on the same wifi
npm test           # all tests with coverage; fails below 80%
```

## Layout

- `*.html`: the pages. Styling and interface code (rendering, input) live inline, in a
  `<script type="module">` that imports from `src/`.
- `src/`: the rules of each game. MUST NOT touch the DOM, so tests run in Node.js.
- `tests/`: Vitest tests, one file per spec, grouped by requirement
  (`describe("Requirement N: …")`). Use `seedRandom()` from `tests/random.js` for anything
  random.
- `.openspec/`: specs (`specs/NNN-name/spec.md`) and ADRs (`adr/NNNN-title.md`).

## How to work here

1. **Spec first.** Before changing behavior, update the requirement in the matching spec,
   or add an ADR for a design decision. Show the spec change before building.
2. **Branch.** Never commit to `main`; it is protected. Use `feat/…`, `fix/…`, `docs/…`,
   `refactor/…` or `chore/…`.
3. **Build and test.** Put game rules in `src/` and test every requirement you add or
   change. Run `npm test`; it must pass with at least 80% coverage.
4. **Check in the browser.** Run `npm run dev` and try the change in the page itself;
   tests don't cover how a page looks or feels.
5. **Pull request.** Push the branch and open a PR with `gh pr create`. Say which spec
   requirements changed and how the change was checked. Never merge; the owner does.

Keep the spec's `**Implementation:**` and `**Tests:**` lines up to date when code moves.

## Rules

- No runtime dependencies, frameworks, build step or network requests (ADR-0004).
  Packages in `package.json` are for development only.
- Shared styling is copied into every page (ADR-0001, ADR-0002); a design change must be
  made in all pages.
- Never commit font files; `fonts/` is licensed and ignored. Don't change the logos.
- Opening a page from disk (`file://`) doesn't work; use the dev server.
