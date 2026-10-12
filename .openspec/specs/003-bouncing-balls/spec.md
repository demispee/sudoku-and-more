---
domain: bouncing-balls
version: 1.1.0
status: accepted
date: 2026-10-09
---

# 003 — Bouncing balls

A full-window canvas of bouncing balls to play with.

---

### Requirement 1: Adding balls [MUST]

The page MUST start with 20 balls at random places in the top half. A click on the canvas
MUST add 5 balls at the cursor, each with a random speed and a radius from 12 to 34. The
panel MUST show the number of balls.

**Implementation:** `src/balls.js::createBall()`; `balls.html` click handler

#### Scenario: Clicking

- GIVEN 20 balls
- WHEN the player clicks once
- THEN there are 25 balls and the panel says `25 balls`

**Tests:** `tests/balls.test.js` ("Requirement 1")

---

### Requirement 2: Physics [MUST]

Balls MUST bounce off the window edges, keeping 90% of their speed. Balls MUST bounce off
each other without overlapping, with bigger balls being heavier (mass ∝ radius²). Gravity
MUST be on at start and MUST be toggled with `G`.

**Implementation:** `src/balls.js::moveBall()`, `collide()`, `GRAVITY`, `BOUNCINESS`

#### Scenario: Gravity off

- GIVEN gravity is on
- WHEN the player presses `G`
- THEN the panel says `gravity off` and the balls keep floating around instead of falling

**Tests:** `tests/balls.test.js` ("Requirement 2")

---

### Requirement 3: Look [MUST]

The background MUST be the Lab271 canvas color, and balls MUST use the Lab271 colors
(turquoise, orange, magenta and blue) with a highlight and a glow. Balls MUST leave a short
trail.

**Implementation:** `src/balls.js::COLORS`; `balls.html::drawBall()`, `frame()`

**Tests:** `tests/balls.test.js` ("Requirement 3")

**Check:** the glow and trails are checked by hand.

---

### Requirement 4: Controls [MUST]

`C` MUST remove all balls. `H` MUST collapse the panel to just the `← back` link and
expand it again.

**Implementation:** `balls.html` keydown handler

#### Scenario: Hiding the panel

- GIVEN the panel is open
- WHEN the player presses `H`
- THEN only the `← back` link remains; pressing `H` again brings the panel back

**Check:** press `C`, then `H` twice.
