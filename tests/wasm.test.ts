// Tests for the bridge between the pages and game-core (WebAssembly, ADR-0006).
// The rules themselves are tested in Rust (game-core/src/*.rs); these tests check that the
// compiled module loads and that values cross the bridge correctly.
import { beforeAll, describe, expect, test } from "vitest";
import {
  Mastermind, Ministry, ReverseSnake, SceneOrder, ShyField, World, ballColors, formsPerDay, mastermindShape, shyShapes, snakeGridSize, clearNotesAround, findHit, generate, hintPenalty, hitsFound, isPeer,
  missPenalty, pickDifferences, recordKey, solverStep, totalTime,
} from "../web/src/wasm";
import { loadWasmForTests } from "./wasm-setup";

beforeAll(loadWasmForTests);

describe("sudoku through WebAssembly", () => {
  // generate() gives undefined when an attempt finds no puzzle; with these seeds it always does
  const puzzleFor = (level: number, seed: number) => {
    const found = generate(level, seed);
    if (!found) throw new Error(`no puzzle for seed ${seed}`);
    return found;
  };

  test("generates a puzzle with its solution", () => {
    const found = puzzleFor(4, 123);
    const puzzle = Array.from(found.puzzle);
    const solution = Array.from(found.solution);
    expect(puzzle).toHaveLength(81);
    expect(solution.every(v => v >= 1 && v <= 9)).toBe(true);
    puzzle.forEach((v, i) => v && expect(v).toBe(solution[i]));
    expect(found.level).toBeGreaterThanOrEqual(1);
    found.free();
  });

  test("takes and returns typed arrays", () => {
    const { puzzle, solution } = puzzleFor(1, 7);
    const step = solverStep(puzzle, new Uint16Array(81), solution, -1);
    expect(step.counts).toBe(true);
    expect(step.notes).toBeInstanceOf(Uint16Array);
    expect(step.values).toBeInstanceOf(Uint8Array);
    expect(step.filled).toHaveLength(1);
    expect(step.targets).toEqual(step.filled);
    expect(typeof step.text).toBe("string");
    step.free();
  });

  test("peers and notes", () => {
    expect(isPeer(0, 8)).toBe(true);
    expect(isPeer(0, 40)).toBe(false);
    const notes = clearNotesAround(new Uint16Array(81).fill(1 << 3), 0, 3);
    expect([notes[1], notes[40]]).toEqual([0, 1 << 3]);
  });
});

describe("spot the difference through WebAssembly", () => {
  test("gives every scene once before any repeats", () => {
    const order = new SceneOrder(5, 42);
    const first = [0, 1, 2, 3, 4].map(() => order.next());
    expect([...first].sort()).toEqual([0, 1, 2, 3, 4]);
    order.free();
  });

  test("finds a click by index, with parallel lists of circles", () => {
    const [xs, ys, rs] = [new Float64Array([100, 150]), new Float64Array([100, 100]), new Float64Array([20, 20])];
    const none = new Uint8Array([0, 0]);
    expect(findHit(xs, ys, rs, none, 130, 100)).toBe(1);
    expect(findHit(xs, ys, rs, none, 400, 400)).toBe(-1);
    expect(hitsFound(xs, ys, rs, new Uint8Array([1, 0]), 100, 100)).toBe(true);
    expect(Array.from(pickDifferences(12, 7, 3))).toHaveLength(7);
    expect(totalTime(20000, 2, 1)).toBe(40000);
    expect([missPenalty(), hintPenalty()]).toEqual([5000, 10000]);
    expect(recordKey("The Swan", 7)).toBe("The Swan|7");
  });
});

describe("bouncing balls through WebAssembly", () => {
  test("adds, moves and clears balls", () => {
    const world = new World(1);
    for (let i = 0; i < 20; i++) world.addRandom(800, 600);
    world.add(300, 200);
    expect(world.count).toBe(21);
    world.step(800, 600, true);
    const balls = world.balls();
    expect(balls).toHaveLength(21 * 4);
    expect(balls[2]).toBeGreaterThanOrEqual(12);  // radius
    world.clear();
    expect(world.count).toBe(0);
    expect(ballColors()).toHaveLength(8);
    world.free();
  });
});

describe("the Ministry of Odd Forms through WebAssembly", () => {
  test("gives the form as strings and the rulebook as a list, and stamps", () => {
    const game = new Ministry(3);
    expect([typeof game.name, typeof game.species, typeof game.hat, typeof game.number]).toEqual(["string", "string", "boolean", "number"]);
    expect(game.rules()).toHaveLength(1);
    const stamp = game.stamp(game.rightStamp())!;
    expect([stamp.right, game.stamped, game.today]).toEqual([true, 1, 1]);
    expect(stamp.rule).toBeLessThanOrEqual(1);
    stamp.free();
    expect(formsPerDay()).toBe(10);
    game.free();
  });
});

describe("shy squares through WebAssembly", () => {
  test("gives the squares as x, y and caught, and the pen's shape", () => {
    const field = new ShyField(2, 5);
    expect([field.count, field.caught, field.done]).toEqual([8, 0, false]);
    const squares = field.squares();
    expect(squares).toBeInstanceOf(Float64Array);
    expect(squares).toHaveLength(24);
    field.step(squares[0]! - 30, squares[1]!, true);
    expect(field.squares()[0]).toBeGreaterThan(squares[0]!);
    expect(Array.from(shyShapes())).toEqual([620, 200, 780, 400, 6, 12]);
    field.free();
  });
});

describe("reverse snake through WebAssembly", () => {
  test("gives the snake as x, y bytes, the apple, the status and the time", () => {
    const game = new ReverseSnake();
    expect(Array.from(game.snake())).toEqual([2, 0, 1, 0, 0, 0]);
    expect([game.appleX, game.appleY, game.status, snakeGridSize()]).toEqual([10, 10, "playing", 20]);
    game.steer(2);
    game.update(200);
    expect([game.appleY, game.elapsed]).toEqual([11, 200]);
    game.free();
  });
});

describe("mastermind through WebAssembly", () => {
  test("checks a row of colours, and shows the code only at the end", () => {
    const game = new Mastermind(5);
    expect(Array.from(mastermindShape())).toEqual([4, 6, 10]);
    expect([game.status, game.code().length, game.check(Uint8Array.from([0, 1])).length]).toEqual(["playing", 0, 0]);
    const answer = Array.from(game.check(Uint8Array.from([0, 1, 2, 3])));
    expect(answer).toHaveLength(2);
    expect(answer[0]! + answer[1]!).toBeLessThanOrEqual(4);
    game.free();
  });
});
