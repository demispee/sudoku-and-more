# ADR-0009: three.js for the realistic Mastermind board

**Status:** Accepted
**Date:** 2026-10-13
**Amends:** ADR-0007 ("`vue` is the one runtime dependency")

## Context

The Mastermind page (spec 007) must look like a real board on a table: wood, glossy
plastic, light and shadows, and a board that can be turned a little. That needs 3D
drawing with lighting and reflections in WebGL. Games such as
[Firewood](https://screen.toys/firewood/) do this with three.js and scanned 3D models.

ADR-0007 allows one runtime package, `vue`. Writing our own WebGL engine with lighting,
shadows and reflections would be far more code than the game, and look worse.

## Decision

- **three.js (`three`) becomes the second runtime dependency,** only for the Mastermind
  page. Only `web/src/mastermind/scene.ts` imports it, so Vite puts it in that page's own
  bundle and the other pages don't load it.
- **No asset files.** The board, holes, shield and pegs are built from three.js shapes in
  code. The wood grain is drawn in code onto a canvas and used as a texture; the
  reflections come from three.js's `RoomEnvironment`, which is also built in code. So
  there is nothing to license and nothing is loaded from the internet (spec 000,
  Requirement 1). The result is realistic, but not as photo-perfect as a scanned model.
- **The rules stay in Rust** (ADR-0006): the code, the answer pegs and the end of the game
  are in `game-core/src/mastermind.rs`. `useMastermind.ts` holds the page's state, and
  `scene.ts` only draws that state and reports which hole or peg was clicked.
- **Tests.** jsdom has no WebGL, so `scene.ts` can't run in Vitest. It is left out of the
  coverage of `web/src/` and checked by hand in the browser (spec 007, Requirement 5).
  The page component is tested with a stand-in for the scene, so the clicks and keys are
  still covered.

## Consequences

- The Mastermind page is bigger to download (three.js is about 150 kB gzipped); the
  other pages stay the same.
- One more package to keep up to date.
- The drawing code is the one part of `web/src/` without automatic tests; a mistake in
  how the board looks is only seen in the browser.

## Update (2026-10-14)

The decision stands; how the board looks changed. Since spec 007 v2.0.0 the board is
modern graphite in a studio instead of wood on a table, so where this ADR says "wood" and
"wood grain", read "graphite": its fine surface grain and the row numbers are still drawn
in code onto a canvas, and still nothing is loaded from the internet. The pegs are glossy
balls, and the board floats and moves a little (spec 007, Requirement 7).

Two things learned while building it:

- The page bundle stays at about 155 kB gzipped. Rectangular "softbox" lights
  (`RectAreaLight`) looked a little nicer but added about 100 kB of lookup tables, so the
  coloured side lights are spotlights.
- jsdom still can't run `scene.ts`; mistakes in it were found by the critical reviews and
  in the browser (for example the end of a hard game, fixed in pull request #43). The
  scene therefore gets as little game logic as possible: whether a game is won comes
  from Rust through the page.
