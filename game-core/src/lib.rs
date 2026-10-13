//! Game rules for sudoku-and-more, compiled to WebAssembly (ADR-0006).
//!
//! The modules hold the rules and know nothing about the browser. The functions and types
//! in this file are the bridge to JavaScript: they take and return plain numbers, strings
//! and arrays, and are what the pages import from `game-core/pkg/game_core.js`.

pub mod balls;
pub mod random;
pub mod spot;
pub mod sudoku;

use wasm_bindgen::prelude::*;

use random::Rng;
use spot::Difference;
use sudoku::{Grid, Masks};

fn grid(cells: &[u8]) -> Grid {
    cells.try_into().expect("a grid has 81 cells")
}

fn masks(cells: &[u16]) -> Masks {
    cells.try_into().expect("a grid has 81 cells")
}

fn cells(indexes: &[usize]) -> Vec<u8> {
    indexes.iter().map(|&i| i as u8).collect()
}

// ---------- Sudoku ----------

#[wasm_bindgen]
pub struct Puzzle {
    puzzle: Vec<u8>,
    solution: Vec<u8>,
    level: u8,
}

#[wasm_bindgen]
impl Puzzle {
    #[wasm_bindgen(getter)]
    pub fn puzzle(&self) -> Vec<u8> {
        self.puzzle.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn solution(&self) -> Vec<u8> {
        self.solution.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn level(&self) -> u8 {
        self.level
    }
}

/// One attempt at a puzzle close to `level` (see `sudoku::attempt`). The page calls this
/// repeatedly with new seeds until it finds the level or runs out of time.
#[wasm_bindgen]
pub fn generate(level: u8, seed: u32) -> Option<Puzzle> {
    sudoku::attempt(level, &mut Rng::new(seed)).map(|g| Puzzle {
        puzzle: g.puzzle.to_vec(),
        solution: g.solution.to_vec(),
        level: g.level,
    })
}

#[wasm_bindgen]
pub struct Step {
    label: String,
    text: String,
    targets: Vec<u8>,
    counts: bool,
    pattern: Vec<u8>,
    removed: Vec<u16>,
    filled: Vec<u8>,
    values: Vec<u8>,
    notes: Vec<u16>,
}

#[wasm_bindgen]
impl Step {
    #[wasm_bindgen(getter)]
    pub fn label(&self) -> String {
        self.label.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn text(&self) -> String {
        self.text.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn targets(&self) -> Vec<u8> {
        self.targets.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn counts(&self) -> bool {
        self.counts
    }

    #[wasm_bindgen(getter)]
    pub fn pattern(&self) -> Vec<u8> {
        self.pattern.clone()
    }

    /// Per cell, a bitmask of the notes this step crossed out
    #[wasm_bindgen(getter)]
    pub fn removed(&self) -> Vec<u16> {
        self.removed.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn filled(&self) -> Vec<u8> {
        self.filled.clone()
    }

    /// The board after the step
    #[wasm_bindgen(getter)]
    pub fn values(&self) -> Vec<u8> {
        self.values.clone()
    }

    /// The notes after the step, as a bitmask per cell
    #[wasm_bindgen(getter)]
    pub fn notes(&self) -> Vec<u16> {
        self.notes.clone()
    }
}

/// One step of the solver (see `sudoku::solver_step`). Notes are a bitmask per cell;
/// `selected` is -1 when no cell is selected.
#[wasm_bindgen(js_name = solverStep)]
pub fn solver_step(values: &[u8], notes: &[u16], solution: &[u8], selected: i32) -> Step {
    let (mut values, mut notes) = (grid(values), masks(notes));
    let selected = usize::try_from(selected).ok();
    let step = sudoku::solver_step(&mut values, &mut notes, &grid(solution), selected);
    Step {
        label: step.label,
        text: step.text,
        targets: cells(&step.targets),
        counts: step.counts,
        pattern: cells(&step.pattern),
        removed: step.removed.to_vec(),
        filled: cells(&step.filled),
        values: values.to_vec(),
        notes: notes.to_vec(),
    }
}

#[wasm_bindgen(js_name = isPeer)]
pub fn is_peer(a: u8, b: u8) -> bool {
    sudoku::is_peer(a.into(), b.into())
}

/// Removes n from the notes around cell i; notes are a bitmask per cell
#[wasm_bindgen(js_name = clearNotesAround)]
pub fn clear_notes_around(notes: &[u16], i: u8, n: u8) -> Vec<u16> {
    let mut notes = masks(notes);
    sudoku::clear_notes_around(&mut notes, i.into(), n);
    notes.to_vec()
}

// ---------- Spot the difference ----------

/// Gives scene numbers in random order (see `spot::SceneOrder`)
#[wasm_bindgen(js_name = SceneOrder)]
pub struct JsSceneOrder(spot::SceneOrder);

#[wasm_bindgen(js_class = SceneOrder)]
impl JsSceneOrder {
    #[wasm_bindgen(constructor)]
    pub fn new(count: u32, seed: u32) -> JsSceneOrder {
        JsSceneOrder(spot::SceneOrder::new(count as usize, seed))
    }

    #[wasm_bindgen(js_name = next)]
    pub fn next_scene(&mut self) -> u32 {
        self.0.next_scene() as u32
    }
}

/// Indexes of `count` differences out of a scene's `total`, picked at random
#[wasm_bindgen(js_name = pickDifferences)]
pub fn pick_differences(total: u32, count: u32, seed: u32) -> Vec<u32> {
    spot::pick_differences(total as usize, count as usize, &mut Rng::new(seed))
        .into_iter()
        .map(|i| i as u32)
        .collect()
}

fn differences(xs: &[f64], ys: &[f64], rs: &[f64]) -> Vec<Difference> {
    xs.iter()
        .zip(ys)
        .zip(rs)
        .map(|((&x, &y), &r)| Difference { x, y, r })
        .collect()
}

fn flags(found: &[u8]) -> Vec<bool> {
    found.iter().map(|&f| f != 0).collect()
}

/// The index of the difference a click at (x, y) finds, or -1. The differences are given
/// as parallel lists of x, y and radius; `found` holds 1 for the ones already found.
#[wasm_bindgen(js_name = findHit)]
pub fn find_hit(xs: &[f64], ys: &[f64], rs: &[f64], found: &[u8], x: f64, y: f64) -> i32 {
    spot::find_hit(&differences(xs, ys, rs), &flags(found), x, y).map_or(-1, |i| i as i32)
}

/// Whether a click at (x, y) is on a difference that was already found
#[wasm_bindgen(js_name = hitsFound)]
pub fn hits_found(xs: &[f64], ys: &[f64], rs: &[f64], found: &[u8], x: f64, y: f64) -> bool {
    spot::hits_found(&differences(xs, ys, rs), &flags(found), x, y)
}

/// Which picture shows the differences: 0 (left) or 1 (right)
#[wasm_bindgen(js_name = changedSide)]
pub fn changed_side(seed: u32) -> u32 {
    spot::changed_side(&mut Rng::new(seed)) as u32
}

/// Which of the `remaining` differences a hint points at
#[wasm_bindgen(js_name = pickHint)]
pub fn pick_hint(remaining: u32, seed: u32) -> u32 {
    spot::pick_hint(remaining as usize, &mut Rng::new(seed)) as u32
}

#[wasm_bindgen(js_name = totalTime)]
pub fn total_time(ms: f64, misses: u32, hints: u32) -> f64 {
    spot::total_time(ms, misses, hints)
}

#[wasm_bindgen(js_name = missPenalty)]
pub fn miss_penalty() -> u32 {
    spot::MISS_PENALTY
}

#[wasm_bindgen(js_name = hintPenalty)]
pub fn hint_penalty() -> u32 {
    spot::HINT_PENALTY
}

#[wasm_bindgen(js_name = recordKey)]
pub fn record_key(scene_name: &str, count: u32) -> String {
    spot::record_key(scene_name, count as usize)
}

// ---------- Bouncing balls ----------

/// All the balls on the page (see `balls::World`)
#[wasm_bindgen(js_name = World)]
pub struct JsWorld(balls::World);

#[wasm_bindgen(js_class = World)]
impl JsWorld {
    #[wasm_bindgen(constructor)]
    pub fn new(seed: u32) -> JsWorld {
        JsWorld(balls::World::new(seed))
    }

    pub fn add(&mut self, x: f64, y: f64) {
        self.0.add(x, y);
    }

    #[wasm_bindgen(js_name = addRandom)]
    pub fn add_random(&mut self, width: f64, height: f64) {
        self.0.add_random(width, height);
    }

    pub fn step(&mut self, width: f64, height: f64, gravity_on: bool) {
        self.0.step(width, height, gravity_on);
    }

    pub fn clear(&mut self) {
        self.0.clear();
    }

    #[wasm_bindgen(getter)]
    pub fn count(&self) -> u32 {
        self.0.balls.len() as u32
    }

    /// For drawing: x, y, radius and color index of every ball, one after the other
    pub fn balls(&self) -> Vec<f64> {
        self.0
            .balls
            .iter()
            .flat_map(|b| [b.x, b.y, b.radius, b.color as f64])
            .collect()
    }
}

/// The ball colors as highlight, base, highlight, base, …
#[wasm_bindgen(js_name = ballColors)]
pub fn ball_colors() -> Vec<String> {
    balls::COLORS
        .iter()
        .flat_map(|(highlight, base)| [highlight.to_string(), base.to_string()])
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    const HARD: &str =
        "800000000003600000070090200050007000000045700000100030001000068008500010090000400";

    fn hard() -> Vec<u8> {
        HARD.chars()
            .map(|c| c.to_digit(10).unwrap() as u8)
            .collect()
    }

    fn solution() -> Vec<u8> {
        let mut grid = grid(&hard());
        sudoku::solve(&mut grid, 1, None);
        grid.to_vec()
    }

    #[test]
    fn generate_returns_a_puzzle_with_its_solution_and_level() {
        let p = generate(3, 11).unwrap();
        assert_eq!((p.puzzle().len(), p.solution().len()), (81, 81));
        assert!(
            p.puzzle()
                .iter()
                .zip(p.solution())
                .all(|(&v, s)| v == 0 || v == s)
        );
        assert!((1..=10).contains(&p.level()));
    }

    #[test]
    fn solver_step_returns_the_new_board_and_notes() {
        let notes = sudoku::candidate_masks(&grid(&hard()));
        let step = solver_step(&hard(), &notes, &solution(), -1);
        assert!(step.counts() && !step.label().is_empty() && !step.text().is_empty());
        let [i] = step.filled()[..] else { panic!() };
        assert_eq!(step.targets(), [i]);
        assert_eq!(step.values()[i as usize], solution()[i as usize]);
        assert_eq!(step.notes()[i as usize], 0);
        assert!(
            step.notes()
                .iter()
                .zip(notes)
                .all(|(&new, old)| new & !old == 0)
        );
        assert_eq!(step.removed().len(), 81);
        assert!(step.pattern().iter().all(|&i| i < 81));
    }

    #[test]
    fn peers_and_notes() {
        assert!(is_peer(0, 8) && is_peer(0, 72) && is_peer(0, 20));
        assert!(!is_peer(0, 40) && !is_peer(0, 0));
        let notes = clear_notes_around(&[0b1000; 81], 0, 3);
        assert_eq!((notes[1], notes[40]), (0, 0b1000));
    }

    #[test]
    #[should_panic(expected = "81 cells")]
    fn a_short_grid_is_rejected() {
        solver_step(&[0; 10], &[0; 81], &solution(), -1);
    }
    #[test]
    fn spot_bridge() {
        let mut order = JsSceneOrder::new(5, 3);
        let mut first: Vec<u32> = (0..5).map(|_| order.next_scene()).collect();
        first.sort();
        assert_eq!(first, vec![0, 1, 2, 3, 4]);

        let picked = pick_differences(11, 7, 1);
        assert_eq!(picked.len(), 7);
        assert!(picked.iter().all(|&i| i < 11));

        let (xs, ys, rs) = ([100.0, 150.0], [100.0, 100.0], [20.0, 20.0]);
        assert_eq!(find_hit(&xs, &ys, &rs, &[0, 0], 130.0, 100.0), 1);
        assert_eq!(find_hit(&xs, &ys, &rs, &[0, 0], 400.0, 400.0), -1);
        assert!(hits_found(&xs, &ys, &rs, &[1, 0], 100.0, 100.0));
        assert_eq!(total_time(20_000.0, 2, 1), 40_000.0);
        assert_eq!((miss_penalty(), hint_penalty()), (5000, 10000));
        assert_eq!(record_key("The Swan", 7), "The Swan|7");
        assert!(changed_side(1) < 2);
        assert!(pick_hint(3, 1) < 3);
    }

    #[test]
    fn balls_bridge() {
        let mut world = JsWorld::new(4);
        world.add(100.0, 100.0);
        world.add_random(800.0, 600.0);
        assert_eq!(world.count(), 2);
        world.step(800.0, 600.0, true);
        let data = world.balls();
        assert_eq!(data.len(), 8);
        assert!(data[3] < 4.0 && data[7] < 4.0);
        world.clear();
        assert_eq!(world.count(), 0);
        assert_eq!(ball_colors().len(), 8);
        assert_eq!(ball_colors()[1], "#1EE8ED");
    }
}
