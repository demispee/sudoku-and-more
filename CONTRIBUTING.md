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

You need [Node.js](https://nodejs.org/). Run `npm install` once, then `npm run dev` to
open the pages with a dev server that reloads on every change. Please check your change
in at least one desktop browser and on a narrow window or phone (`npm run dev:phone`).

Keep it small: no frameworks, no build step, and no runtime dependencies or network
requests. Node.js and the packages in `package.json` are only for development and tests.

## Specs and tests

- Describe new or changed behavior in the spec in `.openspec/specs/` first.
- Game rules belong in `src/`, without page code, so they can be tested. Add tests in
  `tests/` for every requirement you add or change.
- `npm test` must pass, with at least 80% coverage of `src/`. CI runs it on every pull
  request, and `main` only accepts pull requests that pass.

## Fonts and logos

Do not commit font files. TT Interphases is licensed and lives only in the ignored
`fonts/` folder. Do not add or change brand logos; they are not covered by the
license.

## Commits

Short, imperative messages that say what the change does, for example
`Add keyboard shortcut for notes` or `Fix hint on a full board`.

## Using AI agents

Much of this project was written with an AI agent (Claude Code) under human review.
That does not change what is expected of a contribution, but it does mean the code
carries inline comments explaining *why*. Please keep that up.
