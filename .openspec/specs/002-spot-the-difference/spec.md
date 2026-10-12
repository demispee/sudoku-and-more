---
domain: spot-the-difference
version: 1.3.0
status: accepted
date: 2026-10-12
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

**Implementation:** `web/src/scenes.ts::SCENES`, `seeded()`, the `draw…()` and `…Differences()` functions; `web/src/spot/SpotPicture.vue`

#### Scenario: Comparing the pictures

- GIVEN a new round
- THEN the pictures differ only in the differences of this round

**Tests:** `tests/scenes.test.ts` ("Requirement 1"); `tests/use-spot.test.ts` ("Requirement 1 and 3"); `tests/spot-page.test.ts` ("Requirement 1")

---

### Requirement 2: Scene order [MUST]

Scenes MUST come in random order, and every scene MUST be shown once before any scene
repeats. The same scene MUST NOT come twice in a row.

**Implementation:** `game-core/src/spot.rs::SceneOrder`; `web/src/spot/useSpot.ts::newRound()`

#### Scenario: Playing five rounds

- GIVEN a fresh page
- WHEN the player plays five rounds
- THEN they have seen all five scenes

**Tests:** `game-core/src/spot.rs` (the `requirement_2_…` tests); `tests/use-spot.test.ts` ("Requirement 2"); `tests/wasm.test.ts` for the bridge

---

### Requirement 3: Rounds [MUST]

The player MUST be able to choose 5 (easy), 7 (normal) or 10 (hard) differences; the
default is 7 and the choice MUST be remembered. Each round MUST pick that many differences
at random from the scene, and put the changed picture randomly on the left or the right.
Changing the number MUST restart the round with the same scene.

**Implementation:** `game-core/src/spot.rs::pick_differences()`, `changed_side()`; `web/src/spot/useSpot.ts::newRound()`, `setCount()`

#### Scenario: Same scene, different round

- GIVEN the same scene is played twice
- THEN the differences are (usually) not the same set

**Tests:** `game-core/src/spot.rs` (the `requirement_3_…` tests); `tests/use-spot.test.ts` ("Requirement 1 and 3"); `tests/spot-page.test.ts` ("Requirement 3 and 4"); `tests/wasm.test.ts` for the bridge

---

### Requirement 4: Clicking [MUST]

A click within a difference's radius plus 12 units (in the 800 × 600 picture) MUST count
as found, in either picture. A found difference MUST be circled in turquoise in both
pictures. Clicking a difference that was already found MUST NOT count as a miss. Any other
click MUST count as a miss, shown as a magenta cross with `+5s`.

**Implementation:** `game-core/src/spot.rs::find_hit()`, `hits_found()`, `CLICK_MARGIN`; `web/src/spot/useSpot.ts::click()`; `web/src/spot/SpotPicture.vue::onClick()`

#### Scenario: A miss

- GIVEN a round in progress
- WHEN the player clicks where nothing differs
- THEN a magenta cross and `+5s` appear and the misses counter goes up by one

**Tests:** `game-core/src/spot.rs` (the `requirement_4_…` tests); `tests/use-spot.test.ts` ("Requirement 4"); `tests/spot-page.test.ts` ("Requirement 3 and 4"); `tests/wasm.test.ts` for the bridge

---

### Requirement 5: Time and penalties [MUST]

The time MUST be the real time plus 5 seconds per miss and 10 seconds per hint, so that
clicking at random does not pay.

**Implementation:** `game-core/src/spot.rs::total_time()`, `MISS_PENALTY`, `HINT_PENALTY`; `web/src/spot/useSpot.ts::click()`, `hint()`

#### Scenario: Penalties add up

- GIVEN 20 seconds have passed, with 2 misses and 1 hint
- THEN the time shows 0:40

**Tests:** `game-core/src/spot.rs` (the `requirement_5_…` tests); `tests/use-spot.test.ts` ("Requirement 5"); `tests/wasm.test.ts` for the bridge

---

### Requirement 6: Hint [MUST]

`hint` (key `H`) MUST mark one random difference that has not been found yet with a
pulsing orange circle for 2.5 seconds, and add the hint penalty.

**Implementation:** `game-core/src/spot.rs::pick_hint()`; `web/src/spot/useSpot.ts::hint()`

**Tests:** `game-core/src/spot.rs` (the `requirement_6_…` tests); `tests/use-spot.test.ts` ("Requirement 6"); `tests/spot-page.test.ts` ("Requirement 6 and 7"); `tests/wasm.test.ts` for the bridge

---

### Requirement 7: Show solution [MUST]

`show solution` (key `S`) MUST circle all differences that have not been found yet in
dashed magenta and lock the round. A round ended this way MUST NOT count as solved and
MUST NOT set a record.

**Implementation:** `web/src/spot/useSpot.ts::reveal()`

**Tests:** `tests/use-spot.test.ts` ("Requirement 7"); `tests/spot-page.test.ts` ("Requirement 6 and 7")

---

### Requirement 8: Finishing a round [MUST]

When all differences are found, an overlay MUST show the time, the misses and hints, and
the record. The best time MUST be saved per scene and number of differences, and a new
record MUST be announced. The solved counter MUST go up by one. After 3.5 seconds the next
scene MUST start. `next` (key `N`) MUST start the next scene at any time.

Records and the solved count are kept in the browser (`localStorage` keys `spotRecords`,
`spotSolved` and `spotCount`).

**Implementation:** `game-core/src/spot.rs::record_key()`; `web/src/spot/useSpot.ts::finishRound()`; `web/src/pages/SpotPage.vue` (the result)

#### Scenario: New record

- GIVEN the record for The Swan with 7 differences is 1:10
- WHEN the player finds all 7 in 0:55
- THEN the overlay says `New record in 0:55` and the record label shows 0:55

**Tests:** `game-core/src/spot.rs` (the `requirement_8_…` tests); `tests/use-spot.test.ts` ("Requirement 8"); `tests/spot-page.test.ts` ("Requirement 8"); `tests/wasm.test.ts` for the bridge
