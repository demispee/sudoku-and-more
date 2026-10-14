//! Spot-the-difference rules: scene order, rounds, hit detection and time penalties.
//! See `.openspec/specs/002-spot-the-difference/spec.md`. The scene drawings stay in
//! TypeScript (`web/src/scenes/`, ADR-0006); here a scene is just a number and a
//! difference just a circle.

use crate::random::Rng;

/// Extra room around a difference, in picture units (the picture is 800 × 600)
pub const CLICK_MARGIN: f64 = 12.0;
/// Milliseconds added to your time for a wrong click
pub const MISS_PENALTY: u32 = 5000;
/// Milliseconds added to your time for a hint
pub const HINT_PENALTY: u32 = 10000;

/// Where a difference is: a circle around (x, y) with radius r
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Difference {
    pub x: f64,
    pub y: f64,
    pub r: f64,
}

/// Gives the scenes in random order: all of them before any repeats, and never the same
/// scene twice in a row
pub struct SceneOrder {
    count: usize,
    order: Vec<usize>,
    position: usize,
    rng: Rng,
}

impl SceneOrder {
    pub fn new(count: usize, seed: u32) -> Self {
        SceneOrder {
            count,
            order: Vec::new(),
            position: 0,
            rng: Rng::new(seed),
        }
    }

    /// The number of the next scene, from 0 to count - 1
    pub fn next_scene(&mut self) -> usize {
        if self.position >= self.order.len() {
            let last = self.order.last().copied();
            self.order = (0..self.count).collect();
            self.rng.shuffle(&mut self.order);
            if self.order.first().copied() == last {
                self.order.rotate_left(1);
            }
            self.position = 0;
        }
        self.position += 1;
        self.order[self.position - 1]
    }
}

/// The differences of one round: `count` of the scene's `total`, picked at random
pub fn pick_differences(total: usize, count: usize, rng: &mut Rng) -> Vec<usize> {
    let mut picked: Vec<usize> = (0..total).collect();
    rng.shuffle(&mut picked);
    picked.truncate(count);
    picked
}

/// Which picture shows the differences: 0 (left) or 1 (right), at random
pub fn changed_side(rng: &mut Rng) -> usize {
    rng.below(2)
}

/// Which of the `remaining` differences a hint points at, at random
pub fn pick_hint(remaining: usize, rng: &mut Rng) -> usize {
    rng.below(remaining)
}

/// Misses and hints cost time, so clicking around at random doesn't pay off
pub fn total_time(ms: f64, misses: u32, hints: u32) -> f64 {
    ms + f64::from(misses * MISS_PENALTY + hints * HINT_PENALTY)
}

fn distance(d: &Difference, x: f64, y: f64) -> f64 {
    (d.x - x).hypot(d.y - y)
}

fn near(d: &Difference, x: f64, y: f64) -> bool {
    distance(d, x, y) <= d.r + CLICK_MARGIN
}

/// The difference not found yet within reach of (x, y) whose circle edge is nearest, as its
/// index in `active`: a click inside a circle finds that one, even next to a smaller one
pub fn find_hit(active: &[Difference], found: &[bool], x: f64, y: f64) -> Option<usize> {
    let mut best: Option<usize> = None;
    for (i, d) in active.iter().enumerate() {
        if found[i] || !near(d, x, y) {
            continue;
        }
        let edge = |d: &Difference| distance(d, x, y) - d.r;
        if best.is_none_or(|b| edge(d) < edge(&active[b])) {
            best = Some(i);
        }
    }
    best
}

/// Whether (x, y) is on a difference that was already found; that is not a mistake
pub fn hits_found(active: &[Difference], found: &[bool], x: f64, y: f64) -> bool {
    active.iter().zip(found).any(|(d, &f)| f && near(d, x, y))
}

/// Records are kept per scene and number of differences
pub fn record_key(scene_name: &str, count: usize) -> String {
    format!("{scene_name}|{count}")
}

#[cfg(test)]
mod tests {
    use super::*;

    const A: Difference = Difference {
        x: 100.0,
        y: 100.0,
        r: 20.0,
    };
    const B: Difference = Difference {
        x: 150.0,
        y: 100.0,
        r: 20.0,
    };

    // ----- Requirement 2: scene order -----

    #[test]
    fn requirement_2_shows_every_scene_once_before_any_repeats() {
        for seed in 0..20 {
            let mut order = SceneOrder::new(5, seed);
            for _ in 0..4 {
                let mut round: Vec<usize> = (0..5).map(|_| order.next_scene()).collect();
                round.sort();
                assert_eq!(round, vec![0, 1, 2, 3, 4]);
            }
        }
    }

    #[test]
    fn requirement_2_never_shows_the_same_scene_twice_in_a_row() {
        for seed in 0..50 {
            let mut order = SceneOrder::new(5, seed);
            let mut previous = order.next_scene();
            for _ in 0..30 {
                let scene = order.next_scene();
                assert_ne!(scene, previous, "seed {seed}");
                previous = scene;
            }
        }
    }

