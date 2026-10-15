//! Flying Schubert: flap through the gaps between obstacles.
//! See `.openspec/specs/008-flying-schubert/spec.md`.

use crate::random::Rng;

pub const WIDTH: f64 = 800.0;
pub const HEIGHT: f64 = 600.0;
/// The top of the ground; touching it ends the game
pub const GROUND: f64 = 560.0;
/// Schubert's distance from the left
pub const X: f64 = 200.0;
/// Schubert's hit area: a circle a little smaller than the 48 × 48 picture
pub const RADIUS: f64 = 18.0;
const GRAVITY: f64 = 0.45;
const FLAP: f64 = -7.5;
const FASTEST_FALL: f64 = 12.0;

pub const OBSTACLE_WIDTH: f64 = 80.0;
pub const GAP: f64 = 170.0;
const SPACING: f64 = 260.0;
/// How far a gap may be from the one before it, so every gap can be reached
pub const MAX_SHIFT: f64 = 150.0;
/// The space a gap keeps from the top and from the ground
const MARGIN: f64 = 60.0;
const SLOWEST: f64 = 3.0;
const SPEED_UP: f64 = 0.3;

/// Points per landscape, and how many landscapes there are
pub const POINTS_PER_LANDSCAPE: u32 = 20;
pub const LANDSCAPES: u32 = 4;

#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Obstacle {
    /// The left side
    pub x: f64,
    /// The top of the gap; its bottom is `gap_top + GAP`
    pub gap_top: f64,
    pub passed: bool,
}

pub struct Field {
    rng: Rng,
    /// Schubert's height (the middle of the picture) and speed; down is positive
    pub y: f64,
    pub vy: f64,
    pub obstacles: Vec<Obstacle>,
    pub score: u32,
    /// How far the obstacles have moved, for the background
    pub distance: f64,
    pub started: bool,
    pub over: bool,
}

/// How fast the obstacles move: a little faster every 10 points, up to 50
pub fn speed(score: u32) -> f64 {
    SLOWEST + SPEED_UP * (score / 10).min(5) as f64
}

/// The landscape Schubert flies in: the next one every 20 points, after the last the first
pub fn landscape(start: u32, score: u32) -> u32 {
    (start + score / POINTS_PER_LANDSCAPE) % LANDSCAPES
}

impl Field {
    pub fn new(seed: u32) -> Field {
        let mut field = Field {
            rng: Rng::new(seed),
            y: HEIGHT / 2.0,
            vy: 0.0,
            obstacles: Vec::new(),
            score: 0,
            distance: 0.0,
            started: false,
            over: false,
        };
        field.add_obstacle(WIDTH, (HEIGHT - GAP) / 2.0);
        field.fill();
        field
    }

    fn add_obstacle(&mut self, x: f64, gap_top: f64) {
        self.obstacles.push(Obstacle {
            x,
            gap_top,
            passed: false,
        });
    }

    /// Adds obstacles until there is one beyond the right edge
    fn fill(&mut self) {
        while let Some(&last) = self.obstacles.last() {
            if last.x > WIDTH {
                break;
            }
            let shift = (self.rng.next_f64() * 2.0 - 1.0) * MAX_SHIFT;
            let gap_top = (last.gap_top + shift).clamp(MARGIN, GROUND - MARGIN - GAP);
            self.add_obstacle(last.x + SPACING, gap_top);
        }
    }

    /// The same upward speed, whatever the speed was; the first flap starts the game
    pub fn flap(&mut self) {
        if !self.over {
            self.started = true;
            self.vy = FLAP;
        }
    }

    /// One step of 1/60 s
    pub fn step(&mut self) {
        if !self.started || self.over {
            return;
        }
        self.vy = (self.vy + GRAVITY).min(FASTEST_FALL);
        self.y += self.vy;
        if self.y - RADIUS < 0.0 {
            self.y = RADIUS;
            self.vy = self.vy.max(0.0);
        }
        let speed = speed(self.score);
        self.distance += speed;
        for o in &mut self.obstacles {
            o.x -= speed;
            if !o.passed && o.x + OBSTACLE_WIDTH < X {
                o.passed = true;
                self.score += 1;
            }
        }
        self.obstacles.retain(|o| o.x + OBSTACLE_WIDTH > 0.0);
        self.fill();
        if self.y + RADIUS >= GROUND {
            self.y = GROUND - RADIUS;
            self.over = true;
        } else if self.obstacles.iter().any(|o| self.hits(o)) {
            self.over = true;
        }
    }

