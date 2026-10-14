---
domain: spot-the-difference
version: 2.4.0
status: accepted
date: 2026-10-12
---

# 002 — Spot the difference

Two pictures side by side; find the differences as quickly as possible.

---

### Requirement 1: Scenes [MUST]

There MUST be at least 30 scenes, each drawn in code as SVG, in varied themes, each with
10 to 12 possible differences. Every scene MUST have its own name.

| # | Scene | Possible differences |
|---|-------|---------------------|
| 1 | Champagne & Diamonds | 12 |
| 2 | The Peacock | 10 |
| 3 | Perfume & Pearls | 10 |
| 4 | The Swan | 11 |
| 5 | Cocktails & Disco Ball | 11 |
| 6 | Coral Reef | 12 |
| 7 | Outer Space | 12 |
| 8 | The Bakery | 12 |
| 9 | Autumn Forest | 11 |
| 10 | City at Night | 12 |
| 11 | A Day at the Beach | 12 |
| 12 | Winter Village | 12 |
| 13 | The Farm | 12 |
| 14 | Flower Garden | 12 |
| 15 | Desert Oasis | 12 |
| 16 | Haunted House | 12 |
| 17 | Kitchen Shelf | 12 |
| 18 | The Music Room | 12 |
| 19 | The Steam Train | 12 |
| 20 | Mountain Lake | 12 |
| 21 | The Jungle | 12 |
| 22 | The North Pole | 12 |
| 23 | Hot-Air Balloons | 12 |
| 24 | The Reading Nook | 12 |
| 25 | Picnic in the Park | 12 |
| 26 | The Aquarium | 12 |
| 27 | Pirate Cove | 12 |
| 28 | The Toy Room | 12 |
| 29 | Japanese Garden | 12 |
| 30 | The Fruit Market | 12 |

Every difference MUST be fair to find:

- it MUST visibly change the picture: the part that changes MUST be big enough to see
  without hunting, and its click circle MUST cover it;
- its click area MUST be a circle of at least 10 units (in the 800 × 600 picture) that lies
  wholly inside the picture;
- the click circles of two differences in a scene MUST NOT overlap, so a click never finds
  the wrong one (the extra 12 units of Requirement 4 MAY overlap: see there).

Apart from the chosen differences, both pictures MUST be identical; anything random in a
drawing MUST use a seeded generator.

**Implementation:** `web/src/scenes/index.ts::SCENES`, one file per scene in
`web/src/scenes/`, `web/src/scenes/helpers.ts::seeded()`; `web/src/spot/SpotPicture.vue`

#### Scenario: Comparing the pictures

- GIVEN a new round
- THEN the pictures differ only in the differences of this round

#### Scenario: Two differences close together

- GIVEN a scene with two differences near each other
- THEN their click areas don't overlap, and a click inside one finds that one

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
as found, in either picture. When a click is within reach of two differences, the one whose
circle edge is nearest MUST count, so a click inside a circle always finds that one. A found difference MUST be circled in turquoise in both
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
`spotSolved` and `spotCount`). A saved value that can't be read MUST be ignored, not break
the page; a number of differences other than 5, 7 or 10 MUST become 7.

The keys `H`, `S` and `N` MUST do nothing together with Ctrl, Cmd or Alt (so the browser's
own shortcuts such as Cmd+S keep working), or when held down.

**Implementation:** `game-core/src/spot.rs::record_key()`; `web/src/spot/useSpot.ts::finishRound()`; `web/src/pages/SpotPage.vue` (the result)

#### Scenario: New record

- GIVEN the record for The Swan with 7 differences is 1:10
- WHEN the player finds all 7 in 0:55
- THEN the overlay says `New record in 0:55` and the record label shows 0:55

**Tests:** `game-core/src/spot.rs` (the `requirement_8_…` tests); `tests/use-spot.test.ts` ("Requirement 8"); `tests/spot-page.test.ts` ("Requirement 8"); `tests/wasm.test.ts` for the bridge
