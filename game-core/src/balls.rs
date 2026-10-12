//! Bouncing-balls physics: creating, moving and colliding balls.
//! See `.openspec/specs/003-bouncing-balls/spec.md`.

use crate::random::Rng;

pub const GRAVITY: f64 = 0.25;
pub const BOUNCINESS: f64 = 0.9;
/// Lab271 colors, each as (highlight, base)
pub const COLORS: [(&str, &str); 4] = [
    ("#B5FAFB", "#1EE8ED"),
    ("#FFD3AE", "#FF8D33"),
    ("#FF8CC8", "#FF0089"),
    ("#A9CBEA", "#347EC1"),
];

#[derive(Clone, Debug, PartialEq)]
pub struct Ball {
    pub x: f64,
    pub y: f64,
    pub vx: f64,
    pub vy: f64,
    pub radius: f64,
    /// Index into COLORS
    pub color: usize,
}

fn between(rng: &mut Rng, min: f64, max: f64) -> f64 {
    rng.next_f64() * (max - min) + min
}

/// A ball at (x, y) with a random speed, size and color
pub fn create_ball(x: f64, y: f64, rng: &mut Rng) -> Ball {
    Ball {
        x,
        y,
        vx: between(rng, -6.0, 6.0),
        vy: between(rng, -8.0, 2.0),
        radius: between(rng, 12.0, 34.0),
        color: rng.below(COLORS.len()),
    }
}

/// Moves a ball one frame inside a width × height area
pub fn move_ball(ball: &mut Ball, width: f64, height: f64, gravity_on: bool) {
    if gravity_on {
        ball.vy += GRAVITY;
    }
    ball.x += ball.vx;
    ball.y += ball.vy;

    // Bounce off the edges of the window
    if ball.x - ball.radius < 0.0 || ball.x + ball.radius > width {
        ball.vx *= -BOUNCINESS;
        ball.x = ball.x.max(ball.radius).min(width - ball.radius);
    }
    if ball.y - ball.radius < 0.0 || ball.y + ball.radius > height {
        ball.vy *= -BOUNCINESS;
        ball.y = ball.y.max(ball.radius).min(height - ball.radius);
    }
}

/// Lets two balls bounce off each other, with bigger balls being heavier
pub fn collide(a: &mut Ball, b: &mut Ball) {
    let (dx, dy) = (b.x - a.x, b.y - a.y);
    let distance = dx.hypot(dy);
    let min_distance = a.radius + b.radius;
    if distance == 0.0 || distance >= min_distance {
        return;
    }

    let (nx, ny) = (dx / distance, dy / distance);
    let (mass_a, mass_b) = (a.radius.powi(2), b.radius.powi(2));

    // Push the balls apart so they don't overlap
    let overlap = min_distance - distance;
    let total = mass_a + mass_b;
    a.x -= nx * overlap * (mass_b / total);
    a.y -= ny * overlap * (mass_b / total);
    b.x += nx * overlap * (mass_a / total);
    b.y += ny * overlap * (mass_a / total);

    // Exchange speed along the line between their centers
    let speed = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
    if speed <= 0.0 {
        return;
    }
    let impulse = 2.0 * speed / total;
    a.vx -= impulse * mass_b * nx;
    a.vy -= impulse * mass_b * ny;
    b.vx += impulse * mass_a * nx;
    b.vy += impulse * mass_a * ny;
}

/// All the balls on the page, moved together one frame at a time
pub struct World {
    pub balls: Vec<Ball>,
    rng: Rng,
}

impl World {
    pub fn new(seed: u32) -> Self {
        World {
            balls: Vec::new(),
            rng: Rng::new(seed),
        }
    }

    pub fn add(&mut self, x: f64, y: f64) {
        let ball = create_ball(x, y, &mut self.rng);
        self.balls.push(ball);
    }

    /// A ball at a random place in the top half of a width × height area
    pub fn add_random(&mut self, width: f64, height: f64) {
        let x = between(&mut self.rng, 50.0, width - 50.0);
        let y = between(&mut self.rng, 50.0, height / 2.0);
        self.add(x, y);
    }

    /// One frame: move every ball, then let every pair collide
    pub fn step(&mut self, width: f64, height: f64, gravity_on: bool) {
        for ball in &mut self.balls {
            move_ball(ball, width, height, gravity_on);
        }
        for i in 0..self.balls.len() {
            let (left, right) = self.balls.split_at_mut(i + 1);
            for other in right {
                collide(&mut left[i], other);
            }
        }
    }

