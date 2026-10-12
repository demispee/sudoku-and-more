# OpenSpec — Sudoku and more

Specifications and design decisions for this project. The specs say **what** each page
must do; the ADRs say **why** it is built the way it is.

## Workflow

1. **Spec first.** Before changing behavior, add or update the requirement in the spec
   (and an ADR for a design decision).
2. **Branch.** Work on a branch such as `feat/…` or `fix/…`, never on `main`.
3. **Build and test.** Implement the change with tests; `npm test` must pass, with at
   least 80% coverage of `src/`. Look at it with `npm run dev`.
4. **Pull request.** Push the branch and open a pull request. CI runs the tests again.
5. **Merge.** The owner reviews and merges; then GitHub Pages publishes it.

If the code and the spec disagree, one of them is wrong: fix the code, or update the spec
on purpose. See ADR-0004 and ADR-0005.

## Specs

| # | Spec | Covers |
|---|------|--------|
| [000](specs/000-site/spec.md) | Site | Pages and modules, start page, back links, design system, hosting, dev server, tests, CI |
| [001](specs/001-sudoku/spec.md) | Sudoku | Generator, difficulty 1–10, input, notes, hints, step solver |
| [002](specs/002-spot-the-difference/spec.md) | Spot the difference | Scenes, rounds, clicks, penalties, records |
| [003](specs/003-bouncing-balls/spec.md) | Bouncing balls | Physics, colors, controls |

## ADRs

| # | Decision | Status |
|---|----------|--------|
| [0001](adr/0001-single-file-pages.md) | Every page is one self-contained HTML file | Superseded by 0004 |
| [0002](adr/0002-lab271-design-system.md) | All pages use the Lab271 design system; licensed fonts stay out of the repo | Accepted |
| [0003](adr/0003-difficulty-by-human-techniques.md) | Sudoku difficulty is rated by the techniques a person needs | Accepted |
| [0004](adr/0004-modules-and-automated-tests.md) | Game logic in modules, tested with Vitest, 80% coverage, CI | Accepted |
| [0005](adr/0005-branch-and-pull-request-workflow.md) | Every change goes through a branch and a pull request | Accepted |

## Format

Each requirement in a spec has:

- a title with **MUST**, **SHOULD** or **MAY** (RFC 2119)
- a short description
- `**Implementation:**` the file and function that implement it
- at least one `#### Scenario:` in GIVEN / WHEN / THEN form
- `**Tests:**` the test file that covers it, or `**Check:**` how to verify it by hand when
  it cannot be tested automatically (for example how a page looks)

ADRs are numbered `NNNN-title.md` and are never deleted. A decision that is replaced gets
the status *Superseded by NNNN*.
