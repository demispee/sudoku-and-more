// The state of the shy squares page and what the player does (.openspec/specs/005-shy-squares).
// The squares' behaviour is in Rust (game-core/src/shy.rs).
import { ref } from "vue";
import { formatTime } from "../format";
import { ShyField, randomSeed } from "../wasm";

export const NEXT_LEVEL_DELAY = 3000; // ms between finishing a level and the next one

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
  const best = ref<Record<string, number>>(JSON.parse(store.getItem("shyBest") || "{}"));

  let field: ShyField | null = null;
  let cursor: { x: number; y: number } | null = null;
  let startTime = 0;
  let frameId = 0;
  let nextLevelTimer: ReturnType<typeof setTimeout> | undefined;

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
    startTime = Date.now();
    time.value = "0:00";
    read();
  }

  function finish() {
    const ms = Date.now() - startTime;
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

  /** One frame: the squares move, and the level ends when all are caught */
  function frame() {
    if (field && !result.value) {
      field.step(cursor?.x ?? 0, cursor?.y ?? 0, cursor !== null);
      read();
      time.value = formatTime(Date.now() - startTime);
      if (field.done) finish();
    }
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
    frame();
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
