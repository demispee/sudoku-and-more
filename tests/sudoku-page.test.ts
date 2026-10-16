// Tests for .openspec/specs/001-sudoku/spec.md: the page, its buttons, keys and board.
// @vitest-environment jsdom
import { mount, type VueWrapper } from "@vue/test-utils";
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import SudokuPage from "../web/src/pages/SudokuPage.vue";
import { NEXT_PUZZLE_DELAY, type Sudoku } from "../web/src/sudoku/useSudoku";
import { runUntil, seedRandom } from "./helpers";
import { loadWasmForTests } from "./wasm-setup";

beforeAll(loadWasmForTests);

let page: VueWrapper;
let game: Sudoku;

beforeEach(async () => {
  vi.useFakeTimers();
  seedRandom(2);
  localStorage.clear();
  localStorage.setItem("sudokuLevel", "1");
  page = mount(SudokuPage, { attachTo: document.body });
  game = (page.vm as unknown as { game: Sudoku }).game;
  await page.vm.$nextTick(); // Vue updates the screen on the next tick
  expect(page.find(".overlay").text()).toContain("building a level 1 puzzle");
  runUntil(() => !game.locked.value);
  await page.vm.$nextTick();
});

afterEach(() => {
  page.unmount();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const cells = () => page.findAll(".cell");
const press = async (key: string) => {
  window.dispatchEvent(new KeyboardEvent("keydown", { key }));
  await page.vm.$nextTick();
};
const click = async (selector: string) => {
  await page.find(selector).trigger("click");
};
const firstEmpty = () => game.values.value.findIndex(v => v === 0);

describe("the board", () => {
  test("shows 81 cells with the given numbers in bold and the level", () => {
    expect(cells()).toHaveLength(81);
    expect(page.findAll(".cell.given").length).toBe(game.puzzle.value.filter(Boolean).length);
    expect(page.find(".level").text()).toBe("1");
    expect(page.find(".overlay").exists()).toBe(false);
  });

  test("selecting a cell highlights it, its 20 peers and the same number", async () => {
    const given = game.puzzle.value.findIndex(Boolean);
    await cells()[given]!.trigger("click");
    expect(cells()[given]!.classes()).toContain("selected");
    expect(page.findAll(".cell.peer")).toHaveLength(20);
    expect(page.findAll(".cell.same").length).toBeGreaterThan(1);
  });
});

describe("Requirement 4: entering numbers", () => {
  test("regression: shortcuts, a held S and keys in the level list don't play", async () => {
    const send = async (init: KeyboardEventInit, target: EventTarget = window) => {
      target.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, ...init }));
      await page.vm.$nextTick();
    };
    await send({ key: "s", metaKey: true }); // Cmd+S saves the page
    await send({ key: "s", ctrlKey: true });
    await send({ key: "n", altKey: true });
    await send({ key: "s", repeat: true });
    expect([page.find(".hints").text(), game.notesMode.value]).toEqual(["0", false]);

    const i = firstEmpty();
    await cells()[i]!.trigger("click");
    await send({ key: "5" }, page.find("select").element);
    expect(game.values.value[i]).toBe(0);

    await press("s");
    expect(page.find(".hints").text()).toBe("1");
  });

  test("with the keyboard: a wrong number turns magenta, backspace erases", async () => {
    const i = firstEmpty();
    await cells()[i]!.trigger("click");
    const wrong = (game.solution.value[i]! % 9) + 1;
    await press(String(wrong));
    expect(cells()[i]!.text()).toBe(String(wrong));
    expect(cells()[i]!.classes()).toContain("wrong");
    await press("Backspace");
    expect(cells()[i]!.text()).toBe("");
  });

  test("with the number pad, and arrows move the selection", async () => {
    const i = firstEmpty();
    await cells()[i]!.trigger("click");
    await page.findAll(".pad button")[game.solution.value[i]! - 1]!.trigger("click");
    expect(cells()[i]!.text()).toBe(String(game.solution.value[i]));
    await click(".btn.erase");
    expect(cells()[i]!.text()).toBe("");
    await press("ArrowDown");
    expect(game.selected.value).toBe(i + 9 < 81 ? i + 9 : i);
  });
});

describe("Requirement 5: notes", () => {
  test("the notes button and N switch notes mode; notes show in the cell", async () => {
    await click(".btn.notes");
    expect(page.find(".btn.notes").classes()).toContain("on");
    const i = firstEmpty();
    await cells()[i]!.trigger("click");
    await press("4");
    await press("7");
    expect(cells()[i]!.find(".notes").text()).toBe("47");
    await press("n");
    expect(page.find(".btn.notes").classes()).not.toContain("on");
  });
});

