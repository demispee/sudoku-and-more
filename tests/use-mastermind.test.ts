// Tests for .openspec/specs/007-mastermind/spec.md: the page's state and actions.
// The code and the answer pegs are tested in Rust (game-core/src/mastermind.rs).
import { afterEach, beforeAll, describe, expect, test } from "vitest";
import { levels, useMastermind, type MastermindGame } from "../web/src/mastermind/useMastermind";
import { PALETTES } from "../web/src/mastermind/palettes";
import { Mastermind } from "../web/src/wasm";
import { memoryStore } from "./helpers";
import { loadWasmForTests } from "./wasm-setup";

beforeAll(loadWasmForTests);

const SEED = 11;
let game: MastermindGame;

afterEach(() => game?.stop());

/** The code for SEED and a level: a lost game shows it */
function secret(level = 0) {
  const probe = new Mastermind(SEED, level);
  const holes = levels()[level]!.holes;
  while (probe.status === "playing") probe.check(new Uint8Array(holes));
  const code = Array.from(probe.code());
  probe.free();
  return code;
}

function started(initial: Record<string, string> = {}) {
  const store = memoryStore(initial);
  game = useMastermind(store, () => SEED);
  return store;
}

/** Places a row of colours and checks it */
function play(colours: number[]) {
  colours.forEach(c => game.place(c));
  game.check();
}

const wrong = (level = 0) => secret(level).map(c => (c + 1) % levels()[level]!.colours);
const first = () => game.rows.value[0]!.pegs;

describe("Requirement 2: placing pegs", () => {
  test("a clicked colour goes in the first empty hole; a clicked peg comes out", () => {
    started();
    expect(game.rows.value).toHaveLength(10);
    game.place(0);
    game.place(4);
    game.place(3);
    expect(first()).toEqual([0, 4, 3, null]);
    game.takeOut(1); // fixing a mistake
    game.place(2);
    expect(first()).toEqual([0, 2, 3, null]);
    game.takeOut(3); // an empty hole: nothing
    game.place(9); // not a colour
    expect(first()).toEqual([0, 2, 3, null]);
    expect(game.lastColour.value).toEqual({ colour: 2, count: 4 });
  });

  test("backspace takes out the last peg placed", () => {
    started();
    [1, 2, 4].forEach(game.place);
    game.back();
    game.back();
    expect(first()).toEqual([1, null, null, null]);
    game.back();
    game.back(); // nothing left
    expect(first()).toEqual([null, null, null, null]);
  });

  test("an unfinished row is not checked, and a full row takes no more pegs", () => {
    started();
    [0, 1, 2].forEach(game.place);
    expect(game.full.value).toBe(false);
    game.check();
    expect([game.current.value, game.rows.value[0]!.answer]).toEqual([0, null]);
    game.place(5);
    game.place(5);
    expect(first()).toEqual([0, 1, 2, 5]);
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
    game.place(0); // nothing moves after the end
    game.takeOut(0);
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

describe("Requirement 8: levels", () => {
  test("hard has 5 holes and 8 colours, a best of its own, and is remembered", () => {
    const store = started({ mastermindBest: "3", mastermindBest5x8: "7" });
    expect([game.level.value, game.best.value, game.colours.value]).toEqual([0, 3, PALETTES[0]!.colours.slice(0, 6)]);
    game.place(0);
    game.setLevel(1);
    expect([game.shape.value, game.best.value, store.getItem("mastermindLevel")]).toEqual([{ holes: 5, colours: 8 }, 7, "1"]);
    expect(first()).toEqual([null, null, null, null, null]);
    expect(game.colours.value).toHaveLength(8);
    game.place(7);
    play(secret(1));
    expect(game.rows.value[0]!.pegs).toHaveLength(5);
    game.again();
    play(secret(1));
    expect(game.result.value).toEqual({ won: true, rows: 1, isRecord: true });
    expect(store.getItem("mastermindBest5x8")).toBe("1");
    game.setLevel(1); // the same level: nothing changes
    game.setLevel(5); // not a level
    expect(game.result.value).not.toBeNull();
    game.stop();
    game = useMastermind(store, () => SEED);
    expect(game.level.value).toBe(1);
  });
});

describe("Requirement 9: colour palettes", () => {
  test("the palette button goes round all palettes and is remembered; the game stays", () => {
    const store = started();
    play(wrong());
    expect(game.paletteName.value).toBe("vivid");
    const names = PALETTES.map(() => {
      game.nextPalette();
      return game.paletteName.value;
    });
    expect(names).toEqual(["warm", "cool", "tropical", "vivid"]);
    game.nextPalette();
    expect([store.getItem("mastermindPalette"), game.colours.value[0]]).toEqual(["warm", PALETTES[1]!.colours[0]]);
    expect(game.rows.value[0]!.answer).not.toBeNull();
    game.stop();
    game = useMastermind(store, () => SEED);
    expect(game.paletteName.value).toBe("warm");
  });
});

describe("Requirement 10: symbols", () => {
  test("symbols start off, go on and off, and are remembered", () => {
    const store = started();
    expect(game.symbols.value).toBe(false);
    game.toggleSymbols();
    expect([game.symbols.value, store.getItem("mastermindSymbols")]).toEqual([true, "on"]);
    game.stop();
    game = useMastermind(store, () => SEED);
    expect(game.symbols.value).toBe(true);
    game.toggleSymbols();
    expect(store.getItem("mastermindSymbols")).toBe("off");
  });
});
