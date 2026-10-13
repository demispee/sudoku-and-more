// Tests for .openspec/specs/006-reverse-snake/spec.md: the page, its keys and buttons.
// @vitest-environment jsdom
import { mount, type VueWrapper } from "@vue/test-utils";
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import SnakePage from "../web/src/pages/SnakePage.vue";
import type { SnakeGame } from "../web/src/snake/useSnake";
import { loadWasmForTests } from "./wasm-setup";

beforeAll(loadWasmForTests);

let frames: FrameRequestCallback[] = [];
let now = 0;
let page: VueWrapper;
let game: SnakeGame;

beforeEach(async () => {
  frames = [];
  now = 0;
  localStorage.clear();
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => frames.push(cb));
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  page = mount(SnakePage, { attachTo: document.body });
  game = (page.vm as unknown as { game: SnakeGame }).game;
  await page.vm.$nextTick();
});

afterEach(() => {
  page.unmount();
  vi.unstubAllGlobals();
});

const press = async (key: string, init: KeyboardEventInit = {}) => {
  window.dispatchEvent(new KeyboardEvent("keydown", { key, ...init }));
  await page.vm.$nextTick();
};
const play = async (ms: number) => {
  for (let t = 0; t < ms; t += 50) {
    now += 50;
    frames.shift()!(now);
  }
  await page.vm.$nextTick();
};

describe("Requirement 1 and 2: the grid and moving the apple", () => {
  test("draws the snake with eyes and the apple; keys and buttons move the apple", async () => {
    expect(page.findAll(".body")).toHaveLength(3);
    expect(page.findAll(".body.head")).toHaveLength(1);
    expect(page.findAll(".eye")).toHaveLength(2);
    expect(page.find(".apple circle").attributes("cx")).toBe("210");
    await press("ArrowRight");
    expect(game.apple.value).toEqual({ x: 11, y: 10 });
    await play(250);
    await press("s");
    await play(250);
    await page.find(".pad .left").trigger("click");
    await play(250);
    await page.find(".pad .up").trigger("click");
    await play(250);
    await page.find(".pad .down").trigger("click");
    await play(250);
    await page.find(".pad .right").trigger("click");
    await press("x"); // other keys do nothing
    await press("ArrowLeft", { metaKey: true });
    expect(game.apple.value).toEqual({ x: 11, y: 11 });
  });
});

describe("Requirement 4 and 5: the end, pause and records", () => {
  test("space pauses; when the apple is eaten the overlay shows the time; Enter plays again", async () => {
    expect(page.find(".best").text()).toBe("–");
    await press(" ");
    expect(page.find(".paused").exists()).toBe(true);
    await press(" ", { repeat: true }); // holding space doesn't unpause
    await press(" ");
    expect(page.find(".paused").exists()).toBe(false);
    await play(30_000);
    expect(page.find(".overlay strong").text()).toMatch(/^Eaten after \d:\d\d$/);
    expect(page.find(".overlay .meta").text()).toBe("your longest yet");
    expect(page.find(".best").text()).toMatch(/^\d:\d\d$/);
    await press("Enter");
    expect(page.find(".overlay").exists()).toBe(false);
    await play(30_000);
    expect(page.find(".overlay .meta").text()).toMatch(/^(your longest yet|best \d:\d\d)$/);
    await page.find(".again").trigger("click");
    expect(page.find(".time").text()).toBe("0:00");
  });

  test("a stuck snake shows that the apple wins", async () => {
    game.result.value = { status: "stuck", time: "1:05", isRecord: false };
    await page.vm.$nextTick();
    expect(page.find(".overlay strong").text()).toBe("The snake got itself stuck! The apple wins after 1:05");
    expect(page.find(".overlay .meta").text()).toBe("best –");
  });
});
