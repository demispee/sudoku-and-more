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

/// Keeps a square on the field and out of the walls of the pen: it bounces off them
fn keep_in(s: &mut Square) {
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
}

/// Moves overlapping squares apart along the shortest way: two free squares half each,
/// a free square all the way from a caught one
fn separate(squares: &mut [Square]) {
    for _ in 0..3 {
        for i in 0..squares.len() {
            for j in i + 1..squares.len() {
                let (a, b) = (squares[i], squares[j]);
                if a.caught && b.caught {
                    continue;
                }
                let (dx, dy) = (b.x - a.x, b.y - a.y);
                let (over_x, over_y) = (2.0 * HALF - dx.abs(), 2.0 * HALF - dy.abs());
                if over_x <= 0.0 || over_y <= 0.0 {
                    continue;
                }
                let share_a = if a.caught {
                    0.0
                } else if b.caught {
                    1.0
                } else {
                    0.5
                };
                let (mx, my) = if over_x < over_y {
                    (over_x * if dx < 0.0 { -1.0 } else { 1.0 }, 0.0)
                } else {
                    (0.0, over_y * if dy < 0.0 { -1.0 } else { 1.0 })
                };
                squares[i].x -= mx * share_a;
                squares[i].y -= my * share_a;
                squares[j].x += mx * (1.0 - share_a);
                squares[j].y += my * (1.0 - share_a);
                keep_in(&mut squares[i]);
                keep_in(&mut squares[j]);
            }
        }
    }
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
                if distance < SCARE_RADIUS {
                    let push = SCARE_FORCE * (1.0 - distance / SCARE_RADIUS);
                    // Right under the cursor there is no "away": the square jumps up
                    let (ux, uy) = if distance > 0.0 {
                        (dx / distance, dy / distance)
                    } else {
                        (0.0, -1.0)
                    };
                    s.vx += push * ux;
                    s.vy += push * uy;
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

            keep_in(s);
        }
        separate(&mut self.squares);
        for s in self.squares.iter_mut().filter(|s| !s.caught) {
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

    // ----- Physics, exactly -----

    fn close(a: f64, b: f64) -> bool {
        (a - b).abs() < 1e-9
    }

    #[test]
    fn requirement_1_the_pen_has_three_walls_and_is_open_on_the_left() {
        assert_eq!(
            WALLS.map(|w| (w.left, w.top, w.right, w.bottom)),
            [
                (620.0, 194.0, 786.0, 200.0),
                (620.0, 400.0, 786.0, 406.0),
                (780.0, 200.0, 786.0, 400.0),
            ]
        );
    }

    #[test]
    fn requirement_3_inside_the_pen_means_every_edge_inside() {
        let at = |x, y| inside_pen(&square(x, y));
        assert!(at(PEN.left + HALF, PEN.top + HALF));
        assert!(at(PEN.right - HALF, PEN.bottom - HALF));
        assert!(!at(PEN.left + HALF - 0.1, 300.0));
        assert!(!at(PEN.right - HALF + 0.1, 300.0));
        assert!(!at(700.0, PEN.top + HALF - 0.1));
        assert!(!at(700.0, PEN.bottom - HALF + 0.1));
    }

    #[test]
    fn requirement_4_squares_get_faster_up_to_level_11() {
        let speeds: Vec<f64> = [1, 2, 11, 15].iter().map(|&l| top_speed(l)).collect();
        assert!(close(speeds[0], 4.0) && close(speeds[1], 4.3));
        assert!(close(speeds[2], 7.0) && close(speeds[3], 7.0));
    }

    #[test]
    fn requirement_2_the_cursor_pushes_by_how_close_it_is() {
        // 60 pixels away, half the radius: half the force, then friction
        let mut f = field(vec![square(300.0, 300.0)]);
        f.step(Some((240.0, 300.0)));
        let s = f.squares[0];
        assert!(close(s.vx, 0.8 * FRICTION) && close(s.vy, 0.0));
        assert!(close(s.x, 300.0 + 0.8 * FRICTION));
        // Exactly at the radius: nothing
        let mut f = field(vec![square(300.0, 300.0)]);
        f.step(Some((300.0, 300.0 - SCARE_RADIUS)));
        assert_eq!(f.squares[0].vy, 0.0);
    }

    #[test]
    fn regression_a_cursor_right_on_a_square_still_scares_it() {
        let mut f = field(vec![square(300.0, 300.0)]);
        f.step(Some((300.0, 300.0)));
        let s = f.squares[0];
        assert!(close(s.vy, -SCARE_FORCE * FRICTION) && close(s.vx, 0.0));
    }

    #[test]
    fn requirement_2_friction_and_the_top_speed_exactly() {
        let mut f = field(vec![Square {
            vx: 2.0,
            ..square(300.0, 300.0)
        }]);
        f.step(None);
        assert!(close(f.squares[0].vx, 2.0 * FRICTION));
        let mut f = field(vec![Square {
            vx: 30.0,
            vy: 40.0,
            ..square(300.0, 300.0)
        }]);
        f.step(None);
        let s = f.squares[0];
        assert!(close(s.vx.hypot(s.vy), top_speed(1)) && close(s.vx / s.vy, 0.75));
    }

    #[test]
    fn requirement_2_bouncing_off_each_edge_exactly() {
        // x, y, vx, vy → where it ends and how fast it goes back
        let cases = [
            (HALF + 0.5, 300.0, -3.0, 0.0, HALF, 300.0),
            (WIDTH - HALF - 0.5, 100.0, 3.0, 0.0, WIDTH - HALF, 100.0), // above the pen
            (300.0, HALF + 0.5, 0.0, -3.0, 300.0, HALF),
            (300.0, HEIGHT - HALF - 0.5, 0.0, 3.0, 300.0, HEIGHT - HALF),
        ];
        for (x, y, vx, vy, ex, ey) in cases {
            let mut f = field(vec![Square {
                vx,
                vy,
                ..square(x, y)
            }]);
            f.step(None);
            let s = f.squares[0];
            assert!(
                close(s.x, ex) && close(s.y, ey),
                "{x},{y} ends at {},{}",
                s.x,
                s.y
            );
            assert!(close(s.vx, -vx * FRICTION * BOUNCE) && close(s.vy, -vy * FRICTION * BOUNCE));
        }
    }

    #[test]
    fn requirement_2_the_walls_push_a_square_out_the_shortest_way() {
        let wall = Rect {
            left: 100.0,
            top: 100.0,
            right: 200.0,
            bottom: 110.0,
        };
        // From above, below, the left and the right of a flat wall
        let cases = [
            (
                150.0,
                100.0 - HALF + 2.0,
                0.0,
                1.0,
                (150.0, 100.0 - HALF),
                (0.0, -BOUNCE),
            ),
            (
                150.0,
                110.0 + HALF - 2.0,
                0.0,
                -1.0,
                (150.0, 110.0 + HALF),
                (0.0, BOUNCE),
            ),
            (
                100.0 - HALF + 2.0,
                105.0,
                1.0,
                0.0,
                (100.0 - HALF, 105.0),
                (-BOUNCE, 0.0),
            ),
            (
                200.0 + HALF - 2.0,
                105.0,
                -1.0,
                0.0,
                (200.0 + HALF, 105.0),
                (BOUNCE, 0.0),
            ),
        ];
        for (x, y, vx, vy, at, v) in cases {
            let mut s = Square {
                vx,
                vy,
                ..square(x, y)
            };
            push_out(&mut s, &wall);
            assert!(
                close(s.x, at.0) && close(s.y, at.1),
                "{x},{y} pushed to {},{}",
                s.x,
                s.y
            );
            assert!(close(s.vx, v.0) && close(s.vy, v.1));
        }
        let mut free = square(150.0, 200.0);
        push_out(&mut free, &wall);
        assert_eq!(free, square(150.0, 200.0));
    }

    #[test]
    fn requirement_2_squares_never_overlap() {
        // Two free squares on top of each other, and one against a caught square
        let caught = Square {
            caught: true,
            home: Some((300.0, 300.0)),
            ..square(300.0, 300.0)
        };
        let mut f = field(vec![
            square(100.0, 100.0),
            square(110.0, 104.0),
            caught,
            square(310.0, 300.0),
        ]);
        f.step(None);
        let s = &f.squares;
        let apart = |a: &Square, b: &Square| {
            (a.x - b.x).abs() >= 2.0 * HALF - 1e-9 || (a.y - b.y).abs() >= 2.0 * HALF - 1e-9
        };
        assert!(apart(&s[0], &s[1]));
        assert!(
            close(s[0].x + s[1].x, 210.0),
            "both moved half: {} {}",
            s[0].x,
            s[1].x
        );
        assert!(
            apart(&s[2], &s[3]) && close(s[2].x, 300.0),
            "the caught one stays put"
        );
    }

    #[test]
    fn requirement_2_herding_never_leaves_the_field_or_enters_a_wall() {
        let mut f = Field::new(11, 4);
        let mut rng = Rng::new(9);
        for t in 0..5000 {
            let cursor = (rng.next_f64() * WIDTH, rng.next_f64() * HEIGHT);
            f.step(if t % 7 == 0 { None } else { Some(cursor) });
            for s in f.squares.iter().filter(|s| !s.caught) {
                assert!(s.x >= HALF && s.x <= WIDTH - HALF && s.y >= HALF && s.y <= HEIGHT - HALF);
                for w in &WALLS {
                    let inside = s.x + HALF > w.left + 1e-6
                        && s.x - HALF < w.right - 1e-6
                        && s.y + HALF > w.top + 1e-6
                        && s.y - HALF < w.bottom - 1e-6;
                    assert!(!inside, "a square at {},{} is in a wall", s.x, s.y);
                }
            }
        }
    }

    #[test]
    fn requirement_2_overlapping_squares_move_apart_the_shortest_way() {
        let caught = |x, y| Square {
            caught: true,
            ..square(x, y)
        };
        let after = |mut squares: Vec<Square>| {
            separate(&mut squares);
            squares.iter().map(|s| (s.x, s.y)).collect::<Vec<_>>()
        };
        // Side by side: 14 too close in x, 20 in y, so apart along x, half each
        assert_eq!(
            after(vec![square(100.0, 100.0), square(110.0, 104.0)]),
            vec![(93.0, 100.0), (117.0, 104.0)]
        );
        // The other way round, and above each other
        assert_eq!(
            after(vec![square(110.0, 104.0), square(100.0, 100.0)]),
            vec![(117.0, 104.0), (93.0, 100.0)]
        );
        assert_eq!(
            after(vec![square(104.0, 100.0), square(100.0, 110.0)]),
            vec![(104.0, 93.0), (100.0, 117.0)]
        );
        assert_eq!(
            after(vec![square(100.0, 110.0), square(104.0, 100.0)]),
            vec![(100.0, 117.0), (104.0, 93.0)]
        );
        // A free square moves all the way from a caught one, whichever comes first
        assert_eq!(
            after(vec![caught(300.0, 300.0), square(310.0, 300.0)]),
            vec![(300.0, 300.0), (324.0, 300.0)]
        );
        assert_eq!(
            after(vec![square(310.0, 300.0), caught(300.0, 300.0)]),
            vec![(324.0, 300.0), (300.0, 300.0)]
        );
        // Two caught squares, or squares apart on one axis, stay where they are
        assert_eq!(
            after(vec![caught(300.0, 300.0), caught(310.0, 300.0)]),
            vec![(300.0, 300.0), (310.0, 300.0)]
        );
        assert_eq!(
            after(vec![square(100.0, 100.0), square(110.0, 124.0)]),
            vec![(100.0, 100.0), (110.0, 124.0)]
        );
        assert_eq!(
            after(vec![square(100.0, 100.0), square(124.0, 110.0)]),
            vec![(100.0, 100.0), (124.0, 110.0)]
        );
    }

    #[test]
    fn requirement_2_close_free_squares_drift_apart_but_not_from_caught_ones() {
        // 26 apart: not overlapping, but closer than KEEP_APART
        let mut f = field(vec![square(100.0, 100.0), square(126.0, 100.0)]);
        f.step(None);
        let s = &f.squares;
        assert!(close(s[0].vx, -0.15 * FRICTION) && close(s[1].vx, 0.15 * FRICTION));
        assert!(close(s[0].vy, 0.0) && close(s[1].vy, 0.0));
        let mut f = field(vec![
            square(100.0, 100.0),
            Square {
                caught: true,
                home: Some((126.0, 100.0)),
                ..square(126.0, 100.0)
            },
        ]);
        f.step(None);
        assert_eq!(f.squares[0].vx, 0.0);
    }

    #[test]
    fn requirement_2_the_cursor_pushes_straight_away_from_itself() {
        // The cursor 60 away on the upper left (36, 48): the push is 0.6 right, 0.8 down
        let mut f = field(vec![square(300.0, 300.0)]);
        f.step(Some((264.0, 252.0)));
        let s = f.squares[0];
        assert!(close(s.vx, 0.8 * 0.6 * FRICTION) && close(s.vy, 0.8 * 0.8 * FRICTION));
    }
}
