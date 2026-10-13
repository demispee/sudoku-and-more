---
domain: mastermind
version: 1.0.0
status: accepted
date: 2026-10-13
---

# 007 — Mastermind

The classic code-breaking game, on a board that looks real: lacquered wood, glossy
plastic pegs, light and shadows (ADR-0009).

---

### Requirement 1: The secret code [MUST]

A new game MUST pick a secret code of 4 pegs from 6 colours (red, orange, yellow, green,
blue, purple). A colour MAY appear more than once; a hole MUST NOT be left empty. The code
is hidden under a shield at the end of the board until the game is over.

**Implementation:** `game-core/src/mastermind.rs` (`Game::new`)

#### Scenario: A repeatable code

- GIVEN two new games with the same seed
- WHEN their codes are compared
- THEN they are the same, and every peg is one of the 6 colours

**Tests:** `game-core/src/mastermind.rs`

---

### Requirement 2: Placing pegs [MUST]

The board MUST have 10 rows of 4 holes; the player fills the lowest open row. Clicking a
colour in the peg tray and then a hole MUST place that colour there; clicking a filled
hole of the open row MUST take its peg out again. The keys 1–6 MUST place a colour in
the first empty hole, and Backspace MUST take out the last peg placed. `check` (or Enter)
MUST only work when all 4 holes of the row are filled.

**Implementation:** `web/src/mastermind/useMastermind.ts`, `web/src/pages/MastermindPage.vue`

#### Scenario: An unfinished row

- GIVEN an open row with 3 pegs
- WHEN the player presses Enter
- THEN nothing is checked, and the row stays open

**Tests:** `tests/use-mastermind.test.ts`, `tests/mastermind-page.test.ts`

---

### Requirement 3: The answer pegs [MUST]

After a row is checked, it MUST get a black answer peg for every peg of the right colour
in the right hole, and a white one for every other peg whose colour is in the code but in
another hole. A peg in the code MUST be counted at most once. The answer pegs MUST be
shown in a block next to the row, black ones first, so they don't tell which peg is which.

**Implementation:** `game-core/src/mastermind.rs` (`score`)

#### Scenario: Repeated colours

- GIVEN the code red, green, blue, blue
- WHEN the player checks blue, red, green, blue
- THEN the row gets 1 black (the last blue) and 3 white answer pegs

#### Scenario: Not counted twice

- GIVEN the code red, green, blue, yellow
- WHEN the player checks red, red, red, red
- THEN the row gets 1 black answer peg and no white ones

**Tests:** `game-core/src/mastermind.rs`

---

### Requirement 4: The end [MUST]

With 4 black answer pegs the player MUST win; after 10 rows without that, the player MUST
lose. Either way the shield MUST open and show the code, an overlay MUST say how many
rows it took (or that the code wasn't broken), and `again` (or Enter) starts a new game.

**Implementation:** `game-core/src/mastermind.rs`; `web/src/mastermind/useMastermind.ts`

#### Scenario: Out of rows

- GIVEN 9 checked rows without 4 black answer pegs
- WHEN the 10th row is checked and is not the code
- THEN the shield opens, the overlay shows the code was not broken, and no more pegs can
  be placed

**Tests:** `game-core/src/mastermind.rs`, `tests/use-mastermind.test.ts`

---

### Requirement 5: A realistic board [MUST]

The board MUST be drawn in 3D with three.js (ADR-0009), and look like a real game on a
table, not like a drawing:

- a board of dark lacquered wood with a visible grain, 10 rows of round holes, small
  holes for the answer pegs, and a hinged shield over the code;
- glossy plastic pegs that reflect the light; a placed peg drops into its hole;
- soft light from above with real shadows on the board and the table;
- the player MAY drag to tilt and turn the board a little, within limits, so it never
  ends up upside down.

All shapes and textures MUST be made in code: no model, image or texture files. When the
browser has no WebGL, the page MUST say so instead of showing an empty board.

**Implementation:** `web/src/mastermind/scene.ts`, `web/src/pages/MastermindPage.vue`

#### Scenario: Turning the board

- GIVEN the board on the screen
- WHEN the player drags it sideways
- THEN it turns with the drag and stops at its limit

**Check:** by hand with `npm run dev`: the board looks like wood and plastic in light, not
like a flat drawing; pegs drop into the holes; dragging turns it within its limits.

---

### Requirement 6: Records [SHOULD]

The fewest rows needed to break a code SHOULD be kept in the browser (`localStorage` key
`mastermindBest`) and shown on the page.

**Implementation:** `web/src/mastermind/useMastermind.ts`

#### Scenario: A new best

- GIVEN a best of 6 rows
- WHEN the player breaks a code in 4 rows
- THEN the best becomes 4, and the overlay says it is the best yet

**Tests:** `tests/use-mastermind.test.ts`
