// Tests for .openspec/specs/007-mastermind/spec.md: the page, its keys and buttons.
// The 3D board needs WebGL, which jsdom doesn't have; a stand-in records what the page
// sends to it (ADR-0009).
// @vitest-environment jsdom
import { mount, type VueWrapper } from "@vue/test-utils";
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import type { BoardEvents, BoardState } from "../web/src/mastermind/scene";
import type { MastermindGame } from "../web/src/mastermind/useMastermind";
import MastermindPage from "../web/src/pages/MastermindPage.vue";
import { seedRandom } from "./helpers";
import { loadWasmForTests } from "./wasm-setup";

const board = vi.hoisted(() => ({
  fail: false,
  events: null as BoardEvents | null,
  last: null as BoardState | null,
  disposed: 0,
}));

vi.mock("../web/src/mastermind/scene", () => ({
  PEG_COLOURS: ["#c8102e", "#f0661a", "#f4c20d", "#1d9a3d", "#1652c4", "#6a2ca0"],
  createBoard: (_: HTMLElement, events: BoardEvents) => {
    if (board.fail) throw new Error("no WebGL");
    board.events = events;
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
  test("clicks on the board and keys place pegs; the board is told", async () => {
    board.events!.colour(4);
    board.events!.hole(1);
    await page.vm.$nextTick();
    expect(board.last).toMatchObject({ current: 0, selected: 4, code: null });
    expect(board.last!.rows[0]!.pegs).toEqual([null, 4, null, null]);
    await press("1");
    await press("7"); // not a colour
    await press("2", { metaKey: true });
    await press("3", { repeat: true });
    expect(game.rows.value[0]!.pegs).toEqual([0, 4, null, null]);
    await press("Backspace");
    expect(game.rows.value[0]!.pegs).toEqual([null, 4, null, null]);
    await page.findAll(".colour")[5]!.trigger("click");
    expect(page.find(".colour.on").attributes("aria-label")).toBe("purple");
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
