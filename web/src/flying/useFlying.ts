// The state of the Flying Schubert page and what the player does
// (.openspec/specs/008-flying-schubert). How Schubert and the obstacles move is in Rust
// (game-core/src/flying.rs).
import { ref } from "vue";
import { FlyingField, flyingLandscape, randomSeed } from "../wasm";
import { LANDSCAPES } from "./landscapes";

export const STEP = 1000 / 60; // ms per step: 60 a second, on any screen
export const RESTART_DELAY = 500; // ms after the end before a flap starts a new game

export interface Obstacle {
  x: number;
  gapTop: number;
}

/** Where the page keeps the best score and the chosen landscape between visits */
export type Store = Pick<Storage, "getItem" | "setItem">;

export function useFlying(store: Store = localStorage, page: Pick<Document, "hidden" | "addEventListener" | "removeEventListener"> = document) {
  const y = ref(0);
  const vy = ref(0);
  const obstacles = ref<Obstacle[]>([]);
  const score = ref(0);
  const distance = ref(0);
  const started = ref(false);
  const over = ref(false);
  const isRecord = ref(false);
  const best = ref(readBest());
  const chosen = ref(readLandscape()); // the landscape a game starts in
  const landscape = ref(chosen.value); // the one Schubert flies in now

  let field: FlyingField | null = null;
  let pending = 0; // ms not yet turned into steps
  let sinceOver = 0; // ms since the game ended
  let last: number | null = null; // the time of the last frame
  let frameId = 0;

  /** The saved best score; one that can't be read is ignored */
  function readBest(): number {
    const saved = Number(store.getItem("flyingBest"));
    return Number.isInteger(saved) && saved > 0 ? saved : 0;
  }

  function readLandscape(): number {
    const i = LANDSCAPES.findIndex(l => l.name === store.getItem("flyingLandscape"));
    return Math.max(i, 0);
  }

  function read() {
    const f = field!;
    y.value = f.y;
    vy.value = f.vy;
    score.value = f.score;
    distance.value = f.distance;
    started.value = f.started;
    over.value = f.over;
    const values = f.obstacles();
    const list: Obstacle[] = [];
    for (let i = 0; i < values.length; i += 2) list.push({ x: values[i]!, gapTop: values[i + 1]! });
    obstacles.value = list;
    landscape.value = flyingLandscape(chosen.value, f.score);
  }

  function newGame() {
    field?.free();
    field = new FlyingField(randomSeed());
    pending = 0;
    sinceOver = 0;
    isRecord.value = false;
    read();
  }

  function finish() {
    isRecord.value = score.value > best.value;
    if (isRecord.value) {
      best.value = score.value;
      store.setItem("flyingBest", String(best.value));
    }
  }

  /** A click, tap or the space bar; after the end, it starts a new game */
  function flap() {
    if (!field) return;
    if (field.over) {
      if (sinceOver < RESTART_DELAY) return;
      newGame();
    }
    field.flap();
    read();
  }

  /**
   * One animation frame: the time since the last frame becomes steps of 1/60 s, so the
   * game is as fast on a 120 Hz screen as on a 60 Hz one.
   */
  function frame(now: number) {
    if (field) {
      // The first frame, and the first after the page was hidden, count as one step
      const passed = last === null ? STEP : Math.max(now - last, 0);
      if (field.over) {
        sinceOver += passed;
      } else {
        pending += passed;
        while (pending >= STEP - 1e-6 && !field.over) { // 1000 / 60 isn't exact
          field.step();
          pending -= STEP;
        }
        read();
        if (field.over) finish();
      }
    }
    last = now;
    frameId = requestAnimationFrame(frame);
  }

  /** A hidden page gets no frames; when it comes back, the game goes on where it was */
  function onVisibility() {
    if (page.hidden) last = null;
  }

  /** The next landscape to start in; a game in flight switches to it at once */
  function nextLandscape() {
    chosen.value = (chosen.value + 1) % LANDSCAPES.length;
    store.setItem("flyingLandscape", LANDSCAPES[chosen.value]!.name);
    if (field) landscape.value = flyingLandscape(chosen.value, field.score);
  }

  function start() {
    newGame();
    page.addEventListener("visibilitychange", onVisibility);
    frameId = requestAnimationFrame(frame);
  }

  function stop() {
    cancelAnimationFrame(frameId);
    page.removeEventListener("visibilitychange", onVisibility);
    field?.free();
    field = null;
  }

  return {
    // state
    y, vy, obstacles, score, distance, started, over, isRecord, best, chosen, landscape,
    // actions
    start, stop, frame, flap, nextLandscape,
  };
}

export type FlyingGame = ReturnType<typeof useFlying>;
