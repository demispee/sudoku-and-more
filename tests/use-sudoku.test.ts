// Tests for .openspec/specs/001-sudoku/spec.md: the page's state and actions. The rules
// themselves are tested in Rust (game-core/src/sudoku.rs).
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import {
  AUTO_SOLVE_INTERVAL, NEXT_PUZZLE_DELAY, digitsOf, formatTime, useSudoku, type Sudoku,
} from "../web/src/sudoku/useSudoku";
import { memoryStore, runUntil, seedRandom } from "./helpers";
import { loadWasmForTests } from "./wasm-setup";

beforeAll(loadWasmForTests);
beforeEach(() => {
  vi.useFakeTimers();
  seedRandom(1);
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

let game: Sudoku;
afterEach(() => game?.stop());

/** A game at `level` with its first puzzle on the board */
function started(level = 1, extra: Record<string, string> = {}) {
  const store = memoryStore({ sudokuLevel: String(level), ...extra });
  game = useSudoku(store);
  game.start();
  runUntil(() => !game.locked.value);
  return store;
}

const emptyCells = () => game.values.value.flatMap((v, i) => (v ? [] : [i]));
const wrongDigit = (i: number) => (game.solution.value[i]! % 9) + 1;

function solveByHand() {
  for (const i of emptyCells()) {
    game.select(i);
    game.enter(game.solution.value[i]!);
  }
}

describe("helpers", () => {
  test("formats time as m:ss", () => {
    expect([formatTime(0), formatTime(65_400), formatTime(600_000)]).toEqual(["0:00", "1:05", "10:00"]);
  });

  test("reads the digits in a notes bitmask", () => {
    expect(digitsOf((1 << 2) | (1 << 9))).toEqual([2, 9]);
  });
});

describe("Requirement 2: difficulty levels", () => {
  test("generates a puzzle of the chosen level and shows its level", () => {
    started(4);
    expect(game.level.value).toBe(4);
    game.puzzle.value.forEach((v, i) => v && expect(v).toBe(game.solution.value[i]));
  });

  test("changing the level saves it and starts a new puzzle", () => {
    const store = started(1);
    game.setLevel(2);
    expect(store.getItem("sudokuLevel")).toBe("2");
    runUntil(() => !game.locked.value && game.level.value === 2);
    expect(game.chosenLevel.value).toBe(2);
  });
});

describe("Requirement 3: responsive generation", () => {
  test("shows a loader while the first puzzle is built", () => {
    game = useSudoku(memoryStore({ sudokuLevel: "1" }));
    game.start();
    expect(game.overlay.value).toEqual({ kind: "loading", level: 1 });
    expect(game.locked.value).toBe(true);
    runUntil(() => !game.locked.value);
    expect(game.overlay.value).toBeNull();
  });

  test("prepares the next puzzle in the background, so it appears at once", () => {
    started(1);
    vi.advanceTimersByTime(1000); // the next puzzle is ready by now
    game.newGame();
    expect(game.locked.value).toBe(false);
    expect(game.overlay.value).toBeNull();
  });
});

describe("Requirement 4: entering numbers", () => {
  beforeEach(() => void started(1));

  test("fills in a number, shows a wrong one, and clears it when entered again", () => {
    const i = emptyCells()[0]!;
    game.select(i);
    game.enter(wrongDigit(i));
    expect(game.values.value[i]).toBe(wrongDigit(i));
    expect(game.values.value[i]).not.toBe(game.solution.value[i]);
    game.enter(wrongDigit(i));
    expect(game.values.value[i]).toBe(0);
  });

  test("does nothing on a given number or without a selected cell", () => {
    const given = game.puzzle.value.findIndex(v => v !== 0);
    game.enter(5);
    game.select(given);
    game.enter(game.puzzle.value[given] === 1 ? 2 : 1);
    game.erase();
    expect(game.values.value[given]).toBe(game.puzzle.value[given]);
  });

  test("erases the selected cell", () => {
    const i = emptyCells()[0]!;
    game.select(i);
    game.enter(wrongDigit(i));
    game.erase();
    expect(game.values.value[i]).toBe(0);
  });

  test("a correct number clears that note from its row, column and box", () => {
    game.step(); // fills in all notes
    const i = emptyCells()[0]!;
    const n = game.solution.value[i]!;
    const peer = emptyCells().find(j => j !== i && Math.floor(j / 9) === Math.floor(i / 9) && game.notes.value[j]! & (1 << n));
    game.select(i);
    game.enter(n);
    if (peer !== undefined) expect(game.notes.value[peer]! & (1 << n)).toBe(0);
    expect(game.notes.value[i]).toBe(0);
  });

  test("arrow keys move the selection within the board", () => {
    game.move("ArrowDown"); // nothing selected: start top left
    expect(game.selected.value).toBe(0);
    game.move("ArrowLeft"); // already at the left edge
    game.move("ArrowUp"); // already at the top
    expect(game.selected.value).toBe(0);
    game.move("ArrowRight");
    game.move("ArrowDown");
    expect(game.selected.value).toBe(10);
    game.select(8);
    game.move("ArrowRight"); // doesn't wrap to the next row
    expect(game.selected.value).toBe(8);
    game.move("Enter"); // not an arrow
    expect(game.selected.value).toBe(8);
  });
});

describe("Requirement 5: notes", () => {
  test("in notes mode a number toggles a note instead of filling the cell", () => {
    started(1);
    const i = emptyCells()[0]!;
    game.toggleNotes();
    game.select(i);
    game.enter(3);
    expect([game.values.value[i], digitsOf(game.notes.value[i]!)]).toEqual([0, [3]]);
    game.enter(3);
    expect(game.notes.value[i]).toBe(0);
    game.toggleNotes();
    expect(game.notesMode.value).toBe(false);
  });
});

describe("Requirement 7: step solver", () => {
  test("fills in one correct number with an explanation, without adding notes", () => {
    started(1);
    game.step();
    const [i] = game.targets.value;
    expect(game.values.value[i!]).toBe(game.solution.value[i!]);
    expect(game.message.value?.label).toMatch(/^step \\ /);
    expect(game.message.value?.text).not.toBe("");
    expect(game.hints.value).toBe(1);
    expect(game.hinted.value.has(i!)).toBe(true);
    expect(game.flash.value.cell).toBe(i);
    expect(game.notes.value.every(m => m === 0)).toBe(true);
    expect(game.selected.value).toBeNull();
  });

  test("corrects a wrong number first", () => {
    started(1);
    const i = emptyCells()[0]!;
    game.select(i);
    game.enter(wrongDigit(i));
    game.step();
    expect(game.values.value[i]).toBe(game.solution.value[i]);
    expect(game.message.value?.text).toMatch(/^This cell was wrong/);
  });

  test("crosses out the notes the techniques ruled out, and never adds any", () => {
    started(6); // needs more than singles
    for (const i of emptyCells()) game.notes.value[i] = 0b11_1111_1110; // every number noted
    let crossedOut = false;
    for (let k = 0; k < 81 && !game.locked.value; k++) {
      const before = [...game.notes.value];
      game.step();
      expect(game.notes.value.every((m, j) => (m & ~before[j]!) === 0)).toBe(true);
      crossedOut ||= game.removed.value.some(m => m !== 0);
    }
    expect(crossedOut).toBe(true);
  });
});

describe("Requirement 8: auto-solve", () => {
  test("steps every 700 ms until solved, without counting it as solved", () => {
    const store = started(1);
    game.toggleAutoSolve();
    expect(game.autoSolving.value).toBe(true);
    runUntil(() => game.locked.value, 600_000, AUTO_SOLVE_INTERVAL);
    expect(game.values.value).toEqual(game.solution.value);
    expect(game.message.value?.label).toBe("solver \\ done");
    expect(game.autoSolving.value).toBe(false);
    expect(game.solvedCount.value).toBe(0);
    expect(store.getItem("sudokuSolved")).toBeNull();
  });

  test("stops when pressed again or when the player enters a number", () => {
    started(1);
    game.toggleAutoSolve();
    game.toggleAutoSolve();
    expect(game.autoSolving.value).toBe(false);
    game.toggleAutoSolve();
    const i = emptyCells()[0]!;
    game.select(i);
    game.enter(game.solution.value[i]!);
    expect(game.autoSolving.value).toBe(false);
  });

  test("regression: any input stops it, also when nothing is selected", () => {
    started(1);
    const inputs = [
      () => game.enter(5), () => game.erase(), () => game.select(0), () => game.move("ArrowRight"),
      () => game.toggleNotes(),
    ];
    for (const input of inputs) {
      game.toggleAutoSolve();
      vi.advanceTimersByTime(AUTO_SOLVE_INTERVAL); // each step clears the selection
      expect(game.selected.value).toBeNull();
      input();
      expect(game.autoSolving.value).toBe(false);
      game.selected.value = null;
    }
  });
});

describe("Requirement 9: solving a puzzle", () => {
  test("locks the board, shows the result, counts it and starts the next puzzle", () => {
    const store = started(1, { sudokuSolved: "3" });
    vi.advanceTimersByTime(5000);
    solveByHand();
    expect(game.locked.value).toBe(true);
    expect(game.overlay.value).toMatchObject({ kind: "solved", time: "0:05", level: 1, hints: 0 });
    expect([game.solvedCount.value, store.getItem("sudokuSolved")]).toEqual([4, "4"]);

    const first = game.puzzle.value;
    vi.advanceTimersByTime(NEXT_PUZZLE_DELAY);
    runUntil(() => !game.locked.value);
    expect(game.overlay.value).toBeNull();
    expect(game.puzzle.value).not.toEqual(first);
  });

  test("the clock runs while playing and the board ignores input while locked", () => {
    started(1);
    vi.advanceTimersByTime(2300); // the clock updates every 250 ms
    expect(game.time.value).toBe("0:02");
    solveByHand();
    const before = [...game.values.value];
    game.step();
    game.toggleAutoSolve();
    game.select(0);
    game.move("ArrowRight");
    expect(game.values.value).toEqual(before);
    expect(game.autoSolving.value).toBe(false);
  });

  test("skip starts a new puzzle at any time", () => {
    started(1);
    const first = game.puzzle.value;
    game.newGame();
    runUntil(() => !game.locked.value);
    expect(game.puzzle.value).not.toEqual(first);
  });
});

describe("Requirement 10: remembered between visits", () => {
  test("starts at level 5 with nothing saved", () => {
    game = useSudoku(memoryStore());
    expect([game.chosenLevel.value, game.solvedCount.value]).toEqual([5, 0]);
  });

  test("uses the saved level and solved count", () => {
    game = useSudoku(memoryStore({ sudokuLevel: "8", sudokuSolved: "3" }));
    expect([game.chosenLevel.value, game.solvedCount.value]).toEqual([8, 3]);
  });

  test("stop() cancels the generator, so nothing starts afterwards", () => {
    game = useSudoku(memoryStore({ sudokuLevel: "1" }));
    game.start();
    game.stop();
    vi.advanceTimersByTime(10_000);
    expect(game.locked.value).toBe(true);
  });
});