    #[test]
    fn requirement_2_the_same_seed_gives_the_same_order() {
        let (mut a, mut b) = (SceneOrder::new(5, 9), SceneOrder::new(5, 9));
        for _ in 0..10 {
            assert_eq!(a.next_scene(), b.next_scene());
        }
    }

    // ----- Requirement 3: rounds -----

    #[test]
    fn requirement_3_a_round_picks_different_differences_from_the_scene() {
        for count in [5, 7, 10] {
            let picked = pick_differences(12, count, &mut Rng::new(count as u32));
            assert_eq!(picked.len(), count);
            let mut unique = picked.clone();
            unique.sort();
            unique.dedup();
            assert_eq!(unique.len(), count);
            assert!(picked.iter().all(|&i| i < 12));
        }
    }

    #[test]
    fn requirement_3_rounds_differ() {
        let mut rng = Rng::new(1);
        let first = pick_differences(12, 7, &mut rng);
        let second = pick_differences(12, 7, &mut rng);
        assert_ne!(first, second);
    }

    #[test]
    fn requirement_3_the_changed_picture_is_left_or_right_at_random() {
        let mut rng = Rng::new(4);
        let sides: Vec<usize> = (0..100).map(|_| changed_side(&mut rng)).collect();
        assert!(sides.iter().all(|&s| s < 2));
        assert!(sides.contains(&0) && sides.contains(&1));
    }

    // ----- Requirement 6: hint -----

    #[test]
    fn requirement_6_a_hint_points_at_any_remaining_difference() {
        let mut rng = Rng::new(5);
        let mut seen = [false; 4];
        for _ in 0..200 {
            seen[pick_hint(4, &mut rng)] = true;
        }
        assert!(seen.iter().all(|&s| s));
        assert_eq!(pick_hint(1, &mut rng), 0);
    }

    // ----- Requirement 4: clicking -----

    #[test]
    fn requirement_4_a_click_within_the_radius_plus_the_margin_counts() {
        let active = [A, B];
        let none = [false, false];
        assert_eq!(
            find_hit(&active, &none, 100.0 + 20.0 + CLICK_MARGIN, 100.0),
            Some(1)
        );
        assert_eq!(
            find_hit(&active, &none, 100.0, 100.0 + 20.0 + CLICK_MARGIN),
            Some(0)
        );
    }

    #[test]
    fn requirement_4_a_click_just_outside_does_not() {
        assert_eq!(
            find_hit(
                &[A, B],
                &[false, false],
                100.0,
                100.0 + 20.0 + CLICK_MARGIN + 1.0
            ),
            None
        );
    }

    #[test]
    fn requirement_4_picks_the_closest_difference_when_two_are_in_reach() {
        let active = [A, B];
        let none = [false, false];
        assert_eq!(find_hit(&active, &none, 120.0, 100.0), Some(0));
        assert_eq!(find_hit(&active, &none, 130.0, 100.0), Some(1));
    }

    #[test]
    fn requirement_4_a_difference_that_was_already_found_cant_be_found_again() {
        let active = [A, B];
        let found = [true, false];
        assert_eq!(find_hit(&active, &found, 100.0, 100.0), None);
        assert!(hits_found(&active, &found, 100.0, 100.0));
        assert!(!hits_found(&active, &found, 400.0, 400.0));
        assert!(!hits_found(&active, &found, 150.0, 100.0)); // B is not found yet
    }

    // ----- Requirement 5: time and penalties -----

    #[test]
    fn requirement_5_adds_5_seconds_per_miss_and_10_per_hint() {
        assert_eq!(total_time(20_000.0, 2, 1), 40_000.0);
        assert_eq!(total_time(12_345.0, 0, 0), 12_345.0);
    }

    // ----- Requirement 8: records -----

    #[test]
    fn requirement_8_records_are_kept_per_scene_and_number_of_differences() {
        assert_eq!(record_key("The Swan", 7), "The Swan|7");
        assert_ne!(record_key("The Swan", 10), record_key("The Swan", 7));
    }

    #[test]
    fn regression_a_click_inside_a_big_circle_finds_it_next_to_a_small_one() {
        // As in Champagne & Diamonds: r 16 and r 12, 29.2 apart
        let big = Difference {
            x: 100.0,
            y: 100.0,
            r: 16.0,
        };
        let small = Difference {
            x: 129.2,
            y: 100.0,
            r: 12.0,
        };
        let found = [false, false];
        // Inside the big circle, 14 from its centre and 15.2 from the small one's
        assert_eq!(find_hit(&[big, small], &found, 114.0, 100.0), Some(0));
        assert_eq!(find_hit(&[small, big], &found, 114.0, 100.0), Some(1));
        // Inside the small circle
        assert_eq!(find_hit(&[big, small], &found, 125.0, 100.0), Some(1));
    }
}
