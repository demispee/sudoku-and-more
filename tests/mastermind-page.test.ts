// Tests for .openspec/specs/007-mastermind/spec.md: the page, its keys and buttons.
// The 3D board needs WebGL, which jsdom doesn't have; a stand-in records what the page
// sends to it (ADR-0009).
// @vitest-environment jsdom
import { mount, type VueWrapper } from "@vue/test-utils";
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import type { BoardEvents, BoardState, Level } from "../web/src/mastermind/scene";
import { PALETTES } from "../web/src/mastermind/palettes";
import type { MastermindGame } from "../web/src/mastermind/useMastermind";
import MastermindPage from "../web/src/pages/MastermindPage.vue";
import { seedRandom } from "./helpers";
import { loadWasmForTests } from "./wasm-setup";

const board = vi.hoisted(() => ({
  fail: false,
  events: null as BoardEvents | null,
  last: null as BoardState | null,
  level: null as Level | null,
  disposed: 0,
}));

vi.mock("../web/src/mastermind/scene", () => ({
  createBoard: (_: HTMLElement, events: BoardEvents, level: Level) => {
    if (board.fail) throw new Error("no WebGL");
    board.events = events;
    board.level = level;
    return { update: (s: BoardState) => (board.last = s), dispose: () => board.disposed++ };
  },
}));

beforeAll(loadWasmForTests);

let page: VueWrapper;
let game: MastermindGame;

beforeEach(async () => {
  localStorage.clear();
  board.fail = false;
  seedRandom(1); // a code that isn't red, red, red, red
  page = mount(MastermindPage, { attachTo: document.body });
  game = (page.vm as unknown as { game: MastermindGame }).game;
  await page.vm.$nextTick();
});

afterEach(() => {
  page.unmount();
  vi.restoreAllMocks();
});

const press = async (key: string, init: KeyboardEventInit = {}) => {
  window.dispatchEvent(new KeyboardEvent("keydown", { key, ...init }));
  await page.vm.$nextTick();
};

describe("Requirement 2: placing pegs", () => {
  test("colours on the board, the buttons and keys place pegs; a clicked peg comes out", async () => {
    board.events!.colour(4);
    await page.vm.$nextTick();
    expect(board.last).toMatchObject({ current: 0, code: null, hop: { colour: 4, count: 1 } });
    expect(board.last!.rows[0]!.pegs).toEqual([4, null, null, null]);
    await press("1");
    await press("7"); // not a colour on classic
    await press("2", { metaKey: true });
    await press("3", { repeat: true });
    await page.findAll(".colour")[5]!.trigger("click");
    expect(game.rows.value[0]!.pegs).toEqual([4, 0, 5, null]);
    board.events!.hole(1);
    await press("Backspace");
    expect(game.rows.value[0]!.pegs).toEqual([4, null, null, null]);
    expect(page.findAll(".colour")).toHaveLength(6);
  });

  test("check only works for a full row", async () => {
    expect(page.find(".check").attributes("disabled")).toBeDefined();
    await press("Enter");
    expect(page.find(".row").text()).toBe("1");
    for (const k of "1234") await press(k);
    expect(page.find(".check").attributes("disabled")).toBeUndefined();
    await page.find(".check").trigger("click");
    expect(page.find(".row").text()).toBe("2");
    expect(board.last!.rows[0]!.answer).not.toBeNull();
  });
});

describe("Requirement 8 and 9: levels and palettes", () => {
  test("hard gets a new board with 5 holes and 8 colours, and the keys up to 8", async () => {
    expect(board.level).toEqual({ holes: 4, colours: 6 });
    const before = board.disposed;
    await page.findAll(".level")[1]!.trigger("click");
    await page.vm.$nextTick();
    expect([board.level, board.disposed]).toEqual([{ holes: 5, colours: 8 }, before + 1]);
    expect(page.find(".level.on").text()).toBe("hard");
    await press("8");
    expect(board.last!.rows[0]!.pegs).toEqual([7, null, null, null, null]);
    expect(page.findAll(".colour")).toHaveLength(8);
  });

  test("the colours button changes the palette of the board and the buttons", async () => {
    const vivid = board.last!.colours[0];
    await page.find(".palette").trigger("click");
    expect(page.find(".palette").text()).toBe("colours \\ warm");
    expect(board.last!.colours[0]).not.toBe(vivid);
    expect(board.last!.studio).toEqual(PALETTES[1]!.studio); // the studio turns warm too
    expect(page.find(".board").attributes("style")).toContain("background");
    expect(page.find(".colour .dot").attributes("style")).toContain("background");
  });
});

