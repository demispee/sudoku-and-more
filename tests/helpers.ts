// Shared helpers for tests that need a predictable game
import { vi } from "vitest";

/** Makes Math.random predictable (and so the seeds the pages pass to Rust) */
export function seedRandom(seed: number) {
  vi.spyOn(Math, "random").mockImplementation(() => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  });
}

/** A store like localStorage, kept in memory */
export function memoryStore(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  };
}

/** Advances fake timers in small steps until `done()` is true */
export function runUntil(done: () => boolean, maxMs = 20_000, stepMs = 20) {
  for (let t = 0; t < maxMs && !done(); t += stepMs) vi.advanceTimersByTime(stepMs);
  if (!done()) throw new Error("timed out");
}
