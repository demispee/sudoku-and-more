// The state of the sudoku page and what the player can do (.openspec/specs/001-sudoku).
// The rules are in Rust (game-core/src/sudoku.rs): this file keeps track of what is on
// the screen and asks the WebAssembly module what a move or step does.
import { computed, ref } from "vue";
import { formatTime } from "../format";
import { clearNotesAround as clearNotesIn, generate, randomSeed, solverStep } from "../wasm";

export const NEXT_PUZZLE_DELAY = 3000; // ms between solving a puzzle and the next one
export const GENERATE_BUDGET = 8000; // ms; after this, take the closest puzzle found
export const AUTO_SOLVE_INTERVAL = 700; // ms between the steps of "solve"
const CHUNK_DELAY = 20; // ms between generator attempts, so the page stays responsive

export const LEVELS = [
  "very easy", "easy", "medium", "pointing pairs", "pairs",
  "x-wing and triples", "expert", "master", "extreme", "fiendish",
];

// Board layout: cells are numbered 0-80, row by row
export const row = (i: number) => Math.floor(i / 9);
export const col = (i: number) => i % 9;

/** The digits in a notes bitmask (bit n set = note n) */
export const digitsOf = (mask: number) => [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(n => mask & (1 << n));

export { formatTime } from "../format";

interface Puzzle {
  puzzle: number[];
  solution: number[];
  level: number;
}

interface Job {
  level: number;
  result: Puzzle | null;
  done: boolean;
  onDone: ((result: Puzzle) => void) | null;
  cancelled: boolean;
}

export type Overlay =
  | { kind: "loading"; level: number }
  | { kind: "solved"; time: string; level: number; hints: number }
  | null;

export interface Message {
  label: string;
  text: string;
}

const MOVES: Record<string, number> = { ArrowUp: -9, ArrowDown: 9, ArrowLeft: -1, ArrowRight: 1 };

/** Where the page keeps the chosen level and the solved counter between visits */
export type Store = Pick<Storage, "getItem" | "setItem">;

export function useSudoku(store: Store = localStorage) {
  const chosenLevel = ref(Number(store.getItem("sudokuLevel")) || 5);
  const level = ref(0); // the level of the puzzle on the board
  const puzzle = ref<number[]>(new Array(81).fill(0));
  const solution = ref<number[]>(new Array(81).fill(0));
  const values = ref<number[]>(new Array(81).fill(0));
  const notes = ref<number[]>(new Array(81).fill(0)); // a bitmask per cell
  const hinted = ref(new Set<number>()); // filled in by the solver
  const selected = ref<number | null>(null);
  const notesMode = ref(false);
  const locked = ref(true);
  const hints = ref(0);
  const time = ref("0:00");
  const solvedCount = ref(Number(store.getItem("sudokuSolved")) || 0);
  const pattern = ref(new Set<number>()); // highlights of the last step
  const targets = ref(new Set<number>());
  const removed = ref<number[]>(new Array(81).fill(0)); // notes the last step crossed out
  const message = ref<Message | null>(null);
  const overlay = ref<Overlay>(null);
  const autoSolving = ref(false);
  const flash = ref({ cell: -1, count: 0 }); // the cell a step just filled in

  let startTime = 0;
  let nextJob: Job | null = null; // next puzzle, prepared in the background while you play
  let waitingJob: Job | null = null; // puzzle we are waiting for right now
  let nextGameTimer: ReturnType<typeof setTimeout> | undefined;
  let solveTimer: ReturnType<typeof setInterval> | undefined;
  let clockTimer: ReturnType<typeof setInterval> | undefined;

  /** Per digit, whether it is placed correctly 9 times (its pad button is dimmed) */
  const done = computed(() =>
    [1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => values.value.filter((v, i) => v === n && v === solution.value[i]).length === 9));

  // ---------- Generating ----------

  // Generating can take a second or more for some levels, so it runs in small chunks:
  // one attempt per tick, keeping the page responsive.
  function startJob(wanted: number): Job {
    const job: Job = { level: wanted, result: null, done: false, onDone: null, cancelled: false };
    const startedAt = Date.now();
    function attempt() {
      if (job.cancelled) return;
      const found = generate(wanted, randomSeed());
      if (found) {
        const result = { puzzle: Array.from(found.puzzle), solution: Array.from(found.solution), level: found.level };
        found.free();
        if (!job.result || Math.abs(result.level - wanted) < Math.abs(job.result.level - wanted)) job.result = result;
      }
      if (job.result && (job.result.level === wanted || Date.now() - startedAt > GENERATE_BUDGET)) {
        job.done = true;
        job.onDone?.(job.result);
      } else {
        setTimeout(attempt, CHUNK_DELAY);
      }
    }
    setTimeout(attempt, CHUNK_DELAY);
    return job;
  }

  function newGame() {
    clearTimeout(nextGameTimer);
    stopAutoSolve();
    if (waitingJob) waitingJob.cancelled = true;

    const wanted = chosenLevel.value;
    let job = nextJob && nextJob.level === wanted ? nextJob : null;
    if (nextJob && !job) nextJob.cancelled = true;
    nextJob = null;
    job ??= startJob(wanted);

    if (job.done) {
      startGame(job.result!);
    } else {
      waitingJob = job;
      job.onDone = startGame;
      locked.value = true;
      selected.value = null;
      overlay.value = { kind: "loading", level: wanted };
    }
  }

  function startGame(result: Puzzle) {
    waitingJob = null;
    puzzle.value = result.puzzle;
    solution.value = result.solution;
    level.value = result.level;
    values.value = result.puzzle.slice();
    notes.value = new Array(81).fill(0);
    hinted.value = new Set();
    selected.value = null;
    locked.value = false;
    hints.value = 0;
    startTime = Date.now();
    time.value = "0:00";
    overlay.value = null;
    message.value = null;
    clearMarks();
    nextJob = startJob(chosenLevel.value);
  }

  function setLevel(wanted: number) {
    chosenLevel.value = wanted;
    store.setItem("sudokuLevel", String(wanted));
    newGame();
  }

  // ---------- Playing ----------
  // Anything the player does stops auto-solve, even when it changes nothing

  function select(i: number) {
    stopAutoSolve();
    if (locked.value) return;
    selected.value = i;
  }

  function move(key: string) {
    const step = MOVES[key];
    if (step === undefined) return;
    stopAutoSolve();
    if (locked.value) return;
    if (selected.value === null) return select(0);
    const next = selected.value + step;
    const sameRow = row(next) === row(selected.value);
    if (next >= 0 && next < 81 && (Math.abs(step) === 9 || sameRow)) select(next);
  }

  function clearNotesAround(i: number, n: number) {
    notes.value = Array.from(clearNotesIn(Uint16Array.from(notes.value), i, n));
  }

  function enter(n: number) {
    stopAutoSolve();
    const i = selected.value;
    if (locked.value || i === null || puzzle.value[i]) return;
    clearMarks();
    message.value = null;

    if (notesMode.value && !values.value[i]) {
      notes.value[i] = notes.value[i]! ^ (1 << n);
    } else {
      values.value[i] = values.value[i] === n ? 0 : n;
      notes.value[i] = 0;
      hinted.value.delete(i);
      if (values.value[i] === solution.value[i]) clearNotesAround(i, n);
    }
    checkSolved();
  }

  function erase() {
    stopAutoSolve();
    const i = selected.value;
    if (locked.value || i === null || puzzle.value[i]) return;
    clearMarks();
    values.value[i] = 0;
    notes.value[i] = 0;
    hinted.value.delete(i);
  }

  function toggleNotes() {
    stopAutoSolve();
    notesMode.value = !notesMode.value;
  }

  // ---------- Step & solve ----------

  function clearMarks() {
    pattern.value = new Set();
    targets.value = new Set();
    removed.value = new Array(81).fill(0);
  }

  function stopAutoSolve() {
    clearInterval(solveTimer);
    solveTimer = undefined;
    autoSolving.value = false;
  }

  function toggleAutoSolve() {
    if (autoSolving.value) return stopAutoSolve();
    if (locked.value) return;
    autoSolving.value = true;
    takeStep();
    solveTimer = setInterval(takeStep, AUTO_SOLVE_INTERVAL);
  }

  function step() {
    if (locked.value) return;
    stopAutoSolve();
    takeStep();
  }

  // One number filled in, explained (see solver_step in game-core/src/sudoku.rs)
  function takeStep() {
    if (locked.value) return stopAutoSolve();
    clearMarks();
    const result = solverStep(
      Uint8Array.from(values.value), Uint16Array.from(notes.value), Uint8Array.from(solution.value), selected.value ?? -1);
    values.value = Array.from(result.values);
    notes.value = Array.from(result.notes);
    result.filled.forEach(i => hinted.value.add(i));
    const [cell] = result.filled;
    if (cell !== undefined) flash.value = { cell, count: flash.value.count + 1 };
    pattern.value = new Set(result.pattern);
    targets.value = new Set(result.targets);
    removed.value = Array.from(result.removed);
    if (result.counts) hints.value++;
    message.value = { label: `step \\ ${result.label}`, text: result.text };
    result.free();
    selected.value = null;
    checkSolved();
  }

  function checkSolved() {
    if (!values.value.every((v, i) => v === solution.value[i])) return;
    locked.value = true;
    selected.value = null;
    if (autoSolving.value) {
      // Solved by "solve": keep the board visible and don't count it
      stopAutoSolve();
      message.value = { label: "solver \\ done", text: "The solver finished this one. Press skip for a new puzzle." };
      return;
    }
    solvedCount.value++;
    store.setItem("sudokuSolved", String(solvedCount.value));
    overlay.value = { kind: "solved", time: formatTime(Date.now() - startTime), level: level.value, hints: hints.value };
    nextGameTimer = setTimeout(newGame, NEXT_PUZZLE_DELAY);
  }

  // ---------- Starting and stopping ----------

  function start() {
    clockTimer = setInterval(() => {
      if (!locked.value) time.value = formatTime(Date.now() - startTime);
    }, 250);
    newGame();
  }

  function stop() {
    clearInterval(clockTimer);
    clearTimeout(nextGameTimer);
    stopAutoSolve();
    if (waitingJob) waitingJob.cancelled = true;
    if (nextJob) nextJob.cancelled = true;
  }

  return {
    // state
    chosenLevel, level, puzzle, solution, values, notes, hinted, selected, notesMode, locked, hints,
    time, solvedCount, pattern, targets, removed, message, overlay, autoSolving, flash, done,
    // actions
    start, stop, newGame, setLevel, select, move, enter, erase, toggleNotes, step, toggleAutoSolve,
  };
}

export type Sudoku = ReturnType<typeof useSudoku>;
