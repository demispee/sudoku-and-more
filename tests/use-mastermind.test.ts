// Tests for .openspec/specs/007-mastermind/spec.md: the page's state and actions.
// The code and the answer pegs are tested in Rust (game-core/src/mastermind.rs).
import { afterEach, beforeAll, describe, expect, test } from "vitest";
import { useMastermind, type MastermindGame } from "../web/src/mastermind/useMastermind";
import { Mastermind } from "../web/src/wasm";
import { memoryStore } from "./helpers";
import { loadWasmForTests } from "./wasm-setup";

beforeAll(loadWasmForTests);

const SEED = 11;
let game: MastermindGame;

afterEach(() => game?.stop());

/** The code for SEED: a lost game shows it */
function secret() {
  const probe = new Mastermind(SEED);
  while (probe.status === "playing") probe.check(Uint8Array.from([0, 0, 0, 0]));
  const code = Array.from(probe.code());
  probe.free();
  return code;
}

function started(initial: Record<string, string> = {}) {
  const store = memoryStore(initial);
  game = useMastermind(store, () => SEED);
  return store;
}

/** Types a row with the keys 1–6 and checks it */
function play(colours: number[]) {
  colours.forEach(c => game.typeColour(c));
  game.check();
}

const wrong = () => secret().map(c => (c + 1) % 6);

describe("Requirement 2: placing pegs", () => {
  test("a chosen colour goes in a clicked hole; a filled hole is emptied again", () => {
    started();
    expect(game.rows.value).toHaveLength(10);
    game.pick(3);
    game.tapHole(2);
    expect(game.rows.value[0]!.pegs).toEqual([null, null, 3, null]);
    game.tapHole(2);
    expect(game.rows.value[0]!.pegs).toEqual([null, null, null, null]);
    game.pick(9); // not a colour
    game.tapHole(9); // not a hole
    expect([game.selected.value, game.rows.value[0]!.pegs]).toEqual([3, [null, null, null, null]]);
  });

  test("keys fill the first empty hole, and backspace takes out the last peg", () => {
    started();
    game.typeColour(1);
    game.pick(4);
    game.tapHole(3);
    game.typeColour(2);
    expect(game.rows.value[0]!.pegs).toEqual([1, 2, null, 4]);
    game.back();
    game.back();
    expect(game.rows.value[0]!.pegs).toEqual([1, null, null, null]);
    game.back();
    game.back(); // nothing left
    game.typeColour(7);
    expect(game.rows.value[0]!.pegs).toEqual([null, null, null, null]);
  });

  test("an unfinished row is not checked", () => {
    started();
    [0, 1, 2].forEach(game.typeColour);
    expect(game.full.value).toBe(false);
    game.check();
    expect([game.current.value, game.rows.value[0]!.answer]).toEqual([0, null]);
    game.typeColour(5);
    game.typeColour(5); // the row is full
    expect(game.rows.value[0]!.pegs).toEqual([0, 1, 2, 5]);
  });
});

describe("Requirement 3 and 4: answer pegs and the end", () => {
  test("a checked row gets its answer pegs and the next row opens", () => {
    started();
    play(wrong());
    expect(game.rows.value[0]!.answer![0]).toBe(0);
    expect(game.current.value).toBe(1);
    expect(game.code.value).toBeNull();
  });

  test("breaking the code shows it, counts the rows and sets the best", () => {
    const store = started();
    play(wrong());
    play(secret());
    expect(game.rows.value[1]!.answer).toEqual([4, 0]);
    expect(game.code.value).toEqual(secret());
    expect(game.result.value).toEqual({ won: true, rows: 2, isRecord: true });
    expect([game.best.value, store.getItem("mastermindBest")]).toEqual([2, "2"]);
    game.typeColour(0); // nothing moves after the end
    game.tapHole(0);
    game.back();
    expect(game.rows.value[1]!.pegs).toEqual(secret());
    game.again();
    expect([game.result.value, game.code.value, game.current.value, game.rows.value[1]!.pegs])
      .toEqual([null, null, 0, [null, null, null, null]]);
  });

  test("ten rows without the code lose, and keep the best", () => {
    started({ mastermindBest: "5" });
    for (let r = 0; r < 10; r++) play(wrong());
    expect(game.result.value).toEqual({ won: false, rows: 10, isRecord: false });
    expect(game.code.value).toEqual(secret());
    expect(game.best.value).toBe(5);
  });

  test("a slower win is not a new best", () => {
    started({ mastermindBest: "1" });
    play(secret());
    expect(game.result.value).toEqual({ won: true, rows: 1, isRecord: false });
  });
});
