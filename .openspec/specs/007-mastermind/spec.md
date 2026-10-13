---
domain: mastermind
version: 2.1.0
status: accepted
date: 2026-10-13
---

# 007 — Mastermind

The classic code-breaking game, on a modern 3D board that looks real and moves a little:
glossy pegs, light, shadows and a studio backdrop (ADR-0009).

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

The board MUST have 10 rows of 4 holes; the player fills the first open row. Clicking a
colour, in the tray on the board or with the buttons under it, MUST put a peg of that
colour in the first empty hole of the open row. Clicking a peg of the open row MUST take
it out again, so the next colour fills that hole. The keys 1–6 MUST do the same as
clicking a colour, and Backspace MUST take out the last peg placed. `check` (or Enter)
MUST only work when all 4 holes of the row are filled.

**Implementation:** `web/src/mastermind/useMastermind.ts`, `web/src/pages/MastermindPage.vue`

#### Scenario: Fixing a mistake

- GIVEN red, blue and green in the open row
- WHEN the player clicks the blue peg, and then yellow
- THEN the row is red, yellow, green and an empty hole

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

### Requirement 5: A modern, realistic board [MUST]

The board MUST be drawn in 3D with three.js (ADR-0009), and look like a real, modern
object in a studio, not like a drawing:

- the player looks at the board from its bottom edge: row 1 is nearest, row 10 furthest
  away, and the shield with the code at the far end. The 4 holes of a row, and the
  colours of the peg tray in front of the board, MUST run from left to right;
- a board of dark, soft-matte graphite with rounded edges and a thin polished rim;
  10 rows of round holes, small holes for the answer pegs, and a thin light around the
  holes of the open row;
- glossy pegs in bright, deep colours with a slight pearly shine; pearl-white and
  glossy black answer pegs;
- a studio backdrop that curves from the floor into the wall, in a soft colour gradient,
  with a key light that casts real shadows and coloured light from the sides;
- the player MAY drag to tilt and turn the board a little, within limits, so it never
  ends up upside down.

All shapes and textures MUST be made in code: no model, image or texture files. When the
browser has no WebGL, the page MUST say so instead of showing an empty board.

**Implementation:** `web/src/mastermind/scene.ts`, `web/src/pages/MastermindPage.vue`

#### Scenario: A row from left to right

- GIVEN a new game
- WHEN the player types 1, 2, 3, 4
- THEN the four pegs stand next to each other from left to right in the row nearest to
  the player

**Check:** by hand with `npm run dev`: the board looks like a modern object in a studio,
not like a flat drawing; row 1 is at the front; the open row is lit; dragging turns the
board within its limits.

**Tests:** `tests/mastermind-page.test.ts` (the message without WebGL; the board is
disposed of when the page closes)

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

---

### Requirement 7: A board that moves [SHOULD]

The board SHOULD feel alive, a little:

- it floats and sways slowly, as if it hangs in the air;
- the light follows the pointer a little, so the shine moves over the pegs;
- after a drag it springs back to where it was, overshooting a little;
- a peg drops into its hole with a bounce, and the board dips briefly under it;
- a ball in the tray hops when its colour is clicked;
- the answer pegs of a checked row pop up one by one;
- when the code is broken, the pegs of the winning row jump and the shield falls open;
  when it isn't, the shield opens slowly.

When the browser asks for less motion (`prefers-reduced-motion`), the board SHOULD stand
still and only the pegs and the shield move.

**Implementation:** `web/src/mastermind/scene.ts`

#### Scenario: Letting go

- GIVEN the player drags the board to its limit
- WHEN they let go
- THEN the board swings back past its resting place and settles there

**Check:** by hand with `npm run dev`, also with "reduce motion" switched on in the
operating system.