    pub fn clear(&mut self) {
        self.balls.clear();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn ball(x: f64, y: f64) -> Ball {
        Ball {
            x,
            y,
            vx: 0.0,
            vy: 0.0,
            radius: 10.0,
            color: 0,
        }
    }

    fn momentum(balls: &[&Ball]) -> (f64, f64) {
        balls.iter().fold((0.0, 0.0), |(mx, my), b| {
            (mx + b.radius.powi(2) * b.vx, my + b.radius.powi(2) * b.vy)
        })
    }

    // ----- Requirement 1: adding balls -----

    #[test]
    fn requirement_1_a_new_ball_starts_at_the_spot_with_a_radius_from_12_to_34() {
        let mut rng = Rng::new(3);
        for _ in 0..1000 {
            let b = create_ball(50.0, 60.0, &mut rng);
            assert_eq!((b.x, b.y), (50.0, 60.0));
            assert!((12.0..34.0).contains(&b.radius));
            assert!((-6.0..6.0).contains(&b.vx));
            assert!((-8.0..2.0).contains(&b.vy));
        }
    }

    #[test]
    fn requirement_1_random_balls_start_in_the_top_half() {
        let mut world = World::new(1);
        for _ in 0..20 {
            world.add_random(800.0, 600.0);
        }
        assert_eq!(world.balls.len(), 20);
        assert!(
            world
                .balls
                .iter()
                .all(|b| (50.0..750.0).contains(&b.x) && (50.0..300.0).contains(&b.y))
        );
        world.clear();
        assert!(world.balls.is_empty());
    }

    // ----- Requirement 2: physics -----

    #[test]
    fn requirement_2_gravity_pulls_a_ball_down_unless_it_is_off() {
        let mut falling = ball(100.0, 100.0);
        move_ball(&mut falling, 800.0, 600.0, true);
        assert_eq!((falling.vy, falling.y), (GRAVITY, 100.0 + GRAVITY));

        let mut floating = ball(100.0, 100.0);
        move_ball(&mut floating, 800.0, 600.0, false);
        assert_eq!(floating.y, 100.0);
    }

    #[test]
    fn requirement_2_a_ball_bounces_off_a_wall_and_keeps_90_percent_of_its_speed() {
        let mut wall = Ball {
            vx: 10.0,
            ..ball(795.0, 300.0)
        };
        move_ball(&mut wall, 800.0, 600.0, false);
        assert!((wall.vx + 10.0 * BOUNCINESS).abs() < 1e-9);
        assert_eq!(wall.x, 790.0); // pushed back inside

        let mut floor = Ball {
            vy: 10.0,
            ..ball(300.0, 595.0)
        };
        move_ball(&mut floor, 800.0, 600.0, false);
        assert!((floor.vy + 10.0 * BOUNCINESS).abs() < 1e-9);
        assert_eq!(floor.y, 590.0);

        let mut corner = Ball {
            vx: -10.0,
            vy: -10.0,
            ..ball(5.0, 5.0)
        };
        move_ball(&mut corner, 800.0, 600.0, false);
        assert_eq!((corner.x, corner.y), (10.0, 10.0));
    }

    #[test]
    fn requirement_2_colliding_balls_no_longer_overlap_and_keep_their_momentum() {
        let mut a = Ball {
            vx: 3.0,
            radius: 20.0,
            ..ball(100.0, 100.0)
        };
        let mut b = Ball {
            vx: -1.0,
            vy: 2.0,
            ..ball(125.0, 105.0)
        };
        let before = momentum(&[&a, &b]);
        collide(&mut a, &mut b);
        assert!(((b.x - a.x).hypot(b.y - a.y) - 30.0).abs() < 1e-9);
        let after = momentum(&[&a, &b]);
        assert!((after.0 - before.0).abs() < 1e-9 && (after.1 - before.1).abs() < 1e-9);
        assert!(a.vx < 3.0); // the small ball slowed the big one down
    }

    #[test]
    fn requirement_2_a_bigger_ball_is_pushed_less_than_a_smaller_one() {
        let mut big = Ball {
            radius: 30.0,
            ..ball(100.0, 100.0)
        };
        let mut small = ball(135.0, 100.0);
        collide(&mut big, &mut small);
        assert!(100.0 - big.x < small.x - 135.0);
    }

    #[test]
    fn requirement_2_balls_moving_apart_only_get_separated() {
        let mut a = Ball {
            vx: -2.0,
            ..ball(100.0, 100.0)
        };
        let mut b = Ball {
            vx: 2.0,
            ..ball(115.0, 100.0)
        };
        collide(&mut a, &mut b);
        assert_eq!((a.vx, b.vx), (-2.0, 2.0));
        assert!((b.x - a.x - 20.0).abs() < 1e-9);
    }

    #[test]
    fn requirement_2_balls_that_dont_touch_or_sit_on_each_other_are_left_alone() {
        let (mut a, mut b) = (
            Ball {
                vx: 1.0,
                ..ball(100.0, 100.0)
            },
            Ball {
                vx: -1.0,
                ..ball(200.0, 100.0)
            },
        );
        collide(&mut a, &mut b);
        assert_eq!((a.x, b.x, a.vx, b.vx), (100.0, 200.0, 1.0, -1.0));

        let (mut c, mut d) = (ball(50.0, 50.0), ball(50.0, 50.0));
        collide(&mut c, &mut d);
        assert_eq!((c.x, d.x), (50.0, 50.0));
    }

    #[test]
    fn requirement_2_a_world_step_moves_and_separates_all_balls() {
        let mut world = World::new(2);
        world.balls = vec![ball(100.0, 100.0), ball(105.0, 100.0), ball(400.0, 400.0)];
        world.step(800.0, 600.0, true);
        let [a, b, c] = &world.balls[..] else {
            panic!()
        };
        assert!((b.x - a.x).hypot(b.y - a.y) >= 20.0 - 1e-9);
        assert!(c.vy > 0.0);
    }

    // ----- Requirement 3: look -----

    #[test]
    fn requirement_3_balls_use_the_four_lab271_colors() {
        let bases: Vec<&str> = COLORS.iter().map(|c| c.1).collect();
        assert_eq!(bases, ["#1EE8ED", "#FF8D33", "#FF0089", "#347EC1"]);
        let mut rng = Rng::new(9);
        let mut used = [false; 4];
        for _ in 0..100 {
            used[create_ball(0.0, 0.0, &mut rng).color] = true;
        }
        assert!(used.iter().all(|&u| u));
    }
}
