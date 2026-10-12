//! Sudoku rules: generating, solving and rating puzzles, hints and the step solver.
//! See `.openspec/specs/001-sudoku/spec.md`.
//!
//! Cells are numbered 0..81, row by row. A grid holds 0 for an empty cell. Candidates and
//! notes are bitmasks: bit n set means n is still possible.

use std::fmt::Display;
use std::sync::OnceLock;

use crate::random::Rng;

pub type Grid = [u8; 81];
pub type Masks = [u16; 81];

pub const MAX_RATED_GIVENS: usize = 42;
/// Tier 8 means: the techniques are not enough, you need chains or guessing
pub const STUCK: u8 = 8;

pub fn row(i: usize) -> usize {
    i / 9
}

pub fn col(i: usize) -> usize {
    i % 9
}

pub fn bx(i: usize) -> usize {
    row(i) / 3 * 3 + col(i) / 3
}

pub fn is_peer(a: usize, b: usize) -> bool {
    a != b && (row(a) == row(b) || col(a) == col(b) || bx(a) == bx(b))
}

/// The 27 units: 9 rows, then 9 columns, then 9 boxes
fn units() -> &'static [[usize; 9]; 27] {
    static UNITS: OnceLock<[[usize; 9]; 27]> = OnceLock::new();
    UNITS.get_or_init(|| {
        std::array::from_fn(|u| {
            let k = u % 9;
            std::array::from_fn(|j| match u / 9 {
                0 => k * 9 + j,
                1 => j * 9 + k,
                _ => (k / 3 * 3 + j / 3) * 9 + (k % 3) * 3 + j % 3,
            })
        })
    })
}

fn peers() -> &'static Vec<Vec<usize>> {
    static PEERS: OnceLock<Vec<Vec<usize>>> = OnceLock::new();
    PEERS.get_or_init(|| {
        (0..81)
            .map(|i| (0..81).filter(|&j| is_peer(i, j)).collect())
            .collect()
    })
}

pub fn candidates(grid: &Grid, i: usize) -> Vec<u8> {
    let mut used = [false; 10];
    let (r, c) = (row(i), col(i));
    let (br, bc) = (r - r % 3, c - c % 3);
    for k in 0..9 {
        used[grid[r * 9 + k] as usize] = true;
        used[grid[k * 9 + c] as usize] = true;
        used[grid[(br + k / 3) * 9 + bc + k % 3] as usize] = true;
    }
    (1..=9).filter(|&n| !used[n as usize]).collect()
}

/// Counts solutions up to `limit`. Leaves the grid solved when it stops at the limit.
/// With a random generator, it tries numbers in random order (for generating).
pub fn solve(grid: &mut Grid, limit: u32, mut rng: Option<&mut Rng>) -> u32 {
    let mut best = None;
    let mut best_candidates = Vec::new();
    for i in 0..81 {
        if grid[i] != 0 {
            continue;
        }
        let c = candidates(grid, i);
        if c.is_empty() {
            return 0;
        }
        if best.is_none() || c.len() < best_candidates.len() {
            best = Some(i);
            best_candidates = c;
            if best_candidates.len() == 1 {
                break;
            }
        }
    }
    let Some(best) = best else { return 1 };
    if let Some(rng) = rng.as_deref_mut() {
        rng.shuffle(&mut best_candidates);
    }

    let mut count = 0;
    for n in best_candidates {
        grid[best] = n;
        count += solve(grid, limit - count, rng.as_deref_mut());
        if count >= limit {
            return count;
        }
    }
    grid[best] = 0;
    count
}

pub struct Generated {
    pub puzzle: Grid,
    pub solution: Grid,
    pub level: u8,
}

/// One attempt: remove numbers one by one (keeping exactly one solution) and rate the
/// puzzle along the way. Returns the version closest to `level`.
pub fn attempt(level: u8, rng: &mut Rng) -> Option<Generated> {
    let mut full = [0; 81];
    solve(&mut full, 1, Some(&mut *rng));

    let mut grid = full;
    let mut filled = 81;
    let mut best: Option<Generated> = None;
    let mut order: Vec<usize> = (0..81).collect();
    rng.shuffle(&mut order);
    for i in order {
        let kept = grid[i];
        grid[i] = 0;
        if solve(&mut grid.clone(), 2, None) != 1 {
            grid[i] = kept;
            continue;
        }
        filled -= 1;
        if filled > MAX_RATED_GIVENS {
            continue;
        }

        let found = level_of(rate(&grid), filled);
        if best
            .as_ref()
            .is_none_or(|b| found.abs_diff(level) < b.level.abs_diff(level))
        {
            best = Some(Generated {
                puzzle: grid,
                solution: full,
                level: found,
            });
        }
        // Removing more numbers (almost) never makes it easier, so stop here
        if found >= level {
            break;
        }
    }
    best
}

// ---------- Techniques ----------
// Solves the puzzle the way a person would. The hardest technique needed decides how
// difficult the puzzle is.

pub struct State {
    pub grid: Grid,
    pub cand: Masks,
}

/// What a technique did: its name, an explanation, and the cells involved
pub struct Found {
    pub name: String,
    pub text: String,
    pub pattern: Vec<usize>,
}

#[derive(Clone, Copy, Debug, PartialEq)]
pub enum Technique {
    NakedSingle,
    HiddenSingle,
    LockedCandidates,
    NakedPair,
    HiddenPair,
    NakedTriple,
    HiddenTriple,
    XWing,
    XyWing,
    Swordfish,
}

