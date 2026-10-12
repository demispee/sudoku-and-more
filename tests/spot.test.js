// Tests for .openspec/specs/002-spot-the-difference/spec.md
import { afterEach, describe, expect, test, vi } from "vitest";
import { seedRandom } from "./random.js";
import { SCENES, seeded } from "../src/spot-scenes.js";
import {
  CLICK_MARGIN, findHit, hitsFound, pickDifferences, recordKey, sceneOrder, totalTime,
} from "../src/spot.js";

afterEach(() => vi.restoreAllMocks());

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

describe("Requirement 2: scene order", () => {
  test("shows every scene once before any repeats", () => {
    seedRandom(1);
    const next = sceneOrder(SCENES);
    const firstFive = [...Array(5)].map(next);
    expect(new Set(firstFive).size).toBe(5);
  });

  test("never shows the same scene twice in a row", () => {
    for (let seed = 0; seed < 20; seed++) {
      seedRandom(seed);
      const next = sceneOrder(SCENES);
      let previous = next();
      for (let k = 0; k < 30; k++) {
        const scene = next();
        expect(scene).not.toBe(previous);
        previous = scene;
      }
      vi.restoreAllMocks();
    }
  });
});

describe("Requirement 3: rounds", () => {
  test.each([5, 7, 10])("a round picks %i different differences from the scene", count => {
    seedRandom(count);
    const scene = SCENES[0];
    const active = pickDifferences(scene, count);
    expect(active).toHaveLength(count);
    expect(new Set(active.map(d => d.id)).size).toBe(count);
    active.forEach(d => expect(scene.differences).toContain(d));
  });

  test("leaves the scene's own list untouched", () => {
    const before = SCENES[1].differences.slice();
    pickDifferences(SCENES[1], 5);
    expect(SCENES[1].differences).toEqual(before);
  });
});

describe("Requirement 4: clicking", () => {
  const a = { id: "a", x: 100, y: 100, r: 20 };
  const b = { id: "b", x: 150, y: 100, r: 20 };
  const active = [a, b];

  test("a click within the radius plus the margin counts", () => {
    expect(findHit(active, new Set(), 100 + 20 + CLICK_MARGIN, 100)).toBe(b);
    expect(findHit(active, new Set(), 100, 100 + 20 + CLICK_MARGIN)).toBe(a);
  });

  test("a click just outside does not", () => {
    expect(findHit(active, new Set(), 100, 100 + 20 + CLICK_MARGIN + 1)).toBeUndefined();
  });

  test("picks the closest difference when two are in reach", () => {
    expect(findHit(active, new Set(), 120, 100)).toBe(a);
    expect(findHit(active, new Set(), 130, 100)).toBe(b);
  });

  test("a difference that was already found can't be found again", () => {
    const found = new Set(["a"]);
    expect(findHit(active, found, 100, 100)).toBeUndefined();
    expect(hitsFound(active, found, 100, 100)).toBe(true);
    expect(hitsFound(active, found, 400, 400)).toBe(false);
  });
});

describe("Requirement 5: time and penalties", () => {
  test("adds 5 seconds per miss and 10 per hint", () => {
    expect(totalTime(20000, 2, 1)).toBe(40000);
    expect(totalTime(12345, 0, 0)).toBe(12345);
  });
});

describe("Requirement 8: records", () => {
  test("are kept per scene and number of differences", () => {
    expect(recordKey(SCENES[3], 7)).toBe("The Swan|7");
    expect(recordKey(SCENES[3], 10)).not.toBe(recordKey(SCENES[3], 7));
  });
});
