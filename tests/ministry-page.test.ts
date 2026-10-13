// Tests for .openspec/specs/004-ministry-of-odd-forms/spec.md: the page, its buttons and keys.
// @vitest-environment jsdom
import { mount, type VueWrapper } from "@vue/test-utils";
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import MinistryPage from "../web/src/pages/MinistryPage.vue";
import { STAMP_TIME, type MinistryGame } from "../web/src/ministry/useMinistry";
import { seedRandom } from "./helpers";
import { loadWasmForTests } from "./wasm-setup";

beforeAll(loadWasmForTests);

let page: VueWrapper;
let game: MinistryGame;

beforeEach(async () => {
  vi.useFakeTimers();
  seedRandom(7);
  localStorage.clear();
  page = mount(MinistryPage, { attachTo: document.body });
  game = (page.vm as unknown as { game: MinistryGame }).game;
  await page.vm.$nextTick();
});

afterEach(() => {
  page.unmount();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const press = async (key: string, init: KeyboardEventInit = {}) => {
  window.dispatchEvent(new KeyboardEvent("keydown", { key, ...init }));
  await page.vm.$nextTick();
};
const wait = async () => {
  vi.advanceTimersByTime(STAMP_TIME);
  await page.vm.$nextTick();
};
/** The key for the right (or wrong) stamp */
const keyFor = (right = true) => (game.rightStamp() === right ? "a" : "r");

describe("Requirement 1 and 2: the form and the rulebook", () => {
  test("shows every field of the form and the rulebook with its number", () => {
    const f = game.form.value;
    expect(page.find(".name").text()).toBe(f.name);
    expect(page.find(".species").text()).toContain(f.species);
    expect(page.find(".hat").text()).toBe(f.hat ? "🎩 yes" : "no");
    expect(page.find(".number").text()).toBe(String(f.number));
    expect(page.find(".form header").text()).toContain(f.weekday);
    expect(page.find(".doodle").text()).toContain(f.doodle);
    expect(page.findAll(".rulebook li").map(li => li.text())).toEqual([`1${game.rules.value[0]}`]);
  });
});

describe("Requirement 3: stamping", () => {
  test("the buttons stamp the form", async () => {
    await page.find(game.rightStamp() ? ".btn.approve" : ".btn.reject").trigger("click");
    expect(page.find(".stamp").exists()).toBe(true);
    await wait();
    expect(page.find(".stamped").text()).toBe("1");
    await page.find(game.rightStamp() ? ".btn.reject" : ".btn.approve").trigger("click");
    await wait();
    expect(page.find(".strikes").text()).toBe("1");
  });

  test("A and R stamp; a wrong stamp spills tea and says why; shortcuts are left alone", async () => {
    await press(keyFor(false));
    expect(page.find(".stamp").text()).toMatch(/^(approved|rejected)$/);
    await wait();
    expect(page.findAll(".stain")).toHaveLength(1);
    expect(page.find(".message").text()).toContain(game.message.value);
    await press("a", { metaKey: true });
    await press("r", { repeat: true });
    expect(page.find(".stamp").exists()).toBe(false);
    await press(keyFor());
    await wait();
    expect(page.find(".stamped").text()).toBe("1");
  });
});

describe("Requirement 4: days", () => {
  test("after 10 forms the memo shows the new rule on top of the rulebook; Enter starts the day", async () => {
    for (let k = 0; k < game.FORMS_PER_DAY; k++) {
      await press(keyFor());
      await wait();
    }
    expect(page.find(".memo strong").text()).toBe(game.rules.value.at(-1));
    expect(page.find(".day").text()).toBe("2");
    expect(page.findAll(".rulebook li")[0]!.text()).toBe(`2${game.rules.value[1]}`);
    await press("Enter");
    expect(page.find(".memo").exists()).toBe(false);
    await press("a");
    await page.find(".btn.primary.approve").trigger("click");
    await wait();
    expect(page.find(".today").text()).toBe("1");
  });

  test("the next day button closes the memo", async () => {
    for (let k = 0; k < game.FORMS_PER_DAY; k++) {
      await press(keyFor());
      await wait();
    }
    await page.find(".next-day").trigger("click");
    expect(page.find(".memo").exists()).toBe(false);
  });
});

describe("Requirement 5 and 6: fired, and the best result", () => {
  test("the third strike fires you; Enter or reapply starts over; the best result shows", async () => {
    expect(page.find(".best").text()).toBe("–");
    for (let k = 0; k < 3; k++) {
      await press(keyFor(false));
      await wait();
    }
    expect(page.find(".fired strong").text()).toBe("You're fired.");
    expect(page.find(".fired .meta").text()).toBe("You lasted until day 1 and stamped 0 forms right.");
    expect(page.find(".best").text()).toBe("day 1, 0 forms");
    expect(page.findAll(".stain")).toHaveLength(3);
    await press("Enter");
    expect(page.find(".fired").exists()).toBe(false);
    for (let k = 0; k < 3; k++) {
      await press(keyFor(false));
      await wait();
    }
    await page.find(".reapply").trigger("click");
    expect(page.find(".strikes").text()).toBe("0");
  });
});