/// From easy to hard, with their tier
pub const TECHNIQUES: [(u8, Technique); 10] = [
    (1, Technique::NakedSingle),
    (2, Technique::HiddenSingle),
    (3, Technique::LockedCandidates),
    (4, Technique::NakedPair),
    (4, Technique::HiddenPair),
    (5, Technique::NakedTriple),
    (5, Technique::HiddenTriple),
    (6, Technique::XWing),
    (7, Technique::XyWing),
    (7, Technique::Swordfish),
];

impl Technique {
    /// Changes the state and says what it did, or returns None if it doesn't apply
    pub fn apply(self, s: &mut State) -> Option<Found> {
        match self {
            Technique::NakedSingle => naked_single(s),
            Technique::HiddenSingle => hidden_single(s),
            Technique::LockedCandidates => locked_candidates(s),
            Technique::NakedPair => naked_subset(s, 2),
            Technique::HiddenPair => hidden_subset(s, 2),
            Technique::NakedTriple => naked_subset(s, 3),
            Technique::HiddenTriple => hidden_subset(s, 3),
            Technique::XWing => fish(s, 2),
            Technique::XyWing => xy_wing(s),
            Technique::Swordfish => fish(s, 3),
        }
    }
}

pub fn bit_count(mask: u16) -> u32 {
    mask.count_ones()
}

pub fn digits_of(mask: u16) -> Vec<u8> {
    (1..=9).filter(|n| mask & (1 << n) != 0).collect()
}

fn mask_of(digits: &[u8]) -> u16 {
    digits.iter().fold(0, |m, n| m | (1 << n))
}

fn combinations<T: Clone>(items: &[T], k: usize) -> Vec<Vec<T>> {
    fn go<T: Clone>(
        items: &[T],
        k: usize,
        start: usize,
        combo: &mut Vec<T>,
        out: &mut Vec<Vec<T>>,
    ) {
        if combo.len() == k {
            out.push(combo.clone());
            return;
        }
        for i in start..items.len() {
            combo.push(items[i].clone());
            go(items, k, i + 1, combo, out);
            combo.pop();
        }
    }
    let mut out = Vec::new();
    go(items, k, 0, &mut Vec::new(), &mut out);
    out
}

pub fn place(s: &mut State, i: usize, n: u8) {
    s.grid[i] = n;
    s.cand[i] = 0;
    for &p in &peers()[i] {
        s.cand[p] &= !(1 << n);
    }
}

fn eliminate(s: &mut State, cells: &[usize], mask: u16) -> bool {
    let mut changed = false;
    for &i in cells {
        if s.cand[i] & mask != 0 {
            s.cand[i] &= !mask;
            changed = true;
        }
    }
    changed
}

fn unit_name(k: usize) -> String {
    match k {
        0..9 => format!("row {}", k + 1),
        9..18 => format!("column {}", k - 8),
        _ => format!("box {}", k - 17),
    }
}

fn list_text<T: Display>(items: &[T]) -> String {
    let words: Vec<String> = items.iter().map(|x| x.to_string()).collect();
    if words.len() <= 2 {
        return words.join(" and ");
    }
    format!(
        "{}, and {}",
        words[..words.len() - 1].join(", "),
        words[words.len() - 1]
    )
}

/// A cell with only one possible number
fn naked_single(s: &mut State) -> Option<Found> {
    let i = (0..81).find(|&i| bit_count(s.cand[i]) == 1)?;
    let n = digits_of(s.cand[i])[0];
    place(s, i, n);
    Some(Found {
        name: "Naked single".into(),
        text: format!("Only a {n} still fits in this cell."),
        pattern: vec![i],
    })
}

/// A number that fits in only one cell of a row, column or box
fn hidden_single(s: &mut State) -> Option<Found> {
    for (k, unit) in units().iter().enumerate() {
        for n in 1..=9u8 {
            let spots: Vec<usize> = unit
                .iter()
                .copied()
                .filter(|&i| s.cand[i] & (1 << n) != 0)
                .collect();
            if spots.len() == 1 {
                place(s, spots[0], n);
                return Some(Found {
                    name: "Hidden single".into(),
                    text: format!("In {}, the {n} only fits here.", unit_name(k)),
                    pattern: unit.to_vec(),
                });
            }
        }
    }
    None
}

/// Pointing pairs and box-line reduction: a number confined to the overlap of a box and a
/// line can be removed from the rest of both
fn locked_candidates(s: &mut State) -> Option<Found> {
    for n in 1..=9u8 {
        let bit = 1 << n;
        for (k, unit) in units().iter().enumerate() {
            let spots: Vec<usize> = unit
                .iter()
                .copied()
                .filter(|&i| s.cand[i] & bit != 0)
                .collect();
            if spots.len() < 2 {
                continue;
            }
            for (k2, other) in units().iter().enumerate() {
                if k2 == k || !spots.iter().all(|i| other.contains(i)) {
                    continue;
                }
                let rest: Vec<usize> = other
                    .iter()
                    .copied()
                    .filter(|i| !unit.contains(i))
                    .collect();
                if eliminate(s, &rest, bit) {
                    return Some(Found {
                        name: if k >= 18 {
                            "Pointing pair"
                        } else {
                            "Box-line reduction"
                        }
                        .into(),
                        text: format!(
                            "In {}, the {n} only fits in these cells, and they all sit in {}. \
                             So the {n} can go from the rest of {}.",
                            unit_name(k),
                            unit_name(k2),
                            unit_name(k2)
                        ),
                        pattern: spots,
                    });
                }
            }
        }
    }
    None
}

