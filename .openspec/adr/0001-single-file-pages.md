# ADR-0001: Every page is one self-contained HTML file

**Status:** Superseded by ADR-0004 (pages split into HTML and modules); the copied shared styling still applies
**Date:** 2026-10-09

## Context

The games are small and meant to be shared easily: as a link, or by sending a single file
to someone. There is no server and no build step.

## Decision

Every page is one HTML file with its CSS and JavaScript inline. Pages use no libraries,
frameworks, package managers or external resources. Artwork is drawn in code (SVG or
canvas).

## Consequences

- A page works when opened straight from disk, offline, and on GitHub Pages without any
  setup.
- Shared styling (the Lab271 tokens, buttons, footer) is copied into each page instead of
  living in one CSS file. A change to the design has to be made in every page.
- Files get long (the sudoku and spot-the-difference pages are over 1000 lines each).
- If the copied styling becomes a burden, a shared stylesheet can replace it, at the cost
  of pages no longer working as a single file. That would need a new ADR.
