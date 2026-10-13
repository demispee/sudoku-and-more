//! Shy squares: squares that flee from the cursor, to be herded into a pen.
//! See `.openspec/specs/005-shy-squares/spec.md`.

use crate::random::Rng;

pub const WIDTH: f64 = 800.0;
pub const HEIGHT: f64 = 600.0;
/// Half the side of a square
pub const HALF: f64 = 12.0;
pub const SCARE_RADIUS: f64 = 120.0;
const SCARE_FORCE: f64 = 1.6;
const FRICTION: f64 = 0.92;
const KEEP_APART: f64 = 30.0;
const BOUNCE: f64 = 0.6;

/// The pen: its inside, and the walls around it (open on the left)
pub const PEN: Rect = Rect {
    left: 620.0,
    top: 200.0,
    right: 780.0,
    bottom: 400.0,
};
const WALL: f64 = 6.0;
pub const WALLS: [Rect; 3] = [
    Rect {
        left: PEN.left,
        top: PEN.top - WALL,
        right: PEN.right + WALL,
        bottom: PEN.top,
    },
    Rect {
        left: PEN.left,
        top: PEN.bottom,
        right: PEN.right + WALL,
        bottom: PEN.bottom + WALL,
    },
    Rect {
        left: PEN.right,
        top: PEN.top,
        right: PEN.right + WALL,
        bottom: PEN.bottom,
    },
];

#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Rect {
    pub left: f64,
    pub top: f64,
    pub right: f64,
    pub bottom: f64,
}

#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Square {
    pub x: f64,
    pub y: f64,
    pub vx: f64,
    pub vy: f64,
    pub caught: bool,
    /// Where a caught square goes to rest at the back of the pen
    pub home: Option<(f64, f64)>,
}

/// The resting place of the k-th caught square: rows of five from the back of the pen
pub fn home(k: usize) -> (f64, f64) {
    (
        PEN.right - 18.0 - (k / 5) as f64 * 32.0,
        PEN.top + 24.0 + (k % 5) as f64 * 38.0,
    )
}

pub fn squares_for(level: u32) -> usize {
    (6 + 2 * (level.max(1) as usize - 1)).min(20)
}

pub fn top_speed(level: u32) -> f64 {
    4.0 + 0.3 * (level.max(1) - 1).min(10) as f64
}

/// Whether a square lies entirely inside the pen
pub fn inside_pen(s: &Square) -> bool {
    s.x - HALF >= PEN.left
        && s.x + HALF <= PEN.right
        && s.y - HALF >= PEN.top
        && s.y + HALF <= PEN.bottom
}

/// Pushes a square out of a wall it overlaps, along the shortest way, and bounces it
fn push_out(s: &mut Square, wall: &Rect) {
    let (left, right) = (s.x + HALF - wall.left, wall.right - (s.x - HALF));
    let (up, down) = (s.y + HALF - wall.top, wall.bottom - (s.y - HALF));
    if left <= 0.0 || right <= 0.0 || up <= 0.0 || down <= 0.0 {
        return;
    }
    let least = left.min(right).min(up).min(down);
    if least == left {
        s.x -= left;
        s.vx = -s.vx.abs() * BOUNCE;
    } else if least == right {
        s.x += right;
        s.vx = s.vx.abs() * BOUNCE;
    } else if least == up {
        s.y -= up;
        s.vy = -s.vy.abs() * BOUNCE;
    } else {
        s.y += down;
        s.vy = s.vy.abs() * BOUNCE;
    }
}

pub struct Field {
    pub squares: Vec<Square>,
    pub level: u32,
}

impl Field {
    /// A level with its squares at random places outside the pen, apart from each other
    pub fn new(level: u32, seed: u32) -> Field {
        let mut rng = Rng::new(seed);
        let mut squares: Vec<Square> = Vec::new();
        while squares.len() < squares_for(level) {
            let s = Square {
                x: 40.0 + rng.next_f64() * 520.0,
                y: 40.0 + rng.next_f64() * 520.0,
                vx: 0.0,
                vy: 0.0,
                caught: false,
                home: None,
            };
            if squares
                .iter()
                .all(|o| (o.x - s.x).hypot(o.y - s.y) > 3.0 * HALF)
            {
                squares.push(s);
            }
        }
        Field { squares, level }
    }

    pub fn caught(&self) -> usize {
        self.squares.iter().filter(|s| s.caught).count()
    }

    pub fn done(&self) -> bool {
        self.caught() == self.squares.len()
    }