/// k cells in a unit that together hold only k numbers
fn naked_subset(s: &mut State, k: usize) -> Option<Found> {
    for (u, unit) in units().iter().enumerate() {
        let open: Vec<usize> = unit
            .iter()
            .copied()
            .filter(|&i| s.cand[i] != 0 && bit_count(s.cand[i]) as usize <= k)
            .collect();
        for combo in combinations(&open, k) {
            let mask = combo.iter().fold(0, |m, &i| m | s.cand[i]);
            if bit_count(mask) as usize != k {
                continue;
            }
            let rest: Vec<usize> = unit
                .iter()
                .copied()
                .filter(|i| !combo.contains(i))
                .collect();
            if eliminate(s, &rest, mask) {
                let digits = list_text(&digits_of(mask));
                return Some(Found {
                    name: if k == 2 { "Naked pair" } else { "Naked triple" }.into(),
                    text: format!(
                        "These {k} cells in {} can only hold {digits} between them. \
                         So {digits} can go from the rest of {}.",
                        unit_name(u),
                        unit_name(u)
                    ),
                    pattern: combo,
                });
            }
        }
    }
    None
}

/// k numbers in a unit that only fit in the same k cells
fn hidden_subset(s: &mut State, k: usize) -> Option<Found> {
    for (u, unit) in units().iter().enumerate() {
        let mut digits = Vec::new();
        let mut spots: [Vec<usize>; 10] = Default::default();
        for n in 1..=9u8 {
            spots[n as usize] = unit
                .iter()
                .copied()
                .filter(|&i| s.cand[i] & (1 << n) != 0)
                .collect();
            if (2..=k).contains(&spots[n as usize].len()) {
                digits.push(n);
            }
        }
        for combo in combinations(&digits, k) {
            let mut cells: Vec<usize> = Vec::new();
            for &n in &combo {
                for &i in &spots[n as usize] {
                    if !cells.contains(&i) {
                        cells.push(i);
                    }
                }
            }
            if cells.len() != k {
                continue;
            }
            let keep = mask_of(&combo);
            if eliminate(s, &cells, !keep) {
                return Some(Found {
                    name: if k == 2 {
                        "Hidden pair"
                    } else {
                        "Hidden triple"
                    }
                    .into(),
                    text: format!(
                        "In {}, {} only fit in these {k} cells. Every other number in those cells can go.",
                        unit_name(u),
                        list_text(&combo)
                    ),
                    pattern: cells,
                });
            }
        }
    }
    None
}

/// One way to look for a fish: base units, cover units, the cover and base index of a
/// cell, and the words for them
type Orientation<'a> = (
    &'a [[usize; 9]],
    &'a [[usize; 9]],
    fn(usize) -> usize,
    fn(usize) -> usize,
    &'a str,
    &'a str,
);

/// X-Wing (size 2) and Swordfish (size 3)
fn fish(s: &mut State, size: usize) -> Option<Found> {
    let all = units();
    let orientations: [Orientation; 2] = [
        (&all[0..9], &all[9..18], col, row, "rows", "columns"),
        (&all[9..18], &all[0..9], row, col, "columns", "rows"),
    ];
    for n in 1..=9u8 {
        let bit = 1 << n;
        for (bases, covers, cover_of, base_of, base_word, cover_word) in orientations {
            // (base index, cover positions) for lines where n fits in 2..=size places
            let lines: Vec<(usize, Vec<usize>)> = bases
                .iter()
                .enumerate()
                .map(|(index, unit)| {
                    (
                        index,
                        unit.iter()
                            .copied()
                            .filter(|&i| s.cand[i] & bit != 0)
                            .map(cover_of)
                            .collect::<Vec<_>>(),
                    )
                })
                .filter(|(_, positions)| (2..=size).contains(&positions.len()))
                .collect();
            for combo in combinations(&lines, size) {
                let mut cover_indexes: Vec<usize> = Vec::new();
                for (_, positions) in &combo {
                    for &c in positions {
                        if !cover_indexes.contains(&c) {
                            cover_indexes.push(c);
                        }
                    }
                }
                if cover_indexes.len() != size {
                    continue;
                }
                let base_indexes: Vec<usize> = combo.iter().map(|(index, _)| *index).collect();
                let targets: Vec<usize> = cover_indexes
                    .iter()
                    .flat_map(|&c| covers[c])
                    .filter(|&i| !base_indexes.contains(&base_of(i)))
                    .collect();
                if eliminate(s, &targets, bit) {
                    let mut cover_list: Vec<usize> = cover_indexes.iter().map(|c| c + 1).collect();
                    cover_list.sort();
                    let base_list: Vec<usize> = base_indexes.iter().map(|b| b + 1).collect();
                    return Some(Found {
                        name: format!("{} on {n}", if size == 2 { "X-Wing" } else { "Swordfish" }),
                        text: format!(
                            "In {base_word} {}, the {n} only fits in {cover_word} {}. Wherever it lands, \
                             those {cover_word} get their {n} there. So the {n} can go from the rest of \
                             those {cover_word}.",
                            list_text(&base_list),
                            list_text(&cover_list)
                        ),
                        pattern: base_indexes
                            .iter()
                            .flat_map(|&b| bases[b])
                            .filter(|&i| s.cand[i] & bit != 0)
                            .collect(),
                    });
                }
            }
        }
    }
    None
}

