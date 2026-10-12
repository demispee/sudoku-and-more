// Sudoku rules: generating, solving and rating puzzles, and the step solver.
// No DOM access, so this runs in the browser and in Node.js (tests).

export const MAX_RATED_GIVENS = 42;

// ---------- Generator ----------

export function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function row(i) { return Math.floor(i / 9); }
export function col(i) { return i % 9; }
export function box(i) { return Math.floor(row(i) / 3) * 3 + Math.floor(col(i) / 3); }

export function isPeer(a, b) {
  return a !== b && (row(a) === row(b) || col(a) === col(b) || box(a) === box(b));
}

export function candidates(grid, i) {
  const used = new Array(10).fill(false);
  const r = row(i), c = col(i);
  const br = r - r % 3, bc = c - c % 3;
  for (let k = 0; k < 9; k++) {
    used[grid[r * 9 + k]] = true;
    used[grid[k * 9 + c]] = true;
    used[grid[(br + Math.floor(k / 3)) * 9 + bc + k % 3]] = true;
  }
  const result = [];
  for (let n = 1; n <= 9; n++) {
    if (!used[n]) result.push(n);
  }
  return result;
}

// Counts solutions up to `limit`. Leaves the grid solved when it stops at the limit.
export function solve(grid, limit, randomize) {
  let best = -1;
  let bestCandidates = null;
  for (let i = 0; i < 81; i++) {
    if (grid[i]) continue;
    const c = candidates(grid, i);
    if (c.length === 0) return 0;
    if (!bestCandidates || c.length < bestCandidates.length) {
      best = i;
      bestCandidates = c;
      if (c.length === 1) break;
    }
  }
  if (best === -1) return 1;
  if (randomize) shuffle(bestCandidates);

  let count = 0;
  for (const n of bestCandidates) {
    grid[best] = n;
    count += solve(grid, limit - count, randomize);
    if (count >= limit) return count;
  }
  grid[best] = 0;
  return count;
}

// One attempt: remove numbers one by one (keeping exactly one solution) and
// rate the puzzle along the way. Returns the version closest to `level`.
export function attempt(level) {
  const full = new Array(81).fill(0);
  solve(full, 1, true);

  const grid = full.slice();
  let filled = 81;
  let best = null;
  for (const i of shuffle([...Array(81).keys()])) {
    const kept = grid[i];
    grid[i] = 0;
    if (solve(grid.slice(), 2, false) !== 1) {
      grid[i] = kept;
      continue;
    }
    filled--;
    if (filled > MAX_RATED_GIVENS) continue;

    const found = levelOf(rate(grid), filled);
    if (!best || Math.abs(found - level) < Math.abs(best.level - level)) {
      best = { puzzle: grid.slice(), solution: full, level: found };
    }
    // Removing more numbers (almost) never makes it easier, so stop here
    if (found >= level) break;
  }
  return best;
}

// ---------- Difficulty ----------
// Solves the puzzle the way a person would, with candidate bitmasks
// (bit n set = n is still possible). The hardest technique needed
// decides how difficult the puzzle is.

const ROWS = [...Array(9)].map((_, r) => [...Array(9)].map((_, k) => r * 9 + k));
const COLS = [...Array(9)].map((_, c) => [...Array(9)].map((_, k) => k * 9 + c));
const BOXES = [...Array(9)].map((_, b) => [...Array(9)].map((_, k) =>
  (Math.floor(b / 3) * 3 + Math.floor(k / 3)) * 9 + (b % 3) * 3 + k % 3));
const UNITS = [...ROWS, ...COLS, ...BOXES];
const PEERS = [...Array(81)].map((_, i) => [...Array(81).keys()].filter(j => isPeer(i, j)));

// Tier 8 means: these techniques are not enough, you need chains or guessing
export const STUCK = 8;
export const TECHNIQUES = [
  { tier: 1, apply: nakedSingle },
  { tier: 2, apply: hiddenSingle },
  { tier: 3, apply: lockedCandidates },
  { tier: 4, apply: s => nakedSubset(s, 2) },
  { tier: 4, apply: s => hiddenSubset(s, 2) },
  { tier: 5, apply: s => nakedSubset(s, 3) },
  { tier: 5, apply: s => hiddenSubset(s, 3) },
  { tier: 6, apply: s => fish(s, 2) },  // X-Wing
  { tier: 7, apply: xyWing },
  { tier: 7, apply: s => fish(s, 3) },  // Swordfish
];