    /// One frame. `cursor` is where the mouse or finger is on the field, if it is on it.
    pub fn step(&mut self, cursor: Option<(f64, f64)>) {
        let others: Vec<Square> = self.squares.clone();
        let speed = top_speed(self.level);
        let mut caught = self.caught();
        for (i, s) in self.squares.iter_mut().enumerate() {
            if let Some((hx, hy)) = s.home {
                s.x += (hx - s.x) * 0.2;
                s.y += (hy - s.y) * 0.2;
                continue;
            }
            if let Some((cx, cy)) = cursor {
                let (dx, dy) = (s.x - cx, s.y - cy);
                let distance = dx.hypot(dy);
                if distance < SCARE_RADIUS && distance > 0.0 {
                    let push = SCARE_FORCE * (1.0 - distance / SCARE_RADIUS);
                    s.vx += push * dx / distance;
                    s.vy += push * dy / distance;
                }
            }
            for (j, o) in others.iter().enumerate() {
                let (dx, dy) = (s.x - o.x, s.y - o.y);
                let distance = dx.hypot(dy);
                if j != i && !o.caught && distance < KEEP_APART && distance > 0.0 {
                    s.vx += 0.15 * dx / distance;
                    s.vy += 0.15 * dy / distance;
                }
            }
            s.vx *= FRICTION;
            s.vy *= FRICTION;
            let v = s.vx.hypot(s.vy);
            if v > speed {
                s.vx *= speed / v;
                s.vy *= speed / v;
            }
            s.x += s.vx;
            s.y += s.vy;

            // The edges of the field, then the walls of the pen
            if s.x - HALF < 0.0 || s.x + HALF > WIDTH {
                s.vx = -s.vx * BOUNCE;
                s.x = s.x.clamp(HALF, WIDTH - HALF);
            }
            if s.y - HALF < 0.0 || s.y + HALF > HEIGHT {
                s.vy = -s.vy * BOUNCE;
                s.y = s.y.clamp(HALF, HEIGHT - HALF);
            }
            for wall in &WALLS {
                push_out(s, wall);
            }
            if inside_pen(s) {
                s.caught = true;
                s.home = Some(home(caught));
                caught += 1;
                s.vx = 0.0;
                s.vy = 0.0;
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn square(x: f64, y: f64) -> Square {
        Square {
            x,
            y,
            vx: 0.0,
            vy: 0.0,
            caught: false,
            home: None,
        }
    }

    fn field(squares: Vec<Square>) -> Field {
        Field { squares, level: 1 }
    }

    // ----- Requirement 1: the field -----

    #[test]
    fn requirement_1_squares_start_outside_the_pen_and_apart() {
        for seed in 0..50 {
            let f = Field::new(10, seed);
            assert!(
                f.squares
                    .iter()
                    .all(|s| !inside_pen(s) && s.x < PEN.left - HALF)
            );
            assert!(
                f.squares
                    .iter()
                    .all(|s| s.x >= HALF && s.y >= HALF && s.y <= HEIGHT - HALF)
            );
            for (i, a) in f.squares.iter().enumerate() {
                for b in &f.squares[i + 1..] {
                    assert!((a.x - b.x).hypot(a.y - b.y) > 3.0 * HALF);
                }
            }
        }
        assert_eq!(Field::new(1, 4).squares, Field::new(1, 4).squares);
    }

    // ----- Requirement 2: shy squares -----

    #[test]
    fn requirement_2_a_square_flees_from_a_cursor_that_comes_close() {
        let mut f = field(vec![square(300.0, 300.0)]);
        f.step(Some((200.0, 300.0))); // 100 px on its left
        assert!(f.squares[0].vx > 0.0 && f.squares[0].x > 300.0);
        assert!(f.squares[0].vy.abs() < 1e-9);

        let mut far = field(vec![square(300.0, 300.0)]);
        far.step(Some((150.0, 300.0))); // 150 px: too far to scare it
        far.step(None);
        assert_eq!((far.squares[0].x, far.squares[0].y), (300.0, 300.0));
    }

    #[test]
    fn requirement_2_a_closer_cursor_pushes_harder() {
        let mut near = field(vec![square(300.0, 300.0)]);
        near.step(Some((260.0, 300.0)));
        let mut far = field(vec![square(300.0, 300.0)]);
        far.step(Some((210.0, 300.0)));
        assert!(near.squares[0].vx > far.squares[0].vx);
    }

    #[test]
    fn requirement_2_squares_keep_a_top_speed_and_slow_down() {
        let mut f = field(vec![square(300.0, 300.0)]);
        for _ in 0..30 {
            let s = f.squares[0];
            f.step(Some((s.x - 5.0, s.y)));
            assert!(f.squares[0].vx.hypot(f.squares[0].vy) <= top_speed(1) + 1e-9);
        }
        for _ in 0..200 {
            f.step(None);
        }
        assert!(f.squares[0].vx.abs() < 0.01);
        assert!(top_speed(2) > top_speed(1));
    }

    #[test]
    fn requirement_2_squares_bounce_off_the_edges_and_the_pen() {
        let mut edge = field(vec![Square {
            vx: -6.0,
            ..square(14.0, 300.0)
        }]);
        edge.step(None);
        assert!(edge.squares[0].x >= HALF && edge.squares[0].vx > 0.0);

        let mut bottom = field(vec![Square {
            vy: 6.0,
            ..square(300.0, 586.0)
        }]);
        bottom.step(None);
        assert!(bottom.squares[0].y <= HEIGHT - HALF && bottom.squares[0].vy < 0.0);

        // The top wall of the pen, from above
        let mut wall = field(vec![Square {
            vy: 5.0,
            ..square(700.0, PEN.top - WALL - HALF - 1.0)
        }]);
        wall.step(None);
        assert!(wall.squares[0].y + HALF <= PEN.top - WALL + 1e-9 && wall.squares[0].vy < 0.0);

        // The back wall of the pen, from the right
        let mut back = field(vec![Square {
            vx: -5.0,
            ..square(PEN.right + WALL + HALF + 1.0, 300.0)
        }]);
        back.step(None);
        assert!(back.squares[0].x - HALF >= PEN.right + WALL - 1e-9 && back.squares[0].vx > 0.0);

        // The bottom wall, from below and from inside
        let mut below = field(vec![Square {
            vy: -5.0,
            ..square(700.0, PEN.bottom + WALL + HALF + 1.0)
        }]);
        below.step(None);
        assert!(below.squares[0].vy > 0.0);
        let mut left = field(vec![Square {
            vx: 5.0,
            ..square(PEN.left - HALF - 1.0, PEN.top - 2.0)
        }]);
        left.step(None);
        assert!(left.squares[0].vx < 0.0);
    }

    #[test]
    fn requirement_2_squares_keep_a_little_distance() {
        let mut f = field(vec![square(300.0, 300.0), square(310.0, 300.0)]);
        f.step(None);
        assert!(f.squares[1].x - f.squares[0].x > 10.0);
    }

    // ----- Requirement 3: caught -----

    #[test]
    fn requirement_3_a_square_entirely_in_the_pen_is_caught_and_stays() {
        let mut f = field(vec![
            Square {
                vx: 4.0,
                ..square(PEN.left + HALF - 2.0, 300.0)
            },
            square(100.0, 100.0),
        ]);
        f.step(None);
        assert!(f.squares[0].caught && !f.squares[1].caught);
        assert_eq!((f.caught(), f.done()), (1, false));
        let x = f.squares[0].x;
        f.step(Some((x + 10.0, 300.0))); // no longer scared: it keeps walking to the back
        assert!(f.squares[0].x > x);
    }

    #[test]
    fn requirement_3_caught_squares_walk_to_their_own_place_at_the_back() {
        let mut f = field(vec![
            Square {
                vx: 4.0,
                ..square(PEN.left + HALF - 2.0, 300.0)
            },
            Square {
                vx: 4.0,
                ..square(PEN.left + HALF - 2.0, 340.0)
            },
        ]);
        for _ in 0..60 {
            f.step(None);
        }
        assert_eq!(f.caught(), 2);
        let [a, b] = [f.squares[0], f.squares[1]];
        assert!((a.x - home(0).0).abs() < 0.1 && (a.y - home(0).1).abs() < 0.1);
        assert!((b.x - home(1).0).abs() < 0.1 && (b.y - home(1).1).abs() < 0.1);
        for k in 0..20 {
            let s = Square {
                x: home(k).0,
                y: home(k).1,
                ..square(0.0, 0.0)
            };
            assert!(inside_pen(&s));
            for j in 0..k {
                assert!((home(j).0 - home(k).0).hypot(home(j).1 - home(k).1) >= 2.0 * HALF);
            }
        }
    }

    #[test]
    fn requirement_3_half_in_the_opening_is_not_caught() {
        let mut f = field(vec![square(PEN.left, 300.0)]);
        f.step(None);
        assert!(!f.squares[0].caught);
    }

    // ----- Requirement 4: levels -----

    #[test]
    fn requirement_4_levels_add_two_squares_up_to_20() {
        assert_eq!(
            (
                squares_for(1),
                squares_for(2),
                squares_for(8),
                squares_for(30)
            ),
            (6, 8, 20, 20)
        );
        assert_eq!(Field::new(2, 1).squares.len(), 8);
        let mut f = field(vec![square(700.0, 300.0)]);
        f.step(None);
        assert!(f.done());
    }

    #[test]
    fn requirement_4_herding_works_a_square_can_be_driven_into_the_pen() {
        // Chase a square from the left of the opening straight into the pen
        let mut f = field(vec![square(500.0, 300.0)]);
        for _ in 0..400 {
            if f.done() {
                break;
            }
            let s = f.squares[0];
            f.step(Some((s.x - 40.0, 300.0)));
        }
        assert!(f.done());
    }
}
