// Tests for .openspec/specs/005-shy-squares/spec.md: the page, its field and keys.
// @vitest-environment jsdom
import { mount, type VueWrapper } from "@vue/test-utils";
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import ShyPage from "../web/src/pages/ShyPage.vue";
import type { ShyGame } from "../web/src/shy/useShy";
import { seedRandom } from "./helpers";
import { loadWasmForTests } from "./wasm-setup";

beforeAll(loadWasmForTests);

let frames: FrameRequestCallback[] = [];
let now = 0;
let page: VueWrapper;
let game: ShyGame;

beforeEach(async () => {
  vi.useFakeTimers();
  seedRandom(3);
  localStorage.clear();
  frames = [];
  now = 0;
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => frames.push(cb));
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  // jsdom doesn't lay out pages, so the field pretends to be 800 × 600 at the top left
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue(
    { left: 0, top: 0, width: 800, height: 600, right: 800, bottom: 600, x: 0, y: 0, toJSON: () => ({}) });
  page = mount(ShyPage, { attachTo: document.body });
  game = (page.vm as unknown as { game: ShyGame }).game;
  await page.vm.$nextTick();
});

afterEach(() => {
  page.unmount();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const nextFrame = async () => {
  frames.shift()!((now += 1000 / 60));
  await page.vm.$nextTick();
};
const point = (type: string, x: number, y: number) =>
  page.find("svg.field").element.dispatchEvent(new PointerEvent(type, { clientX: x, clientY: y, bubbles: true }));

describe("Requirement 1: the field", () => {
  test("shows the pen with three walls and the squares of level 1", () => {
    expect(page.findAll(".wall")).toHaveLength(3);
    expect(page.findAll(".square")).toHaveLength(6);
    expect([page.find(".level").text(), page.find(".caught").text(), page.find(".total").text()]).toEqual(["1", "0", "6"]);
    expect(page.find(".best").text()).toBe("–");
  });
});

describe("Requirement 2: shy squares", () => {
  test("a square runs from the pointer", async () => {
    const s = game.squares.value[0]!;
    point("pointermove", s.x - 50, s.y);
    await nextFrame();
    expect(game.squares.value[0]!.x).toBeGreaterThan(s.x);
  });
});

describe("Requirement 3 and 4: caught, levels and keys", () => {
  test("R restarts the level; shortcuts and held keys do nothing", async () => {
    for (let k = 0; k < 180; k++) frames.shift()!((now += 1000 / 60)); // 3 seconds
    await page.vm.$nextTick();
    expect(page.find(".time").text()).toBe("0:03");
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "r", metaKey: true }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "r", repeat: true }));
    await page.vm.$nextTick();
    expect(page.find(".time").text()).toBe("0:03");
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "r" }));
    await page.vm.$nextTick();
    expect(page.find(".time").text()).toBe("0:00");
  });

  test("caught squares get a turquoise mark, and a finished level shows its time", async () => {
    for (let k = 0; k < 40_000 && !game.result.value; k++) {
      const s = game.squares.value.find(q => !q.caught)!;
      const inFront = s.x > 520 && Math.abs(s.y - 300) < 50;
      const [tx, ty] = inFront ? [720, 300] : [560, 300];
      const d = Math.hypot(tx - s.x, ty - s.y) || 1;
      game.setCursor({ x: s.x - ((tx - s.x) / d) * 40, y: s.y - ((ty - s.y) / d) * 40 });
      frames.shift()!((now += 1000 / 60));
    }
    await page.vm.$nextTick();
    expect(page.findAll(".square.caught")).toHaveLength(6);
    expect(page.findAll(".square.caught .mark")).toHaveLength(6);
    expect(page.find(".overlay strong").text()).toMatch(/^New best: level 1 in \d:\d\d$/);
    expect(page.find(".overlay .meta").text()).toBe("level 2 starts in 3 seconds");
  });
});

describe("Requirement 2: the cursor", () => {
  test("a pointer outside the field, or a cancelled touch, scares nothing", async () => {
    const s = [...game.squares.value].sort((a, b) => a.x - b.x)[0]!;
    const i = game.squares.value.indexOf(s);
    point("pointermove", s.x - 50, s.y); // on the field: it flees
    await nextFrame();
    expect(game.squares.value[i]!.x).toBeGreaterThan(s.x);
    point("pointercancel", 0, 0);
    for (let k = 0; k < 300; k++) frames.shift()!((now += 1000 / 60));
    const still = game.squares.value[i]!;
    point("pointermove", -20, still.y); // a finger dragged past the left edge
    await nextFrame();
    expect(game.squares.value[i]!.x).toBeCloseTo(still.x, 2);
  });

  test("the field's border is not part of the field", async () => {
    // A field drawn at 400 × 300 with a 2 px border: the middle is (402, 152) on screen
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue(
      { left: 0, top: 0, width: 404, height: 304, right: 404, bottom: 304, x: 0, y: 0, toJSON: () => ({}) });
    const svg = page.find("svg.field").element;
    for (const [key, value] of [["clientLeft", 2], ["clientTop", 2], ["clientWidth", 400], ["clientHeight", 300]] as const) {
      Object.defineProperty(svg, key, { value, configurable: true });
    }
    const set = vi.spyOn(game, "setCursor");
    point("pointermove", 202, 152);
    expect(set).toHaveBeenLastCalledWith({ x: 400, y: 300 });
  });
});

describe("Requirement 6: shy Schuberts", () => {
  test("every square is drawn as Schubert, filling the square", () => {
    const images = page.findAll(".square image");
    expect(images).toHaveLength(6);
    expect(page.findAll(".square rect")).toHaveLength(0);
    const s = game.squares.value[0]!;
    const first = images[0]!;
    expect(first.attributes("href")).toMatch(/schubert\.png$/);
    expect([first.attributes("x"), first.attributes("y"), first.attributes("width"), first.attributes("height")].map(Number))
      .toEqual([s.x - 18, s.y - 18, 36, 36]);
  });

  test("only a caught Schubert stands on a turquoise circle", async () => {
    expect(page.findAll(".mark")).toHaveLength(0);
    const s = game.squares.value[0]!;
    game.squares.value = game.squares.value.map((q, i) => (i === 0 ? { ...q, caught: true } : q));
    await page.vm.$nextTick();
    const marks = page.findAll(".mark");
    expect(marks).toHaveLength(1);
    expect([marks[0]!.attributes("cx"), marks[0]!.attributes("cy")].map(Number)).toEqual([s.x, s.y]);
  });

  test("the page is called shy Schuberts", () => {
    expect(page.find("h1").text()).toBe("Herd the shy Schuberts");
  });
});
