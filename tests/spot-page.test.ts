// Tests for .openspec/specs/002-spot-the-difference/spec.md: the page, its pictures and keys.
// @vitest-environment jsdom
import { mount, type VueWrapper } from "@vue/test-utils";
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import SpotPage from "../web/src/pages/SpotPage.vue";
import type { Spot } from "../web/src/spot/useSpot";
import { seedRandom } from "./helpers";
import { loadWasmForTests } from "./wasm-setup";

beforeAll(loadWasmForTests);

let page: VueWrapper;
let game: Spot;

beforeEach(async () => {
  vi.useFakeTimers();
  seedRandom(4);
  localStorage.clear();
  // jsdom doesn't lay out pages, so every picture pretends to be 800 × 600 at the top left
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(
    { left: 0, top: 0, width: 800, height: 600, right: 800, bottom: 600, x: 0, y: 0, toJSON: () => ({}) });
  page = mount(SpotPage, { attachTo: document.body });
  game = (page.vm as unknown as { game: Spot }).game;
  await page.vm.$nextTick();
});

afterEach(() => {
  page.unmount();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const pictures = () => page.findAll(".picture");
const clickPicture = async (side: number, x: number, y: number) => {
  await pictures()[side]!.trigger("click", { clientX: x, clientY: y });
};
const press = async (key: string) => {
  window.dispatchEvent(new KeyboardEvent("keydown", { key }));
  await page.vm.$nextTick();
};

describe("Requirement 1: scenes", () => {
  test("shows two drawn pictures and the scene name", () => {
    expect(pictures()).toHaveLength(2);
    expect(page.findAll("svg.art")[0]!.element.querySelectorAll("*").length).toBeGreaterThan(100);
    expect(page.find(".label.scene").text()).toBe(game.scene.value!.name);
    expect(page.find(".total").text()).toBe("7");
  });
});

describe("Requirement 3 and 4: rounds and clicking", () => {
  test("a click on a difference circles it in both pictures", async () => {
    const d = game.active.value[0]!;
    await clickPicture(1, d.x, d.y);
    expect(page.find(".found").text()).toBe("1");
    expect(page.findAll("circle.found")).toHaveLength(2);
  });

  test("a miss shows +5s on the clicked picture only", async () => {
    await clickPicture(0, 1, 1);
    expect(page.find(".misses").text()).toBe("1");
    expect(pictures()[0]!.findAll(".penalty").map(t => t.text())).toEqual(["+5s"]);
    expect(pictures()[1]!.findAll(".penalty")).toHaveLength(0);
  });

  test("the number of differences can be chosen", async () => {
    await page.find("select").setValue("10");
    expect(page.find(".total").text()).toBe("10");
    expect(localStorage.getItem("spotCount")).toBe("10");
  });
});

describe("Requirement 6 and 7: hint and show solution", () => {
  test("hint (button and H) draws an orange circle", async () => {
    await page.find(".btn.hint").trigger("click");
    expect(page.findAll("circle.hintmark")).toHaveLength(2);
    await press("h");
    expect(page.find(".hints").text()).toBe("2");
  });

  test("show solution (button and S) circles the rest", async () => {
    await page.find(".btn.reveal").trigger("click");
    expect(page.findAll("circle.revealed")).toHaveLength(14);
    expect(page.find(".message").text()).toBe("Here are the last 7. Press next for a new picture.");
    await press("s"); // already shown: nothing changes
    expect(page.findAll("circle.revealed")).toHaveLength(14);
  });
});

describe("Requirement 8: finishing a round", () => {
  async function findAll() {
    for (const d of [...game.active.value]) await clickPicture(0, d.x, d.y);
  }

  test("shows a new record with misses and hints", async () => {
    await clickPicture(0, 1, 1);
    await clickPicture(0, 799, 1);
    await page.find(".btn.hint").trigger("click");
    await findAll();
    expect(page.find(".overlay strong").text()).toMatch(/^New record in 0:\d\d$/);
    expect(page.find(".overlay .meta").text()).toBe("7 differences \\ 2 misses \\ 1 hint \\ next picture loading");
    expect(page.find(".solved").text()).toBe("1");
  });

  test("a round that doesn't beat the record says so, in the singular", async () => {
    const name = game.scene.value!.name;
    localStorage.setItem("spotRecords", JSON.stringify({ [`${name}|7`]: 1 }));
    page.unmount();
    seedRandom(4);
    page = mount(SpotPage, { attachTo: document.body });
    game = (page.vm as unknown as { game: Spot }).game;
    await page.vm.$nextTick();
    expect(page.find(".record").text()).toBe("0:00");
    await clickPicture(0, 1, 1);
    await page.find(".btn.hint").trigger("click");
    await page.find(".btn.hint").trigger("click");
    await findAll();
    expect(page.find(".overlay strong").text()).toMatch(/^All found in/);
    expect(page.find(".overlay .meta").text()).toBe("7 differences \\ 1 miss \\ 2 hints \\ record 0:00 \\ next picture loading");
  });

  test("next (button and N) starts another scene", async () => {
    const name = page.find(".label.scene").text();
    await page.find(".btn.next").trigger("click");
    expect(page.find(".label.scene").text()).not.toBe(name);
    await press("n");
    await press("x"); // other keys do nothing
    expect(page.find(".found").text()).toBe("0");
  });
});
