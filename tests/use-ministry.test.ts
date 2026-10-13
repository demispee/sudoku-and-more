// Tests for .openspec/specs/004-ministry-of-odd-forms/spec.md: the page's state and actions.
// The rules themselves are tested in Rust (game-core/src/ministry.rs).
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import { STAMP_TIME, useMinistry, type MinistryGame } from "../web/src/ministry/useMinistry";
import { memoryStore, seedRandom } from "./helpers";
import { loadWasmForTests } from "./wasm-setup";

beforeAll(loadWasmForTests);
beforeEach(() => {
  vi.useFakeTimers();
  seedRandom(5);
});

let game: MinistryGame;
afterEach(() => {
  game?.stop();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

function started(initial: Record<string, string> = {}) {
  const store = memoryStore(initial);
  game = useMinistry(store);
  game.start();
  return store;
}

/** Stamps the form on the desk right (or wrong) and waits for the next one */
function stamp(right = true) {
  const answer = game.rightStamp();
  game.stamp(right ? answer : !answer);
  vi.advanceTimersByTime(STAMP_TIME);
}

describe("Requirement 1 and 2: forms and the rulebook", () => {
  test("starts on day 1 with one rule and a filled-in form", () => {
    started();
    expect([game.day.value, game.rules.value.length]).toEqual([1, 1]);
    const f = game.form.value;
    expect(f.name).not.toBe("");
    expect(["penguin", "goose", "cat", "badger", "octopus", "llama", "snail", "owl"]).toContain(f.species);
    expect(f.number).toBeGreaterThanOrEqual(1);
  });
});

describe("Requirement 3: stamping", () => {
  test("a right stamp shows on the form, counts, and then the next form comes", () => {
    started();
    const answer = game.rightStamp();
    game.stamp(answer);
    expect(game.stampMark.value).toBe(answer ? "approved" : "rejected");
    game.stamp(!answer); // ignored while the stamp is still on the form
    vi.advanceTimersByTime(STAMP_TIME);
    expect([game.stampMark.value, game.stamped.value, game.today.value, game.strikes.value]).toEqual([null, 1, 1, 0]);
    expect(game.message.value).toBe("");
  });

  test("a wrong stamp is a strike, and the message names the rule or says none applies", () => {
    started();
    stamp(false);
    expect(game.strikes.value).toBe(1);
    expect(game.message.value).toMatch(/^(Rule 1 says: .+|No rule applies, so the form is approved\.)$/);
  });
});

describe("Requirement 4: days", () => {
  test("after 10 forms a memo shows the new rule, and next day closes it", () => {
    started();
    for (let k = 0; k < game.FORMS_PER_DAY; k++) stamp();
    expect(game.memo.value).toBe(game.rules.value.at(-1));
    expect([game.day.value, game.today.value, game.rules.value.length]).toEqual([2, 0, 2]);
    const before = game.stamped.value;
    game.stamp(true); // the memo is in the way
    expect(game.stamped.value).toBe(before);
    game.nextDay();
    expect(game.memo.value).toBeNull();
  });
});

describe("Requirement 5 and 6: fired, and the best result", () => {
  test("three strikes and you're fired; the best result is saved, and reapply starts over", () => {
    const store = started();
    stamp();
    for (let k = 0; k < 3; k++) stamp(false);
    expect(game.fired.value).toBe(true);
    expect(game.best.value).toEqual({ days: 1, forms: 1 });
    expect(JSON.parse(store.getItem("ministryBest")!)).toEqual({ days: 1, forms: 1 });
    game.stamp(true);
    expect(game.today.value).toBe(4);
    game.reapply();
    expect([game.fired.value, game.strikes.value, game.stamped.value, game.message.value]).toEqual([false, 0, 0, ""]);
  });

  test("a worse result keeps the best, and reapply only works once fired", () => {
    started({ ministryBest: JSON.stringify({ days: 3, forms: 25 }) });
    game.reapply();
    expect(game.strikes.value).toBe(0);
    for (let k = 0; k < 3; k++) stamp(false);
    expect(game.best.value).toEqual({ days: 3, forms: 25 });
  });

  test("the same number of days with more forms is a new best", () => {
    started({ ministryBest: JSON.stringify({ days: 1, forms: 0 }) });
    stamp();
    for (let k = 0; k < 3; k++) stamp(false);
    expect(game.best.value).toEqual({ days: 1, forms: 1 });
  });
});
