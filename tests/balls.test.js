// Tests for .openspec/specs/003-bouncing-balls/spec.md
import { afterEach, describe, expect, test, vi } from "vitest";
import { seedRandom } from "./random.js";
import { BOUNCINESS, COLORS, GRAVITY, collide, createBall, moveBall } from "../src/balls.js";

afterEach(() => vi.restoreAllMocks());

const ball = props => ({ x: 0, y: 0, vx: 0, vy: 0, radius: 10, color: COLORS[0], ...props });
const momentum = (...balls) => ({
  x: balls.reduce((sum, b) => sum + b.radius ** 2 * b.vx, 0),
  y: balls.reduce((sum, b) => sum + b.radius ** 2 * b.vy, 0),
});

describe("Requirement 1: adding balls", () => {
  test("a new ball starts at the given spot with a radius from 12 to 34", () => {
    seedRandom(3);
    for (let k = 0; k < 100; k++) {
      const b = createBall(50, 60);
      expect(b).toMatchObject({ x: 50, y: 60 });
      expect(b.radius).toBeGreaterThanOrEqual(12);
      expect(b.radius).toBeLessThan(34);
      expect(b.vx).toBeGreaterThanOrEqual(-6);
      expect(b.vx).toBeLessThan(6);
    }
  });
});

describe("Requirement 2: physics", () => {
  test("gravity pulls a ball down, unless it is off", () => {
    const falling = ball({ x: 100, y: 100 });
    moveBall(falling, 800, 600, true);
    expect(falling.vy).toBe(GRAVITY);
    expect(falling.y).toBe(100 + GRAVITY);

    const floating = ball({ x: 100, y: 100 });
    moveBall(floating, 800, 600, false);
    expect(floating.y).toBe(100);
  });

  test("a ball bounces off a wall and keeps 90% of its speed", () => {
    const b = ball({ x: 795, y: 300, vx: 10 });
    moveBall(b, 800, 600, false);
    expect(b.vx).toBeCloseTo(-10 * BOUNCINESS);
    expect(b.x).toBe(790);  // pushed back inside

    const floor = ball({ x: 300, y: 595, vy: 10 });
    moveBall(floor, 800, 600, false);
    expect(floor.vy).toBeCloseTo(-10 * BOUNCINESS);
    expect(floor.y).toBe(590);
  });

  test("colliding balls no longer overlap and keep their total momentum", () => {
    const a = ball({ x: 100, y: 100, vx: 3, radius: 20 });
    const b = ball({ x: 125, y: 105, vx: -1, vy: 2, radius: 10 });
    const before = momentum(a, b);
    collide(a, b);
    expect(Math.hypot(b.x - a.x, b.y - a.y)).toBeCloseTo(30);
    const after = momentum(a, b);
    expect(after.x).toBeCloseTo(before.x);
    expect(after.y).toBeCloseTo(before.y);
    expect(a.vx).toBeLessThan(3);  // the small ball slowed the big one down
  });

  test("a bigger ball is pushed less than a smaller one", () => {
    const big = ball({ x: 100, y: 100, radius: 30 });
    const small = ball({ x: 135, y: 100, radius: 10 });
    collide(big, small);
    expect(100 - big.x).toBeLessThan(small.x - 135);
  });

  test("balls moving apart only get separated, not bounced", () => {
    const a = ball({ x: 100, y: 100, vx: -2 });
    const b = ball({ x: 115, y: 100, vx: 2 });
    collide(a, b);
    expect([a.vx, b.vx]).toEqual([-2, 2]);
    expect(b.x - a.x).toBeCloseTo(20);
  });

  test("balls that don't touch are left alone", () => {
    const a = ball({ x: 100, y: 100, vx: 1 });
    const b = ball({ x: 200, y: 100, vx: -1 });
    collide(a, b);
    expect([a.x, b.x, a.vx, b.vx]).toEqual([100, 200, 1, -1]);
  });
});

describe("Requirement 3: look", () => {
  test("balls use the four Lab271 colors", () => {
    expect(COLORS.map(c => c[1])).toEqual(["#1EE8ED", "#FF8D33", "#FF0089", "#347EC1"]);
    seedRandom(9);
    const used = new Set([...Array(50)].map(() => createBall(0, 0).color));
    expect(used.size).toBe(4);
  });
});
