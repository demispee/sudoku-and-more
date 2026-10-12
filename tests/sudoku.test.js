// Tests for .openspec/specs/001-sudoku/spec.md
import { afterEach, describe, expect, test, vi } from "vitest";
import { seedRandom } from "./random.js";
import {
  MAX_RATED_GIVENS, STUCK, TECHNIQUES, attempt, candidates, chooseHint, clearNotesAround,
  isPeer, levelOf, nextStep, rate, solve, solverStep,
} from "../src/sudoku.js";

afterEach(() => vi.restoreAllMocks());

const parse = text => [...text].map(Number);

// Arto Inkala's "world's hardest sudoku": needs more than the techniques in TECHNIQUES
const HARD = parse("800000000003600000070090200050007000000045700000100030001000068008500010090000400");

function solved(grid) {
  const copy = grid.slice();
  solve(copy, 1, false);
  return copy;
}

function isValidSolution(grid) {
  return grid.every((v, i) => v >= 1 && v <= 9 && grid.every((w, j) => !isPeer(i, j) || v !== w));
}

// Every cell can still be every number, unless a test says otherwise
const ALL = 0b1111111110;
function openState() {
  return { grid: new Array(81).fill(0), cand: new Array(81).fill(ALL) };
}
const bits = (...digits) => digits.reduce((m, n) => m | (1 << n), 0);
const technique = name => TECHNIQUES[{
  nakedSingle: 0, hiddenSingle: 1, locked: 2, nakedPair: 3, hiddenPair: 4,
  nakedTriple: 5, hiddenTriple: 6, xWing: 7, xyWing: 8, swordfish: 9,
}[name]].apply;

describe("solving", () => {
  test("counts solutions up to the limit", () => {
    expect(solve(new Array(81).fill(0), 2, false)).toBe(2);
    expect(solve(HARD.slice(), 2, false)).toBe(1);
  });

  test("finds no solution when a cell has no options left", () => {
    const grid = new Array(81).fill(0);
    for (let n = 1; n <= 8; n++) grid[n] = n;  // row 0 holds 1-8
    grid[9] = 9;                               // and the 9 is in the same box
    expect(solve(grid, 2, false)).toBe(0);
  });

  test("solves a puzzle correctly", () => {
    const grid = solved(HARD);
    expect(isValidSolution(grid)).toBe(true);
    HARD.forEach((v, i) => v && expect(grid[i]).toBe(v));
  });

  test("lists the numbers that still fit in a cell", () => {
    const grid = new Array(81).fill(0);
    grid[1] = 1;   // same row
    grid[9] = 2;   // same column
    grid[10] = 3;  // same box
    grid[80] = 4;  // unrelated
    expect(candidates(grid, 0)).toEqual([4, 5, 6, 7, 8, 9]);
  });
});

describe("Requirement 1: valid puzzles", () => {
  test.each([1, 4, 6, 8])("a level %i puzzle has one solution and at most 42 givens", level => {
    seedRandom(level);
    const { puzzle, solution } = attempt(level);
    expect(solve(puzzle.slice(), 2, false)).toBe(1);
    expect(puzzle.filter(Boolean).length).toBeLessThanOrEqual(MAX_RATED_GIVENS);
    expect(isValidSolution(solution)).toBe(true);
    puzzle.forEach((v, i) => v && expect(v).toBe(solution[i]));
  });
});

describe("Requirement 2: difficulty levels", () => {
  test("maps the hardest technique to a level", () => {
    expect(levelOf({ tier: 1, empty: 0 }, 40)).toBe(1);
    expect(levelOf({ tier: 2, empty: 0 }, 32)).toBe(2);
    expect(levelOf({ tier: 2, empty: 0 }, 28)).toBe(3);
    expect(levelOf({ tier: 3, empty: 0 }, 28)).toBe(4);
    expect(levelOf({ tier: 4, empty: 0 }, 28)).toBe(5);
    expect(levelOf({ tier: 5, empty: 0 }, 28)).toBe(6);
    expect(levelOf({ tier: 7, empty: 0 }, 28)).toBe(6);
  });

  test("rates puzzles the techniques can't finish by how much is left", () => {
    expect(levelOf({ tier: STUCK, empty: 20 }, 25)).toBe(7);
    expect(levelOf({ tier: STUCK, empty: 35 }, 25)).toBe(8);
    expect(levelOf({ tier: STUCK, empty: 40 }, 25)).toBe(9);
    expect(levelOf({ tier: STUCK, empty: 50 }, 25)).toBe(10);
  });

  test("a puzzle with one cell open needs only a single", () => {
    const grid = solved(HARD);
    grid[40] = 0;
    expect(rate(grid)).toEqual({ tier: 1, empty: 0 });
  });

  test("the hardest known puzzle is beyond the techniques", () => {
    const { tier, empty } = rate(HARD);
    expect(tier).toBe(STUCK);
    expect(levelOf({ tier, empty }, HARD.filter(Boolean).length)).toBeGreaterThanOrEqual(7);
  });

  test("the generator aims for the chosen level", () => {
    seedRandom(42);
    const result = attempt(2);
    expect(result.level).toBe(levelOf(rate(result.puzzle), result.puzzle.filter(Boolean).length));
  });
});

