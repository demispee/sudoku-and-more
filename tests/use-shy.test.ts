// Tests for .openspec/specs/005-shy-squares/spec.md: the page's state and actions.
// How the squares move is tested in Rust (game-core/src/shy.rs).
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import { LONGEST_FRAME, NEXT_LEVEL_DELAY, STEP, useShy, type ShyGame } from "../web/src/shy/useShy";
import { memoryStore, seedRandom } from "./helpers";
import { loadWasmForTests } from "./wasm-setup";

beforeAll(loadWasmForTests);

let frames: FrameRequestCallback[] = [];
let game: ShyGame;

beforeEach(() => {
  vi.useFakeTimers();
  seedRandom(2);
  frames = [];
  now = 0;
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => frames.push(cb));
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
});

afterEach(() => {
  game?.stop();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function started(initial: Record<string, string> = {}) {
  const store = memoryStore(initial);
  game = useShy(store);
  game.start();
  return store;
}

let now = 0;
/** One animation frame of 1/60 s */
const nextFrame = (ms = STEP) => frames.shift()!((now += ms));

/** Plays sheepdog: drives the first free square to the front of the pen, then inside */
function herd(g: ShyGame, maxFrames = 40_000) {
  for (let k = 0; k < maxFrames && !g.result.value; k++) {
    const s = g.squares.value.find(q => !q.caught);
    if (s) {
      const inFront = s.x > 520 && Math.abs(s.y - 300) < 50;
      const [tx, ty] = inFront ? [720, 300] : [560, 300];
      const d = Math.hypot(tx - s.x, ty - s.y) || 1;
      g.setCursor({ x: s.x - ((tx - s.x) / d) * 40, y: s.y - ((ty - s.y) / d) * 40 });
    }
    nextFrame();
  }
}

describe("Requirement 1 and 4: levels", () => {
  test("level 1 starts with 6 free squares and the clock at 0", () => {
    started();
    expect([game.level.value, game.count(), game.caught.value, game.time.value]).toEqual([1, 6, 0, "0:00"]);
    expect(game.squares.value.every(s => !s.caught)).toBe(true);
  });

  test("catching every square ends the level with its time, and the next one has 2 more", () => {
    const store = started();
    vi.advanceTimersByTime(4000);
    herd(game);
    expect(game.result.value).toMatchObject({ level: 1, isRecord: true });
    expect(game.caught.value).toBe(6);
    expect(Object.keys(JSON.parse(store.getItem("shyBest")!))).toEqual(["1"]);
    expect(game.bestTime(1)).toMatch(/^\d:\d\d$/);
    const frozen = JSON.stringify(game.squares.value);
    nextFrame(); // nothing moves while the result shows
    expect(JSON.stringify(game.squares.value)).toBe(frozen);
    vi.advanceTimersByTime(NEXT_LEVEL_DELAY);
    expect([game.level.value, game.count(), game.result.value]).toEqual([2, 8, null]);
  });

  test("a slower level keeps the best time", () => {
    started({ shyBest: JSON.stringify({ 1: 1 }) });
    expect(game.bestTime(1)).toBe("0:00");
    expect(game.bestTime(2)).toBe("–");
    vi.advanceTimersByTime(2000);
    herd(game);
    expect(game.result.value?.isRecord).toBe(false);
    expect(game.best.value["1"]).toBe(1);
  });

  test("restart gives the same level new squares and resets the clock", () => {
    started();
    for (let k = 0; k < 300; k++) nextFrame(); // 5 seconds
    expect(game.time.value).toBe("0:05");
    const before = JSON.stringify(game.squares.value);
    game.restart();
    expect([game.level.value, game.time.value]).toEqual([1, "0:00"]);
    expect(JSON.stringify(game.squares.value)).not.toBe(before);
  });
});

describe("Requirement 2: shy squares", () => {
  test("a square flees from the cursor, and nothing scares it once the cursor leaves", () => {
    started();
    const s = game.squares.value[0]!;
    game.setCursor({ x: s.x - 50, y: s.y });
    nextFrame();
    expect(game.squares.value[0]!.x).toBeGreaterThan(s.x);
    game.setCursor(null);
    for (let k = 0; k < 300; k++) nextFrame();
    const still = game.squares.value[0]!;
    nextFrame();
    expect(game.squares.value[0]!.x).toBeCloseTo(still.x, 2);
  });
});

describe("Requirement 2 and 4: 60 steps a second, and only visible time", () => {
  test("a 120 Hz screen takes as many steps per second as a 60 Hz one", async () => {
    const { ShyField } = await import("../web/src/wasm");
    const steps = vi.spyOn(ShyField.prototype, "step");
    started();
    nextFrame(); // the first frame
    steps.mockClear();
    for (let k = 0; k < 60; k++) nextFrame(STEP); // 1 second at 60 Hz
    const at60 = steps.mock.calls.length;
    steps.mockClear();
    for (let k = 0; k < 120; k++) nextFrame(STEP / 2); // 1 second at 120 Hz
    expect([at60, steps.mock.calls.length]).toEqual([60, 60]);
  });

  test("a long gap between frames (a hidden tab) counts as at most 250 ms", () => {
    started();
    nextFrame();
    nextFrame(60_000);
    expect(game.time.value).toBe("0:00");
    for (let k = 0; k < 4; k++) nextFrame(60_000);
    expect(game.time.value).toBe("0:01"); // 4 × 250 ms
    expect(LONGEST_FRAME).toBe(250);
  });

  test("regression: a saved level without a real time is left out", () => {
    const other = useShy(memoryStore({ shyBest: JSON.stringify({ 1: "x", 2: null, 3: 4200, 4: -5 }) }));
    expect(other.best.value).toEqual({ 3: 4200 });
    expect([other.bestTime(1), other.bestTime(3)]).toEqual(["–", "0:04"]);
    other.stop();
  });

  test("saved best times that can't be read are ignored", () => {
    for (const saved of ["{not json", "[1, 2]", "null"]) {
      const other = useShy(memoryStore({ shyBest: saved }));
      expect(other.best.value).toEqual({});
      other.stop();
    }
  });
});
