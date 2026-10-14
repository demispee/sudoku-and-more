---
domain: bouncing-balls
version: 1.4.0
status: accepted
date: 2026-10-14
---

# 003 — Bouncing balls

A full-window canvas of bouncing balls to play with.

---

### Requirement 1: Adding balls [MUST]

The page MUST start with 20 balls at random places in the top half. A click on the canvas
MUST add 5 balls at the cursor, each with a random speed and a radius from 12 to 34, up to
150 balls in all, so the page stays smooth. The panel MUST show the number of balls.

**Implementation:** `game-core/src/balls.rs::create_ball()`, `World`; `web/src/pages/BallsPage.vue::addBalls()`

#### Scenario: Clicking

- GIVEN 20 balls
- WHEN the player clicks once
- THEN there are 25 balls and the panel says `25 balls`

**Tests:** `game-core/src/balls.rs` (the `requirement_1_…` tests); `tests/balls-page.test.ts` ("Requirement 1"); `tests/wasm.test.ts` for the bridge

---

### Requirement 2: Physics [MUST]

Balls MUST bounce off the window edges, keeping 90% of their speed, and MUST stay inside
the window. Balls MUST bounce off each other without visible overlap (at most 3 pixels,
also in a full pile under gravity), with bigger balls being heavier (mass ∝ radius²). Gravity MUST be on at start and MUST be toggled with `G`. The
balls MUST move 60 steps per second, so they are as fast on a 120 Hz screen as on a 60 Hz
one.

**Implementation:** `game-core/src/balls.rs::move_ball()`, `collide()`, `GRAVITY`, `BOUNCINESS`

#### Scenario: Gravity off

- GIVEN gravity is on
- WHEN the player presses `G`
- THEN the panel says `gravity off` and the balls keep floating around instead of falling

**Tests:** `game-core/src/balls.rs` (the `requirement_2_…` tests); `tests/wasm.test.ts` for the bridge

---

### Requirement 3: Look [MUST]

The background MUST be the Lab271 canvas color, and balls MUST use the Lab271 colors
(turquoise, orange, magenta and blue) with a highlight and a glow. Balls MUST leave a short
trail.

**Implementation:** `game-core/src/balls.rs::COLORS`; `web/src/pages/BallsPage.vue::drawBall()`, `frame()`

**Tests:** `game-core/src/balls.rs` (the `requirement_3_…` tests); `tests/balls-page.test.ts` ("Requirement 3"); `tests/wasm.test.ts` for the bridge

**Check:** the glow and trails are checked by hand.

---

### Requirement 4: Controls [MUST]

`C` MUST remove all balls. `H` MUST collapse the panel to just the `← back` link and
expand it again. The keys `G`, `C` and `H` MUST do nothing together with Ctrl, Cmd or Alt
(so Cmd+C still copies), or when held down.

**Implementation:** `web/src/pages/BallsPage.vue::onKey()`

#### Scenario: Hiding the panel

- GIVEN the panel is open
- WHEN the player presses `H`
- THEN only the `← back` link remains; pressing `H` again brings the panel back

**Tests:** `tests/balls-page.test.ts` ("Requirement 2 and 4")
