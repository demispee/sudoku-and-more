// Tests for .openspec/specs/006-reverse-snake/spec.md: the page's state and actions.
// The snake itself is tested in Rust (game-core/src/snake.rs).
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import { DOWN, LEFT, RIGHT, UP, useSnake, type SnakeGame } from "../web/src/snake/useSnake";
import { memoryStore } from "./helpers";
import { loadWasmForTests } from "./wasm-setup";

beforeAll(loadWasmForTests);

let frames: FrameRequestCallback[] = [];
let now = 0;
let game: SnakeGame;

beforeEach(() => {
  frames = [];
  now = 0;
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => frames.push(cb));
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
});

afterEach(() => {
  game?.stop();
  vi.unstubAllGlobals();
});

function started(initial: Record<string, string> = {}) {
  const store = memoryStore(initial);
  game = useSnake(store);
  game.start();
  return store;
}

/** Lets `ms` pass in animation frames of 50 ms */
function play(ms: number) {
  for (let t = 0; t < ms; t += 50) {
    now += 50;
    frames.shift()!(now);
  }
}

describe("Requirement 1 and 2: the grid and the apple", () => {
  test("the apple starts in the middle and moves one cell per tick", () => {
    started();
    expect([game.apple.value, game.snake.value.length, game.time.value]).toEqual([{ x: 10, y: 10 }, 3, "0:00"]);
    game.steer(RIGHT);
    game.steer(DOWN); // waits for the next tick
    expect(game.apple.value).toEqual({ x: 11, y: 10 });
    play(250);
    expect(game.apple.value).toEqual({ x: 11, y: 11 });
    game.steer(LEFT);
    game.steer(UP);
  });
});

describe("Requirement 3 and 4: the snake, and the end", () => {
  test("a still apple is eaten; the time is the best, and again starts over", () => {
    const store = started();
    play(30_000);
    expect(game.result.value).toMatchObject({ status: "eaten", isRecord: true });
    expect(Number(store.getItem("snakeBest"))).toBeGreaterThan(0);
    const frozen = game.time.value;
    play(1000);
    expect(game.time.value).toBe(frozen);
    game.steer(RIGHT); // nothing moves after the end
    game.togglePause();
    expect(game.paused.value).toBe(false);
    game.again();
    expect([game.result.value, game.time.value, game.snake.value.length]).toEqual([null, "0:00", 3]);
  });

  test("a shorter game keeps the best", () => {
    started({ snakeBest: "999999" });
    play(30_000);
    expect(game.result.value?.isRecord).toBe(false);
    expect(game.best.value).toBe(999_999);
  });

  test("the snake grows while time passes", () => {
    started();
    for (let k = 0; k < 40; k++) {
      // run away from the head, along the bottom and back
      const head = game.snake.value[0]!;
      game.steer(head.x < game.apple.value.x ? RIGHT : LEFT);
      game.steer(head.y < game.apple.value.y ? DOWN : UP);
      play(100);
    }
    expect(game.snake.value.length).toBeGreaterThan(3);
  });
});

describe("Requirement 5: pause", () => {
  test("space pauses: time stands still and the apple can't move", () => {
    started();
    play(400);
    game.togglePause();
    const t = game.time.value;
    const snake = JSON.stringify(game.snake.value);
    play(5000);
    game.steer(RIGHT);
    expect([game.time.value, JSON.stringify(game.snake.value), game.apple.value]).toEqual([t, snake, { x: 10, y: 10 }]);
    game.togglePause();
    play(400);
    expect(JSON.stringify(game.snake.value)).not.toBe(snake);
  });

  test("a long gap between frames counts as at most 250 ms", () => {
    started();
    frames.shift()!(0);
    frames.shift()!(60_000);
    expect(game.time.value).toBe("0:00");
  });
});
