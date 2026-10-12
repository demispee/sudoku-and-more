---
domain: spot-the-difference
version: 1.1.0
status: accepted
date: 2026-10-09
---

# 002 — Spot the difference

Two pictures side by side; find the differences as quickly as possible.

---

### Requirement 1: Scenes [MUST]

There MUST be five scenes, each drawn in code as SVG, each with 10 to 12 possible
differences:

| Scene | Possible differences |
|-------|---------------------|
| Champagne & Diamonds | 12 |
| The Peacock | 10 |
| Perfume & Pearls | 10 |
| The Swan | 11 |
| Cocktails & Disco Ball | 11 |

Apart from the chosen differences, both pictures MUST be identical; anything random in a
drawing MUST use a seeded generator.

**Implementation:** `src/spot-scenes.js::SCENES`, `draw*()`, `*Differences()`, `seeded()`

#### Scenario: Comparing the pictures

- GIVEN a new round
- THEN the pictures differ only in the differences of this round

**Tests:** `tests/spot.test.js` ("Requirement 1")

---

### Requirement 2: Scene order [MUST]

Scenes MUST come in random order, and every scene MUST be shown once before any scene
repeats. The same scene MUST NOT come twice in a row.

**Implementation:** `src/spot.js::sceneOrder()`

#### Scenario: Playing five rounds

- GIVEN a fresh page
- WHEN the player plays five rounds
- THEN they have seen all five scenes

**Tests:** `tests/spot.test.js` ("Requirement 2")

---

### Requirement 3: Rounds [MUST]

The player MUST be able to choose 5 (easy), 7 (normal) or 10 (hard) differences; the
default is 7 and the choice MUST be remembered. Each round MUST pick that many differences
at random from the scene, and put the changed picture randomly on the left or the right.
Changing the number MUST restart the round with the same scene.

**Implementation:** `src/spot.js::pickDifferences()`; `spot-the-difference.html::newRound()`

#### Scenario: Same scene, different round

- GIVEN the same scene is played twice
- THEN the differences are (usually) not the same set

**Tests:** `tests/spot.test.js` ("Requirement 3")

---

### Requirement 4: Clicking [MUST]

A click within a difference's radius plus 12 units (in the 800 × 600 picture) MUST count
as found, in either picture. A found difference MUST be circled in turquoise in both
pictures. Clicking a difference that was already found MUST NOT count as a miss. Any other
click MUST count as a miss, shown as a magenta cross with `+5s`.

**Implementation:** `src/spot.js::findHit()`, `hitsFound()`, `CLICK_MARGIN`; `spot-the-difference.html::handleClick()`

#### Scenario: A miss

- GIVEN a round in progress
- WHEN the player clicks where nothing differs
- THEN a magenta cross and `+5s` appear and the misses counter goes up by one

**Tests:** `tests/spot.test.js` ("Requirement 4")

---

### Requirement 5: Time and penalties [MUST]

The time MUST be the real time plus 5 seconds per miss and 10 seconds per hint, so that
clicking at random does not pay.

**Implementation:** `src/spot.js::totalTime()`, `MISS_PENALTY`, `HINT_PENALTY`

#### Scenario: Penalties add up

- GIVEN 20 seconds have passed, with 2 misses and 1 hint
- THEN the time shows 0:40

**Tests:** `tests/spot.test.js` ("Requirement 5")

---

### Requirement 6: Hint [MUST]

`hint` (key `H`) MUST mark one random difference that has not been found yet with a
pulsing orange circle for 2.5 seconds, and add the hint penalty.

**Implementation:** `spot-the-difference.html::hint()`

**Check:** press `hint` and click inside the circle.

---

### Requirement 7: Show solution [MUST]

`show solution` (key `S`) MUST circle all differences that have not been found yet in
dashed magenta and lock the round. A round ended this way MUST NOT count as solved and
MUST NOT set a record.

**Implementation:** `spot-the-difference.html::reveal()`

**Check:** press `show solution`; the solved counter stays the same.

---

### Requirement 8: Finishing a round [MUST]

When all differences are found, an overlay MUST show the time, the misses and hints, and
the record. The best time MUST be saved per scene and number of differences, and a new
record MUST be announced. The solved counter MUST go up by one. After 3.5 seconds the next
scene MUST start. `next` (key `N`) MUST start the next scene at any time.

Records and the solved count are kept in the browser (`localStorage` keys `spotRecords`,
`spotSolved` and `spotCount`).

**Implementation:** `spot-the-difference.html::finishRound()`; `src/spot.js::recordKey()`

#### Scenario: New record

- GIVEN the record for The Swan with 7 differences is 1:10
- WHEN the player finds all 7 in 0:55
- THEN the overlay says `New record in 0:55` and the record label shows 0:55

**Tests:** `tests/spot.test.js` ("Requirement 8")

**Check:** finishing a round and the overlay are checked by hand.