describe("Requirement 2: techniques", () => {
  test("none applies when every cell can still be anything", () => {
    for (const { apply } of TECHNIQUES) expect(apply(openState())).toBeNull();
    expect(nextStep(openState())).toBeNull();
  });

  test("naked single: a cell with one option is filled in", () => {
    const s = openState();
    s.cand[0] = bits(5);
    expect(technique("nakedSingle")(s).name).toBe("Naked single");
    expect(s.grid[0]).toBe(5);
    expect(s.cand[1] & bits(5)).toBe(0);
  });

  test("hidden single: a number with one place in a row is filled in", () => {
    const s = openState();
    for (let i = 1; i < 9; i++) s.cand[i] &= ~bits(7);
    expect(technique("hiddenSingle")(s).name).toBe("Hidden single");
    expect(s.grid[0]).toBe(7);
  });

  test("pointing pair: a number stuck on one line of a box leaves the rest of that line", () => {
    const s = openState();
    for (const i of [9, 10, 11, 18, 19, 20]) s.cand[i] &= ~bits(4);
    expect(technique("locked")(s).name).toBe("Pointing pair");
    expect(s.cand[5] & bits(4)).toBe(0);
    expect(s.cand[0] & bits(4)).not.toBe(0);
  });

  test("naked pair: two cells holding the same two numbers clear them from the row", () => {
    const s = openState();
    s.cand[0] = s.cand[1] = bits(1, 2);
    expect(technique("nakedPair")(s).name).toBe("Naked pair");
    expect(s.cand[8] & bits(1, 2)).toBe(0);
  });

  test("hidden pair: two numbers that only fit in two cells clear those cells", () => {
    const s = openState();
    for (let i = 2; i < 9; i++) s.cand[i] &= ~bits(1, 2);
    expect(technique("hiddenPair")(s).name).toBe("Hidden pair");
    expect(s.cand[0]).toBe(bits(1, 2));
  });

  test("naked and hidden triples work the same way with three cells", () => {
    const naked = openState();
    naked.cand[0] = bits(1, 2);
    naked.cand[1] = bits(2, 3);
    naked.cand[2] = bits(1, 3);
    expect(technique("nakedTriple")(naked).name).toBe("Naked triple");
    expect(naked.cand[8] & bits(1, 2, 3)).toBe(0);

    const hidden = openState();
    for (let i = 3; i < 9; i++) hidden.cand[i] &= ~bits(1, 2, 3);
    expect(technique("hiddenTriple")(hidden).name).toBe("Hidden triple");
    expect(hidden.cand[0]).toBe(bits(1, 2, 3));
  });

  test("X-Wing: two rows with a number in the same two columns clear those columns", () => {
    const s = openState();
    for (const r of [0, 4]) {
      for (let c = 0; c < 9; c++) if (c !== 1 && c !== 6) s.cand[r * 9 + c] &= ~bits(5);
    }
    expect(technique("xWing")(s).name).toBe("X-Wing on 5");
    expect(s.cand[2 * 9 + 1] & bits(5)).toBe(0);
    expect(s.cand[0 * 9 + 1] & bits(5)).not.toBe(0);
  });

  test("Swordfish: three rows with a number in the same three columns clear those columns", () => {
    const s = openState();
    const keep = { 0: [1, 4], 3: [4, 7], 6: [1, 7] };
    for (const [r, cols] of Object.entries(keep)) {
      for (let c = 0; c < 9; c++) if (!cols.includes(c)) s.cand[r * 9 + c] &= ~bits(5);
    }
    expect(technique("swordfish")(s).name).toBe("Swordfish on 5");
    expect(s.cand[8 * 9 + 4] & bits(5)).toBe(0);
  });

  test("XY-Wing: a cell seeing both wings can't hold their shared number", () => {
    const s = openState();
    s.cand[0] = bits(1, 2);   // pivot
    s.cand[3] = bits(1, 3);   // wing in the same row
    s.cand[27] = bits(2, 3);  // wing in the same column
    expect(technique("xyWing")(s).name).toBe("XY-Wing");
    expect(s.cand[30] & bits(3)).toBe(0);
  });
});

