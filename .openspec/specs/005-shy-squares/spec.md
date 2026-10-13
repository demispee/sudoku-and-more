---
domain: shy-squares
version: 1.1.0
status: accepted
date: 2026-10-13
---

# 005 — Shy squares

Squares that are afraid of your cursor. You are the sheepdog: herd them into the pen.

---

### Requirement 1: The field [MUST]

The game MUST be played on an 800 × 600 field, scaled to fit the window, with a pen in
the middle of the right side: three walls and an opening on the left. A level MUST start
with its squares at random places outside the pen, from a seed.

**Implementation:** `game-core/src/shy.rs`; `web/src/pages/ShyPage.vue`

---

### Requirement 2: Shy squares [MUST]

Every square that is not caught MUST flee from the cursor when it is closer than 120
pixels: the closer the cursor, the harder it pushes away. Squares MUST:
- keep a top speed and slow down by themselves when nothing scares them;
- bounce off the edges of the field and the walls of the pen;
- never overlap each other, nor the caught squares.

The squares MUST move 60 steps per second, so they are as fast on a 120 Hz screen as on a
60 Hz one. The cursor is the mouse on a computer and the finger on a phone. When it is
outside the field, also while a finger drags past the edge, or the touch is cancelled,
nothing scares the squares.

**Implementation:** `game-core/src/shy.rs`; `web/src/shy/useShy.ts` (60 steps per second);
`web/src/pages/ShyPage.vue` (the cursor)

#### Scenario: A fast screen

- GIVEN the same level on a 60 Hz and on a 120 Hz screen
- WHEN one second passes
- THEN the squares took 60 steps on both

#### Scenario: A finger past the edge

- GIVEN a finger dragging on the field
- WHEN it moves past the edge of the field
- THEN nothing scares the squares until it comes back

**Tests:** `game-core/src/shy.rs`, `tests/use-shy.test.ts`, `tests/shy-page.test.ts`

#### Scenario: Scaring a square

- GIVEN a square standing still
- WHEN the cursor comes within 120 pixels on its left
- THEN the square moves away to the right

**Tests:** `game-core/src/shy.rs`

---

### Requirement 3: Caught [MUST]

A square that is entirely inside the pen MUST be caught: it walks to its own place at the
back of the pen, so the opening stays free, turns turquoise, and no longer flees. The page MUST show how many squares are caught out of how many.

**Implementation:** `game-core/src/shy.rs`; `web/src/pages/ShyPage.vue` (counter, colour)

#### Scenario: Into the pen

- GIVEN a square just outside the opening of the pen
- WHEN it is chased entirely inside
- THEN it is caught, and the counter goes up by one

**Tests:** `game-core/src/shy.rs`, `tests/shy-page.test.ts`

---

### Requirement 4: Levels [MUST]

Level 1 MUST have 6 squares. Each next level MUST have 2 more, up to 20, and squares
MUST get a little faster, up to level 11. The time of a level MUST only count while the
page is visible. When all squares are caught, the page MUST show the time, and
the next level MUST start after 3 seconds. `R` MUST restart the current level.

**Implementation:** `game-core/src/shy.rs`; `web/src/shy/useShy.ts`

#### Scenario: Level done

- GIVEN level 1 with 5 of 6 squares caught
- WHEN the last one is caught
- THEN the page shows the time, and level 2 starts with 8 squares

**Tests:** `game-core/src/shy.rs`, `tests/use-shy.test.ts`

---

### Requirement 5: Remembered between visits [SHOULD]

The best time per level SHOULD be kept in the browser (`localStorage` key `shyBest`) and
shown on the page. A saved value that can't be read MUST be ignored, not break the page.

**Implementation:** `web/src/shy/useShy.ts`

**Tests:** `tests/use-shy.test.ts`
