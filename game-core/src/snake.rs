//! Reverse snake: the player is the apple, and the snake hunts it.
//! See `.openspec/specs/006-reverse-snake/spec.md`.

use std::collections::VecDeque;

pub const SIZE: i32 = 20;
pub const START_TICK_MS: f64 = 200.0;
pub const FASTEST_TICK_MS: f64 = 80.0;
pub const GROW_EVERY_MS: f64 = 3000.0;
pub const SPEED_UP_EVERY_MS: f64 = 10_000.0;

pub type Cell = (i32, i32);

/// Up, right, down, left
pub const DIRECTIONS: [Cell; 4] = [(0, -1), (1, 0), (0, 1), (-1, 0)];

#[derive(Clone, Copy, Debug, PartialEq)]
pub enum Status {
    Playing,
    /// The snake reached the apple
    Eaten,
    /// The snake had nowhere to go: the apple wins
    Stuck,
}

fn on_grid((x, y): Cell) -> bool {
    (0..SIZE).contains(&x) && (0..SIZE).contains(&y)
}

fn step(c: Cell, d: Cell) -> Cell {
    (c.0 + d.0, c.1 + d.1)
}

pub struct Game {
    /// Head first
    pub snake: VecDeque<Cell>,
    pub apple: Cell,
    pub status: Status,
    /// Time played, in ms
    pub elapsed: f64,
    since_tick: f64,
    grown: u32,
    /// The apple already moved in this tick
    apple_moved: bool,
    queued: Option<Cell>,
}

impl Default for Game {
    fn default() -> Self {
        Self::new()
    }
}

impl Game {
    pub fn new() -> Game {
        Game {
            snake: VecDeque::from([(2, 0), (1, 0), (0, 0)]),
            apple: (SIZE / 2, SIZE / 2),
            status: Status::Playing,
            elapsed: 0.0,
            since_tick: 0.0,
            grown: 0,
            apple_moved: false,
            queued: None,
        }
    }

    /// The time between two ticks now: 2% faster every 10 seconds, down to 80 ms
    pub fn tick_ms(&self) -> f64 {
        let speedups = (self.elapsed / SPEED_UP_EVERY_MS).floor();
        (START_TICK_MS * 0.98_f64.powf(speedups)).max(FASTEST_TICK_MS)
    }

    /// Moves the apple one cell, at most once per tick; a second move waits for the next
    pub fn steer(&mut self, direction: usize) {
        if self.status != Status::Playing {
            return;
        }
        let d = DIRECTIONS[direction % 4];
        if self.apple_moved {
            self.queued = Some(d);
        } else {
            self.move_apple(d);
        }
    }

    fn move_apple(&mut self, d: Cell) {
        let to = step(self.apple, d);
        if on_grid(to) && !self.snake.contains(&to) {
            self.apple = to;
            self.apple_moved = true;
        }
    }

    /// Lets `ms` of time pass: the snake grows and takes the ticks that fall in it
    pub fn update(&mut self, ms: f64) {
        if self.status != Status::Playing {
            return;
        }
        self.elapsed += ms;
        self.since_tick += ms;
        while self.status == Status::Playing && self.since_tick >= self.tick_ms() {
            self.since_tick -= self.tick_ms();
            self.tick();
        }
    }

    /// Cells the snake can't enter on its next move: its body, except the tail when it
    /// is about to move away
    fn blocked(&self, growing: bool) -> Vec<Cell> {
        let keep = if growing {
            self.snake.len()
        } else {
            self.snake.len() - 1
        };
        self.snake.iter().take(keep).copied().collect()
    }

    /// The first step of the shortest path from the head to the apple, if there is one
    fn path_step(&self, blocked: &[Cell]) -> Option<Cell> {
        let head = self.snake[0];
        let mut first: Vec<Option<Cell>> = vec![None; (SIZE * SIZE) as usize];
        let index = |(x, y): Cell| (y * SIZE + x) as usize;
        let mut queue = VecDeque::from([head]);
        let mut seen = vec![false; (SIZE * SIZE) as usize];
        seen[index(head)] = true;
        while let Some(c) = queue.pop_front() {
            if c == self.apple {
                return first[index(c)];
            }
            for d in DIRECTIONS {
                let n = step(c, d);
                if on_grid(n) && !seen[index(n)] && !blocked.contains(&n) {
                    seen[index(n)] = true;
                    first[index(n)] = first[index(c)].or(Some(n));
                    queue.push_back(n);
                }
            }
        }
        None
    }

    /// How many cells can be reached from `from`
    fn room(from: Cell, blocked: &[Cell]) -> usize {
        let mut seen = vec![from];
        let mut queue = VecDeque::from([from]);
        while let Some(c) = queue.pop_front() {
            for d in DIRECTIONS {
                let n = step(c, d);
                if on_grid(n) && !blocked.contains(&n) && !seen.contains(&n) {
                    seen.push(n);
                    queue.push_back(n);
                }
            }
        }
        seen.len()
    }