describe("Requirement 4: entering numbers", () => {
  test("a correct number is removed from the notes of its row, column and box", () => {
    const notes = [...Array(81)].map(() => new Set([3, 4]));
    clearNotesAround(notes, 0, 3);
    expect(notes[8].has(3)).toBe(false);   // row
    expect(notes[72].has(3)).toBe(false);  // column
    expect(notes[20].has(3)).toBe(false);  // box
    expect(notes[40].has(3)).toBe(true);   // elsewhere
    expect(notes[8].has(4)).toBe(true);    // other numbers stay
  });
});

describe("Requirement 6: hint", () => {
  const solution = solved(HARD);

  test("corrects a wrong number first", () => {
    const values = solution.slice();
    values[5] = solution[5] % 9 + 1;
    values[60] = 0;
    expect(chooseHint(values, solution, 60)).toEqual({ cell: 5, reason: "wrong" });
  });

  test("prefers the selected wrong number", () => {
    const values = solution.slice();
    values[5] = solution[5] % 9 + 1;
    values[6] = solution[6] % 9 + 1;
    expect(chooseHint(values, solution, 6).cell).toBe(6);
  });

  test("fills the selected empty cell", () => {
    const values = HARD.slice();
    expect(chooseHint(values, solution, 1)).toEqual({ cell: 1, reason: "selected" });
  });

  test("otherwise picks the cell with the fewest options", () => {
    const values = solution.slice();
    values[10] = 0;
    expect(chooseHint(values, solution, null)).toEqual({ cell: 10, reason: "only" });
    expect(chooseHint(new Array(81).fill(0), solution, null).reason).toBe("easiest");
  });
});

describe("Requirement 7: step solver", () => {
  const solution = solved(HARD);
  const emptyNotes = () => [...Array(81)].map(() => new Set());

  test("corrects a wrong number first", () => {
    const values = HARD.slice();
    values[1] = solution[1] % 9 + 1;
    const step = solverStep({ values, notes: emptyNotes(), solution });
    expect(step).toMatchObject({ label: "fix", targets: [1], filled: [1], counts: true });
    expect(values[1]).toBe(solution[1]);
  });

  test("fills in all notes first, without counting it as a hint", () => {
    const values = HARD.slice();
    const notes = emptyNotes();
    const step = solverStep({ values, notes, solution });
    expect(step).toMatchObject({ label: "notes", counts: false });
    expect([...notes[1]]).toEqual(candidates(values, 1));
  });

  test("puts back a correct number that was crossed out", () => {
    const values = HARD.slice();
    const notes = values.map((v, i) => new Set(v ? [] : candidates(values, i)));
    notes[1].delete(solution[1]);
    const step = solverStep({ values, notes, solution });
    expect(step).toMatchObject({ label: "fix", targets: [1], counts: true });
    expect(notes[1].has(solution[1])).toBe(true);
  });

  test("names the technique it applies", () => {
    const values = solution.slice();
    values[40] = 0;
    const notes = emptyNotes();
    notes[40] = new Set([solution[40]]);
    const step = solverStep({ values, notes, solution });
    expect(step).toMatchObject({ label: "naked single", filled: [40], counts: true });
    expect(values[40]).toBe(solution[40]);
  });

  test("always finishes a puzzle with only correct numbers", () => {
    const values = HARD.slice();
    const notes = emptyNotes();
    const labels = new Set();
    for (let k = 0; k < 500 && values.includes(0); k++) {
      const step = solverStep({ values, notes, solution });
      labels.add(step.label);
      values.forEach((v, i) => v && expect(v).toBe(solution[i]));
    }
    expect(values).toEqual(solution);
    // On this puzzle the techniques run out, so it also has to fall back
    expect(labels.has("no technique")).toBe(true);
  });
});
