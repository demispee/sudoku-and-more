// The state of the spot-the-difference page and what the player can do
// (.openspec/specs/002-spot-the-difference). The rules are in Rust (game-core/src/spot.rs);
// the drawings are in web/src/scenes/.
import { computed, ref } from "vue";
import { formatTime } from "../format";
import { SCENES, type Difference, type Scene } from "../scenes";
import {
  SceneOrder, changedSide as pickChangedSide, findHit, hintPenalty, hitsFound, missPenalty, pickDifferences,
  pickHint, randomSeed, recordKey, totalTime,
} from "../wasm";

export const NEXT_ROUND_DELAY = 3500; // ms between finishing a round and the next one
export const MISS_MARK_TIME = 900; // ms a miss stays visible
export const HINT_MARK_TIME = 2500; // ms a hint circle stays visible
export const COUNTS = [
  { count: 5, name: "easy" },
  { count: 7, name: "normal" },
  { count: 10, name: "hard" },
];

/** Something drawn over a picture; `side` is 0 or 1 for one picture, undefined for both */
export interface Mark {
  id: number;
  kind: "found" | "miss" | "hint" | "revealed";
  x: number;
  y: number;
  r: number;
  side?: number;
}

export interface Result {
  isRecord: boolean;
  time: string;
  count: number;
  misses: number;
  hints: number;
  /** The record before this round, when this round didn't beat it */
  previous: string | null;
}

/** Where the page keeps the settings, records and solved counter between visits */
export type Store = Pick<Storage, "getItem" | "setItem">;

