// The state of the Mastermind page and what the player does (.openspec/specs/007-mastermind).
// The code and the answer pegs are in Rust (game-core/src/mastermind.rs).
import { computed, ref } from "vue";
import { Mastermind, mastermindShape, randomSeed } from "../wasm";

export interface Row {
  /** A colour (0–5) per hole, or null for an empty hole */
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

/** Where the page keeps the best result between visits */
export type Store = Pick<Storage, "getItem" | "setItem">;

export function useMastermind(store: Store = localStorage, seed: () => number = randomSeed) {
  const [HOLES, COLOURS, ROWS] = Array.from(mastermindShape()) as [number, number, number];
  let game = new Mastermind(seed());
  const emptyRows = (): Row[] =>
    Array.from({ length: ROWS }, () => ({ pegs: Array<number | null>(HOLES).fill(null), answer: null }));

  const rows = ref<Row[]>(emptyRows());
  const current = ref(0);
  const selected = ref(0);
  const code = ref<number[] | null>(null);
  const result = ref<MastermindResult | null>(null);
  const best = ref<number | null>(Number(store.getItem("mastermindBest")) || null);
  /** The holes of the open row, in the order they were filled */
  let placed: number[] = [];

  const open = () => rows.value[current.value]!;
  const full = computed(() => !result.value && open().pegs.every(p => p !== null));

  function put(hole: number, colour: number) {
    open().pegs[hole] = colour;
    placed = [...placed.filter(h => h !== hole), hole];
  }

  /** Chooses a colour in the peg tray */
  function pick(colour: number) {
    if (colour >= 0 && colour < COLOURS) selected.value = colour;
  }

  /** A click on a hole of the open row: places the chosen colour, or takes the peg out */
  function tapHole(hole: number) {
    if (result.value || hole < 0 || hole >= HOLES) return;
    if (open().pegs[hole] === null) {
      put(hole, selected.value);
    } else {
      open().pegs[hole] = null;
      placed = placed.filter(h => h !== hole);
    }
  }

  /** Keys 1–6: the colour goes in the first empty hole */
  function typeColour(colour: number) {
    if (result.value || colour < 0 || colour >= COLOURS) return;
    pick(colour);
    const hole = open().pegs.indexOf(null);
    if (hole >= 0) put(hole, colour);
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
      store.setItem("mastermindBest", String(used));
    }
    result.value = { won, rows: used, isRecord };
  }

  function again() {
    game.free();
    game = new Mastermind(seed());
    rows.value = emptyRows();
    current.value = 0;
    code.value = null;
    result.value = null;
    placed = [];
  }

  function stop() {
    game.free();
  }

  return {
    // state
    rows, current, selected, code, result, best, full,
    // actions
    pick, tapHole, typeColour, back, check, again, stop,
  };
}

export type MastermindGame = ReturnType<typeof useMastermind>;
