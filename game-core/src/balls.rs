//! Bouncing-balls physics: creating, moving and colliding balls.
//! See `.openspec/specs/003-bouncing-balls/spec.md`.

use crate::random::Rng;

pub const GRAVITY: f64 = 0.25;
pub const BOUNCINESS: f64 = 0.9;
/// The most balls on the page, so it stays smooth
pub const MAX_BALLS: usize = 150;
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

    keep_in(ball, width, height);
}

/// Bounces a ball off the edges of the window it touches: always away from that edge, also
/// when it was already moving away (after another ball pushed it there)
fn keep_in(ball: &mut Ball, width: f64, height: f64) {
    if ball.x - ball.radius < 0.0 {
        ball.vx = ball.vx.abs() * BOUNCINESS;
    } else if ball.x + ball.radius > width {
        ball.vx = -ball.vx.abs() * BOUNCINESS;
    }
    if ball.y - ball.radius < 0.0 {
        ball.vy = ball.vy.abs() * BOUNCINESS;
    } else if ball.y + ball.radius > height {
        ball.vy = -ball.vy.abs() * BOUNCINESS;
    }
    // A window smaller than the ball keeps it at the top left
    ball.x = ball.x.min(width - ball.radius).max(ball.radius);
    ball.y = ball.y.min(height - ball.radius).max(ball.radius);
}

/// Pushes two overlapping balls apart, the lighter one further; true when they overlapped
fn push_apart(a: &mut Ball, b: &mut Ball) -> bool {
    let (dx, dy) = (b.x - a.x, b.y - a.y);
    let distance = dx.hypot(dy);
    let min_distance = a.radius + b.radius;
    if distance == 0.0 || distance >= min_distance {
        return false;
    }
    let (nx, ny) = (dx / distance, dy / distance);
    let (mass_a, mass_b) = (a.radius.powi(2), b.radius.powi(2));
    let overlap = min_distance - distance;
    let total = mass_a + mass_b;
    a.x -= nx * overlap * (mass_b / total);
    a.y -= ny * overlap * (mass_b / total);
    b.x += nx * overlap * (mass_a / total);
    b.y += ny * overlap * (mass_a / total);
    true
}

/// Keeps a ball's centre where the ball fits in the window, without bouncing it
fn clamp_in(ball: &mut Ball, width: f64, height: f64) {
    ball.x = ball.x.min(width - ball.radius).max(ball.radius);
    ball.y = ball.y.min(height - ball.radius).max(ball.radius);
}

