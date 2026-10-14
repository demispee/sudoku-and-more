# Contributing

Thanks for taking the time to look at this project!

Contributions are governed by the [Apache-2.0 License](LICENSE), and
participation by the [Code of Conduct](CODE_OF_CONDUCT.md).

By opening a pull request you agree that your contribution is licensed under the
Apache License 2.0, the same terms as the rest of the repository.

## Before you open a PR

- Open an issue first for anything larger than a bug fix, so we can agree on the
  approach before you spend time on it.
- Keep a pull request to one concern, and describe what you changed and why.
- Do not report security issues in public issues; see [SECURITY.md](SECURITY.md).

## Getting set up

You need [Node.js](https://nodejs.org/) and [Rust](https://rustup.rs/) with `wasm-pack`
and `cargo-llvm-cov`; the README lists the commands. Run `npm install` once, then
`npm run dev` to build the WebAssembly and open the pages with a dev server. Please check
your change in at least one desktop browser and on a narrow window or phone
(`npm run dev:phone`).

Keep it small: Vue is the only runtime package, `wasm-bindgen` the only Rust dependency,
and there are no network requests. Everything else in `package.json` is for development
and tests.

## Specs and tests

- Describe new or changed behavior in the spec in `.openspec/specs/` first.
- Game rules belong in `game-core/` (Rust), without page code. Put the tests at the bottom
  of the same file, in `#[cfg(test)] mod tests`, named after the requirement they test
  (`requirement_6_…`).
- The interface is Vue 3 with TypeScript in `web/src/`. Components show state and send
  actions; they make no game decisions. Test them in `tests/` with Vue Test Utils.
- `npm test` must pass: Rust with at least 80% line coverage, the type check
  (`vue-tsc`), and at least 80% coverage of `web/src/`. CI runs it on every pull request,
  and `main` only accepts pull requests that pass.
- Run `cargo clippy` and `cargo fmt` in `game-core/` before committing Rust code.
- Every bug fix comes with a test that fails without the fix, with `regression` in its
  name (`regression_…` in Rust, `"regression: …"` in Vitest).
- After a larger change to the game rules, run `npm run mutants` (needs
  `brew install cargo-mutants`, about 15 minutes) and add tests for the gaps it finds.
  After changing the sudoku generator or solver, run `npm run bench`. See ADR-0008.

## Fonts and logos

Do not commit font files. TT Interphases is licensed and lives only in the ignored
`web/public/fonts/` folder. Do not add or change brand logos; they are not covered by the
license.

## Commits

Short, imperative messages that say what the change does, for example
`Add keyboard shortcut for notes` or `Fix step on a full board`.

## Using AI agents

Much of this project was written with an AI agent (Claude Code) under human review.
That does not change what is expected of a contribution, but it does mean the code
carries inline comments explaining *why*. Please keep that up.