export function bitCount(mask) {
  let count = 0;
  for (; mask; mask &= mask - 1) count++;
  return count;
}

export function digitsOf(mask) {
  const digits = [];
  for (let n = 1; n <= 9; n++) {
    if (mask & (1 << n)) digits.push(n);
  }
  return digits;
}

function combinations(items, k, start = 0, combo = [], out = []) {
  if (combo.length === k) {
    out.push(combo.slice());
    return out;
  }
  for (let i = start; i < items.length; i++) {
    combo.push(items[i]);
    combinations(items, k, i + 1, combo, out);
    combo.pop();
  }
  return out;
}

export function place(s, i, n) {
  s.grid[i] = n;
  s.cand[i] = 0;
  for (const p of PEERS[i]) s.cand[p] &= ~(1 << n);
}

function eliminate(s, cells, mask) {
  let changed = false;
  for (const i of cells) {
    if (s.cand[i] & mask) {
      s.cand[i] &= ~mask;
      changed = true;
    }
  }
  return changed;
}

// Each technique changes the state and returns what it did
// ({ name, text, pattern: cells involved }), or null if it doesn't apply.

function unitName(unit) {
  const k = UNITS.indexOf(unit);
  return k < 9 ? `row ${k + 1}` : k < 18 ? `column ${k - 8}` : `box ${k - 17}`;
}