/// Pushes two overlapping balls apart inside the window; what one can't move because of an
/// edge, the other moves. True when they overlapped.
fn settle(a: &mut Ball, b: &mut Ball, width: f64, height: f64) -> bool {
    if !push_apart(a, b) {
        return false;
    }
    let (want_ax, want_ay) = (a.x, a.y);
    clamp_in(a, width, height);
    b.x -= want_ax - a.x; // a was held back: b goes further
    b.y -= want_ay - a.y;
    let (want_bx, want_by) = (b.x, b.y);
    clamp_in(b, width, height);
    a.x -= want_bx - b.x; // and the other way round
    a.y -= want_by - b.y;
    clamp_in(a, width, height);
    true
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

    push_apart(a, b);
    let total = mass_a + mass_b;

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

    /// A ball at (x, y); none once there are `MAX_BALLS`
    pub fn add(&mut self, x: f64, y: f64) {
        if self.balls.len() >= MAX_BALLS {
            return;
        }
        let ball = create_ball(x, y, &mut self.rng);
        self.balls.push(ball);
    }

    /// A ball at a random place in the top half of a width × height area
    pub fn add_random(&mut self, width: f64, height: f64) {
        let margin = 50.0_f64.min(width / 2.0);
        let x = between(&mut self.rng, margin, width - margin);
        let y = between(&mut self.rng, 50.0_f64.min(height / 4.0), height / 2.0);
        self.add(x, y);
    }

    /// One step (1/60 s): move every ball, let every pair collide, then a few more passes
    /// to push apart what still overlaps in a pile, and keep every ball in the window
    pub fn step(&mut self, width: f64, height: f64, gravity_on: bool) {
        for ball in &mut self.balls {
            move_ball(ball, width, height, gravity_on);
        }
        self.pairs(collide);
        // In a pile one pass isn't enough, and a ball against an edge can't give way: the
        // other ball of the pair then moves the rest
        for _ in 0..8 {
            let mut overlapped = false;
            self.pairs(|a, b| overlapped |= settle(a, b, width, height));
            if !overlapped {
                break;
            }
        }
        for ball in &mut self.balls {
            keep_in(ball, width, height);
        }
    }

    fn pairs(&mut self, mut each: impl FnMut(&mut Ball, &mut Ball)) {
        for i in 0..self.balls.len() {
            let (left, right) = self.balls.split_at_mut(i + 1);
            for other in right {
                each(&mut left[i], other);
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
        let (mut smallest, mut biggest) = (f64::MAX, 0.0_f64);
        for _ in 0..1000 {
            let b = create_ball(50.0, 60.0, &mut rng);
            assert_eq!((b.x, b.y), (50.0, 60.0));
            assert!((12.0..34.0).contains(&b.radius));
            assert!((-6.0..6.0).contains(&b.vx));
            assert!((-8.0..2.0).contains(&b.vy));
            smallest = smallest.min(b.radius);
            biggest = biggest.max(b.radius);
        }
        // The sizes spread over the whole range, not just one end of it
        assert!(smallest < 13.0 && biggest > 33.0);
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
        assert_eq!((wall.x, wall.y), (790.0, 300.0)); // pushed back inside

        let mut floor = Ball {
            vy: 10.0,
            ..ball(300.0, 595.0)
        };
        move_ball(&mut floor, 800.0, 600.0, false);
        assert!((floor.vy + 10.0 * BOUNCINESS).abs() < 1e-9);
        assert_eq!((floor.x, floor.y, floor.vx), (300.0, 590.0, 0.0));

        let mut corner = Ball {
            vx: -10.0,
            vy: -10.0,
            ..ball(5.0, 5.0)
        };
        move_ball(&mut corner, 800.0, 600.0, false);
        assert_eq!((corner.x, corner.y), (10.0, 10.0));

        // Its middle is still inside, but its edge went past the top left
        let mut edge = Ball {
            vx: -10.0,
            vy: -10.0,
            ..ball(15.0, 15.0)
        };
        move_ball(&mut edge, 800.0, 600.0, false);
        assert_eq!((edge.x, edge.y), (10.0, 10.0));
        assert!((edge.vx - 10.0 * BOUNCINESS).abs() < 1e-9);
        assert!((edge.vy - 10.0 * BOUNCINESS).abs() < 1e-9);
    }

    #[test]
    fn requirement_2_a_ball_that_just_touches_a_wall_does_not_bounce() {
        let mut low = Ball {
            vx: -1.0,
            vy: -1.0,
            ..ball(11.0, 11.0)
        };
        move_ball(&mut low, 800.0, 600.0, false);
        assert_eq!((low.x, low.y, low.vx, low.vy), (10.0, 10.0, -1.0, -1.0));

        let mut high = Ball {
            vx: 1.0,
            vy: 1.0,
            ..ball(789.0, 589.0)
        };
        move_ball(&mut high, 800.0, 600.0, false);
        assert_eq!((high.x, high.y, high.vx, high.vy), (790.0, 590.0, 1.0, 1.0));
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
    fn requirement_2_equal_balls_that_meet_head_on_swap_their_speeds() {
        let close = |a: f64, b: f64| (a - b).abs() < 1e-9;
        let mut left = Ball {
            vx: 2.0,
            ..ball(100.0, 100.0)
        };
        let mut right = Ball {
            vx: -2.0,
            ..ball(115.0, 100.0)
        };
        collide(&mut left, &mut right);
        assert!(close(left.vx, -2.0) && close(right.vx, 2.0));

        let mut top = Ball {
            vy: 3.0,
            ..ball(100.0, 100.0)
        };
        let mut bottom = Ball {
            vy: -1.0,
            ..ball(100.0, 115.0)
        };
        collide(&mut top, &mut bottom);
        assert!(close(top.vy, -1.0) && close(bottom.vy, 3.0));
        assert!(close(top.vx, 0.0) && close(bottom.vx, 0.0));
    }

    #[test]
    fn requirement_2_a_heavy_ball_keeps_going_after_hitting_a_light_one() {
        // Masses 400 and 100: the speeds after a head-on hit are 0.2 and 2.2
        let mut heavy = Ball {
            vx: 1.0,
            radius: 20.0,
            ..ball(100.0, 100.0)
        };
        let mut light = Ball {
            vx: -1.0,
            ..ball(125.0, 100.0)
        };
        collide(&mut heavy, &mut light);
        assert!((heavy.vx - 0.2).abs() < 1e-9 && (light.vx - 2.2).abs() < 1e-9);
        assert!((heavy.x - 99.0).abs() < 1e-9 && (light.x - 129.0).abs() < 1e-9);
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

    fn moving(x: f64, y: f64, vx: f64, vy: f64, radius: f64) -> Ball {
        Ball {
            x,
            y,
            vx,
            vy,
            radius,
            color: 0,
        }
    }

    #[test]
    fn regression_a_ball_moving_away_from_an_edge_keeps_going_away() {
        // Pushed against the left edge while it already moves right
        let mut b = moving(5.0, 300.0, 3.0, 0.0, 10.0);
        keep_in(&mut b, 800.0, 600.0);
        assert!(b.vx > 0.0 && b.x == 10.0);
        let mut b = moving(795.0, 300.0, -3.0, 0.0, 10.0);
        keep_in(&mut b, 800.0, 600.0);
        assert!(b.vx < 0.0 && b.x == 790.0);
        let mut b = moving(300.0, 5.0, 0.0, 3.0, 10.0);
        keep_in(&mut b, 800.0, 600.0);
        assert!(b.vy > 0.0 && b.y == 10.0);
        let mut b = moving(300.0, 595.0, 0.0, -3.0, 10.0);
        keep_in(&mut b, 800.0, 600.0);
        assert!(b.vy < 0.0 && b.y == 590.0);
    }

    #[test]
    fn regression_a_collision_next_to_an_edge_doesnt_push_a_ball_out() {
        let mut world = World::new(1);
        world.balls = vec![
            moving(10.0, 300.0, 0.0, 0.0, 10.0),
            moving(25.0, 300.0, -4.0, 0.0, 20.0),
        ];
        world.step(800.0, 600.0, false);
        for b in &world.balls {
            assert!(b.x >= b.radius, "a ball at {} is outside", b.x);
        }
    }

    #[test]
    fn requirement_2_a_full_page_stays_in_the_window_without_visible_overlap() {
        let (w, h) = (1200.0, 800.0);
        let mut world = World::new(7);
        for _ in 0..MAX_BALLS {
            world.add_random(w, h);
        }
        let mut worst = 0.0_f64;
        for t in 0..3_000 {
            world.step(w, h, true);
            if t < 2_900 {
                continue;
            }
            for (i, a) in world.balls.iter().enumerate() {
                assert!(
                    a.x >= a.radius
                        && a.x <= w - a.radius
                        && a.y >= a.radius
                        && a.y <= h - a.radius
                );
                for b in &world.balls[i + 1..] {
                    worst = worst.max(a.radius + b.radius - (a.x - b.x).hypot(a.y - b.y));
                }
            }
        }
        assert!(worst < 3.0, "balls overlap by up to {worst:.2} px");
    }

    #[test]
    fn requirement_1_at_most_150_balls() {
        let mut world = World::new(3);
        for _ in 0..MAX_BALLS + 10 {
            world.add(100.0, 100.0);
        }
        assert_eq!((world.balls.len(), MAX_BALLS), (150, 150));
    }

    #[test]
    fn a_small_window_still_gets_its_balls_inside() {
        let mut world = World::new(2);
        world.add_random(60.0, 60.0);
        let b = world.balls[0].clone();
        assert!((30.0..=30.0).contains(&b.x) && (15.0..=30.0).contains(&b.y));
    }
}