export function useSpot(store: Store = localStorage, scenes: Scene[] = SCENES) {
  const MISS_PENALTY = missPenalty();
  const HINT_PENALTY = hintPenalty();

  const savedCount = Number(store.getItem("spotCount"));
  const count = ref([5, 7, 10].includes(savedCount) ? savedCount : 7);
  const scene = ref<Scene | null>(null);
  const active = ref<Difference[]>([]); // the differences in this round
  const changedSide = ref(0);
  const found = ref(new Set<string>()); // ids that have been found
  const misses = ref(0);
  const hints = ref(0);
  const locked = ref(true);
  const time = ref("0:00");
  const solvedCount = ref(Math.max(0, Math.floor(Number(store.getItem("spotSolved")))) || 0);

  /** The saved records; ones that can't be read are ignored */
  function readRecords(): Record<string, number> {
    try {
      const saved: unknown = JSON.parse(store.getItem("spotRecords") || "{}");
      if (!saved || typeof saved !== "object" || Array.isArray(saved)) return {};
      return Object.fromEntries(Object.entries(saved).filter(([, ms]) => Number.isFinite(ms) && ms > 0));
    } catch {
      return {};
    }
  }
  const records = ref<Record<string, number>>(readRecords());
  const marks = ref<Mark[]>([]);
  const message = ref("");
  const result = ref<Result | null>(null);

  const order = new SceneOrder(scenes.length, randomSeed());
  let startTime = 0;
  let nextMark = 0;
  let nextRoundTimer: ReturnType<typeof setTimeout> | undefined;
  let clockTimer: ReturnType<typeof setInterval> | undefined;
  const markTimers = new Set<ReturnType<typeof setTimeout>>();

  const key = () => recordKey(scene.value!.name, active.value.length);
  const elapsed = () => totalTime(Date.now() - startTime, misses.value, hints.value);

  /** The SVG of the left and the right picture; only the changed one shows the differences */
  const pictures = computed(() => {
    if (!scene.value) return ["", ""];
    const ids = new Set(active.value.map(d => d.id));
    const changed = scene.value.draw(id => ids.has(id));
    const plain = scene.value.draw(() => false);
    return changedSide.value === 0 ? [changed, plain] : [plain, changed];
  });

  const record = computed(() => {
    if (!scene.value) return "–";
    const best = records.value[key()];
    return best === undefined ? "–" : formatTime(best);
  });

  function addMark(mark: Omit<Mark, "id">, removeAfter?: number) {
    const id = nextMark++;
    marks.value.push({ ...mark, id });
    if (removeAfter) {
      const timer = setTimeout(() => {
        marks.value = marks.value.filter(m => m.id !== id);
        markTimers.delete(timer);
      }, removeAfter);
      markTimers.add(timer);
    }
  }

  /** Differences cross to WebAssembly as parallel lists of x, y, radius and found */
  function circles(): [Float64Array, Float64Array, Float64Array, Uint8Array] {
    const list = active.value;
    return [
      Float64Array.from(list, d => d.x),
      Float64Array.from(list, d => d.y),
      Float64Array.from(list, d => d.r),
      Uint8Array.from(list, d => (found.value.has(d.id) ? 1 : 0)),
    ];
  }

  function newRound(sameScene = false) {
    clearTimeout(nextRoundTimer);
    markTimers.forEach(clearTimeout);
    markTimers.clear();
    if (!sameScene || !scene.value) scene.value = scenes[order.next()]!;
    const all = scene.value.differences;
    active.value = Array.from(pickDifferences(all.length, count.value, randomSeed()), i => all[i]!);
    changedSide.value = pickChangedSide(randomSeed());
    found.value = new Set();
    misses.value = 0;
    hints.value = 0;
    marks.value = [];
    locked.value = false;
    startTime = Date.now();
    time.value = "0:00";
    result.value = null;
    message.value = "Click a difference in either picture.";
  }

  function setCount(wanted: number) {
    count.value = wanted;
    store.setItem("spotCount", String(wanted));
    newRound(true);
  }

  /** A click at (x, y) in picture units (800 × 600) on picture `side` */
  function click(side: number, x: number, y: number) {
    if (locked.value) return;
    const i = findHit(...circles(), x, y);
    if (i >= 0) {
      const hit = active.value[i]!;
      found.value.add(hit.id);
      addMark({ kind: "found", x: hit.x, y: hit.y, r: hit.r });
      message.value = found.value.size < active.value.length ? "Found one." : "";
      if (found.value.size === active.value.length) finishRound();
      return;
    }
    if (hitsFound(...circles(), x, y)) return; // clicking a found difference is no mistake
    misses.value++;
    time.value = formatTime(elapsed()); // the penalty shows at once
    addMark({ kind: "miss", x, y, r: 0, side }, MISS_MARK_TIME);
    message.value = `No difference there. That costs ${MISS_PENALTY / 1000} seconds.`;
  }

  function hint() {
    if (locked.value) return;
    const remaining = active.value.filter(d => !found.value.has(d.id));
    const d = remaining[pickHint(remaining.length, randomSeed())]!;
    hints.value++;
    time.value = formatTime(elapsed());
    addMark({ kind: "hint", x: d.x, y: d.y, r: d.r }, HINT_MARK_TIME);
    message.value = `Look inside the orange circle… (+${HINT_PENALTY / 1000} seconds)`;
  }

  // Give up: show where the remaining differences were
  function reveal() {
    if (locked.value) return;
    locked.value = true;
    const remaining = active.value.filter(d => !found.value.has(d.id));
    remaining.forEach(d => addMark({ kind: "revealed", x: d.x, y: d.y, r: d.r }));
    message.value = `Here are the last ${remaining.length}. Press next for a new picture.`;
  }

  function finishRound() {
    locked.value = true;
    solvedCount.value++;
    store.setItem("spotSolved", String(solvedCount.value));

    const ms = elapsed();
    time.value = formatTime(ms);
    const previous = records.value[key()];
    const isRecord = previous === undefined || ms < previous;
    if (isRecord) {
      records.value[key()] = ms;
      store.setItem("spotRecords", JSON.stringify(records.value));
    }
    result.value = {
      isRecord,
      time: formatTime(ms),
      count: active.value.length,
      misses: misses.value,
      hints: hints.value,
      previous: isRecord ? null : formatTime(previous!),
    };
    nextRoundTimer = setTimeout(newRound, NEXT_ROUND_DELAY);
  }

  function start() {
    clockTimer = setInterval(() => {
      if (!locked.value) time.value = formatTime(elapsed());
    }, 250);
    newRound();
  }

  function stop() {
    clearInterval(clockTimer);
    clearTimeout(nextRoundTimer);
    markTimers.forEach(clearTimeout);
    order.free();
  }

  return {
    // state
    count, scene, active, changedSide, found, misses, hints, locked, time, solvedCount, record,
    marks, message, result, pictures, missPenalty: MISS_PENALTY,
    // actions
    start, stop, newRound, setCount, click, hint, reveal,
  };
}

export type Spot = ReturnType<typeof useSpot>;
