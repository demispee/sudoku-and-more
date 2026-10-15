// Tests for .openspec/specs/008-flying-schubert/spec.md: the page, its field and keys.
// @vitest-environment jsdom
import { mount, type VueWrapper } from "@vue/test-utils";
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import FlyingPage from "../web/src/pages/FlyingPage.vue";
import { RESTART_DELAY, STEP, type FlyingGame } from "../web/src/flying/useFlying";
import { seedRandom } from "./helpers";
import { loadWasmForTests } from "./wasm-setup";

beforeAll(loadWasmForTests);

let frames: FrameRequestCallback[] = [];
let now = 0;
let page: VueWrapper;
let game: FlyingGame;

beforeEach(async () => {
  vi.useFakeTimers();
  seedRandom(4);
  localStorage.clear();
  frames = [];
  now = 0;
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => frames.push(cb));
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  page = mount(FlyingPage, { attachTo: document.body });
  game = (page.vm as unknown as { game: FlyingGame }).game;
  await page.vm.$nextTick();
});

afterEach(() => {
  page.unmount();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const frame = () => frames.shift()!((now += STEP));
const render = () => page.vm.$nextTick();
const key = (init: KeyboardEventInit) => {
  const event = new KeyboardEvent("keydown", { cancelable: true, ...init });
  window.dispatchEvent(event);
  return event;
};

/** Flaps whenever Schubert is below the middle of the next gap and falling */
function fly(until: () => boolean) {
  for (let k = 0; k < 20_000 && !until() && !game.over.value; k++) {
    const next = game.obstacles.value.find(o => o.x + 98 > 200)!;
    if (game.y.value > next.gapTop + 105 && game.vy.value > 0) game.flap();
    frame();
  }
}

describe("Requirement 1 and 5: the flight, start and game over", () => {
  test("before the first flap the page says how to fly", () => {
    expect(page.find(".overlay.start strong").text()).toBe("click or press space to fly");
    expect(page.find(".score").text()).toBe("0");
    expect(page.find(".best").text()).toBe("0");
  });

  test("a click or tap on the field flaps", async () => {
    await page.find("svg.field").trigger("pointerdown");
    expect(game.started.value).toBe(true);
    await render();
    expect(page.find(".overlay").exists()).toBe(false);
  });

  test("the space bar flaps; held down or with a modifier it doesn't", () => {
    expect(key({ key: " ", metaKey: true }).defaultPrevented).toBe(false);
    expect(key({ key: "Enter" }).defaultPrevented).toBe(false);
    const held = key({ key: " ", repeat: true });
    expect([held.defaultPrevented, game.started.value]).toEqual([true, false]);
    expect(key({ key: " " }).defaultPrevented).toBe(true);
    expect(game.started.value).toBe(true);
  });

  test("the end shows the score, and a new best", async () => {
    game.flap();
    fly(() => game.score.value >= 1);
    while (!game.over.value) frame();
    await render();
    expect(page.find(".overlay.end strong").text()).toBe("New best: 1 point");
    expect(page.find(".overlay.end .meta").text()).toBe("click or press space to fly again");
    for (let t = 0; t <= RESTART_DELAY; t += STEP) frame();
    game.flap();
    while (!game.over.value) frame();
    await render();
    expect(page.find(".overlay.end strong").text()).toBe("Game over: 0 points");
    expect(page.find(".best").text()).toBe("1");
  });
});

describe("Requirement 2: obstacles", () => {
  test("every obstacle is drawn at its place, both parts around the gap", async () => {
    const obstacles = page.findAll(".layer .obstacle");
    expect(obstacles).toHaveLength(game.obstacles.value.length);
    expect(obstacles[0]!.attributes("transform")).toBe(`translate(${game.obstacles.value[0]!.x} 0)`);
    const heights = obstacles[0]!.findAll("rect").map(r => Number(r.attributes("height")));
    expect(heights).toContain(game.obstacles.value[0]!.gapTop); // the post in the meadow
    game.flap();
    frame();
    await render();
    expect(page.findAll(".layer .obstacle")[0]!.attributes("transform")).toBe(`translate(${game.obstacles.value[0]!.x} 0)`);
  });
});

describe("Requirement 6: Schubert", () => {
  test("is the Schubert picture, 48 × 48, where the game says", () => {
    const image = page.find("image.schubert");
    expect(image.attributes("href")).toMatch(/schubert\.png$/);
    expect([image.attributes("x"), image.attributes("y"), image.attributes("width"), image.attributes("height")].map(Number))
      .toEqual([176, game.y.value - 24, 48, 48]);
    expect(image.attributes("transform")).toBe(`rotate(0 200 ${game.y.value})`);
  });

  test("tilts up when rising and down when falling, up to 25°", async () => {
    const tilt = () => Number(page.find("image.schubert").attributes("transform")!.match(/rotate\((-?[\d.]+)/)![1]);
    game.flap();
    await render();
    expect(tilt()).toBe(-22.5);
    for (let k = 0; k < 40; k++) frame();
    await render();
    expect(tilt()).toBe(25);
  });
});

describe("Requirement 7: landscapes", () => {
  test("the button chooses the landscape to start in, and lets go of the focus", async () => {
    const button = page.find("button.landscape");
    expect(button.text()).toBe("landscape \\ meadow");
    expect(page.find(".layer").classes()).toContain("meadow");
    (button.element as HTMLButtonElement).focus();
    await button.trigger("click");
    expect(button.text()).toBe("landscape \\ snowy mountains");
    expect(document.activeElement).not.toBe(button.element);
    expect(localStorage.getItem("flyingLandscape")).toBe("mountains");
  });

  test("a new landscape fades in over the old one, which then goes", async () => {
    await page.find("button.landscape").trigger("click");
    await render();
    const layers = page.findAll(".layer");
    expect(layers.map(l => l.classes().filter(c => c !== "layer"))).toEqual([["meadow"], ["mountains", "fade-in"]]);
    vi.advanceTimersByTime(1000);
    await render();
    expect(page.findAll(".layer").map(l => l.classes())).toEqual([["layer", "mountains"]]);
  });

  test("the background moves at a quarter of the obstacles' speed", async () => {
    game.flap();
    for (let k = 0; k < 10; k++) frame();
    await render();
    const far = page.find(".layer > g");
    expect(far.attributes("transform")).toBe(`translate(${-game.distance.value / 4} 0)`);
  });
});
