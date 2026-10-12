// Tests for .openspec/specs/002-spot-the-difference/spec.md, Requirement 1: the scene
// drawings, which belong with the interface (ADR-0007). The rules are tested in Rust
// (game-core/src/spot.rs) and in tests/use-spot.test.ts.
import { describe, expect, test } from "vitest";
import { SCENES, seeded } from "../web/src/scenes";

const none = () => false;
const MIN_RADIUS = 10; // picture units; a difference smaller than this is too hard to see

describe("Requirement 1: scenes", () => {
  test("every scene has its own name", () => {
    expect(new Set(SCENES.map(s => s.name)).size).toBe(SCENES.length);
  });

  test("the first five scenes and their differences", () => {
    expect(SCENES.map(s => [s.name, s.differences.length])).toEqual([
      ["Champagne & Diamonds", 12],
      ["The Peacock", 10],
      ["Perfume & Pearls", 10],
      ["The Swan", 11],
      ["Cocktails & Disco Ball", 11],
    ]);
  });

  describe.each(SCENES)("$name", scene => {
    test("has 10 to 12 differences, each with its own id", () => {
      const ids = scene.differences.map(d => d.id);
      expect(ids.length).toBeGreaterThanOrEqual(10);
      expect(ids.length).toBeLessThanOrEqual(12);
      expect(new Set(ids).size).toBe(ids.length);
    });

    test("every difference is big enough and lies wholly inside the picture", () => {
      for (const d of scene.differences) {
        expect(d.r, d.id).toBeGreaterThanOrEqual(MIN_RADIUS);
        expect(d.x - d.r, d.id).toBeGreaterThanOrEqual(0);
        expect(d.y - d.r, d.id).toBeGreaterThanOrEqual(0);
        expect(d.x + d.r, d.id).toBeLessThanOrEqual(800);
        expect(d.y + d.r, d.id).toBeLessThanOrEqual(600);
      }
    });

    test("no two differences overlap, so a click is never ambiguous", () => {
      const list = scene.differences;
      for (const [i, a] of list.entries()) {
        for (const b of list.slice(i + 1)) {
          expect(Math.hypot(a.x - b.x, a.y - b.y), `${a.id} and ${b.id}`).toBeGreaterThanOrEqual(a.r + b.r);
        }
      }
    });

    test("without differences, both pictures come out exactly the same", () => {
      expect(scene.draw(none)).toBe(scene.draw(none));
    });

    test("every difference changes the picture", () => {
      const plain = scene.draw(none);
      for (const d of scene.differences) {
        expect(scene.draw(id => id === d.id), d.id).not.toBe(plain);
      }
    });

    test("all differences can be shown at once", () => {
      expect(scene.draw(() => true)).toContain("<");
    });
  });

  test("the seeded generator repeats itself for the same seed", () => {
    const a = seeded(7), b = seeded(7);
    const first = [a(), a(), a()];
    expect([b(), b(), b()]).toEqual(first);
    for (const v of first) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});
