// The state of the reverse snake page and what the player does (.openspec/specs/006-reverse-snake).
// The snake and the rules are in Rust (game-core/src/snake.rs).
import { ref } from "vue";
import { formatTime } from "../format";
import { ReverseSnake } from "../wasm";

export const UP = 0;
export const RIGHT = 1;
export const DOWN = 2;
export const LEFT = 3;

export interface Point {
  x: number;
  y: number;
}

export interface SnakeResult {
  /** "eaten": the snake won; "stuck": the apple won */
  status: "eaten" | "stuck";
  time: string;
  isRecord: boolean;
}

/** Where the page keeps the longest survival between visits */
export type Store = Pick<Storage, "getItem" | "setItem">;

export function useSnake(store: Store = localStorage) {
  let game = new ReverseSnake();
  const snake = ref<Point[]>([]);
  const apple = ref<Point>({ x: 0, y: 0 });
  const time = ref("0:00");
  const paused = ref(false);
  const result = ref<SnakeResult | null>(null);
  const best = ref<number | null>(Number(store.getItem("snakeBest")) || null);

  let frameId = 0;
  let last: number | null = null;

  function read() {
    const cells = game.snake(); // x and y of every cell, head first
    const list: Point[] = [];
    for (let i = 0; i < cells.length; i += 2) list.push({ x: cells[i]!, y: cells[i + 1]! });
    snake.value = list;
    apple.value = { x: game.appleX, y: game.appleY };
    time.value = formatTime(game.elapsed);
  }

  function finish() {
    const ms = game.elapsed;
    const isRecord = best.value === null || ms > best.value;
    if (isRecord) {
      best.value = ms;
      store.setItem("snakeBest", String(ms));
    }
    result.value = { status: game.status as SnakeResult["status"], time: formatTime(ms), isRecord };
  }

  /** One animation frame: the time since the last frame passes in the game */
  function frame(now: number) {
    if (last !== null && !paused.value && !result.value) {
      game.update(Math.min(now - last, 250)); // after a hidden tab, don't jump ahead
      read();
      if (game.status !== "playing") finish();
    }
    last = now;
    frameId = requestAnimationFrame(frame);
  }

  function steer(direction: number) {
    if (paused.value || result.value) return;
    game.steer(direction);
    read();
  }

  function togglePause() {
    if (!result.value) paused.value = !paused.value;
  }

  function again() {
    game.free();
    game = new ReverseSnake();
    result.value = null;
    paused.value = false;
    read();
  }

  function start() {
    read();
    frameId = requestAnimationFrame(frame);
  }

  function stop() {
    cancelAnimationFrame(frameId);
    game.free();
  }

  return {
    // state
    snake, apple, time, paused, result, best,
    // actions
    start, stop, frame, steer, togglePause, again,
  };
}

export type SnakeGame = ReturnType<typeof useSnake>;
