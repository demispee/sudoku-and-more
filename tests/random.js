import { vi } from "vitest";

// Makes Math.random predictable, so tests that generate puzzles or rounds give the
// same result every run. Restored automatically by vi.restoreAllMocks().
export function seedRandom(seed) {
  vi.spyOn(Math, "random").mockImplementation(() => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  });
}
