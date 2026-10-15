// Tests for .openspec/specs/008-flying-schubert/spec.md: the page's state and actions.
// How Schubert and the obstacles move is tested in Rust (game-core/src/flying.rs).
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import { RESTART_DELAY, STEP, useFlying, type FlyingGame } from "../web/src/flying/useFlying";
import { memoryStore, seedRandom } from "./helpers";
import { loadWasmForTests } from "./wasm-setup";

beforeAll(loadWasmForTests);

let frames: FrameRequestCallback[] = [];
let game: FlyingGame;
let now = 0;

/** A page that can be hidden, and remembers who listens to it */
function fakePage() {
  const listeners = new Set<() => void>();
  return {
    hidden: false,
    addEventListener: (_: string, fn: () => void) => void listeners.add(fn),
    removeEventListener: (_: string, fn: () => void) => void listeners.delete(fn),
    fire() { listeners.forEach(fn => fn()); },
    listeners,
  };
}

beforeEach(() => {
  seedRandom(4);
  frames = [];
  now = 0;
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => frames.push(cb));
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
});

afterEach(() => {
  game?.stop();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function started(initial: Record<string, string> = {}, page = fakePage()) {
  const store = memoryStore(initial);
  game = useFlying(store, page as unknown as Document);
  game.start();
  return store;
}

/** One animation frame of 1/60 s */
const nextFrame = (ms = STEP) => frames.shift()!((now += ms));

/** Flaps whenever Schubert is below the middle of the next gap and falling */
function fly(g: FlyingGame, until: () => boolean, maxFrames = 20_000) {
  for (let k = 0; k < maxFrames && !until() && !g.over.value; k++) {
    const next = g.obstacles.value.find(o => o.x + 98 > 200)!;
    if (g.y.value > next.gapTop + 105 && g.vy.value > 0) g.flap();
    nextFrame();
  }
}

/** Lets Schubert fall to the ground */
function crash(g: FlyingGame) {
  for (let k = 0; k < 600 && !g.over.value; k++) nextFrame();
}

describe("Requirement 1: the flight", () => {
  test("before the first flap Schubert floats in place, and nothing moves", () => {
    started();
    const before = [game.y.value, game.obstacles.value[0]!.x];
    for (let k = 0; k < 60; k++) nextFrame();
    expect([game.y.value, game.obstacles.value[0]!.x]).toEqual(before);
    expect(game.started.value).toBe(false);
    game.flap();
    expect(game.started.value).toBe(true);
    expect(game.vy.value).toBeLessThan(0);
  });

  test("60 steps a second, on a 60 Hz and on a 120 Hz screen", () => {
    started();
    game.flap();
    nextFrame(); // the first frame is one step
    const x = game.obstacles.value[0]!.x;
    for (let k = 0; k < 120; k++) {
      nextFrame(STEP / 2);
      if (game.vy.value > 2) game.flap();
    }
    expect(game.obstacles.value[0]!.x).toBeCloseTo(x - 60 * 3, 6);
  });

  test("a hidden page pauses the game; back again, it goes on where it was", () => {
    const page = fakePage();
    started({}, page);
    game.flap();
    nextFrame();
    const x = game.obstacles.value[0]!.x;
    page.hidden = true;
    page.fire();
    nextFrame(60_000); // a minute away: counts as one step
    expect(game.obstacles.value[0]!.x).toBe(x - 3);
    expect(game.over.value).toBe(false);
    page.hidden = false;
    page.fire();
    nextFrame();
    expect(game.obstacles.value[0]!.x).toBe(x - 6);
  });

  test("stopping frees the field and stops listening to the page", () => {
    const page = fakePage();
    started({}, page);
    expect(page.listeners.size).toBe(1);
    game.stop();
    expect(page.listeners.size).toBe(0);
    game.flap(); // no field: nothing happens
    nextFrame();
    expect(game.started.value).toBe(false);
  });
});

describe("Requirement 3: score", () => {
  test("flying past obstacles scores, and a new best is kept", () => {
    const store = started();
    game.flap();
    fly(game, () => game.score.value >= 3);
    expect(game.score.value).toBe(3);
    crash(game);
    expect([game.over.value, game.isRecord.value, game.best.value]).toEqual([true, true, 3]);
    expect(store.getItem("flyingBest")).toBe("3");
  });

  test("a lower score is no record and keeps the best", () => {
    const store = started({ flyingBest: "40" });
    expect(game.best.value).toBe(40);
    game.flap();
    crash(game);
    expect([game.isRecord.value, game.best.value, store.getItem("flyingBest")]).toEqual([false, 40, "40"]);
  });

  test.each(["", "abc", "-3", "2.5", "{}"])("a saved best of %j that can't be read is ignored", saved => {
    started({ flyingBest: saved });
    expect(game.best.value).toBe(0);
  });
});

describe("Requirement 5: start and game over", () => {
  test("a flap within half a second of the end does nothing; after it, a new game starts", () => {
    started();
    game.flap();
    crash(game);
    const y = game.y.value;
    for (let t = 0; t < RESTART_DELAY - STEP; t += STEP) nextFrame();
    game.flap();
    expect([game.over.value, game.y.value]).toEqual([true, y]);
    nextFrame();
    nextFrame();
    game.flap();
    expect([game.over.value, game.started.value, game.score.value, game.isRecord.value]).toEqual([false, true, 0, false]);
    expect(game.vy.value).toBeLessThan(0);
  });
});

describe("Requirement 7: landscapes", () => {
  test("the meadow first; the chosen one is kept, and a wrong saved name is ignored", () => {
    let store = started();
    expect([game.chosen.value, game.landscape.value]).toEqual([0, 0]);
    game.nextLandscape();
    expect([game.chosen.value, game.landscape.value, store.getItem("flyingLandscape")]).toEqual([1, 1, "mountains"]);
    game.nextLandscape();
    game.nextLandscape();
    game.nextLandscape(); // after the data centre the meadow again
    expect([game.chosen.value, store.getItem("flyingLandscape")]).toEqual([0, "meadow"]);
    game.stop();
    store = started({ flyingLandscape: "city" });
    expect([game.chosen.value, game.landscape.value]).toEqual([2, 2]);
    game.stop();
    started({ flyingLandscape: "moon" });
    expect(game.chosen.value).toBe(0);
  });

  test("every 20 points the next landscape; a new game starts in the chosen one", () => {
    started({ flyingLandscape: "datacentre" });
    game.flap();
    fly(game, () => game.score.value >= 19);
    expect([game.score.value, game.landscape.value]).toEqual([19, 3]);
    fly(game, () => game.score.value >= 20);
    expect([game.score.value, game.landscape.value]).toEqual([20, 0]);
    crash(game);
    for (let t = 0; t <= RESTART_DELAY; t += STEP) nextFrame();
    game.flap();
    expect(game.landscape.value).toBe(3);
  });

  test("the switch without a game in flight only changes the choice", () => {
    started();
    game.stop();
    game.nextLandscape();
    expect([game.chosen.value, game.landscape.value]).toEqual([1, 0]);
  });
});
