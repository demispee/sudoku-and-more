# ADR-0008: Testing strategy: regression tests, deeper checks by hand

**Status:** Accepted
**Date:** 2026-10-12

## Context

`npm test` runs the Rust unit tests and the Vitest tests, with at least 80% coverage, and
CI runs it on every pull request (ADR-0004, ADR-0006, ADR-0007). Coverage says which
lines ran, not whether a test would notice a mistake in them: a one-time run of
cargo-mutants on `game-core/` found 91 small changes to the rules that no test noticed.

Other Lab271 projects add more kinds of tests. MVL (a programming language) has
regression tests, end-to-end tests that compile and run whole programs, a nightly
benchmark, and mutation testing and fuzzing by hand. algo-synth (a Vue site on a Rust
core, like this one) has a benchmark script. Every pull request here should stay quick
to check, with CI at about one minute.

## Decision

- **Regression tests.** Every bug fix gets a test that fails without the fix. Its name
  contains `regression` (`regression_…` in Rust, `"regression: …"` in Vitest), so it is
  clear why it exists and nobody removes it as a duplicate.
- **Mutation testing by hand: `npm run mutants`.**
  - It runs cargo-mutants on `game-core/`, taking about 8 minutes.
  - Run it after a larger change to the game rules, and add tests for real gaps it finds.
  - `src/lib.rs` is left out (`game-core/.cargo/mutants.toml`): it is the bridge to
    JavaScript, which the Vitest tests cover but cargo-mutants can't see.
  - There is no required score. Some changes it makes give the same result, for example
    a tie-break where either choice is right.
  - It needs `cargo-mutants` (`brew install cargo-mutants`). The results go to
    `mutants.out/`, which git ignores.
- **Benchmark by hand: `npm run bench`.**
  - `tools/bench.mjs` measures how long the sudoku generator needs per level, the way
    the page asks for a puzzle.
  - Run it after changing the generator or the solver.
  - On 2026-10-12 every level took at most 91 ms, and every level was hit in 15 of 15
    tries.
- **No scheduled runs.** Mutation testing and the benchmark run when someone starts them,
  not weekly or nightly. That can be added later with a `schedule` or `workflow_dispatch`
  workflow if it turns out to be needed.
- **No fuzzing.** Fuzzing finds crashes on unexpected input, which matters for code that
  reads input from outside (as in MVL). Here all input to the rules comes from the pages
  themselves: a seed, a click, a level. Fuzzing would also need nightly Rust.
- **No browser tests (such as Playwright) for now.** The Vitest tests run in `jsdom`,
  which has no layout, no canvas and doesn't load the built site, so some mistakes only
  show in a real browser. Every change is still tried in the browser before its pull
  request (`CLAUDE.md`), and algo-synth has no browser tests either. Worth adding when
  the site grows (many pages, forms, logging in), when several people work on it, or
  when a mistake online does real harm.
- **No property-based testing** for now. The fairness tests of the scenes already check
  rules over all 30 scenes, and the other Lab271 projects don't use it either.

## Consequences

- CI stays as it is; nothing new is installed for it.
- Two commands that nobody has to run for every change, but that are there when the
  rules or the generator change.
- `CLAUDE.md` and `CONTRIBUTING.md` describe the regression rule and the new commands.