/// Pivot {a,b} sees wings {a,c} and {b,c}: c is gone from cells that see both wings
fn xy_wing(s: &mut State) -> Option<Found> {
    let pairs: Vec<usize> = (0..81).filter(|&i| bit_count(s.cand[i]) == 2).collect();
    for &pivot in &pairs {
        let d = digits_of(s.cand[pivot]);
        let (a, b) = (d[0], d[1]);
        let wings: Vec<usize> = pairs
            .iter()
            .copied()
            .filter(|&w| is_peer(pivot, w))
            .collect();
        for &w1 in &wings {
            if s.cand[w1] & (1 << a) == 0 || s.cand[w1] & (1 << b) != 0 {
                continue;
            }
            let c = digits_of(s.cand[w1] & !(1 << a))[0];
            let wanted = (1 << b) | (1 << c);
            for &w2 in &wings {
                if s.cand[w2] != wanted {
                    continue;
                }
                let targets: Vec<usize> = peers()[w1]
                    .iter()
                    .copied()
                    .filter(|&i| i != w2 && is_peer(i, w2))
                    .collect();
                if eliminate(s, &targets, 1 << c) {
                    return Some(Found {
                        name: "XY-Wing".into(),
                        text: format!(
                            "The middle cell is a {a} or a {b}. If it's a {a}, one wing becomes a {c}; \
                             if it's a {b}, the other one does. So cells that see both wings can't be a {c}."
                        ),
                        pattern: vec![pivot, w1, w2],
                    });
                }
            }
        }
    }
    None
}

pub fn candidate_masks(grid: &Grid) -> Masks {
    let mut masks = [0; 81];
    for i in 0..81 {
        if grid[i] == 0 {
            masks[i] = mask_of(&candidates(grid, i));
        }
    }
    masks
}

/// Applies the easiest technique that works, with its tier, or None when none does
pub fn next_step(s: &mut State) -> Option<(Found, u8)> {
    TECHNIQUES
        .iter()
        .find_map(|&(tier, technique)| technique.apply(s).map(|found| (found, tier)))
}

#[derive(Debug, PartialEq)]
pub struct Rating {
    pub tier: u8,
    /// Cells still empty when the techniques ran out
    pub empty: usize,
}

pub fn rate(puzzle: &Grid) -> Rating {
    let mut s = State {
        grid: *puzzle,
        cand: candidate_masks(puzzle),
    };
    let mut tier = 0;
    while s.grid.contains(&0) {
        match next_step(&mut s) {
            Some((_, t)) => tier = tier.max(t),
            None => {
                return Rating {
                    tier: STUCK,
                    empty: s.grid.iter().filter(|&&v| v == 0).count(),
                };
            }
        }
    }
    Rating { tier, empty: 0 }
}

/// Maps a rating to the 1-10 scale. Levels 7-10: the more empty cells left when the
/// techniques run out, the harder the puzzle.
pub fn level_of(rating: Rating, givens: usize) -> u8 {
    let Rating { tier, empty } = rating;
    match tier {
        0..=2 if givens > 34 => 1,
        0..=2 if givens > 30 => 2,
        0..=2 => 3,
        3 => 4,
        4 => 5,
        _ if tier < STUCK => 6,
        _ if empty < 30 => 7,
        _ if empty < 38 => 8,
        _ if empty < 46 => 9,
        _ => 10,
    }
}

// ---------- Helpers for the game ----------

/// Removes n from the notes of every cell that shares a row, column or box with i
pub fn clear_notes_around(notes: &mut Masks, i: usize, n: u8) {
    for &j in &peers()[i] {
        notes[j] &= !(1 << n);
    }
}

#[derive(Clone, Copy, Debug, PartialEq)]
pub enum HintReason {
    Wrong,
    Selected,
    Only,
    Easiest,
}

/// Picks the cell a hint fills in: a wrong number first (otherwise the rest can't be
/// solved), then the selected empty cell, then the empty cell with the fewest options.
pub fn choose_hint(
    values: &Grid,
    solution: &Grid,
    selected: Option<usize>,
) -> Option<(usize, HintReason)> {
    let wrong: Vec<usize> = (0..81)
        .filter(|&i| values[i] != 0 && values[i] != solution[i])
        .collect();
    if let Some(&first) = wrong.first() {
        let cell = selected.filter(|s| wrong.contains(s)).unwrap_or(first);
        return Some((cell, HintReason::Wrong));
    }
    if let Some(s) = selected.filter(|&s| values[s] == 0) {
        return Some((s, HintReason::Selected));
    }
    let cell = (0..81).filter(|&i| values[i] == 0).reduce(|a, b| {
        if candidates(values, b).len() < candidates(values, a).len() {
            b
        } else {
            a
        }
    })?;
    let reason = if candidates(values, cell).len() == 1 {
        HintReason::Only
    } else {
        HintReason::Easiest
    };
    Some((cell, reason))
}

/// What one step of the solver did
pub struct StepResult {
    pub label: String,
    pub text: String,
    /// Cells to point out
    pub targets: Vec<usize>,
    /// Whether this step counts as a hint
    pub counts: bool,
    /// Cells that show why the technique works
    pub pattern: Vec<usize>,
    /// Per cell, the notes this step crossed out
    pub removed: Masks,
    /// Cells this step filled in
    pub filled: Vec<usize>,
}

