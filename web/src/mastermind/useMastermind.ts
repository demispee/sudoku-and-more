// The state of the Mastermind page and what the player does (.openspec/specs/007-mastermind).
// The code, the answer pegs and the levels are in Rust (game-core/src/mastermind.rs).
import { computed, ref } from "vue";
import { Mastermind, mastermindLevels, mastermindRows, randomSeed } from "../wasm";
import { palette, PALETTES } from "./palettes";

export interface Row {
  /** A colour per hole, or null for an empty hole */
  pegs: (number | null)[];
  /** [black, white] once the row is checked */
  answer: [number, number] | null;
}

export interface MastermindResult {
  won: boolean;
  /** The rows used */
  rows: number;
  isRecord: boolean;
}

export interface Level {
  holes: number;
  colours: number;
}

/** Where the page keeps the level, palette and best results between visits */
export type Store = Pick<Storage, "getItem" | "setItem">;

/** The levels from Rust: classic, then hard */
export function levels(): Level[] {
  const pairs = Array.from(mastermindLevels());
  const list: Level[] = [];
  for (let i = 0; i < pairs.length; i += 2) list.push({ holes: pairs[i]!, colours: pairs[i + 1]! });
  return list;
}

const bestKey = (level: number) => (level === 0 ? "mastermindBest" : "mastermindBest5x8");

export function useMastermind(store: Store = localStorage, seed: () => number = randomSeed) {
  const LEVELS = levels();
  const ROWS = mastermindRows();
  const level = ref(Number(store.getItem("mastermindLevel")) === 1 ? 1 : 0);
  const paletteName = ref(palette(store.getItem("mastermindPalette")).name);
  const symbols = ref(store.getItem("mastermindSymbols") === "on");
  let game = new Mastermind(seed(), level.value);

  const shape = computed(() => LEVELS[level.value]!);
  const emptyRows = (): Row[] =>
    Array.from({ length: ROWS }, () => ({ pegs: Array<number | null>(shape.value.holes).fill(null), answer: null }));

  const rows = ref<Row[]>(emptyRows());
  const current = ref(0);
  const code = ref<number[] | null>(null);
  const result = ref<MastermindResult | null>(null);
  const best = ref<number | null>(null);
  /** The last colour placed, counted, so the tray can show every click */
  const lastColour = ref<{ colour: number; count: number } | null>(null);
  const colours = computed(() => palette(paletteName.value).colours.slice(0, shape.value.colours));
  /** The holes of the open row, in the order they were filled */
  let placed: number[] = [];

  const readBest = () => (best.value = Number(store.getItem(bestKey(level.value))) || null);
  readBest();

  const open = () => rows.value[current.value]!;
  const full = computed(() => !result.value && open().pegs.every(p => p !== null));

  /** A click on a colour, or its number key: the colour goes in the first empty hole */
  function place(colour: number) {
    if (result.value || colour < 0 || colour >= shape.value.colours) return;
    const hole = open().pegs.indexOf(null);
    if (hole < 0) return;
    open().pegs[hole] = colour;
    placed.push(hole);
    lastColour.value = { colour, count: (lastColour.value?.count ?? 0) + 1 };
  }

  /** A click on a peg of the open row takes it out again */
  function takeOut(hole: number) {
    if (result.value || open().pegs[hole] == null) return;
    open().pegs[hole] = null;
    placed = placed.filter(h => h !== hole);
  }

  /** Backspace: takes out the last peg placed */
  function back() {
    const hole = placed.pop();
    if (hole !== undefined && !result.value) open().pegs[hole] = null;
  }

  function check() {
    if (!full.value) return;
    const row = open();
    const answer = game.check(Uint8Array.from(row.pegs as number[]));
    row.answer = [answer[0]!, answer[1]!];
    placed = [];
    if (game.status === "playing") current.value++;
    else finish();
  }

  function finish() {
    code.value = Array.from(game.code());
    const won = game.status === "won";
    const used = current.value + 1;
    const isRecord = won && (best.value === null || used < best.value);
    if (isRecord) {
      best.value = used;
      store.setItem(bestKey(level.value), String(used));
    }
    result.value = { won, rows: used, isRecord };
  }

  function again() {
    game.free();
    game = new Mastermind(seed(), level.value);
    rows.value = emptyRows();
    current.value = 0;
    code.value = null;
    result.value = null;
    lastColour.value = null;
    placed = [];
  }

  /** Another level starts a new game */
  function setLevel(next: number) {
    if (next === level.value || !LEVELS[next]) return;
    level.value = next;
    store.setItem("mastermindLevel", String(next));
    readBest();
    again();
  }

  /** The next palette; it only changes how the pegs look */
  function nextPalette() {
    const i = PALETTES.findIndex(p => p.name === paletteName.value);
    paletteName.value = PALETTES[(i + 1) % PALETTES.length]!.name;
    store.setItem("mastermindPalette", paletteName.value);
  }

  /** Shapes on the colours, or not */
  function toggleSymbols() {
    symbols.value = !symbols.value;
    store.setItem("mastermindSymbols", symbols.value ? "on" : "off");
  }

  function stop() {
    game.free();
  }

  return {
    // state
    level, shape, paletteName, colours, symbols, rows, current, code, result, best, full, lastColour,
    // actions
    place, takeOut, back, check, again, setLevel, nextPalette, toggleSymbols, stop,
  };
}

export type MastermindGame = ReturnType<typeof useMastermind>;
