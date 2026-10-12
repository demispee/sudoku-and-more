# ADR-0005: Every change goes through a branch and a pull request

**Status:** Accepted
**Date:** 2026-10-09

## Context

Until now, changes were committed and pushed straight to `main`. Every push went live on
GitHub Pages at once, before anything checked it. With automated tests (ADR-0004) there
is now something that can check a change before it goes live.

## Decision

1. Change the spec first (or add an ADR) when behavior or design changes.
2. Work on a branch: `feat/…`, `fix/…`, `docs/…`, `refactor/…` or `chore/…`.
3. Build the change and its tests; run `npm test` locally.
4. Push the branch and open a pull request.
5. CI runs the tests on the pull request.
6. The owner reviews and merges. Claude never merges.

`main` is protected on GitHub: changes only arrive through a pull request, and only when
the CI check passes.

## Consequences

- `main`, and so the live site, only contains changes that passed the tests.
- A change takes one extra step (merging the pull request) before it is live.
- Every change has a pull request that explains what changed and why.
