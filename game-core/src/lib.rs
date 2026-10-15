//! Game rules for sudoku-and-more, compiled to WebAssembly (ADR-0006).
//!
//! The modules hold the rules and know nothing about the browser. The functions and types
//! in this file are the bridge to JavaScript: they take and return plain numbers, strings
//! and arrays, and are what the pages import from `game-core/pkg/game_core.js`.

pub mod balls;
pub mod flying;
pub mod mastermind;
pub mod ministry;
pub mod random;
pub mod shy;
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

// ---------- The Ministry of Odd Forms ----------

#[wasm_bindgen(js_name = Ministry)]
pub struct JsMinistry(ministry::Ministry);

/// What a stamp did: whether it was right, and the rule that decided (its number in the
/// book, 1 = oldest, or 0 when no rule applies)
#[wasm_bindgen(js_name = MinistryStamp)]
pub struct JsMinistryStamp {
    pub right: bool,
    pub approve: bool,
    pub rule: u32,
}

#[wasm_bindgen(js_class = Ministry)]
impl JsMinistry {
    #[wasm_bindgen(constructor)]
    pub fn new(seed: u32) -> JsMinistry {
        JsMinistry(ministry::Ministry::new(seed))
    }

    #[wasm_bindgen(getter)]
    pub fn day(&self) -> u32 {
        self.0.day
    }

    /// Forms stamped today
    #[wasm_bindgen(getter)]
    pub fn today(&self) -> u32 {
        self.0.today
    }

    /// Forms stamped right
    #[wasm_bindgen(getter)]
    pub fn stamped(&self) -> u32 {
        self.0.stamped
    }

    #[wasm_bindgen(getter)]
    pub fn strikes(&self) -> u32 {
        self.0.strikes
    }

    #[wasm_bindgen(getter)]
    pub fn fired(&self) -> bool {
        self.0.fired()
    }

    #[wasm_bindgen(getter, js_name = dayOver)]
    pub fn day_over(&self) -> bool {
        self.0.day_over()
    }

    /// The rulebook as texts, oldest first
    pub fn rules(&self) -> Vec<String> {
        self.0
            .book
            .iter()
            .map(|&r| ministry::RULES[r].text.to_string())
            .collect()
    }

    /// The form on the desk: name, species, weekday and doodle color
    #[wasm_bindgen(getter)]
    pub fn name(&self) -> String {
        ministry::NAMES[self.0.form.name].into()
    }

    #[wasm_bindgen(getter)]
    pub fn species(&self) -> String {
        ministry::SPECIES[self.0.form.species].into()
    }

    #[wasm_bindgen(getter)]
    pub fn hat(&self) -> bool {
        self.0.form.hat
    }

    #[wasm_bindgen(getter)]
    pub fn number(&self) -> u8 {
        self.0.form.number
    }

    #[wasm_bindgen(getter)]
    pub fn weekday(&self) -> String {
        ministry::WEEKDAYS[self.0.form.weekday].into()
    }

    #[wasm_bindgen(getter)]
    pub fn doodle(&self) -> String {
        ministry::DOODLES[self.0.form.doodle].into()
    }

    /// Stamps the form on the desk; undefined when stamping isn't possible now
    pub fn stamp(&mut self, approve: bool) -> Option<JsMinistryStamp> {
        self.0.stamp(approve).map(|s| JsMinistryStamp {
            right: s.right,
            approve: s.decision.approve,
            rule: s.decision.rule.map_or(0, |k| k as u32 + 1),
        })
    }

    #[wasm_bindgen(js_name = nextDay)]
    pub fn next_day(&mut self) {
        self.0.next_day();
    }

    /// The time for a form today, in seconds
    #[wasm_bindgen(getter, js_name = secondsPerForm)]
    pub fn seconds_per_form(&self) -> u32 {
        self.0.seconds_per_form()
    }

    /// The form on the desk ran out of time: a strike and the next form; false when no
    /// form can run out now
    pub fn expire(&mut self) -> bool {
        self.0.expire()
    }

    /// The stamp the rulebook asks for on the form on the desk: true = approve
    #[wasm_bindgen(js_name = rightStamp)]
    pub fn right_stamp(&self) -> bool {
        ministry::decide(&self.0.form, &self.0.book).approve
    }
}

#[wasm_bindgen(js_name = formsPerDay)]
pub fn forms_per_day() -> u32 {
    ministry::FORMS_PER_DAY
}

