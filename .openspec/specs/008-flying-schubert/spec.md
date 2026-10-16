---
domain: flying-schubert
version: 1.2.0
status: accepted
date: 2026-10-16
---

# 008 — Flying Schubert

Schubert flies: every click gives a little lift, gravity does the rest. Steer through the
gaps between the obstacles, on a journey through four landscapes. In the spirit of Flappy
Bird, with a name of its own.

---

### Requirement 1: The flight [MUST]

The game MUST be played on an 800 × 600 field, scaled to fit the window. Schubert MUST
stay at the same distance from the left (x = 200) and only move up and down: gravity
pulls Schubert down a little more every step, and a flap MUST give the same upward
speed, whatever the speed was. A flap is a click or tap on the field, or the space bar. Tapping
quickly MUST NOT zoom the page: every tap on the field is a flap, also the second of a
double tap. Zooming in with two fingers next to the field still works. Schubert can't fly above the top of
the field; touching the ground ends the game.

The game MUST move 60 steps per second, so it is as fast on a 120 Hz screen as on a
60 Hz one, and it MUST pause while the page is not visible.

**Implementation:** `game-core/src/flying.rs`; `web/src/flying/useFlying.ts`;
`web/src/pages/FlyingPage.vue`

#### Scenario: A flap

- GIVEN Schubert falling fast
- WHEN the player flaps
- THEN Schubert rises with the same speed as after any other flap

#### Scenario: A quick double tap on a phone

- GIVEN Schubert flying, on a phone
- WHEN the player taps the field twice, quickly
- THEN Schubert flaps twice, and the page doesn't zoom

#### Scenario: The ground

- GIVEN Schubert just above the ground and falling
- WHEN Schubert touches it
- THEN the game is over

**Tests:** `game-core/src/flying.rs`, `tests/use-flying.test.ts`, `tests/flying-page.test.ts`

---

### Requirement 2: Obstacles [MUST]

Obstacles MUST come in from the right at a steady speed, one every 260 field units, each
a top and a bottom part with a gap of 170 field units between them. The height of the gap
MUST be random, from a seed, and MUST never be more than 150 field units higher or lower
than the previous one, so every gap can be reached. Touching an obstacle ends the game.
Schubert's hit area MUST be a little smaller than the picture (a circle of radius 18), so
a touch that looks like a near miss is a miss.

**Implementation:** `game-core/src/flying.rs`

#### Scenario: Always reachable

- GIVEN any seed
- WHEN the first 1000 obstacles are made
- THEN every gap is within 150 field units of the one before it

**Tests:** `game-core/src/flying.rs`

---

### Requirement 3: Score [MUST]

Flying past an obstacle MUST add one point. The score MUST be shown during the flight.
The best score SHOULD be kept in the browser (`localStorage` key `flyingBest`) and shown
on the page; a saved value that can't be read MUST be ignored, not break the page.

**Implementation:** `game-core/src/flying.rs`; `web/src/flying/useFlying.ts`

**Tests:** `game-core/src/flying.rs`, `tests/use-flying.test.ts`

---

### Requirement 4: Slowly harder [MUST]

Every 10 points the obstacles MUST come a little faster, up to 50 points; after that the
speed stays the same. A new game MUST start at the slowest speed.

**Implementation:** `game-core/src/flying.rs`

#### Scenario: Faster after 10 points

- GIVEN a game with 9 points
- WHEN Schubert flies past the next obstacle
- THEN the score is 10, and the obstacles move faster than before

**Tests:** `game-core/src/flying.rs`

---

### Requirement 5: Start and game over [MUST]

Before the first flap Schubert MUST float in place and the page MUST say "click or press
space to fly". When the game is over the page MUST show the score and the best score, and
the next flap MUST start a new game, but not within half a second of the end, so a flap
that was meant for the last obstacle doesn't start a new game by accident.

**Implementation:** `web/src/flying/useFlying.ts`; `web/src/pages/FlyingPage.vue`

#### Scenario: Flying again

- GIVEN a game that ended a second ago
- WHEN the player flaps
- THEN a new game starts with 0 points, at the slowest speed, in the chosen landscape

**Tests:** `tests/use-flying.test.ts`, `tests/flying-page.test.ts`

---

### Requirement 6: Schubert [MUST]

Schubert MUST be the Schuberg Philis sheep, 48 × 48 field units, wearing the hat of the
landscape Schubert flies in (Requirement 7):

- **Meadow:** a straw hat.
- **Snowy mountains:** the Christmas hat.
- **City:** a bowler hat.
- **Data centre:** a headset with a microphone.

The hat MUST change together with the landscape. Schubert MUST tilt, up to 25°, up when
rising and down when falling, hat and all. Schubert is a Schuberg Philis trademark, not
covered by the license; Schuberg Philis agreed that the games may adapt the mascot (see README).

**Implementation:** `web/src/flying/schubert.ts` (Schubert without a hat, drawn after
`web/src/shy/schubert.png`);
`web/src/flying/landscapes/` (the hats); `web/src/pages/FlyingPage.vue`

#### Scenario: A new hat in the mountains

- GIVEN Schubert in the meadow, wearing the straw hat, with 19 points
- WHEN Schubert flies past the next obstacle
- THEN the snowy mountains fade in, and Schubert wears the Christmas hat

**Tests:** `tests/flying-page.test.ts`, `tests/flying-landscapes.test.ts`

---

### Requirement 7: Landscapes [MUST]

There MUST be four landscapes, always in this order: **meadow**, **snowy mountains**,
**city** and **data centre**, and after the data centre the meadow again:

- **Meadow:** green hills and a blue sky; the obstacles are fence posts.
- **Snowy mountains:** white peaks; the obstacles are pillars of ice.
- **City:** canal houses against an evening sky; the obstacles are stacks of houses.
- **Data centre:** rows of blinking lights; the obstacles are server racks.

The player SHOULD be able to choose the landscape to start in with a button (meadow is
the default); the choice SHOULD be kept in the browser (`localStorage` key
`flyingLandscape`). Every 20 points Schubert MUST fly into the next landscape, which fades
in over about a second. A new game MUST start in the chosen landscape again.

The landscape MUST only change how the game looks, not the game: the obstacles keep their
place and size, so one best score counts for every landscape. The background MUST move
slower than the obstacles, so it feels far away. The landscapes are drawn in SVG in
`web/src/flying/landscapes/`, one file per landscape.

**Implementation:** `game-core/src/flying.rs` (which landscape); `web/src/flying/landscapes/`;
`web/src/flying/useFlying.ts`; `web/src/pages/FlyingPage.vue`

#### Scenario: Into the mountains

- GIVEN a game that started in the meadow, with 19 points
- WHEN Schubert flies past the next obstacle
- THEN the score is 20, the snowy mountains fade in and the fence posts become pillars of
  ice

#### Scenario: Starting in the city

- GIVEN the player chose city
- WHEN a new game starts
- THEN Schubert flies in the city, and after 20 points into the data centre, after 40 into
  the meadow

**Tests:** `game-core/src/flying.rs`, `tests/use-flying.test.ts`, `tests/flying-page.test.ts`,
`tests/flying-landscapes.test.ts`
