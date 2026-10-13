---
domain: reverse-snake
version: 1.0.0
status: withdrawn
date: 2026-10-13
---

# 006 — Reverse snake

Snake, the other way around: you are the apple, and the snake is hungry.

> **Withdrawn on 2026-10-13.** The game was removed from the site: a snake that is as fast
> as the apple and always takes the shortest path catches it within seconds, so there was
> no strategy to play. This spec is kept as a record; the code is in the git history.

---

### Requirement 1: The grid [MUST]

The game MUST be played on a 20 × 20 grid. The apple MUST start in the middle and the
snake, 3 cells long, in the top left corner.

**Implementation:** `game-core/src/snake.rs`; `web/src/pages/SnakePage.vue`

---

### Requirement 2: Moving the apple [MUST]

The player MUST move the apple one cell with the arrow keys or WASD, and on a phone with
the arrow buttons on the page. The apple MUST NOT leave the grid or move onto the snake.
It MUST move at most once per tick of the snake, so it is never faster than the snake.

**Implementation:** `game-core/src/snake.rs`; `web/src/snake/useSnake.ts`

---

### Requirement 3: The hungry snake [MUST]

The snake MUST move one cell per tick, starting at a tick every 200 ms, along the
shortest path to the apple that avoids its own body. If there is no such path, it MUST
move to the free neighbouring cell with the most room. The snake MUST grow by one cell
every 3 seconds, and the ticks MUST get 2% faster every 10 seconds, down to 80 ms.

**Implementation:** `game-core/src/snake.rs`

#### Scenario: Chasing

- GIVEN the apple 5 cells to the right of the snake's head, with nothing in between
- WHEN 5 ticks pass and the apple doesn't move
- THEN the snake's head reaches the apple

---

### Requirement 4: The end [MUST]

When the snake's head reaches the apple, the apple MUST be eaten: an overlay shows how
long it survived. When the snake has no free cell to move to, it is stuck and the player
MUST win the round. Either way, `again` (or Enter) starts a new game.

**Implementation:** `game-core/src/snake.rs`; `web/src/snake/useSnake.ts`

#### Scenario: The snake traps itself

- GIVEN a snake whose head has no free neighbouring cell
- WHEN it has to move
- THEN the overlay says the snake got itself stuck, and the apple wins

---

### Requirement 5: Controls and records [SHOULD]

Space SHOULD pause and resume the game. The longest survival time SHOULD be kept in the
browser (`localStorage` key `snakeBest`) and shown on the page.

**Implementation:** `web/src/snake/useSnake.ts`, `web/src/pages/SnakePage.vue`
