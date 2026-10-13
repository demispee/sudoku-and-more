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
let page: VueWrapper;
let game: ShyGame;

beforeEach(async () => {
  vi.useFakeTimers();
  seedRandom(3);
  localStorage.clear();
  frames = [];
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
  frames.shift()!(0);
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
  test("a square runs from the pointer, and its eyes look away", async () => {
    const s = game.squares.value[0]!;
    point("pointermove", s.x - 50, s.y);
    await nextFrame();
    expect(game.squares.value[0]!.x).toBeGreaterThan(s.x);
    const [left] = page.findAll(".square")[0]!.findAll(".eye");
    expect(Number(left!.attributes("cx"))).toBeGreaterThan(game.squares.value[0]!.x - 4);
    point("pointerdown", 10, 10);
    point("pointerleave", 0, 0);
    await nextFrame();
    expect(Number(page.findAll(".square")[0]!.findAll(".eye")[0]!.attributes("cx"))).toBeCloseTo(game.squares.value[0]!.x - 4, 5);
  });
});

describe("Requirement 3 and 4: caught, levels and keys", () => {
  test("R restarts the level; shortcuts and held keys do nothing", async () => {
    vi.advanceTimersByTime(3000);
    await nextFrame();
    expect(page.find(".time").text()).toBe("0:03");
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "r", metaKey: true }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "r", repeat: true }));
    await page.vm.$nextTick();
    expect(page.find(".time").text()).toBe("0:03");
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "r" }));
    await page.vm.$nextTick();
    expect(page.find(".time").text()).toBe("0:00");
  });

  test("caught squares turn turquoise, and a finished level shows its time", async () => {
    for (let k = 0; k < 40_000 && !game.result.value; k++) {
      const s = game.squares.value.find(q => !q.caught)!;
      const inFront = s.x > 520 && Math.abs(s.y - 300) < 50;
      const [tx, ty] = inFront ? [720, 300] : [560, 300];
      const d = Math.hypot(tx - s.x, ty - s.y) || 1;
      game.setCursor({ x: s.x - ((tx - s.x) / d) * 40, y: s.y - ((ty - s.y) / d) * 40 });
      frames.shift()!(0);
    }
    await page.vm.$nextTick();
    expect(page.findAll(".square.caught")).toHaveLength(6);
    expect(page.find(".overlay strong").text()).toMatch(/^New best: level 1 in \d:\d\d$/);
    expect(page.find(".overlay .meta").text()).toBe("level 2 starts in 3 seconds");
  });
});