function listText(items) {
  if (items.length <= 2) return items.join(" and ");
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

// A cell with only one possible number
function nakedSingle(s) {
  for (let i = 0; i < 81; i++) {
    if (bitCount(s.cand[i]) === 1) {
      const n = digitsOf(s.cand[i])[0];
      place(s, i, n);
      return { name: "Naked single", text: `Only a ${n} still fits in this cell.`, pattern: [i] };
    }
  }
  return null;
}

// A number that fits in only one cell of a row, column or box
function hiddenSingle(s) {
  for (const unit of UNITS) {
    for (let n = 1; n <= 9; n++) {
      const spots = unit.filter(i => s.cand[i] & (1 << n));
      if (spots.length === 1) {
        place(s, spots[0], n);
        return { name: "Hidden single", text: `In ${unitName(unit)}, the ${n} only fits here.`, pattern: unit };
      }
    }
  }
  return null;
}

// Pointing pairs and box-line reduction: a number confined to the
// overlap of a box and a line can be removed from the rest of both
function lockedCandidates(s) {
  for (let n = 1; n <= 9; n++) {
    const bit = 1 << n;
    for (const unit of UNITS) {
      const spots = unit.filter(i => s.cand[i] & bit);
      if (spots.length < 2) continue;
      for (const other of UNITS) {
        if (other === unit || !spots.every(i => other.includes(i))) continue;
        if (eliminate(s, other.filter(i => !unit.includes(i)), bit)) {
          return {
            name: UNITS.indexOf(unit) >= 18 ? "Pointing pair" : "Box-line reduction",
            text: `In ${unitName(unit)}, the ${n} only fits in these cells, and they all sit in ` +
              `${unitName(other)}. So the ${n} can go from the rest of ${unitName(other)}.`,
            pattern: spots,
          };
        }
      }
    }
  }
  return null;
}

// k cells in a unit that together hold only k numbers
function nakedSubset(s, k) {
  for (const unit of UNITS) {
    const open = unit.filter(i => s.cand[i] && bitCount(s.cand[i]) <= k);
    for (const combo of combinations(open, k)) {
      const mask = combo.reduce((m, i) => m | s.cand[i], 0);
      if (bitCount(mask) !== k) continue;
      if (eliminate(s, unit.filter(i => !combo.includes(i)), mask)) {
        const digits = listText(digitsOf(mask));
        return {
          name: k === 2 ? "Naked pair" : "Naked triple",
          text: `These ${k} cells in ${unitName(unit)} can only hold ${digits} between them. ` +
            `So ${digits} can go from the rest of ${unitName(unit)}.`,
          pattern: combo,
        };
      }
    }
  }
  return null;
}

// k numbers in a unit that only fit in the same k cells
function hiddenSubset(s, k) {
  for (const unit of UNITS) {
    const digits = [];
    const spots = {};
    for (let n = 1; n <= 9; n++) {
      spots[n] = unit.filter(i => s.cand[i] & (1 << n));
      if (spots[n].length >= 2 && spots[n].length <= k) digits.push(n);
    }
    for (const combo of combinations(digits, k)) {
      const cells = new Set(combo.flatMap(n => spots[n]));
      if (cells.size !== k) continue;
      const keep = combo.reduce((m, n) => m | (1 << n), 0);
      if (eliminate(s, cells, ~keep)) {
        return {
          name: k === 2 ? "Hidden pair" : "Hidden triple",
          text: `In ${unitName(unit)}, ${listText(combo)} only fit in these ${k} cells. ` +
            `Every other number in those cells can go.`,
          pattern: [...cells],
        };
      }
    }
  }
  return null;
}

// X-Wing (size 2) and Swordfish (size 3)
function fish(s, size) {
  const orientations = [
    [ROWS, COLS, col, row, "rows", "columns"],
    [COLS, ROWS, row, col, "columns", "rows"],
  ];
  for (let n = 1; n <= 9; n++) {
    const bit = 1 << n;
    for (const [bases, covers, coverOf, baseOf, baseWord, coverWord] of orientations) {
      const lines = [];
      bases.forEach((unit, index) => {
        const positions = unit.filter(i => s.cand[i] & bit).map(coverOf);
        if (positions.length >= 2 && positions.length <= size) lines.push({ index, positions });
      });
      for (const combo of combinations(lines, size)) {
        const coverIndexes = new Set(combo.flatMap(l => l.positions));
        if (coverIndexes.size !== size) continue;
        const baseIndexes = combo.map(l => l.index);
        const targets = [...coverIndexes].flatMap(c => covers[c])
          .filter(i => !baseIndexes.includes(baseOf(i)));
        if (eliminate(s, targets, bit)) {
          const coverList = [...coverIndexes].sort().map(c => c + 1);
          return {
            name: `${size === 2 ? "X-Wing" : "Swordfish"} on ${n}`,
            text: `In ${baseWord} ${listText(baseIndexes.map(b => b + 1))}, the ${n} only fits in ` +
              `${coverWord} ${listText(coverList)}. Wherever it lands, those ${coverWord} ` +
              `get their ${n} there. So the ${n} can go from the rest of those ${coverWord}.`,
            pattern: baseIndexes.flatMap(b => bases[b]).filter(i => s.cand[i] & bit),
          };
        }
      }
    }
  }
  return null;
}

// Pivot {a,b} sees wings {a,c} and {b,c}: c is gone from cells that see both wings
function xyWing(s) {
  const pairs = [...Array(81).keys()].filter(i => bitCount(s.cand[i]) === 2);
  for (const pivot of pairs) {
    const [a, b] = digitsOf(s.cand[pivot]);
    const wings = pairs.filter(w => isPeer(pivot, w));
    for (const w1 of wings) {
      if (!(s.cand[w1] & (1 << a)) || (s.cand[w1] & (1 << b))) continue;
      const c = digitsOf(s.cand[w1] & ~(1 << a))[0];
      const wantedW2 = (1 << b) | (1 << c);
      for (const w2 of wings) {
        if (s.cand[w2] !== wantedW2) continue;
        const targets = PEERS[w1].filter(i => i !== w2 && isPeer(i, w2));
        if (eliminate(s, targets, 1 << c)) {
          return {
            name: "XY-Wing",
            text: `The middle cell is a ${a} or a ${b}. If it's a ${a}, one wing becomes a ${c}; ` +
              `if it's a ${b}, the other one does. So cells that see both wings can't be a ${c}.`,
            pattern: [pivot, w1, w2],
          };
        }
      }
    }
  }
  return null;
}

export function candidateMasks(grid) {
  return grid.map((v, i) => v ? 0 : candidates(grid, i).reduce((m, n) => m | (1 << n), 0));
}

// Applies the easiest technique that works, or returns null when none does
export function nextStep(s) {
  for (const technique of TECHNIQUES) {
    const step = technique.apply(s);
    if (step) return { ...step, tier: technique.tier };
  }
  return null;
}

export function rate(puzzleGrid) {
  const s = { grid: puzzleGrid.slice(), cand: candidateMasks(puzzleGrid) };
  let tier = 0;
  while (s.grid.includes(0)) {
    const step = nextStep(s);
    if (!step) return { tier: STUCK, empty: s.grid.filter(v => !v).length };
    tier = Math.max(tier, step.tier);
  }
  return { tier, empty: 0 };
}

// Maps a rating to the 1-10 scale. Levels 7-10: the more empty cells
// left when the techniques run out, the harder the puzzle.
export function levelOf({ tier, empty }, givens) {
  if (tier <= 2) return givens > 34 ? 1 : givens > 30 ? 2 : 3;
  if (tier === 3) return 4;
  if (tier === 4) return 5;
  if (tier < STUCK) return 6;
  return empty < 30 ? 7 : empty < 38 ? 8 : empty < 46 ? 9 : 10;
}


// ---------- Helpers for the game ----------

// Removes n from the notes of every cell that shares a row, column or box with i
export function clearNotesAround(notes, i, n) {
  for (let j = 0; j < 81; j++) {
    if (isPeer(i, j)) notes[j].delete(n);
  }
}

// Picks the cell a hint fills in: a wrong number first (otherwise the rest can't be
// solved), then the selected empty cell, then the empty cell with the fewest options.
export function chooseHint(values, solution, selected) {
  const wrong = [];
  const empty = [];
  for (let i = 0; i < 81; i++) {
    if (values[i] && values[i] !== solution[i]) wrong.push(i);
    if (!values[i]) empty.push(i);
  }
  if (wrong.length) return { cell: wrong.includes(selected) ? selected : wrong[0], reason: "wrong" };
  if (selected !== null && !values[selected]) return { cell: selected, reason: "selected" };
  const cell = empty.reduce((a, b) =>
    candidates(values, b).length < candidates(values, a).length ? b : a);
  return { cell, reason: candidates(values, cell).length === 1 ? "only" : "easiest" };
}

// One logical step, explained. Works on the player's notes, so they can follow which
// numbers are removed. Changes `values` and `notes` in place and returns what it did:
// { label, text, targets, counts, pattern, removed, filled }.
export function solverStep({ values, notes, solution }) {
  const empty = [...Array(81).keys()].filter(i => !values[i]);
  const result = (label, text, targets, counts, filled = []) =>
    ({ label, text, targets, counts, pattern: [], removed: {}, filled });

  // A wrong number would make every deduction after it wrong, so fix that first
  const wrong = values.findIndex((v, i) => v && v !== solution[i]);
  if (wrong !== -1) {
    values[wrong] = solution[wrong];
    notes[wrong].clear();
    clearNotesAround(notes, wrong, solution[wrong]);
    return result("fix", `This cell was wrong. It's a ${solution[wrong]}.`, [wrong], true, [wrong]);
  }

  // The techniques work with notes, so every empty cell needs them
  if (empty.some(i => notes[i].size === 0)) {
    for (const i of empty) {
      if (!notes[i].size) notes[i] = new Set(candidates(values, i));
    }
    return result("notes", "Every possible number is now a note. Press step again.", [], false);
  }

  const crossedOut = empty.find(i => !notes[i].has(solution[i]));
  if (crossedOut !== undefined) {
    notes[crossedOut].add(solution[crossedOut]);
    return result("fix", `The ${solution[crossedOut]} was crossed out here, but it fits. It's back.`,
      [crossedOut], true);
  }

  // Your notes, minus numbers that already appear in the same row, column or box
  const possible = candidateMasks(values);
  const s = {
    grid: values.slice(),
    cand: values.map((v, i) => [...notes[i]].reduce((m, n) => m | (1 << n), 0) & possible[i]),
  };
  const before = s.cand.slice();
  let label, text;
  let pattern = [];
  const step = nextStep(s);
  if (step) {
    label = step.name.toLowerCase();
    text = step.text;
    pattern = step.pattern;
  } else {
    const i = empty.reduce((a, b) => bitCount(s.cand[b]) < bitCount(s.cand[a]) ? b : a);
    place(s, i, solution[i]);
    label = "no technique";
    text = `No technique applies here; it takes chains or trial and error. This cell is a ${solution[i]}.`;
  }

  // Copy the result back to the board
  const filled = empty.filter(i => s.grid[i]);
  const removed = {};
  for (const i of empty) {
    if (s.grid[i]) values[i] = s.grid[i];
    notes[i] = new Set(digitsOf(s.cand[i]));
    if (!filled.length) {
      const gone = digitsOf(before[i] & ~s.cand[i]);
      if (gone.length) removed[i] = gone;
    }
  }
  const targets = filled.length ? filled : Object.keys(removed).map(Number);
  return { label, text, targets, counts: true, pattern, removed, filled };
}