// ---------- Shy squares ----------

#[wasm_bindgen(js_name = ShyField)]
pub struct JsShyField(shy::Field);

#[wasm_bindgen(js_class = ShyField)]
impl JsShyField {
    #[wasm_bindgen(constructor)]
    pub fn new(level: u32, seed: u32) -> JsShyField {
        JsShyField(shy::Field::new(level, seed))
    }

    /// One frame; `on_field` is false when the cursor is not on the field
    pub fn step(&mut self, x: f64, y: f64, on_field: bool) {
        self.0.step(on_field.then_some((x, y)));
    }

    /// x, y and caught (1 or 0) for every square
    pub fn squares(&self) -> Vec<f64> {
        self.0
            .squares
            .iter()
            .flat_map(|s| [s.x, s.y, s.caught as u8 as f64])
            .collect()
    }

    #[wasm_bindgen(getter)]
    pub fn count(&self) -> u32 {
        self.0.squares.len() as u32
    }

    #[wasm_bindgen(getter)]
    pub fn caught(&self) -> u32 {
        self.0.caught() as u32
    }

    #[wasm_bindgen(getter)]
    pub fn done(&self) -> bool {
        self.0.done()
    }
}

/// The pen as left, top, right and bottom of its inside, the wall thickness, and half the
/// side of a square
#[wasm_bindgen(js_name = shyShapes)]
pub fn shy_shapes() -> Vec<f64> {
    let p = shy::PEN;
    vec![
        p.left,
        p.top,
        p.right,
        p.bottom,
        shy::WALLS[2].right - p.right,
        shy::HALF,
    ]
}

// ---------- Flying Schubert ----------

#[wasm_bindgen(js_name = FlyingField)]
pub struct JsFlyingField(flying::Field);

#[wasm_bindgen(js_class = FlyingField)]
impl JsFlyingField {
    #[wasm_bindgen(constructor)]
    pub fn new(seed: u32) -> JsFlyingField {
        JsFlyingField(flying::Field::new(seed))
    }

    pub fn flap(&mut self) {
        self.0.flap();
    }

    /// One step of 1/60 s
    pub fn step(&mut self) {
        self.0.step();
    }

    /// x and the top of the gap for every obstacle
    pub fn obstacles(&self) -> Vec<f64> {
        self.0
            .obstacles
            .iter()
            .flat_map(|o| [o.x, o.gap_top])
            .collect()
    }

    #[wasm_bindgen(getter)]
    pub fn y(&self) -> f64 {
        self.0.y
    }

    #[wasm_bindgen(getter)]
    pub fn vy(&self) -> f64 {
        self.0.vy
    }

    #[wasm_bindgen(getter)]
    pub fn score(&self) -> u32 {
        self.0.score
    }

    #[wasm_bindgen(getter)]
    pub fn distance(&self) -> f64 {
        self.0.distance
    }

    #[wasm_bindgen(getter)]
    pub fn started(&self) -> bool {
        self.0.started
    }

    #[wasm_bindgen(getter)]
    pub fn over(&self) -> bool {
        self.0.over
    }
}

/// The landscape to fly in, from the one the game started in and the score
#[wasm_bindgen(js_name = flyingLandscape)]
pub fn flying_landscape(start: u32, score: u32) -> u32 {
    flying::landscape(start, score)
}

/// The ground, Schubert's distance from the left, the radius of the hit area, the width
/// of an obstacle and the height of a gap
#[wasm_bindgen(js_name = flyingShapes)]
pub fn flying_shapes() -> Vec<f64> {
    vec![
        flying::GROUND,
        flying::X,
        flying::RADIUS,
        flying::OBSTACLE_WIDTH,
        flying::GAP,
    ]
}

// ---------- Mastermind ----------

#[wasm_bindgen(js_name = Mastermind)]
pub struct JsMastermind(mastermind::Game);

#[wasm_bindgen(js_class = Mastermind)]
impl JsMastermind {
    /// A new game of a level: 0 classic, 1 hard (see `mastermindLevels`)
    #[wasm_bindgen(constructor)]
    pub fn new(seed: u32, level: u8) -> JsMastermind {
        JsMastermind(mastermind::Game::new(seed, level as usize))
    }

    /// Checks a full row of colours; gives [black, white], or nothing when the row can't
    /// be checked
    pub fn check(&mut self, guess: &[u8]) -> Vec<u8> {
        self.0
            .check(guess)
            .map_or(Vec::new(), |(black, white)| vec![black, white])
    }

