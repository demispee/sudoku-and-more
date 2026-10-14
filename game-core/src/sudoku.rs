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
    /// Per cell, the numbers whose options the technique relied on
    pub looks_at: Masks,
}

const ALL: u16 = 0b11_1111_1110;

/// `mask` in each of `cells`, nothing elsewhere
fn looks_at(cells: impl IntoIterator<Item = usize>, mask: u16) -> Masks {
    let mut masks = [0; 81];
    for i in cells {
        masks[i] = mask;
    }
    masks
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
        looks_at: looks_at([i], ALL),
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
                    looks_at: looks_at(*unit, 1 << n),
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
                        looks_at: looks_at(*unit, bit),
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
                    looks_at: looks_at(combo.iter().copied(), ALL),
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
                    looks_at: looks_at(*unit, keep),
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
                        looks_at: looks_at(base_indexes.iter().flat_map(|&b| bases[b]), bit),
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
                        looks_at: looks_at([pivot, w1, w2], ALL),
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

/// The most numbers a trial may follow before it has to reach a contradiction
pub const TRIAL_STEPS: usize = 8;

fn cell_name(i: usize) -> String {
    format!("row {}, column {}", row(i) + 1, col(i) + 1)
}

/// What has gone wrong on this board, if anything: a cell without options, or a number
/// that no longer fits anywhere in a row, column or box. Also gives the cells to show.
fn contradiction(s: &State) -> Option<(String, Vec<usize>)> {
    if let Some(i) = (0..81).find(|&i| s.grid[i] == 0 && s.cand[i] == 0) {
        let text = format!("the cell in {} has no number left", cell_name(i));
        return Some((text, vec![i]));
    }
    for (k, unit) in units().iter().enumerate() {
        for n in 1..=9u8 {
            if unit
                .iter()
                .all(|&i| s.grid[i] != n && s.cand[i] & (1 << n) == 0)
            {
                let text = format!("the {n} no longer fits anywhere in {}", unit_name(k));
                return Some((text, unit.to_vec()));
            }
        }
    }
    None
}

/// When the techniques run out: assume the wrong one of a cell's two options and follow
/// the singles. Returns the cell whose wrong option leads to a contradiction soonest.
fn trial(grid: &Grid, options: &Masks, solution: &Grid) -> Option<(usize, Found)> {
    let mut best: Option<(usize, usize, Found)> = None; // numbers followed, cell, explanation
    for cell in (0..81).filter(|&i| grid[i] == 0 && bit_count(options[i]) == 2) {
        let (right, both) = (solution[cell], digits_of(options[cell]));
        let wrong = if both[0] == right { both[1] } else { both[0] };
        let mut s = State {
            grid: *grid,
            cand: *options,
        };
        place(&mut s, cell, wrong);
        let mut forced: Vec<usize> = Vec::new();
        let ending = loop {
            if let Some(found) = contradiction(&s) {
                break Some(found);
            }
            let before = s.grid;
            if forced.len() == TRIAL_STEPS
                || naked_single(&mut s)
                    .or_else(|| hidden_single(&mut s))
                    .is_none()
            {
                break None;
            }
            forced.push((0..81).find(|&i| s.grid[i] != before[i]).expect("placed"));
        };
        let Some((what, cells)) = ending else {
            continue;
        };
        if best.as_ref().is_some_and(|(len, ..)| *len <= forced.len()) {
            continue;
        }
        let chain: Vec<String> = forced
            .iter()
            .map(|&i| format!("a {} ({})", s.grid[i], cell_name(i)))
            .collect();
        let reasoning = if chain.is_empty() {
            format!("then {what}")
        } else {
            format!("that forces {}, and then {what}", chain.join(", then "))
        };
        let mut pattern: Vec<usize> = [cell]
            .into_iter()
            .chain(forced.clone())
            .chain(cells)
            .collect();
        pattern.sort();
        pattern.dedup();
        let found = Found {
            name: "Trial".into(),
            text: format!(
                "No technique gets further here, so try something. This cell is a {} or a {}. \
                 Suppose it's a {wrong}: {reasoning}. So it can't be a {wrong}; it's a {right}.",
                both[0], both[1]
            ),
            pattern,
            looks_at: [0; 81],
        };
        best = Some((forced.len(), cell, found));
    }
    best.map(|(_, cell, found)| (cell, found))
}

/// One number filled in, explained. The solver works out the options itself and applies
/// the easiest techniques until a cell has one number left, then keeps only the
/// techniques that number needed. The player's notes only lose what those ruled out.
/// Changes `values` and `notes` in place.
pub fn solver_step(
    values: &mut Grid,
    notes: &mut Masks,
    solution: &Grid,
    selected: Option<usize>,
) -> StepResult {
    let result = |label: &str, text: String, filled: Vec<usize>, counts: bool| StepResult {
        label: label.into(),
        text,
        targets: filled.clone(),
        counts,
        pattern: Vec::new(),
        removed: [0; 81],
        filled,
    };

    // A wrong number would make every deduction after it wrong, so fix that first: the
    // selected one if it is wrong
    let wrong = |i: &usize| values[*i] != 0 && values[*i] != solution[*i];
    if let Some(w) = selected.filter(wrong).or_else(|| (0..81).find(wrong)) {
        let before = *notes;
        values[w] = solution[w];
        notes[w] = 0;
        clear_notes_around(notes, w, solution[w]);
        let text = format!("This cell was wrong. It's a {}.", solution[w]);
        let mut step = result("fix", text, vec![w], true);
        // Show the notes it crossed out around the cell, as every other step does
        step.removed = std::array::from_fn(|i| before[i] & !notes[i]);
        return step;
    }
    if !values.contains(&0) {
        return result("done", "The puzzle is solved.".into(), vec![], false);
    }

    // Eliminate until a technique places a number, remembering what each one crossed out
    let options = candidate_masks(values);
    let mut s = State {
        grid: *values,
        cand: options,
    };
    let mut used: Vec<(Found, Masks)> = Vec::new();
    let single = loop {
        let before = s.cand;
        let Some((found, _)) = next_step(&mut s) else {
            break None;
        };
        if s.grid != *values {
            break Some(found);
        }
        used.push((found, std::array::from_fn(|i| before[i] & !s.cand[i])));
    };

    let (cell, n, last) = match single {
        Some(found) => {
            let cell = (0..81)
                .find(|&i| s.grid[i] != values[i])
                .expect("one was placed");
            let n = s.grid[cell];
            // Leave out every technique the number doesn't need, latest first
            let holds = |kept: &[(Found, Masks)]| {
                let mut cand = options;
                for (_, gone) in kept {
                    for i in 0..81 {
                        cand[i] &= !gone[i];
                    }
                }
                let bit = 1 << n;
                if found.name == "Naked single" {
                    cand[cell] == bit
                } else {
                    found
                        .pattern
                        .iter()
                        .all(|&i| i == cell || cand[i] & bit == 0)
                }
            };
            for k in (0..used.len()).rev() {
                // A later technique that stays may only work because of this one
                let relied_on = used[k + 1..]
                    .iter()
                    .any(|(later, _)| (0..81).any(|i| used[k].1[i] & later.looks_at[i] != 0));
                if relied_on {
                    continue;
                }
                let step = used.remove(k);
                if !holds(&used) {
                    used.insert(k, step);
                }
            }
            (cell, n, found)
        }
        None => {
            used.clear();
            if let Some((cell, found)) = trial(values, &options, solution) {
                (cell, solution[cell], found)
            } else {
                let cell = (0..81)
                    .filter(|&i| values[i] == 0)
                    .reduce(|a, b| {
                        if bit_count(options[b]) < bit_count(options[a]) {
                            b
                        } else {
                            a
                        }
                    })
                    .expect("a cell is still empty here");
                let n = solution[cell];
                let found = Found {
                    name: "No technique".into(),
                    text: format!(
                        "No technique gets further here, and trying doesn't lead to a short \
                     contradiction. This cell is a {n}."
                    ),
                    pattern: Vec::new(),
                    looks_at: [0; 81],
                };
                (cell, n, found)
            }
        }
    };

    // Copy the result back to the board; notes only lose numbers
    let before = *notes;
    for (_, gone) in &used {
        for i in 0..81 {
            notes[i] &= !gone[i];
        }
    }
    values[cell] = n;
    notes[cell] = 0;
    clear_notes_around(notes, cell, n);
    let mut removed: Masks = std::array::from_fn(|i| before[i] & !notes[i]);
    removed[cell] = 0;

    let mut pattern: Vec<usize> = used
        .iter()
        .flat_map(|(found, _)| found.pattern.iter().copied())
        .chain(last.pattern.iter().copied())
        .collect();
    pattern.sort();
    pattern.dedup();
    let steps: Vec<&Found> = used.iter().map(|(found, _)| found).chain([&last]).collect();
    StepResult {
        label: steps
            .iter()
            .map(|f| f.name.to_lowercase())
            .collect::<Vec<_>>()
            .join(", then "),
        text: steps
            .iter()
            .enumerate()
            .map(|(k, f)| match k {
                0 => f.text.clone(),
                // "Then only a 3 fits", not "Then Only a 3 fits"
                _ => format!("Then {}{}", f.text[..1].to_lowercase(), &f.text[1..]),
            })
            .collect::<Vec<_>>()
            .join(" "),
        targets: vec![cell],
        counts: true,
        pattern,
        removed,
        filled: vec![cell],
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
    fn requirement_1_counting_solutions_stops_exactly_at_the_limit() {
        // Many solutions; the second option of a cell opens a subtree with several of them
        let grid = parse(
            "000700009000602100670091083000200000000040720080100530020970300030000000090000452",
        );
        for limit in 1..=3 {
            assert_eq!(solve(&mut grid.clone(), limit, None), limit);
        }
    }

    #[test]
    fn requirement_1_the_easiest_level_keeps_all_42_givens() {
        // Rating starts at 42 givens, and with only singles that is already level 1
        for seed in 1..=3 {
            let easy = attempt(1, &mut Rng::new(seed)).unwrap();
            assert_eq!((easy.level, givens(&easy.puzzle)), (1, MAX_RATED_GIVENS));
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

    #[test]
    fn requirement_2_out_of_reach_it_keeps_the_first_closest_version() {
        // This attempt never gets past level 3 on its way to 5. It keeps the first level 3
        // it found, with 30 givens: the most a level 3 can have.
        let result = attempt(5, &mut Rng::new(1)).unwrap();
        assert_eq!((result.level, givens(&result.puzzle)), (3, 30));
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
    fn requirement_2_an_x_wing_names_its_lines_and_shows_its_cells() {
        let mut s = open_state();
        for r in [0, 4] {
            for c in (0..9).filter(|&c| c != 1 && c != 6) {
                s.cand[r * 9 + c] &= !bits(&[5]);
            }
        }
        let found = Technique::XWing.apply(&mut s).unwrap();
        assert_eq!(
            found.text,
            "In rows 1 and 5, the 5 only fits in columns 2 and 7. Wherever it lands, \
             those columns get their 5 there. So the 5 can go from the rest of those columns."
        );
        // The four corners: rows 1 and 5, columns 2 and 7
        assert_eq!(found.pattern, vec![1, 6, 37, 42]);
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

    // ----- Requirement 7: step solver -----

    #[test]
    fn regression_requirement_7_a_fix_shows_the_notes_it_crossed_out() {
        let solution = solved(&hard());
        let mut values = hard();
        values[1] = solution[1] % 9 + 1;
        let mut notes = candidate_masks(&hard());
        let before = notes;
        let step = solver_step(&mut values, &mut notes, &solution, None);
        assert_eq!(step.label, "fix");
        assert!((0..81).all(|i| step.removed[i] == before[i] & !notes[i]));
        assert!(step.removed.iter().any(|&m| m == 1 << solution[1]));
    }

    #[test]
    fn requirement_7_corrects_the_selected_wrong_number_first() {
        let solution = solved(&hard());
        let mut values = hard();
        values[1] = solution[1] % 9 + 1;
        values[2] = solution[2] % 9 + 1;
        let step = solver_step(&mut values, &mut [0; 81], &solution, Some(2));
        assert_eq!((step.label.as_str(), step.filled), ("fix", vec![2]));
        // An empty or correct selected cell doesn't change which one comes first
        let step = solver_step(&mut values, &mut [0; 81], &solution, Some(3));
        assert_eq!(step.filled, vec![1]);
    }

    #[test]
    fn requirement_7_corrects_a_wrong_number_first() {
        let solution = solved(&hard());
        let mut values = hard();
        values[1] = solution[1] % 9 + 1;
        let step = solver_step(&mut values, &mut [0; 81], &solution, None);
        assert_eq!(
            (step.label.as_str(), step.targets, step.filled, step.counts),
            ("fix", vec![1], vec![1], true)
        );
        assert_eq!(values[1], solution[1]);
    }

    #[test]
    fn requirement_7_a_step_without_notes_fills_in_a_number_and_adds_no_notes() {
        let solution = solved(&hard());
        let mut values = hard();
        let mut notes = [0; 81];
        let step = solver_step(&mut values, &mut notes, &solution, None);
        assert_eq!((step.filled.len(), step.counts), (1, true));
        let i = step.filled[0];
        assert_eq!((step.targets, values[i]), (vec![i], solution[i]));
        assert_eq!(notes, [0; 81]);
    }

    #[test]
    fn requirement_7_names_the_technique_it_applies() {
        let solution = solved(&hard());
        let mut values = solution;
        values[40] = 0;
        let mut notes = [0; 81];
        notes[40] = 1 << solution[40];
        let step = solver_step(&mut values, &mut notes, &solution, None);
        assert_eq!(
            (step.label.as_str(), step.filled, step.counts),
            ("naked single", vec![40], true)
        );
        assert_eq!(values[40], solution[40]);
    }

    #[test]
    fn requirement_7_a_step_names_the_techniques_it_needed_and_crosses_out_their_notes() {
        let solution = solved(&hard());
        let mut values = hard();
        let mut notes = candidate_masks(&values);
        let mut saw_elimination = false;
        while values.contains(&0) {
            let before = notes;
            let step = solver_step(&mut values, &mut notes, &solution, None);
            let [i] = step.filled[..] else {
                panic!("one number per step")
            };
            assert_eq!(values[i], solution[i]);
            // Notes only lose numbers, never the right one, and `removed` says exactly which
            assert!((0..81).all(|j| notes[j] & !before[j] == 0));
            assert!((0..81).all(|j| values[j] != 0 || notes[j] & (1 << solution[j]) != 0));
            assert!(!step.text.starts_with("Then"));
            assert!((0..81).all(|j| j == i || step.removed[j] == before[j] & !notes[j]));
            // Crossed out by a technique, not just because the number went in nearby
            let by_technique = (0..81).any(|j| {
                step.removed[j] & !(1 << values[i]) != 0 || (step.removed[j] != 0 && !is_peer(i, j))
            });
            if step.label.contains(", then ") && by_technique {
                assert!(!step.pattern.is_empty());
                assert!(step.text.contains(". Then "));
                saw_elimination = true;
            }
        }
        assert!(saw_elimination);
    }

    #[test]
    fn regression_requirement_7_keeps_a_technique_that_a_later_one_relies_on() {
        // The box-line reduction leaves the XY-Wing's middle cell with two options; without
        // it, the explanation claimed an XY-Wing that wasn't there
        let g = attempt(7, &mut Rng::new(15)).unwrap();
        let mut values = g.puzzle;
        for _ in 0..16 {
            solver_step(&mut values, &mut [0; 81], &g.solution, None);
        }
        let step = solver_step(&mut values, &mut [0; 81], &g.solution, None);
        assert_eq!(
            step.label,
            "box-line reduction, then xy-wing, then naked single"
        );
    }

    #[test]
    fn regression_requirement_7_leaves_out_a_technique_about_other_numbers() {
        // The pointing pair only crosses out 6s, which the hidden pair on 2 and 8 and the
        // hidden single on 9 don't look at, so it isn't needed
        let mut values = parse(
            "530400000180000054294580000465000030973805402821340509712650043649100005358024000",
        );
        let solution = solved(&values);
        let step = solver_step(&mut values, &mut [0; 81], &solution, None);
        assert_eq!(step.label, "hidden pair, then hidden single");
    }

    #[test]
    fn requirement_7_when_the_techniques_run_out_it_tries_a_cell_with_two_options() {
        let solution = solved(&hard());
        let mut values = hard();
        for _ in 0..81 {
            let before = values;
            let step = solver_step(&mut values, &mut [0; 81], &solution, None);
            if step.label != "trial" {
                continue;
            }
            let i = step.filled[0];
            let options = candidate_masks(&before);
            assert_eq!((bit_count(options[i]), values[i]), (2, solution[i]));
            let wrong = digits_of(options[i] & !(1 << solution[i]))[0];
            assert!(step.text.contains(&format!("Suppose it's a {wrong}:")));
            assert!(step.text.ends_with(&format!("it's a {}.", solution[i])));
            assert!(step.pattern.contains(&i));
            // Following the wrong number with singles really goes wrong within the limit
            let mut s = State {
                grid: before,
                cand: options,
            };
            place(&mut s, i, wrong);
            for _ in 0..TRIAL_STEPS {
                if contradiction(&s).is_some() {
                    break;
                }
                naked_single(&mut s).or_else(|| hidden_single(&mut s));
            }
            assert!(contradiction(&s).is_some());
            return;
        }
        panic!("no step had to try a cell");
    }

    #[test]
    fn requirement_7_a_trial_says_when_a_cell_runs_out_of_numbers() {
        // Assuming the 2 here leaves no number at all for a cell in the same row
        let mut s = open_state();
        s.cand[1] = bits(&[2]);
        place(&mut s, 0, 2);
        let (text, cells) = contradiction(&s).unwrap();
        assert_eq!(
            (text.as_str(), cells),
            ("the cell in row 1, column 2 has no number left", vec![1])
        );
    }

    #[test]
    fn requirement_7_a_trial_says_when_a_number_no_longer_fits_in_a_row() {
        let mut s = open_state();
        assert!(contradiction(&s).is_none());
        // A 5 placed in row 1 is fine, even though no cell there has a 5 option left
        place(&mut s, 0, 5);
        assert!(contradiction(&s).is_none());

        let mut s = open_state();
        for i in 0..9 {
            s.cand[i] &= !bits(&[5]);
        }
        let (text, cells) = contradiction(&s).unwrap();
        assert_eq!(text, "the 5 no longer fits anywhere in row 1");
        assert_eq!(cells, (0..9).collect::<Vec<_>>());
    }

    /// How many numbers the singles fill in after assuming `wrong`, before they reach a
    /// contradiction, or None if they don't within the limit
    fn numbers_until_contradiction(grid: &Grid, cell: usize, wrong: u8) -> Option<usize> {
        let mut s = State {
            grid: *grid,
            cand: candidate_masks(grid),
        };
        place(&mut s, cell, wrong);
        for forced in 0..=TRIAL_STEPS {
            if contradiction(&s).is_some() {
                return Some(forced);
            }
            naked_single(&mut s).or_else(|| hidden_single(&mut s))?;
        }
        None
    }

    #[test]
    fn requirement_7_a_trial_follows_the_shortest_contradiction_and_names_each_number() {
        let solution = solved(&hard());
        // Step until the techniques run out for the first time
        let mut values = hard();
        let values = loop {
            let before = values;
            if solver_step(&mut values, &mut [0; 81], &solution, None).label == "trial" {
                break before;
            }
        };
        let options = candidate_masks(&values);
        let (cell, found) = trial(&values, &options, &solution).unwrap();
        assert_eq!(cell, 64);
        assert_eq!(
            found.text,
            "No technique gets further here, so try something. This cell is a 3 or a 6. \
             Suppose it's a 6: that forces a 8 (row 6, column 2), then a 3 (row 5, column 2), \
             then a 7 (row 9, column 3), then a 3 (row 9, column 1), then a 8 (row 5, column 4), \
             then a 2 (row 9, column 4), and then the 2 no longer fits anywhere in row 8. \
             So it can't be a 6; it's a 3."
        );
        // No other cell with two options goes wrong sooner
        let shortest = (0..81)
            .filter(|&i| values[i] == 0 && bit_count(options[i]) == 2)
            .filter_map(|i| {
                let wrong = digits_of(options[i] & !(1 << solution[i]))[0];
                numbers_until_contradiction(&values, i, wrong)
            })
            .min();
        assert_eq!(shortest, Some(6));
    }

    #[test]
    fn requirement_7_without_a_technique_fills_a_cell_with_the_fewest_options() {
        let solution = solved(&hard());
        let mut values = hard();
        for _ in 0..81 {
            let options = candidate_masks(&values);
            let step = solver_step(&mut values, &mut [0; 81], &solution, None);
            if step.label == "no technique" {
                assert!(
                    step.text
                        .contains("trying doesn't lead to a short contradiction")
                );
                let fewest = (0..81)
                    .filter(|&i| options[i] != 0)
                    .map(|i| bit_count(options[i]))
                    .min();
                assert_eq!(Some(bit_count(options[step.filled[0]])), fewest);
                return;
            }
        }
        panic!("the techniques never ran out at the start of a step");
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
            let step = solver_step(&mut values, &mut notes, &solution, None);
            labels.push(step.label);
            assert!((0..81).all(|i| values[i] == 0 || values[i] == solution[i]));
        }
        assert_eq!(values, solution);
        // On this puzzle the techniques run out, so it also has to fall back
        assert!(labels.iter().any(|l| l == "trial"));
        // Once solved, a step does nothing
        let step = solver_step(&mut values, &mut notes, &solution, None);
        assert_eq!((step.label.as_str(), step.counts), ("done", false));
    }
}
