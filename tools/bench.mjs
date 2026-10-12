// Measures how long the sudoku generator needs per level, the way the page does it:
// attempts with fresh seeds until the level is found or 8 seconds have passed.
import { readFileSync } from "node:fs";
import init, { generate } from "../game-core/pkg/game_core.js";
await init({ module_or_path: readFileSync("game-core/pkg/game_core_bg.wasm") });
let seed = 1;
console.log("level  puzzles  median ms  slowest ms  attempts/puzzle  hit the level");
for (let level = 1; level <= 10; level++) {
  const times = [], attempts = []; let hits = 0;
  for (let p = 0; p < 15; p++) {
    const start = performance.now(); let best = null, n = 0;
    while (performance.now() - start < 8000) {
      n++; const r = generate(level, seed++);
      if (r && (!best || Math.abs(r.level - level) < Math.abs(best - level))) best = r.level;
      r?.free();
      if (best === level) break;
    }
    times.push(performance.now() - start); attempts.push(n); if (best === level) hits++;
  }
  times.sort((a, b) => a - b);
  console.log(`${String(level).padStart(5)}  ${String(times.length).padStart(7)}  ${times[7].toFixed(0).padStart(9)}  ${times.at(-1).toFixed(0).padStart(10)}  ${(attempts.reduce((a, b) => a + b) / attempts.length).toFixed(1).padStart(15)}  ${hits}/15`);
}