    /// "playing", "won" or "lost"
    #[wasm_bindgen(getter)]
    pub fn status(&self) -> String {
        match self.0.status {
            mastermind::Status::Playing => "playing",
            mastermind::Status::Won => "won",
            mastermind::Status::Lost => "lost",
        }
        .into()
    }

    /// The secret code, only once the game is over
    pub fn code(&self) -> Vec<u8> {
        if self.0.status == mastermind::Status::Playing {
            Vec::new()
        } else {
            self.0.code.clone()
        }
    }
}

/// Holes and colours of every level, one pair after the other
#[wasm_bindgen(js_name = mastermindLevels)]
pub fn mastermind_levels() -> Vec<u8> {
    mastermind::LEVELS
        .iter()
        .flat_map(|&(holes, colours)| [holes as u8, colours])
        .collect()
}

#[wasm_bindgen(js_name = mastermindRows)]
pub fn mastermind_rows() -> u8 {
    mastermind::ROWS as u8
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

    #[test]
    fn ministry_bridge() {
        let mut game = JsMinistry::new(4);
        assert_eq!(
            (game.day(), game.today(), game.stamped(), game.strikes()),
            (1, 0, 0, 0)
        );
        assert_eq!(game.rules().len(), 1);
        assert!(!game.name().is_empty() && !game.species().is_empty());
        assert!(!game.weekday().is_empty() && !game.doodle().is_empty());
        assert!((1..=20).contains(&game.number()));
        let _ = game.hat();
        assert_eq!(game.seconds_per_form(), 12);
        let right = game.right_stamp();
        let stamp = game.stamp(right).unwrap();
        assert!(stamp.right && stamp.approve == right && stamp.rule <= 1);
        for _ in 1..forms_per_day() {
            let wrong = !game.right_stamp();
            if game.fired() {
                break;
            }
            game.stamp(wrong);
        }
        assert!(game.fired() && !game.day_over());
        assert!(game.stamp(true).is_none());
        assert!(!game.expire());
        game.next_day();
        assert_eq!(game.day(), 1);
    }

    #[test]
    fn flying_bridge() {
        let mut field = JsFlyingField::new(3);
        assert!(!field.started() && !field.over());
        assert_eq!((field.score(), field.y(), field.vy()), (0, 300.0, 0.0));
        let before = field.obstacles();
        assert_eq!(before[0..2], [800.0, 215.0]);
        field.flap();
        field.step();
        assert!(field.started() && field.vy() < 0.0);
        assert_eq!(field.obstacles()[0], 797.0);
        assert_eq!(field.distance(), 3.0);
        assert_eq!((flying_landscape(1, 20), flying_landscape(3, 20)), (2, 0));
        assert_eq!(flying_shapes(), vec![560.0, 200.0, 18.0, 80.0, 170.0]);
    }

    #[test]
    fn shy_bridge() {
        let mut field = JsShyField::new(1, 3);
        assert_eq!((field.count(), field.caught(), field.done()), (6, 0, false));
        let before = field.squares();
        assert_eq!(before.len(), 18);
        field.step(before[0] - 20.0, before[1], true);
        assert_ne!(field.squares()[0], before[0]);
        field.step(0.0, 0.0, false);
        assert_eq!(shy_shapes(), vec![580.0, 190.0, 780.0, 410.0, 6.0, 18.0]);
    }

    #[test]
    fn mastermind_bridge() {
        assert_eq!(
            (mastermind_levels(), mastermind_rows()),
            (vec![4, 6, 5, 8], 10)
        );
        let mut game = JsMastermind::new(5, 0);
        let code = game.0.code.clone();
        assert!(game.code().is_empty());
        assert!(game.check(&[0, 1, 2]).is_empty());
        let wrong: Vec<u8> = code.iter().map(|p| (p + 1) % 6).collect();
        assert_eq!(game.check(&wrong)[0], 0);
        assert_eq!(game.status(), "playing");
        assert_eq!(game.check(&code), vec![4, 0]);
        assert_eq!((game.status(), game.code()), ("won".into(), code));
        let mut lost = JsMastermind::new(5, 0);
        for _ in 0..10 {
            lost.check(&wrong);
        }
        assert_eq!(lost.status(), "lost");
        assert_eq!(JsMastermind::new(5, 1).0.code.len(), 5);
    }
}