describe("Requirement 4 and 6: the end and the best", () => {
  test("a lost game shows the overlay and opens the shield; Enter plays again", async () => {
    for (let r = 0; r < 10 && !game.result.value; r++) {
      for (const k of "1111") await press(k);
      await press("Enter");
    }
    expect(page.find(".overlay strong").text()).toBe("The code wasn't broken");
    expect(page.find(".overlay .meta").text()).toBe("best –");
    expect(board.last!.code).toHaveLength(4);
    await press("Enter");
    expect(page.find(".overlay").exists()).toBe(false);
    expect(board.last!.code).toBeNull();
  });

  test("a won game shows the rows it took", async () => {
    game.result.value = { won: true, rows: 3, isRecord: true };
    await page.vm.$nextTick();
    expect(page.find(".overlay strong").text()).toBe("Code broken in 3 rows");
    expect(page.find(".overlay .meta").text()).toBe("your best yet");
    game.result.value = { won: true, rows: 1, isRecord: false };
    game.best.value = 1;
    await page.vm.$nextTick();
    expect(page.find(".overlay strong").text()).toBe("Code broken in 1 row");
    expect(page.find(".overlay .meta").text()).toBe("best 1 rows");
    expect(page.find(".best").text()).toBe("1 rows");
    await page.find(".again").trigger("click");
    expect(page.find(".overlay").exists()).toBe(false);
  });
});

describe("Requirement 5: a realistic board", () => {
  test("without WebGL the page says so, and still works with the keys", async () => {
    page.unmount();
    board.fail = true;
    page = mount(MastermindPage, { attachTo: document.body });
    await page.vm.$nextTick();
    expect(page.find(".no-webgl").text()).toContain("no WebGL");
    await press("1");
    expect((page.vm as unknown as { game: MastermindGame }).game.rows.value[0]!.pegs[0]).toBe(0);
  });

  test("leaving the page disposes of the board", () => {
    const before = board.disposed;
    page.unmount();
    expect(board.disposed).toBe(before + 1);
    page = mount(MastermindPage, { attachTo: document.body });
  });
});

describe("Requirement 4 and 7: the end on every level", () => {
  test("regression: the board hears from the game whether the code was broken, also on hard", async () => {
    await page.findAll(".level")[1]!.trigger("click");
    game.result.value = { won: true, rows: 3, isRecord: false };
    game.code.value = [1, 2, 3, 4, 5];
    await page.vm.$nextTick();
    expect(board.last).toMatchObject({ won: true, code: [1, 2, 3, 4, 5] });
    game.result.value = { won: false, rows: 10, isRecord: false };
    await page.vm.$nextTick();
    expect(board.last!.won).toBe(false);
  });

  test("regression: Enter on a focused button doesn't click it too", async () => {
    (page.findAll(".colour")[2]!.element as HTMLButtonElement).focus();
    const event = new KeyboardEvent("keydown", { key: "Enter", cancelable: true });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });

  test("new game starts over in the middle of a game, without a result", async () => {
    for (const k of "1234") await press(k);
    await press("Enter");
    await page.find(".new-game").trigger("click");
    expect([game.current.value, game.result.value, game.lastColour.value]).toEqual([0, null, null]);
    expect(board.last!.rows[0]!.pegs).toEqual([null, null, null, null]);
    expect(page.find(".best").text()).toBe("–");
  });
});

describe("Requirement 3: the answer pegs", () => {
  test("the page explains what a black and a white answer peg mean", () => {
    const legend = page.find(".legend");
    expect(legend.find(".peg.black").exists() && legend.find(".peg.white").exists()).toBe(true);
    expect(legend.findAll(":scope > span").map(s => s.text())).toEqual(["right colour, right hole", "right colour, other hole"]);
  });
});