    /// One tick: a waiting apple move, then the snake moves one cell
    pub fn tick(&mut self) {
        self.apple_moved = false;
        if let Some(d) = self.queued.take() {
            self.move_apple(d);
        }
        let growing = self.elapsed >= GROW_EVERY_MS * (self.grown + 1) as f64;
        let blocked = self.blocked(growing);
        let head = self.snake[0];
        let next = self.path_step(&blocked).or_else(|| {
            DIRECTIONS
                .iter()
                .map(|&d| step(head, d))
                .filter(|&n| on_grid(n) && !blocked.contains(&n))
                .max_by_key(|&n| Self::room(n, &blocked))
        });
        let Some(next) = next else {
            self.status = Status::Stuck;
            return;
        };
        self.snake.push_front(next);
        if growing {
            self.grown += 1;
        } else {
            self.snake.pop_back();
        }
        if next == self.apple {
            self.status = Status::Eaten;
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const UP: usize = 0;
    const RIGHT: usize = 1;
    const DOWN: usize = 2;
    const LEFT: usize = 3;

    // ----- Requirement 1: the grid -----

    #[test]
    fn requirement_1_the_apple_starts_in_the_middle_and_the_snake_top_left() {
        let game = Game::new();
        assert_eq!(game.apple, (10, 10));
        assert_eq!(Vec::from(game.snake.clone()), vec![(2, 0), (1, 0), (0, 0)]);
        assert_eq!(game.status, Status::Playing);
    }

    // ----- Requirement 2: moving the apple -----

    #[test]
    fn requirement_2_the_apple_moves_once_per_tick_and_the_next_move_waits() {
        let mut game = Game::new();
        game.steer(RIGHT);
        assert_eq!(game.apple, (11, 10));
        game.steer(DOWN); // already moved in this tick
        assert_eq!(game.apple, (11, 10));
        game.tick();
        assert_eq!(game.apple, (11, 11));
        game.steer(LEFT); // the waiting move used this tick's move
        assert_eq!(game.apple, (11, 11));
    }

    #[test]
    fn requirement_2_the_apple_stays_on_the_grid_and_off_the_snake() {
        let mut game = Game::new();
        game.apple = (0, 5);
        game.steer(LEFT);
        assert_eq!(game.apple, (0, 5));
        game.apple = (2, 1);
        game.steer(UP); // the snake's head is at (2, 0)
        assert_eq!(game.apple, (2, 1));
    }

    // ----- Requirement 3: the hungry snake -----

    #[test]
    fn requirement_3_the_snake_reaches_a_still_apple_along_the_shortest_path() {
        let mut game = Game::new();
        game.apple = (7, 0); // 5 cells right of the head
        for _ in 0..4 {
            game.tick();
            assert_eq!(game.status, Status::Playing);
        }
        game.tick();
        assert_eq!(game.status, Status::Eaten);
        assert_eq!(game.snake[0], (7, 0));
    }

    #[test]
    fn requirement_3_the_snake_goes_around_its_own_body() {
        let mut game = Game::new();
        // A long snake curled so the straight way down is its own body
        game.snake = VecDeque::from([(5, 5), (5, 6), (4, 6), (3, 6), (3, 5), (3, 4)]);
        game.apple = (5, 8);
        for _ in 0..10 {
            if game.status != Status::Playing {
                break;
            }
            game.tick();
            let head = game.snake[0];
            assert!(!game.snake.iter().skip(1).any(|&c| c == head));
        }
        assert_eq!(game.status, Status::Eaten);
    }

    #[test]
    fn requirement_3_ticks_follow_the_clock_and_get_faster() {
        let mut game = Game::new();
        game.apple = (19, 19);
        game.update(199.0);
        assert_eq!(game.snake[0], (2, 0));
        game.update(1.0);
        assert_ne!(game.snake[0], (2, 0));
        assert_eq!(game.tick_ms(), 200.0);
        let mut later = Game::new();
        later.elapsed = 10_000.0;
        assert!((later.tick_ms() - 196.0).abs() < 1e-9);
        later.elapsed = 1_000_000.0;
        assert_eq!(later.tick_ms(), FASTEST_TICK_MS);
    }

    #[test]
    fn requirement_3_the_snake_grows_every_3_seconds() {
        let mut game = Game::new();
        game.apple = (19, 19);
        game.elapsed = GROW_EVERY_MS - 1.0;
        game.tick();
        assert_eq!(game.snake.len(), 3);
        game.elapsed = GROW_EVERY_MS;
        game.tick();
        assert_eq!(game.snake.len(), 4);
        game.tick(); // not yet the next 3 seconds
        assert_eq!(game.snake.len(), 4);
    }

    #[test]
    fn requirement_3_without_a_path_the_snake_moves_to_the_most_room() {
        let mut game = Game::new();
        // The apple sits in a pocket the snake can't reach; on the way, the head can turn
        // into a dead end of one cell (above it) or into the open field (below it)
        game.snake = VecDeque::from([(1, 1), (0, 1), (0, 2), (1, 2)]);
        game.snake.extend((2..SIZE).map(|x| (x, 2)));
        game.apple = (19, 0);
        game.snake.extend([(18, 1), (18, 0), (17, 0)]); // a wall in front of the apple
        game.snake.push_front((1, 0)); // the head, between a dead end on the left and the rest
        game.tick();
        assert_eq!(game.snake[0], (2, 0)); // to the right: more room than the corner
        assert_eq!(game.status, Status::Playing);
    }

    // ----- Requirement 4: the end -----

    #[test]
    fn requirement_4_a_snake_with_nowhere_to_go_is_stuck_and_the_apple_wins() {
        let mut game = Game::new();
        game.snake = VecDeque::from([(0, 0), (1, 0), (1, 1), (0, 1), (0, 2)]);
        game.apple = (5, 5);
        game.tick(); // its head is boxed in by its own body
        assert_eq!(game.status, Status::Stuck);
        game.update(1000.0);
        game.steer(RIGHT);
        assert_eq!((game.apple, game.elapsed), ((5, 5), 0.0));
    }

    #[test]
    fn requirement_4_once_eaten_nothing_moves() {
        let mut game = Game::new();
        game.apple = (3, 0);
        game.tick();
        assert_eq!(game.status, Status::Eaten);
        let before = game.snake.clone();
        game.update(5000.0);
        assert_eq!(game.snake, before);
    }

    #[test]
    fn a_new_game_is_the_default() {
        assert_eq!(Game::default().apple, Game::new().apple);
    }
}
