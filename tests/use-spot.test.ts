// Tests for .openspec/specs/002-spot-the-difference/spec.md: the page's state and actions.
// The rules themselves are tested in Rust (game-core/src/spot.rs).
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import { HINT_MARK_TIME, MISS_MARK_TIME, NEXT_ROUND_DELAY, useSpot, type Spot } from "../web/src/spot/useSpot";
import { memoryStore, seedRandom } from "./helpers";
import { loadWasmForTests } from "./wasm-setup";

beforeAll(loadWasmForTests);
beforeEach(() => {
  vi.useFakeTimers();
  seedRandom(3);
});

let game: Spot;
afterEach(() => {
  game?.stop();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

function started(initial: Record<string, string> = {}) {
  const store = memoryStore(initial);
  game = useSpot(store);
  game.start();
  return store;
}

/** A spot where nothing differs: far from every difference of the round */
function emptySpot(): [number, number] {
  for (let x = 5; x < 800; x += 10) {
    for (let y = 5; y < 600; y += 10) {
      if (game.active.value.every(d => Math.hypot(d.x - x, d.y - y) > d.r + 30)) return [x, y];
    }
  }
  throw new Error("no empty spot");
}

function findAll() {
  for (const d of [...game.active.value]) game.click(0, d.x, d.y);
}

describe("Requirement 1 and 3: scenes and rounds", () => {
  test("a round shows one scene, with the chosen number of differences in one picture", () => {
    started({ spotCount: "5" });
    expect(game.scene.value).not.toBeNull();
    expect(game.active.value).toHaveLength(5);
    const [left, right] = game.pictures.value;
    expect(left).not.toBe(right);
    const plain = game.scene.value!.draw(() => false);
    expect(game.changedSide.value === 0 ? right : left).toBe(plain);
  });

  test("starts with 7 differences when nothing is saved", () => {
    started();
    expect([game.count.value, game.active.value.length]).toEqual([7, 7]);
  });

  test("changing the number saves it and restarts with the same scene", () => {
    const store = started();
    const scene = game.scene.value;
    game.setCount(10);
    expect([store.getItem("spotCount"), game.active.value.length, game.scene.value]).toEqual(["10", 10, scene]);
  });
});

describe("Requirement 2: scene order", () => {
  test("next gives all five scenes before any repeats", () => {
    started();
    const names = [game.scene.value!.name];
    for (let k = 0; k < 4; k++) {
      game.newRound();
      names.push(game.scene.value!.name);
    }
    expect(new Set(names).size).toBe(5);
  });
});

describe("Requirement 4: clicking", () => {
  test("a click on a difference finds it, in either picture, and marks both", () => {
    started();
    const [a, b] = game.active.value;
    game.click(0, a!.x, a!.y);
    game.click(1, b!.x, b!.y);
    expect(game.found.value.size).toBe(2);
    expect(game.marks.value.filter(m => m.kind === "found" && m.side === undefined)).toHaveLength(2);
    expect(game.message.value).toBe("Found one.");
  });

  test("clicking a found difference again is not a miss", () => {
    started();
    const d = game.active.value[0]!;
    game.click(0, d.x, d.y);
    game.click(1, d.x, d.y);
    expect([game.found.value.size, game.misses.value]).toEqual([1, 0]);
  });

  test("any other click is a miss, marked on that picture for a moment", () => {
    started();
    game.click(1, ...emptySpot());
    expect(game.misses.value).toBe(1);
    expect(game.message.value).toBe("No difference there. That costs 5 seconds.");
    expect(game.marks.value).toEqual([expect.objectContaining({ kind: "miss", side: 1 })]);
    vi.advanceTimersByTime(MISS_MARK_TIME);
    expect(game.marks.value).toEqual([]);
  });
});

describe("Requirement 5: time and penalties", () => {
  test("the time adds 5 seconds per miss and 10 per hint, at once", () => {
    started();
    vi.advanceTimersByTime(3000);
    expect(game.time.value).toBe("0:03");
    game.click(0, ...emptySpot());
    expect(game.time.value).toBe("0:08");
    game.hint();
    expect(game.time.value).toBe("0:18");
  });
});

describe("Requirement 6: hint", () => {
  test("circles a difference that is not found yet, for 2.5 seconds", () => {
    started();
    game.hint();
    const [mark] = game.marks.value;
    expect(mark?.kind).toBe("hint");
    expect(game.active.value.some(d => d.x === mark!.x && d.y === mark!.y)).toBe(true);
    expect(game.hints.value).toBe(1);
    expect(game.message.value).toMatch(/orange circle/);
    vi.advanceTimersByTime(HINT_MARK_TIME);
    expect(game.marks.value).toEqual([]);
  });

  test("never points at a difference that was found", () => {
    started({ spotCount: "5" });
    const [first, ...rest] = game.active.value;
    for (const d of rest) game.click(0, d.x, d.y);
    game.hint();
    expect(game.marks.value.at(-1)).toMatchObject({ kind: "hint", x: first!.x, y: first!.y });
  });
});

describe("Requirement 7: show solution", () => {
  test("circles the rest, locks the round, and doesn't count it", () => {
    const store = started();
    game.click(0, game.active.value[0]!.x, game.active.value[0]!.y);
    game.reveal();
    expect(game.marks.value.filter(m => m.kind === "revealed")).toHaveLength(6);
    expect(game.message.value).toBe("Here are the last 6. Press next for a new picture.");
    expect(game.locked.value).toBe(true);
    game.click(0, game.active.value[1]!.x, game.active.value[1]!.y);
    game.hint();
    game.reveal();
    expect(game.found.value.size).toBe(1);
    expect([game.solvedCount.value, store.getItem("spotSolved")]).toEqual([0, null]);
  });
});

describe("Requirement 8: finishing a round", () => {
  test("shows the result, saves the record and solved count, and starts the next scene", () => {
    const store = started();
    vi.advanceTimersByTime(20_000);
    game.click(0, ...emptySpot());
    findAll();
    expect(game.result.value).toEqual({ isRecord: true, time: "0:25", count: 7, misses: 1, hints: 0, previous: null });
    expect(game.record.value).toBe("0:25");
    expect(store.getItem("spotSolved")).toBe("1");
    expect(JSON.parse(store.getItem("spotRecords")!)).toEqual({ [`${game.scene.value!.name}|7`]: 25_000 });

    const scene = game.scene.value;
    vi.advanceTimersByTime(NEXT_ROUND_DELAY);
    expect(game.result.value).toBeNull();
    expect(game.scene.value).not.toBe(scene);
  });

  test("a slower round keeps the old record and says what it was", () => {
    seedRandom(3);
    started();
    const name = game.scene.value!.name;
    const records = JSON.stringify({ [`${name}|7`]: 1000 });
    game.stop();
    seedRandom(3);
    started({ spotRecords: records });
    expect(game.record.value).toBe("0:01");
    vi.advanceTimersByTime(4000);
    findAll();
    expect(game.result.value).toMatchObject({ isRecord: false, time: "0:04", previous: "0:01" });
  });

  test("the record is per scene and number of differences", () => {
    started();
    expect(game.record.value).toBe("–");
  });
});