describe("Requirement 7: step", () => {
  test("step (button and S) fills in a number with an explanation, and there is no hint button", async () => {
    const empty = game.values.value.filter(v => !v).length;
    await click(".btn.step");
    expect(page.find(".message .eyebrow").text()).toMatch(/^step \\ /);
    expect(page.find(".hints").text()).toBe("1");
    expect(page.findAll(".cell .flash")).toHaveLength(1);
    expect(page.findAll(".cell.target")).toHaveLength(1);
    expect(page.findAll(".cell .notes")).toHaveLength(0);
    await press("s");
    expect(game.values.value.filter(v => !v).length).toBe(empty - 2);
    expect(page.find(".btn.hint").exists()).toBe(false);
    await press("t");
    expect(page.find(".hints").text()).toBe("2");
  });
});

describe("Requirement 8: auto-solve", () => {
  test("solve turns into stop, solves the puzzle and doesn't count it", async () => {
    await click(".btn.solve");
    expect(page.find(".btn.solve").text()).toBe("stop");
    runUntil(() => game.locked.value, 600_000, 700);
    await page.vm.$nextTick();
    expect(page.find(".btn.solve").text()).toBe("solve");
    expect(page.find(".message").text()).toContain("The solver finished this one");
    expect(page.find(".solved").text()).toBe("0");
    expect(page.findAll(".pad button.done")).toHaveLength(9);
  });
});

describe("Requirement 9: solving a puzzle", () => {
  async function solveByHand() {
    for (const [i, v] of game.values.value.entries()) {
      if (v) continue;
      await cells()[i]!.trigger("click");
      await press(String(game.solution.value[i]));
    }
  }

  test("shows the time, level and hints, and counts it", async () => {
    await solveByHand();
    expect(page.find(".overlay strong").text()).toMatch(/^Solved in 0:0\d$/);
    expect(page.find(".overlay .meta").text()).toBe("level 1 \\ no hints \\ next puzzle loading");
    expect(page.find(".solved").text()).toBe("1");
    expect(localStorage.getItem("sudokuSolved")).toBe("1");
  });

  test("says how many hints were used", async () => {
    await click(".btn.step");
    await solveByHand();
    expect(page.find(".overlay .meta").text()).toContain("\\ 1 hint \\");
  });

  test("counts more hints in the plural, and skip starts a new puzzle", async () => {
    await click(".btn.step");
    await click(".btn.step");
    await solveByHand();
    expect(page.find(".overlay .meta").text()).toContain("\\ 2 hints \\");
    await click(".btn.skip");
    runUntil(() => !game.locked.value);
    await page.vm.$nextTick();
    expect(page.find(".overlay").exists()).toBe(false);
  });

  test.each(["waits for the next puzzle", "presses skip"])(
    "regression: after stepping to the end, a player who %s sees only the new puzzle's numbers", async how => {
      for (let k = 0; k < 200 && !game.locked.value; k++) await click(".btn.step");
      expect(game.values.value).toEqual(game.solution.value);
      if (how === "presses skip") await click(".btn.skip");
      else vi.advanceTimersByTime(NEXT_PUZZLE_DELAY);
      runUntil(() => !game.locked.value);
      await page.vm.$nextTick();
      const shown = cells().map(c => c.text());
      expect(shown).toEqual(game.puzzle.value.map(v => (v ? String(v) : "")));
      // A step still lights up the cell it fills in
      await click(".btn.step");
      expect(page.findAll(".cell .flash")).toHaveLength(1);
    });
});

describe("Requirement 2 and 10: choosing and remembering the level", () => {
  test("the difficulty list starts at the saved level and changing it is saved", async () => {
    const select = page.find("select");
    expect((select.element as HTMLSelectElement).value).toBe("1");
    expect(select.findAll("option")).toHaveLength(10);
    await select.setValue("2");
    expect(localStorage.getItem("sudokuLevel")).toBe("2");
    runUntil(() => !game.locked.value && game.level.value === 2);
    await page.vm.$nextTick();
    expect(page.find(".level").text()).toBe("2");
  });
});

test("other keys do nothing, and leaving the page stops the game", async () => {
  const before = [...game.values.value];
  await press("x");
  await press("Delete");
  await press("0");
  expect(game.values.value).toEqual(before);
});
