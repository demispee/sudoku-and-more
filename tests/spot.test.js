// Tests for .openspec/specs/002-spot-the-difference/spec.md, Requirement 1: the scene
// drawings, which stay in JavaScript (ADR-0006). The other rules are tested in Rust
// (game-core/src/spot.rs).
import { describe, expect, test } from "vitest";
import { SCENES, seeded } from "../src/spot-scenes.js";

const none = () => false;

describe("Requirement 1: scenes", () => {
  test("there are five scenes with 10 to 12 possible differences each", () => {
    expect(SCENES.map(s => [s.name, s.differences.length])).toEqual([
      ["Champagne & Diamonds", 12],
      ["The Peacock", 10],
      ["Perfume & Pearls", 10],
      ["The Swan", 11],
      ["Cocktails & Disco Ball", 11],
    ]);
  });

  describe.each(SCENES)("$name", scene => {
    test("every difference has its own id and lies inside the picture", () => {
      const ids = scene.differences.map(d => d.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const d of scene.differences) {
        expect(d.x).toBeGreaterThanOrEqual(0);
        expect(d.x).toBeLessThanOrEqual(800);
        expect(d.y).toBeGreaterThanOrEqual(0);
        expect(d.y).toBeLessThanOrEqual(600);
        expect(d.r).toBeGreaterThan(0);
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
    first.forEach(v => expect(v).toBeGreaterThanOrEqual(0) && expect(v).toBeLessThan(1));
  });
});