/// One logical step, explained. Works on the player's notes, so they can follow which
/// numbers are removed. Changes `values` and `notes` in place.
pub fn solver_step(values: &mut Grid, notes: &mut Masks, solution: &Grid) -> StepResult {
    let empty: Vec<usize> = (0..81).filter(|&i| values[i] == 0).collect();
    let result =
        |label: &str, text: String, targets: Vec<usize>, counts: bool, filled: Vec<usize>| {
            StepResult {
                label: label.into(),
                text,
                targets,
                counts,
                pattern: Vec::new(),
                removed: [0; 81],
                filled,
            }
        };

    // A wrong number would make every deduction after it wrong, so fix that first
    if let Some(w) = (0..81).find(|&i| values[i] != 0 && values[i] != solution[i]) {
        values[w] = solution[w];
        notes[w] = 0;
        clear_notes_around(notes, w, solution[w]);
        return result(
            "fix",
            format!("This cell was wrong. It's a {}.", solution[w]),
            vec![w],
            true,
            vec![w],
        );
    }

    // The techniques work with notes, so every empty cell needs them
    if empty.iter().any(|&i| notes[i] == 0) {
        for &i in &empty {
            if notes[i] == 0 {
                notes[i] = mask_of(&candidates(values, i));
            }
        }
        return result(
            "notes",
            "Every possible number is now a note. Press step again.".into(),
            vec![],
            false,
            vec![],
        );
    }

    if let Some(&c) = empty.iter().find(|&&i| notes[i] & (1 << solution[i]) == 0) {
        notes[c] |= 1 << solution[c];
        let text = format!(
            "The {} was crossed out here, but it fits. It's back.",
            solution[c]
        );
        return result("fix", text, vec![c], true, vec![]);
    }

    if empty.is_empty() {
        return result(
            "done",
            "The puzzle is solved.".into(),
            vec![],
            false,
            vec![],
        );
    }

    // Your notes, minus numbers that already appear in the same row, column or box
    let possible = candidate_masks(values);
    let mut s = State {
        grid: *values,
        cand: [0; 81],
    };
    for i in 0..81 {
        s.cand[i] = notes[i] & possible[i];
    }
    let before = s.cand;
    let (label, text, pattern) = match next_step(&mut s) {
        Some((found, _)) => (found.name.to_lowercase(), found.text, found.pattern),
        None => {
            let i = empty
                .iter()
                .copied()
                .reduce(|a, b| {
                    if bit_count(s.cand[b]) < bit_count(s.cand[a]) {
                        b
                    } else {
                        a
                    }
                })
                .expect("empty is not empty here");
            place(&mut s, i, solution[i]);
            let text = format!(
                "No technique applies here; it takes chains or trial and error. This cell is a {}.",
                solution[i]
            );
            ("no technique".into(), text, Vec::new())
        }
    };

    // Copy the result back to the board
    let filled: Vec<usize> = empty.iter().copied().filter(|&i| s.grid[i] != 0).collect();
    let mut removed = [0; 81];
    for &i in &empty {
        if s.grid[i] != 0 {
            values[i] = s.grid[i];
        }
        notes[i] = s.cand[i];
        if filled.is_empty() {
            removed[i] = before[i] & !s.cand[i];
        }
    }
    let targets = if filled.is_empty() {
        (0..81).filter(|&i| removed[i] != 0).collect()
    } else {
        filled.clone()
    };
    StepResult {
        label,
        text,
        targets,
        counts: true,
        pattern,
        removed,
        filled,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn parse(text: &str) -> Grid {
        let mut grid = [0; 81];
        for (i, ch) in text.chars().enumerate() {
            grid[i] = ch.to_digit(10).unwrap() as u8;
        }
        grid
    }

    /// Arto Inkala's "world's hardest sudoku": needs more than these techniques
    fn hard() -> Grid {
        parse("800000000003600000070090200050007000000045700000100030001000068008500010090000400")
    }

    fn solved(grid: &Grid) -> Grid {
        let mut copy = *grid;
        solve(&mut copy, 1, None);
        copy
    }

    fn is_valid_solution(grid: &Grid) -> bool {
        (0..81).all(|i| {
            (1..=9).contains(&grid[i]) && (0..81).all(|j| !is_peer(i, j) || grid[i] != grid[j])
        })
    }

    fn givens(grid: &Grid) -> usize {
        grid.iter().filter(|&&v| v != 0).count()
    }

    /// Every cell can still be every number, unless a test says otherwise
    fn open_state() -> State {
        State {
            grid: [0; 81],
            cand: [0b11_1111_1110; 81],
        }
    }

    fn bits(digits: &[u8]) -> u16 {
        mask_of(digits)
    }

    // ----- solving -----

    #[test]
    fn counts_solutions_up_to_the_limit() {
        assert_eq!(solve(&mut [0; 81], 2, None), 2);
        assert_eq!(solve(&mut hard(), 2, None), 1);
    }

    #[test]
    fn finds_no_solution_when_a_cell_has_no_options_left() {
        let mut grid = [0; 81];
        grid[1..=8].copy_from_slice(&[1, 2, 3, 4, 5, 6, 7, 8]); // row 0 holds 1-8
        grid[9] = 9; // and the 9 is in the same box
        assert_eq!(solve(&mut grid, 2, None), 0);
    }

    #[test]
    fn solves_a_puzzle_correctly() {
        let grid = solved(&hard());
        assert!(is_valid_solution(&grid));
        for (&v, &given) in grid.iter().zip(hard().iter()) {
            assert!(given == 0 || v == given);
        }
    }

    #[test]
    fn lists_the_numbers_that_still_fit_in_a_cell() {
        let mut grid = [0; 81];
        grid[1] = 1; // same row
        grid[9] = 2; // same column
        grid[10] = 3; // same box
        grid[80] = 4; // unrelated
        assert_eq!(candidates(&grid, 0), vec![4, 5, 6, 7, 8, 9]);
    }

    #[test]
    fn units_and_peers() {
        assert_eq!(units()[0], [0, 1, 2, 3, 4, 5, 6, 7, 8]);
        assert_eq!(units()[9], [0, 9, 18, 27, 36, 45, 54, 63, 72]);
        assert_eq!(units()[26], [60, 61, 62, 69, 70, 71, 78, 79, 80]);
        assert!(peers().iter().all(|p| p.len() == 20));
        // 27 different units, and every cell is in exactly one row, column and box
        let mut sorted: Vec<Vec<usize>> = units().iter().map(|u| u.to_vec()).collect();
        sorted.sort();
        sorted.dedup();
        assert_eq!(sorted.len(), 27);
        assert!((0..81).all(|i| units().iter().filter(|u| u.contains(&i)).count() == 3));
        assert_eq!(
            (unit_name(0), unit_name(9), unit_name(26)),
            ("row 1".into(), "column 1".into(), "box 9".into())
        );
    }

    #[test]
    fn writes_lists_like_a_person() {
        assert_eq!(list_text(&[1]), "1");
        assert_eq!(list_text(&[1, 2]), "1 and 2");
        assert_eq!(list_text(&[1, 2, 3]), "1, 2, and 3");
    }

    // ----- Requirement 1: valid puzzles -----

    #[test]
    fn requirement_1_generated_puzzles_have_one_solution_and_at_most_42_givens() {
        for (seed, level) in [(1, 1), (4, 4), (6, 6), (8, 8)] {
            let Generated {
                puzzle, solution, ..
            } = attempt(level, &mut Rng::new(seed)).unwrap();
            assert_eq!(solve(&mut puzzle.clone(), 2, None), 1);
            assert!(givens(&puzzle) <= MAX_RATED_GIVENS);
            assert!(is_valid_solution(&solution));
            for i in 0..81 {
                if puzzle[i] != 0 {
                    assert_eq!(puzzle[i], solution[i]);
                }
            }
        }
    }

    #[test]
    fn requirement_1_the_same_seed_gives_the_same_puzzle() {
        let a = attempt(5, &mut Rng::new(42)).unwrap();
        let b = attempt(5, &mut Rng::new(42)).unwrap();
        assert_eq!(a.puzzle, b.puzzle);
    }

    // ----- Requirement 2: difficulty levels -----

    #[test]
    fn requirement_2_maps_the_hardest_technique_to_a_level() {
        let rating = |tier| Rating { tier, empty: 0 };
        assert_eq!(level_of(rating(1), 40), 1);
        assert_eq!(level_of(rating(2), 32), 2);
        assert_eq!(level_of(rating(2), 28), 3);
        assert_eq!(level_of(rating(3), 28), 4);
        assert_eq!(level_of(rating(4), 28), 5);
        assert_eq!(level_of(rating(5), 28), 6);
        assert_eq!(level_of(rating(7), 28), 6);
        // Exactly at the edges between levels 1, 2 and 3
        assert_eq!(level_of(rating(2), 35), 1);
        assert_eq!(level_of(rating(2), 34), 2);
        assert_eq!(level_of(rating(2), 31), 2);
        assert_eq!(level_of(rating(2), 30), 3);
    }

    #[test]
    fn requirement_2_rates_puzzles_the_techniques_cant_finish_by_how_much_is_left() {
        let stuck = |empty| Rating { tier: STUCK, empty };
        assert_eq!(level_of(stuck(20), 25), 7);
        assert_eq!(level_of(stuck(35), 25), 8);
        assert_eq!(level_of(stuck(40), 25), 9);
        assert_eq!(level_of(stuck(50), 25), 10);
        // Exactly at the edges between levels 7, 8, 9 and 10
        assert_eq!(level_of(stuck(29), 25), 7);
        assert_eq!(level_of(stuck(30), 25), 8);
        assert_eq!(level_of(stuck(37), 25), 8);
        assert_eq!(level_of(stuck(38), 25), 9);
        assert_eq!(level_of(stuck(45), 25), 9);
        assert_eq!(level_of(stuck(46), 25), 10);
    }

    #[test]
    fn requirement_2_counts_the_empty_cells_left_when_the_techniques_run_out() {
        assert_eq!(
            rate(&[0; 81]),
            Rating {
                tier: STUCK,
                empty: 81
            }
        );
    }

    #[test]
    fn requirement_2_a_puzzle_with_one_cell_open_needs_only_a_single() {
        let mut grid = solved(&hard());
        grid[40] = 0;
        assert_eq!(rate(&grid), Rating { tier: 1, empty: 0 });
    }

    #[test]
    fn requirement_2_the_hardest_known_puzzle_is_beyond_the_techniques() {
        let rating = rate(&hard());
        assert_eq!(rating.tier, STUCK);
        assert!(level_of(rating, givens(&hard())) >= 7);
    }

    #[test]
    fn requirement_2_the_generator_reports_the_level_it_found() {
        let result = attempt(2, &mut Rng::new(42)).unwrap();
        assert_eq!(
            result.level,
            level_of(rate(&result.puzzle), givens(&result.puzzle))
        );
    }

    // ----- Requirement 2: techniques -----

    #[test]
    fn requirement_2_no_technique_applies_when_every_cell_can_still_be_anything() {
        for (_, t) in TECHNIQUES {
            assert!(t.apply(&mut open_state()).is_none(), "{t:?}");
        }
        assert!(next_step(&mut open_state()).is_none());
    }

    #[test]
    fn requirement_2_naked_single() {
        let mut s = open_state();
        s.cand[0] = bits(&[5]);
        assert_eq!(
            Technique::NakedSingle.apply(&mut s).unwrap().name,
            "Naked single"
        );
        assert_eq!(s.grid[0], 5);
        assert_eq!(s.cand[1] & bits(&[5]), 0);
    }

    #[test]
    fn requirement_2_hidden_single() {
        let mut s = open_state();
        for i in 1..9 {
            s.cand[i] &= !bits(&[7]);
        }
        assert_eq!(
            Technique::HiddenSingle.apply(&mut s).unwrap().name,
            "Hidden single"
        );
        assert_eq!(s.grid[0], 7);
    }

    #[test]
    fn requirement_2_pointing_pair() {
        let mut s = open_state();
        for i in [9, 10, 11, 18, 19, 20] {
            s.cand[i] &= !bits(&[4]);
        }
        assert_eq!(
            Technique::LockedCandidates.apply(&mut s).unwrap().name,
            "Pointing pair"
        );
        assert_eq!(s.cand[5] & bits(&[4]), 0);
        assert_ne!(s.cand[0] & bits(&[4]), 0);
    }

    #[test]
    fn requirement_2_box_line_reduction() {
        let mut s = open_state();
        for i in 3..9 {
            s.cand[i] &= !bits(&[4]); // in row 1 the 4 only fits in box 1
        }
        let found = Technique::LockedCandidates.apply(&mut s).unwrap();
        assert_eq!(found.name, "Box-line reduction");
        assert_eq!(s.cand[9] & bits(&[4]), 0);
    }

    #[test]
    fn requirement_2_naked_pair() {
        let mut s = open_state();
        s.cand[0] = bits(&[1, 2]);
        s.cand[1] = bits(&[1, 2]);
        assert_eq!(
            Technique::NakedPair.apply(&mut s).unwrap().name,
            "Naked pair"
        );
        assert_eq!(s.cand[8] & bits(&[1, 2]), 0);
    }

    #[test]
    fn requirement_2_hidden_pair() {
        let mut s = open_state();
        for i in 2..9 {
            s.cand[i] &= !bits(&[1, 2]);
        }
        assert_eq!(
            Technique::HiddenPair.apply(&mut s).unwrap().name,
            "Hidden pair"
        );
        assert_eq!(s.cand[0], bits(&[1, 2]));
    }

    #[test]
    fn requirement_2_naked_and_hidden_triples() {
        let mut naked = open_state();
        naked.cand[0] = bits(&[1, 2]);
        naked.cand[1] = bits(&[2, 3]);
        naked.cand[2] = bits(&[1, 3]);
        assert_eq!(
            Technique::NakedTriple.apply(&mut naked).unwrap().name,
            "Naked triple"
        );
        assert_eq!(naked.cand[8] & bits(&[1, 2, 3]), 0);

        let mut hidden = open_state();
        for i in 3..9 {
            hidden.cand[i] &= !bits(&[1, 2, 3]);
        }
        assert_eq!(
            Technique::HiddenTriple.apply(&mut hidden).unwrap().name,
            "Hidden triple"
        );
        assert_eq!(hidden.cand[0], bits(&[1, 2, 3]));
    }

    #[test]
    fn requirement_2_x_wing() {
        let mut s = open_state();
        for r in [0, 4] {
            for c in (0..9).filter(|&c| c != 1 && c != 6) {
                s.cand[r * 9 + c] &= !bits(&[5]);
            }
        }
        assert_eq!(Technique::XWing.apply(&mut s).unwrap().name, "X-Wing on 5");
        assert_eq!(s.cand[2 * 9 + 1] & bits(&[5]), 0);
        assert_ne!(s.cand[1] & bits(&[5]), 0);
    }

    #[test]
    fn requirement_2_swordfish() {
        let mut s = open_state();
        for (r, cols) in [(0, [1, 4]), (3, [4, 7]), (6, [1, 7])] {
            for c in (0..9).filter(|c| !cols.contains(c)) {
                s.cand[r * 9 + c] &= !bits(&[5]);
            }
        }
        assert_eq!(
            Technique::Swordfish.apply(&mut s).unwrap().name,
            "Swordfish on 5"
        );
        assert_eq!(s.cand[8 * 9 + 4] & bits(&[5]), 0);
    }

    #[test]
    fn requirement_2_x_wing_on_columns() {
        let mut s = open_state();
        for c in [0, 4] {
            for r in (0..9).filter(|&r| r != 2 && r != 7) {
                s.cand[r * 9 + c] &= !bits(&[3]);
            }
        }
        let found = Technique::XWing.apply(&mut s).unwrap();
        assert_eq!(found.name, "X-Wing on 3");
        assert!(found.text.starts_with("In columns 1 and 5"));
    }

    #[test]
    fn requirement_2_xy_wing() {
        let mut s = open_state();
        s.cand[0] = bits(&[1, 2]); // pivot
        s.cand[3] = bits(&[1, 3]); // wing in the same row
        s.cand[27] = bits(&[2, 3]); // wing in the same column
        assert_eq!(Technique::XyWing.apply(&mut s).unwrap().name, "XY-Wing");
        assert_eq!(s.cand[30] & bits(&[3]), 0);
    }

    // ----- Requirement 4: entering numbers -----

    #[test]
    fn requirement_4_a_correct_number_is_removed_from_the_notes_around_it() {
        let mut notes = [bits(&[3, 4]); 81];
        clear_notes_around(&mut notes, 0, 3);
        assert_eq!(notes[8], bits(&[4])); // row
        assert_eq!(notes[72], bits(&[4])); // column
        assert_eq!(notes[20], bits(&[4])); // box
        assert_eq!(notes[40], bits(&[3, 4])); // elsewhere
        assert_eq!(notes[0], bits(&[3, 4])); // the cell itself
    }

    // ----- Requirement 6: hint -----

    #[test]
    fn requirement_6_corrects_a_wrong_number_first() {
        let solution = solved(&hard());
        let mut values = solution;
        values[5] = solution[5] % 9 + 1;
        values[60] = 0;
        assert_eq!(
            choose_hint(&values, &solution, Some(60)),
            Some((5, HintReason::Wrong))
        );
    }

    #[test]
    fn requirement_6_prefers_the_selected_wrong_number() {
        let solution = solved(&hard());
        let mut values = solution;
        values[5] = solution[5] % 9 + 1;
        values[6] = solution[6] % 9 + 1;
        assert_eq!(
            choose_hint(&values, &solution, Some(6)),
            Some((6, HintReason::Wrong))
        );
    }

    #[test]
    fn requirement_6_fills_the_selected_empty_cell() {
        let solution = solved(&hard());
        assert_eq!(
            choose_hint(&hard(), &solution, Some(1)),
            Some((1, HintReason::Selected))
        );
    }

    #[test]
    fn requirement_6_prefers_a_later_cell_with_fewer_options() {
        let solution = solved(&hard());
        let mut values = [0; 81];
        // Row 9 has one open cell left, so its last cell has one option and every other
        // empty cell has many
        values[72..80].copy_from_slice(&solution[72..80]);
        assert_eq!(
            choose_hint(&values, &solution, None),
            Some((80, HintReason::Only))
        );
    }

    #[test]
    fn requirement_6_otherwise_picks_the_cell_with_the_fewest_options() {
        let solution = solved(&hard());
        let mut values = solution;
        values[10] = 0;
        assert_eq!(
            choose_hint(&values, &solution, None),
            Some((10, HintReason::Only))
        );
        assert_eq!(
            choose_hint(&[0; 81], &solution, None).unwrap().1,
            HintReason::Easiest
        );
        assert_eq!(choose_hint(&solution, &solution, None), None);
    }

    // ----- Requirement 7: step solver -----

    #[test]
    fn requirement_7_corrects_a_wrong_number_first() {
        let solution = solved(&hard());
        let mut values = hard();
        values[1] = solution[1] % 9 + 1;
        let step = solver_step(&mut values, &mut [0; 81], &solution);
        assert_eq!(
            (step.label.as_str(), step.targets, step.filled, step.counts),
            ("fix", vec![1], vec![1], true)
        );
        assert_eq!(values[1], solution[1]);
    }

    #[test]
    fn requirement_7_fills_in_all_notes_first_without_counting_it_as_a_hint() {
        let solution = solved(&hard());
        let mut values = hard();
        let mut notes = [0; 81];
        let step = solver_step(&mut values, &mut notes, &solution);
        assert_eq!((step.label.as_str(), step.counts), ("notes", false));
        assert_eq!(digits_of(notes[1]), candidates(&values, 1));
    }

    #[test]
    fn requirement_7_puts_back_a_correct_number_that_was_crossed_out() {
        let solution = solved(&hard());
        let mut values = hard();
        let mut notes = candidate_masks(&values);
        notes[1] &= !(1 << solution[1]);
        let step = solver_step(&mut values, &mut notes, &solution);
        assert_eq!(
            (step.label.as_str(), step.targets, step.counts),
            ("fix", vec![1], true)
        );
        assert_ne!(notes[1] & (1 << solution[1]), 0);
    }

    #[test]
    fn requirement_7_names_the_technique_it_applies() {
        let solution = solved(&hard());
        let mut values = solution;
        values[40] = 0;
        let mut notes = [0; 81];
        notes[40] = 1 << solution[40];
        let step = solver_step(&mut values, &mut notes, &solution);
        assert_eq!(
            (step.label.as_str(), step.filled, step.counts),
            ("naked single", vec![40], true)
        );
        assert_eq!(values[40], solution[40]);
    }

    #[test]
    fn requirement_7_an_elimination_step_shows_what_it_crossed_out() {
        let solution = solved(&hard());
        let mut values = hard();
        let mut notes = candidate_masks(&values);
        let mut saw_elimination = false;
        for _ in 0..200 {
            let before = notes;
            let step = solver_step(&mut values, &mut notes, &solution);
            if step.filled.is_empty() && step.label != "notes" && step.label != "fix" {
                assert!(!step.targets.is_empty());
                assert!(step.targets.iter().all(|&i| step.removed[i] != 0));
                // Exactly the notes that were there before and are gone now
                assert!((0..81).all(|i| step.removed[i] == before[i] & !notes[i]));
                saw_elimination = true;
                break;
            }
        }
        assert!(saw_elimination);
    }

    #[test]
    fn requirement_7_without_a_technique_fills_a_cell_with_the_fewest_notes() {
        let solution = solved(&hard());
        let mut values = hard();
        let mut notes = [0; 81];
        for _ in 0..500 {
            let before = notes;
            let step = solver_step(&mut values, &mut notes, &solution);
            if step.label == "no technique" {
                let fewest = (0..81)
                    .filter(|&i| before[i] != 0)
                    .map(|i| bit_count(before[i]))
                    .min();
                assert_eq!(Some(bit_count(before[step.filled[0]])), fewest);
                return;
            }
        }
        panic!("the techniques never ran out");
    }

    #[test]
    fn requirement_7_always_finishes_a_puzzle_with_only_correct_numbers() {
        let solution = solved(&hard());
        let mut values = hard();
        let mut notes = [0; 81];
        let mut labels = Vec::new();
        for _ in 0..500 {
            if !values.contains(&0) {
                break;
            }
            let step = solver_step(&mut values, &mut notes, &solution);
            labels.push(step.label);
            assert!((0..81).all(|i| values[i] == 0 || values[i] == solution[i]));
        }
        assert_eq!(values, solution);
        // On this puzzle the techniques run out, so it also has to fall back
        assert!(labels.iter().any(|l| l == "no technique"));
        // Once solved, a step does nothing
        let step = solver_step(&mut values, &mut notes, &solution);
        assert_eq!((step.label.as_str(), step.counts), ("done", false));
    }
}
