// Tests for .openspec/specs/003-bouncing-balls/spec.md: the page. The physics is tested in
// Rust (game-core/src/balls.rs).
// @vitest-environment jsdom
import { mount } from "@vue/test-utils";
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import BackLink from "../web/src/components/BackLink.vue";
import BallsPage from "../web/src/pages/BallsPage.vue";
import { loadWasmForTests } from "./wasm-setup";

beforeAll(loadWasmForTests);

// jsdom has no canvas drawing and no animation frames, so the tests provide both
let frames: FrameRequestCallback[] = [];
const ctx = {
  createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  beginPath: vi.fn(), arc: vi.fn(), fill: vi.fn(), fillRect: vi.fn(),
  fillStyle: "", shadowColor: "", shadowBlur: 0,
};

beforeEach(() => {
  frames = [];
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => frames.push(cb));
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(ctx as unknown as CanvasRenderingContext2D);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const nextFrame = () => frames.shift()!(0);
const press = (key: string) => window.dispatchEvent(new KeyboardEvent("keydown", { key }));

describe("Requirement 1: adding balls", () => {
  test("starts with 20 balls, and a click adds 5", async () => {
    const page = mount(BallsPage, { attachTo: document.body });
    await page.vm.$nextTick(); // Vue updates the screen on the next tick
    expect(page.find(".count").text()).toBe("20 balls");
    await page.find("canvas").trigger("click", { clientX: 30, clientY: 40 });
    expect(page.find(".count").text()).toBe("25 balls");
    page.unmount();
  });
});

describe("Requirement 3: look", () => {
  test("draws every ball with a highlight and a glow, over a see-through background", () => {
    const page = mount(BallsPage, { attachTo: document.body });
    expect(ctx.fillRect).toHaveBeenCalled();
    expect(ctx.arc).toHaveBeenCalledTimes(20);
    expect(ctx.shadowBlur).toBe(20);
    nextFrame();
    expect(ctx.arc).toHaveBeenCalledTimes(40);
    page.unmount();
  });

  test("keeps counting when the canvas can't draw", async () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    ctx.arc.mockClear();
    const page = mount(BallsPage, { attachTo: document.body });
    nextFrame();
    await page.vm.$nextTick();
    expect(ctx.arc).not.toHaveBeenCalled();
    expect(page.find(".count").text()).toBe("20 balls");
    page.unmount();
  });
});

describe("Requirement 2 and 4: controls", () => {
  test("G toggles gravity, C clears, H hides the panel but keeps the back link", async () => {
    const page = mount(BallsPage, { attachTo: document.body });
    press("g");
    await page.vm.$nextTick();
    expect(page.find(".gravity").text()).toBe("off");
    press("G");
    await page.vm.$nextTick();
    expect(page.find(".gravity").text()).toBe("on");

    press("c");
    await page.vm.$nextTick();
    expect(page.find(".count").text()).toBe("0 balls");

    press("h");
    await page.vm.$nextTick();
    expect(page.find(".help").exists()).toBe(false);
    expect(page.findComponent(BackLink).exists()).toBe(true);
    press("h");
    await page.vm.$nextTick();
    expect(page.find(".help").exists()).toBe(true);

    press("x"); // other keys do nothing
    window.dispatchEvent(new Event("resize"));
    page.unmount();
    expect(cancelAnimationFrame).toHaveBeenCalled();
  });
});