    /// Whether Schubert's circle touches the top or the bottom part of an obstacle
    fn hits(&self, o: &Obstacle) -> bool {
        let dx = (o.x - X).max(0.0).max(X - (o.x + OBSTACLE_WIDTH));
        if dx >= RADIUS {
            return false;
        }
        let reach = (RADIUS * RADIUS - dx * dx).sqrt();
        self.y - reach < o.gap_top || self.y + reach > o.gap_top + GAP
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn flying(seed: u32) -> Field {
        let mut f = Field::new(seed);
        f.flap();
        f
    }

    /// A field with one obstacle at `x`, its gap from `gap_top`, and Schubert at `y`
    fn with_obstacle(x: f64, gap_top: f64, y: f64) -> Field {
        let mut f = flying(1);
        f.obstacles = vec![Obstacle {
            x,
            gap_top,
            passed: false,
        }];
        f.y = y;
        f.vy = 0.0;
        f
    }

    #[test]
    fn requirement_1_gravity_pulls_schubert_down_a_little_more_every_step() {
        let mut f = flying(1);
        f.vy = 0.0;
        let y = f.y;
        f.step();
        assert_eq!((f.vy, f.y), (GRAVITY, y + GRAVITY));
        f.step();
        assert_eq!(f.vy, 2.0 * GRAVITY);
        // Not faster than the fastest fall
        f.vy = FASTEST_FALL;
        f.step();
        assert_eq!(f.vy, FASTEST_FALL);
    }

    #[test]
    fn requirement_1_a_flap_gives_the_same_upward_speed_whatever_the_speed_was() {
        let mut f = flying(1);
        f.vy = 10.0;
        f.flap();
        assert_eq!(f.vy, FLAP);
        f.vy = -3.0;
        f.flap();
        assert_eq!(f.vy, FLAP);
    }

    #[test]
    fn requirement_1_schubert_cant_fly_above_the_top() {
        let mut f = flying(1);
        f.y = RADIUS + 1.0;
        f.vy = FLAP;
        f.step();
        assert_eq!((f.y, f.vy), (RADIUS, 0.0));
        assert!(!f.over);
        // Exactly at the top is not above it: the speed stays
        f.y = RADIUS + GRAVITY;
        f.vy = -2.0 * GRAVITY;
        f.step();
        assert_eq!((f.y, f.vy), (RADIUS, -GRAVITY));
        // Falling again from the top
        f.y = RADIUS;
        f.vy = 1.0;
        f.step();
        assert_eq!(f.vy, 1.0 + GRAVITY);
    }

    #[test]
    fn requirement_1_touching_the_ground_ends_the_game() {
        let mut f = flying(1);
        f.obstacles.clear();
        f.y = GROUND - RADIUS - 1.0;
        f.vy = 0.6;
        f.step();
        assert!(f.over);
        assert_eq!(f.y, GROUND - RADIUS);
        // Exactly touching it is enough
        let mut f = flying(1);
        f.obstacles.clear();
        f.y = GROUND - RADIUS;
        f.vy = -GRAVITY;
        f.step();
        assert!(f.over);
        // Just above it is still flying
        let mut f = flying(1);
        f.obstacles.clear();
        f.y = GROUND - RADIUS - 2.0;
        f.vy = 1.0 - GRAVITY;
        f.step();
        assert!(!f.over);
    }

    #[test]
    fn requirement_1_nothing_moves_before_the_first_flap_or_after_the_end() {
        let mut f = Field::new(1);
        let before = (f.y, f.obstacles.clone());
        f.step();
        assert_eq!((f.y, f.obstacles.clone()), before);
        assert!(!f.started);
        f.flap();
        assert!(f.started);
        f.over = true;
        f.vy = 0.0;
        f.flap();
        assert_eq!(f.vy, 0.0);
        let before = (f.y, f.obstacles.clone(), f.distance);
        f.step();
        assert_eq!((f.y, f.obstacles.clone(), f.distance), before);
    }

    #[test]
    fn requirement_2_obstacles_come_in_from_the_right_one_every_260() {
        let f = Field::new(7);
        assert_eq!(f.obstacles[0].x, WIDTH);
        assert_eq!(f.obstacles[0].gap_top, (HEIGHT - GAP) / 2.0);
        for pair in f.obstacles.windows(2) {
            assert_eq!(pair[1].x - pair[0].x, SPACING);
        }
        assert!(f.obstacles.last().unwrap().x > WIDTH);
        // They move left at the speed of the score, and new ones keep coming
        let mut f = flying(7);
        f.y = 100.0;
        let x = f.obstacles[0].x;
        f.vy = FLAP;
        f.step();
        assert_eq!(f.obstacles[0].x, x - speed(0));
        assert_eq!(f.distance, speed(0));
    }

    #[test]
    fn requirement_2_every_gap_can_be_reached() {
        for seed in [1, 2, 3, 42, 4_000_000_000] {
            let mut f = Field::new(seed);
            let mut gaps = vec![];
            while gaps.len() < 1000 {
                gaps.push(f.obstacles.remove(0).gap_top);
                for o in &mut f.obstacles {
                    o.x -= SPACING;
                }
                f.fill();
            }
            for pair in gaps.windows(2) {
                assert!((pair[1] - pair[0]).abs() <= MAX_SHIFT);
            }
            for g in &gaps {
                assert!(*g >= MARGIN && g + GAP <= GROUND - MARGIN);
            }
            // Random: up and down, by up to 150
            assert!(gaps.windows(2).any(|p| p[1] - p[0] > 120.0));
            assert!(gaps.windows(2).any(|p| p[1] - p[0] < -120.0));
        }
    }

    #[test]
    fn requirement_2_the_same_seed_gives_the_same_obstacles() {
        let gaps = |seed| {
            Field::new(seed)
                .obstacles
                .iter()
                .map(|o| o.gap_top)
                .collect::<Vec<_>>()
        };
        assert_eq!(gaps(5), gaps(5));
        assert_ne!(gaps(5), gaps(6));
    }

    #[test]
    fn requirement_2_touching_an_obstacle_ends_the_game() {
        // In the gap: flying on
        let mut f = with_obstacle(X - 40.0, 200.0, 285.0);
        f.step();
        assert!(!f.over);
        // Against the top part
        let mut f = with_obstacle(X - 40.0, 200.0, 200.0 + RADIUS - 1.0);
        f.step();
        assert!(f.over);
        // Against the bottom part
        let mut f = with_obstacle(X - 40.0, 200.0, 200.0 + GAP - RADIUS);
        f.step();
        assert!(f.over);
    }

    #[test]
    fn requirement_2_the_hit_area_is_a_circle() {
        // Next to an obstacle's front side: only a touch within the radius counts
        let f = with_obstacle(X + RADIUS - 1.0, 300.0, 100.0);
        assert!(f.hits(&f.obstacles[0]));
        let f = with_obstacle(X + RADIUS, 300.0, 100.0);
        assert!(!f.hits(&f.obstacles[0]));
        // Behind it
        let f = with_obstacle(X - RADIUS + 1.0 - OBSTACLE_WIDTH, 300.0, 100.0);
        assert!(f.hits(&f.obstacles[0]));
        let f = with_obstacle(X - RADIUS - OBSTACLE_WIDTH, 300.0, 100.0);
        assert!(!f.hits(&f.obstacles[0]));
        // Right under the top part or right above the bottom part, just touching: a miss
        let f = with_obstacle(X - 40.0, 200.0, 200.0 + RADIUS);
        assert!(!f.hits(&f.obstacles[0]));
        let f = with_obstacle(X - 40.0, 200.0, 200.0 + GAP - RADIUS);
        assert!(!f.hits(&f.obstacles[0]));
        // Near a corner: 12 to the side, 12 below the corner is 17 away, a hit; the square
        // around the circle would hit at 14 and 14 too, the circle doesn't (19.8)
        let f = with_obstacle(X + 12.0, 200.0, 212.0);
        assert!(f.hits(&f.obstacles[0]));
        let f = with_obstacle(X + 14.0, 200.0, 214.0);
        assert!(!f.hits(&f.obstacles[0]));
        // The same at the bottom corner
        let f = with_obstacle(X + 12.0, 200.0, 200.0 + GAP - 12.0);
        assert!(f.hits(&f.obstacles[0]));
        let f = with_obstacle(X + 14.0, 200.0, 200.0 + GAP - 14.0);
        assert!(!f.hits(&f.obstacles[0]));
    }

    #[test]
    fn requirement_3_flying_past_an_obstacle_adds_one_point() {
        let mut f = with_obstacle(X - OBSTACLE_WIDTH + 1.0, 200.0, 285.0);
        f.step(); // its right side moves past Schubert's middle
        assert_eq!(f.score, 1);
        assert!(f.obstacles[0].passed);
        f.vy = FLAP;
        f.step();
        assert_eq!(f.score, 1, "only once");
        // Its right side right at Schubert's middle is not yet past
        let mut f = with_obstacle(X - OBSTACLE_WIDTH + speed(0), 200.0, 285.0);
        f.step();
        assert_eq!(f.score, 0);
        let mut f = with_obstacle(X - OBSTACLE_WIDTH + speed(0) + 0.5, 200.0, 285.0);
        f.step();
        assert_eq!(f.score, 0);
    }

    #[test]
    fn requirement_3_obstacles_that_left_the_field_are_removed() {
        let mut f = flying(1);
        f.obstacles.insert(
            0,
            Obstacle {
                x: -OBSTACLE_WIDTH + 1.0,
                gap_top: 200.0,
                passed: true,
            },
        );
        f.obstacles.insert(
            1,
            Obstacle {
                x: -OBSTACLE_WIDTH + speed(0),
                gap_top: 200.0,
                passed: true,
            },
        );
        f.obstacles.insert(
            2,
            Obstacle {
                x: -20.0 + speed(0),
                gap_top: 200.0,
                passed: true,
            },
        );
        let count = f.obstacles.len();
        f.step();
        // The first two left the field (the second's right side is exactly at 0); the
        // third, with its left side off the field, is still partly on it
        assert_eq!(f.obstacles.len(), count - 2);
        assert_eq!(f.obstacles[0].x, -20.0);
        assert!(f.obstacles.iter().all(|o| o.x + OBSTACLE_WIDTH > 0.0));
    }

    #[test]
    fn requirement_4_a_little_faster_every_10_points_up_to_50() {
        assert_eq!(speed(0), SLOWEST);
        assert_eq!(speed(9), SLOWEST);
        assert_eq!(speed(10), SLOWEST + SPEED_UP);
        assert_eq!(speed(25), SLOWEST + 2.0 * SPEED_UP);
        assert_eq!(speed(50), SLOWEST + 5.0 * SPEED_UP);
        assert_eq!(speed(500), speed(50));
        let mut f = with_obstacle(500.0, 200.0, 285.0);
        f.score = 10;
        f.step();
        assert_eq!(f.obstacles[0].x, 500.0 - speed(10));
    }

    #[test]
    fn requirement_7_every_20_points_the_next_landscape_and_after_the_last_the_first() {
        assert_eq!(landscape(0, 0), 0);
        assert_eq!(landscape(0, 19), 0);
        assert_eq!(landscape(0, 20), 1);
        assert_eq!(landscape(0, 79), 3);
        assert_eq!(landscape(0, 80), 0);
        // Starting in the city: the data centre after 20, the meadow after 40
        assert_eq!(landscape(2, 0), 2);
        assert_eq!(landscape(2, 20), 3);
        assert_eq!(landscape(2, 40), 0);
    }

    #[test]
    fn a_good_flyer_gets_far() {
        // Flaps whenever Schubert is below the middle of the next gap: the game is playable
        for seed in [1, 2, 3] {
            let mut f = flying(seed);
            for _ in 0..60 * 120 {
                let next = f
                    .obstacles
                    .iter()
                    .find(|o| o.x + OBSTACLE_WIDTH + RADIUS > X)
                    .unwrap();
                if f.y > next.gap_top + GAP / 2.0 + 20.0 && f.vy > 0.0 {
                    f.flap();
                }
                f.step();
                if f.over {
                    break;
                }
            }
            assert!(f.score >= 60, "seed {seed}: only {} points", f.score);
        }
    }
}
