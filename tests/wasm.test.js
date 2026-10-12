// Tests for the bridge between the pages and game-core (WebAssembly, ADR-0006).
// The rules themselves are tested in Rust (game-core/src/*.rs); these tests check that the
// compiled module loads and that values cross the bridge correctly.
import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, test } from "vitest";
import init, { clearNotesAround, generate, hint, isPeer, solverStep } from "../game-core/pkg/game_core.js";

beforeAll(async () => {
  const wasm = readFileSync(new URL("../game-core/pkg/game_core_bg.wasm", import.meta.url));
  await init({ module_or_path: wasm });
});

describe("sudoku through WebAssembly", () => {
  test("generates a puzzle with its solution", () => {
    const found = generate(4, 123);
    const puzzle = Array.from(found.puzzle);
    const solution = Array.from(found.solution);
    expect(puzzle).toHaveLength(81);
    expect(solution.every(v => v >= 1 && v <= 9)).toBe(true);
    puzzle.forEach((v, i) => v && expect(v).toBe(solution[i]));
    expect(found.level).toBeGreaterThanOrEqual(1);
    found.free();
  });

  test("accepts plain arrays and returns typed arrays", () => {
    const { puzzle, solution } = generate(1, 7);
    const values = Array.from(puzzle);
    const first = solverStep(values, new Array(81).fill(0), Array.from(solution));
    expect(first.label).toBe("notes");
    expect(first.counts).toBe(false);
    expect(first.notes).toBeInstanceOf(Uint16Array);

    const second = solverStep(Array.from(first.values), Array.from(first.notes), Array.from(solution));
    expect(second.counts).toBe(true);
    expect(second.targets.length).toBeGreaterThan(0);
    expect(typeof second.text).toBe("string");
  });

  test("hint takes -1 for no selected cell", () => {
    const { puzzle, solution } = generate(1, 9);
    const found = hint(Array.from(puzzle), Array.from(solution), -1);
    expect(["only", "easiest"]).toContain(found.reason);
    expect(puzzle[found.cell]).toBe(0);
  });

  test("peers and notes", () => {
    expect(isPeer(0, 8)).toBe(true);
    expect(isPeer(0, 40)).toBe(false);
    const notes = clearNotesAround(new Array(81).fill(1 << 3), 0, 3);
    expect([notes[1], notes[40]]).toEqual([0, 1 << 3]);
  });
});
