// The state of the shy squares page and what the player does (.openspec/specs/005-shy-squares).
// The squares' behaviour is in Rust (game-core/src/shy.rs).
import { ref } from "vue";
import { formatTime } from "../format";
import { ShyField, randomSeed } from "../wasm";

export const NEXT_LEVEL_DELAY = 3000; // ms between finishing a level and the next one
export const STEP = 1000 / 60; // ms per step of the squares: 60 a second, on any screen
export const LONGEST_FRAME = 250; // ms; a longer gap (a hidden tab) counts as this

export interface ShySquare {
  x: number;
  y: number;
  caught: boolean;
}

export interface LevelResult {
  level: number;
  time: string;
  isRecord: boolean;
}

/** Where the page keeps the best times between visits */
export type Store = Pick<Storage, "getItem" | "setItem">;

export function useShy(store: Store = localStorage) {
  const level = ref(1);
  const squares = ref<ShySquare[]>([]);
  const caught = ref(0);
  const time = ref("0:00");
  const result = ref<LevelResult | null>(null);
  const best = ref<Record<string, number>>(readBest());

  let field: ShyField | null = null;
  let cursor: { x: number; y: number } | null = null;
  let played = 0; // ms of this level, only while the page is visible
  let pending = 0; // ms not yet turned into steps
  let last: number | null = null; // the time of the last frame
  let frameId = 0;
  let nextLevelTimer: ReturnType<typeof setTimeout> | undefined;

  /** The saved best times; ones that can't be read are ignored */
  function readBest(): Record<string, number> {
    try {
      const saved: unknown = JSON.parse(store.getItem("shyBest") || "{}");
      if (!saved || typeof saved !== "object" || Array.isArray(saved)) return {};
      // Keep only the levels with a real time
      return Object.fromEntries(Object.entries(saved).filter(([, ms]) => Number.isFinite(ms) && ms > 0));
    } catch {
      return {};
    }
  }

  function read() {
    const values = field!.squares(); // x, y and caught for every square
    const list: ShySquare[] = [];
    for (let i = 0; i < values.length; i += 3) list.push({ x: values[i]!, y: values[i + 1]!, caught: values[i + 2] === 1 });
    squares.value = list;
    caught.value = field!.caught;
  }

  function startLevel(n: number) {
    clearTimeout(nextLevelTimer);
    field?.free();
    field = new ShyField(n, randomSeed());
    level.value = n;
    result.value = null;
    played = 0;
    pending = 0;
    time.value = "0:00";
    read();
  }

  function finish() {
    const ms = Math.round(played);
    const key = String(level.value);
    const previous = best.value[key];
    const isRecord = previous === undefined || ms < previous;
    if (isRecord) {
      best.value = { ...best.value, [key]: ms };
      store.setItem("shyBest", JSON.stringify(best.value));
    }
    result.value = { level: level.value, time: formatTime(ms), isRecord };
    nextLevelTimer = setTimeout(() => startLevel(level.value + 1), NEXT_LEVEL_DELAY);
  }

  /**
   * One animation frame: the time since the last frame becomes steps of 1/60 s, so the
   * squares move as fast on a 120 Hz screen as on a 60 Hz one. The level ends when all
   * are caught.
   */
  function frame(now: number) {
    if (field && !result.value) {
      // The first frame counts as one step, so the game starts moving at once
      const passed = last === null ? STEP : Math.min(Math.max(now - last, 0), LONGEST_FRAME);
      played += passed;
      pending += passed;
      while (pending >= STEP - 1e-6 && !field.done) { // 1000 / 60 isn't exact
        field.step(cursor?.x ?? 0, cursor?.y ?? 0, cursor !== null);
        pending -= STEP;
      }
      read();
      time.value = formatTime(Math.round(played));
      if (field.done) finish();
    }
    last = now;
    frameId = requestAnimationFrame(frame);
  }

  /** Where the cursor is, in field units (800 × 600), or null when it left the field */
  function setCursor(point: { x: number; y: number } | null) {
    cursor = point;
  }

  function restart() {
    startLevel(level.value);
  }

  const bestTime = (n: number) => {
    const ms = best.value[String(n)];
    return ms === undefined ? "–" : formatTime(ms);
  };

  function start() {
    startLevel(1);
    frameId = requestAnimationFrame(frame);
  }

  function stop() {
    cancelAnimationFrame(frameId);
    clearTimeout(nextLevelTimer);
    field?.free();
    field = null;
  }

  return {
    // state
    level, squares, caught, time, result, best,
    // actions
    start, stop, frame, setCursor, restart, bestTime,
    count: () => squares.value.length,
  };
}

export type ShyGame = ReturnType<typeof useShy>;
