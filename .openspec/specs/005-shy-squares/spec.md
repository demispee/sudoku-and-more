---
domain: shy-squares
version: 1.0.0
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
- keep a little distance from each other.

The cursor is the mouse on a computer and the finger on a phone. When it leaves the
field, nothing scares the squares.

**Implementation:** `game-core/src/shy.rs`

#### Scenario: Scaring a square

- GIVEN a square standing still
- WHEN the cursor comes within 120 pixels on its left
- THEN the square moves away to the right

---

### Requirement 3: Caught [MUST]

A square that is entirely inside the pen MUST be caught: it walks to its own place at the
back of the pen, so the opening stays free, turns turquoise, and no longer flees. The page MUST show how many squares are caught out of how many.

**Implementation:** `game-core/src/shy.rs`

#### Scenario: Into the pen

- GIVEN a square just outside the opening of the pen
- WHEN it is chased entirely inside
- THEN it is caught, and the counter goes up by one

---

### Requirement 4: Levels [MUST]

Level 1 MUST have 6 squares. Each next level MUST have 2 more, up to 20, and squares
MUST get a little faster. When all squares are caught, the page MUST show the time, and
the next level MUST start after 3 seconds. `R` MUST restart the current level.

**Implementation:** `game-core/src/shy.rs`; `web/src/shy/useShy.ts`

#### Scenario: Level done

- GIVEN level 1 with 5 of 6 squares caught
- WHEN the last one is caught
- THEN the page shows the time, and level 2 starts with 8 squares

---

### Requirement 5: Remembered between visits [SHOULD]

The best time per level SHOULD be kept in the browser (`localStorage` key `shyBest`) and
shown on the page.

**Implementation:** `web/src/shy/useShy.ts`
