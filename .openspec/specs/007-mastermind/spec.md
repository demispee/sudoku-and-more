---
domain: mastermind
version: 3.5.0
status: accepted
date: 2026-10-13
---

# 007 — Mastermind

The classic code-breaking game, on a modern 3D board that looks real and moves a little:
glossy pegs, light, shadows and a studio backdrop (ADR-0009).

---

### Requirement 1: The secret code [MUST]

A new game MUST pick a secret code for the chosen level (Requirement 8): 4 pegs from 6
colours, or 5 pegs from 8 colours. A colour MAY appear more than once; a hole MUST NOT be
left empty. The code is hidden under a shield at the end of the board until the game is
over.

**Implementation:** `game-core/src/mastermind.rs` (`Game::new`)

#### Scenario: A repeatable code

- GIVEN two new games with the same seed
- WHEN their codes are compared
- THEN they are the same, and every peg is one of the level's colours

**Tests:** `game-core/src/mastermind.rs`

---

### Requirement 2: Placing pegs [MUST]

The board MUST have 10 rows with a hole per peg of the code; the player fills the first open row. Clicking a
colour, in the tray on the board or with the buttons under it, MUST put a peg of that
colour in the first empty hole of the open row. Clicking a peg of the open row MUST take
it out again, so the next colour fills that hole. The number keys (1–6, or 1–8) MUST do the same as
clicking a colour, and Backspace MUST take out the last peg placed. `check` (or Enter)
MUST only work when every hole of the row is filled.

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
The page MUST explain them next to the board, also on a phone: a black peg is a right
colour in the right hole, a white one a right colour in another hole.

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

With a black answer peg for every hole the player MUST win; after 10 rows without that, the player MUST
lose. Either way the shield MUST open and show the code, an overlay MUST say how many
rows it took (or that the code wasn't broken), and `again` (or Enter) starts a new game.
A `new game` button SHOULD also start a new game of the same level in the middle of a
game, without counting it as a result.

**Implementation:** `game-core/src/mastermind.rs`; `web/src/mastermind/useMastermind.ts`

#### Scenario: Out of rows

- GIVEN 9 checked rows without all black answer pegs
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
- on a phone (a screen up to 700 px wide) the board SHOULD fill most of its frame, the
  buttons above it SHOULD be small, and the colours and `check` SHOULD sit in one row under
  the board, within reach of the thumb. The overlay at the end SHOULD sit at the bottom of
  the board there, so it doesn't cover the code at the far end.

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

The fewest rows needed to break a code SHOULD be kept per level in the browser
(`localStorage` keys `mastermindBest` for 4 × 6 and `mastermindBest5x8` for 5 × 8) and
shown on the page.

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

---

### Requirement 8: Levels [MUST]

The player MUST be able to choose a level: **classic** (4 holes, 6 colours) or **hard**
(5 holes, 8 colours). The levels are defined in the Rust core. Choosing another level
MUST start a new game, with a board that has as many holes and colours as the level. The
choice SHOULD be kept in the browser (`localStorage` key `mastermindLevel`); the first
visit starts with classic.

**Implementation:** `game-core/src/mastermind.rs` (`LEVELS`); `web/src/mastermind/useMastermind.ts`;
`web/src/mastermind/scene.ts`

#### Scenario: A harder game

- GIVEN a classic game
- WHEN the player chooses hard
- THEN a new game starts with 5 holes per row, 8 colours in the tray and the keys 1–8

---

### Requirement 9: Colour palettes [SHOULD]

The player SHOULD be able to change the colours of the pegs with a button: **vivid**
(bright, the default), **warm**, **cool** and **tropical**. Every palette MUST have 8
colours that are easy to tell apart, also in lightness, so the hard level stays fair.
Each palette SHOULD also have its own studio: the colours of the backdrop and of the
lights from the sides fit the palette (vivid purple with magenta and cyan, warm amber and
terracotta, cool midnight blue and teal, tropical deep jungle green with lime and
flamingo). Changing the palette MUST only change how the pegs and the studio look, not
the game. The choice SHOULD
be kept in the browser (`localStorage` key `mastermindPalette`).

**Implementation:** `web/src/mastermind/palettes.ts`; `web/src/pages/MastermindPage.vue`;
`web/src/mastermind/scene.ts`

#### Scenario: Warm colours in the middle of a game

- GIVEN a game with 3 checked rows
- WHEN the player switches the palette to warm
- THEN every peg on the board and in the tray gets its warm colour, the studio turns
  amber and terracotta, and the rows and answer pegs stay the same

**Tests:** `tests/mastermind-palettes.test.ts` (every palette has 8 colours that differ
enough in hue or lightness)

---

### Requirement 10: Symbols for colour blindness [SHOULD]

A `symbols` button SHOULD put a shape on every colour, so players who can't tell some
colours apart can still play: a circle, triangle, square, diamond, star, cross, ring and
hexagon for colours 1 to 8. The shapes SHOULD show on the pegs on the board, on the balls
in the tray and on the colour buttons, in every palette, and stay readable when the board
turns. The answer pegs keep black and white. Symbols start off; the choice SHOULD be kept
in the browser (`localStorage` key `mastermindSymbols`).

**Implementation:** `web/src/mastermind/useMastermind.ts`; `web/src/mastermind/scene.ts`;
`web/src/pages/MastermindPage.vue`

#### Scenario: Red and green look the same

- GIVEN a player who can't tell red from green
- WHEN they turn on `symbols`
- THEN red pegs show a circle and green pegs a diamond, on the board, in the tray and on
  the buttons

**Tests:** `tests/use-mastermind.test.ts`, `tests/mastermind-page.test.ts`

**Check:** by hand with `npm run dev`: the shapes are readable on every colour and when
the board is turned.
