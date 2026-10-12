//! Game rules for sudoku-and-more, compiled to WebAssembly (ADR-0006).
//!
//! The modules hold the rules and know nothing about the browser. The functions and types
//! in this file are the bridge to JavaScript: they take and return plain numbers, strings
//! and arrays, and are what the pages import from `game-core/pkg/game_core.js`.

pub mod random;
pub mod sudoku;

use wasm_bindgen::prelude::*;

use random::Rng;
use sudoku::{Grid, HintReason, Masks};

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
pub struct Hint {
    cell: u8,
    reason: String,
}

#[wasm_bindgen]
impl Hint {
    #[wasm_bindgen(getter)]
    pub fn cell(&self) -> u8 {
        self.cell
    }

    /// "wrong", "selected", "only" or "easiest"
    #[wasm_bindgen(getter)]
    pub fn reason(&self) -> String {
        self.reason.clone()
    }
}

/// The cell a hint fills in; `selected` is -1 when no cell is selected
#[wasm_bindgen]
pub fn hint(values: &[u8], solution: &[u8], selected: i32) -> Option<Hint> {
    let selected = usize::try_from(selected).ok();
    sudoku::choose_hint(&grid(values), &grid(solution), selected).map(|(cell, reason)| Hint {
        cell: cell as u8,
        reason: match reason {
            HintReason::Wrong => "wrong",
            HintReason::Selected => "selected",
            HintReason::Only => "only",
            HintReason::Easiest => "easiest",
        }
        .into(),
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

/// One step of the solver (see `sudoku::solver_step`). Notes are a bitmask per cell.
#[wasm_bindgen(js_name = solverStep)]
pub fn solver_step(values: &[u8], notes: &[u16], solution: &[u8]) -> Step {
    let (mut values, mut notes) = (grid(values), masks(notes));
    let step = sudoku::solver_step(&mut values, &mut notes, &grid(solution));
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
    fn hint_names_its_reason_and_accepts_no_selection() {
        let mut values = solution();
        values[10] = 0;
        let h = hint(&values, &solution(), -1).unwrap();
        assert_eq!((h.cell(), h.reason().as_str()), (10, "only"));
        assert_eq!(hint(&hard(), &solution(), 1).unwrap().reason(), "selected");
        assert_eq!(hint(&[0; 81], &solution(), -1).unwrap().reason(), "easiest");
        let mut wrong = hard();
        wrong[1] = solution()[1] % 9 + 1;
        assert_eq!(hint(&wrong, &solution(), -1).unwrap().reason(), "wrong");
        assert!(hint(&solution(), &solution(), -1).is_none());
    }

    #[test]
    fn solver_step_returns_the_new_board_and_notes() {
        let first = solver_step(&hard(), &[0; 81], &solution());
        assert_eq!((first.label().as_str(), first.counts()), ("notes", false));
        assert!(first.text().contains("note"));
        assert_eq!(first.values(), hard());

        let second = solver_step(&first.values(), &first.notes(), &solution());
        assert!(second.counts());
        assert!(!second.targets().is_empty());
        assert!(second.filled().len() + second.removed().iter().filter(|&&m| m != 0).count() > 0);
        assert!(second.pattern().iter().all(|&i| i < 81));
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
        hint(&[0; 10], &solution(), -1);
    }
}
