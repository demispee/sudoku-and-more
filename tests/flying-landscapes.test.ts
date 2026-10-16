// Tests for .openspec/specs/008-flying-schubert/spec.md, Requirement 7: the landscapes
// @vitest-environment jsdom
import { describe, expect, test } from "vitest";
import { LANDSCAPES } from "../web/src/flying/landscapes";

/** Parses SVG markup and gives the box around every rect, polygon and circle in it */
function shapes(markup: string) {
  const svg = new DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg">${markup}</svg>`, "image/svg+xml");
  expect(svg.querySelector("parsererror")).toBeNull();
  const n = (el: Element, name: string) => Number(el.getAttribute(name));
  return [...svg.querySelectorAll("rect, polygon, circle")].map(el => {
    if (el.tagName === "rect") return { left: n(el, "x"), top: n(el, "y"), right: n(el, "x") + n(el, "width"), bottom: n(el, "y") + n(el, "height") };
    if (el.tagName === "circle") {
      const [cx, cy, r] = [n(el, "cx"), n(el, "cy"), n(el, "r")];
      return { left: cx - r, top: cy - r, right: cx + r, bottom: cy + r };
    }
    const points = el.getAttribute("points")!.split(" ").map(p => p.split(",").map(Number));
    const xs = points.map(p => p[0]!), ys = points.map(p => p[1]!);
    return { left: Math.min(...xs), top: Math.min(...ys), right: Math.max(...xs), bottom: Math.max(...ys) };
  });
}

describe("Requirement 7: landscapes", () => {
  test("four, in this order: meadow, snowy mountains, city, data centre", () => {
    expect(LANDSCAPES.map(l => l.label)).toEqual(["meadow", "snowy mountains", "city", "data centre"]);
    expect(new Set(LANDSCAPES.map(l => l.name)).size).toBe(4);
  });

  test.each(LANDSCAPES)("$label loads nothing from the internet and is valid SVG", l => {
    const all = l.far + l.ground + l.hat + l.obstacle(0, 0, 80, 200, "bottom");
    expect(all).not.toMatch(/https?:|href=/);
    expect(shapes(l.far).length).toBeGreaterThan(5);
    expect(shapes(l.ground).length).toBeGreaterThan(0);
  });

  test("every landscape has its own hat for Schubert, around his head", () => {
    expect(new Set(LANDSCAPES.map(l => l.hat)).size).toBe(4);
    for (const l of LANDSCAPES) {
      for (const s of shapes(l.hat)) {
        expect([s.left >= 8, s.right <= 40, s.top >= -4, s.bottom <= 32]).toEqual([true, true, true, true]);
      }
    }
  });

  test.each(LANDSCAPES)("$label draws the ground from 560 down, and the background above it", l => {
    for (const s of shapes(l.ground)) expect([s.top >= 560, s.bottom <= 600]).toEqual([true, true]);
    for (const s of shapes(l.far)) expect(s.bottom).toBeLessThanOrEqual(560);
  });

  // The game only knows the box: what is drawn must not stick out into the gap
  test.each(LANDSCAPES)("$label keeps an obstacle inside its box", l => {
    for (const [y, h, gapAt] of [[0, 60, "bottom"], [0, 330, "bottom"], [230, 60, "top"], [120, 440, "top"]] as const) {
      for (const s of shapes(l.obstacle(40, y, 80, h, gapAt))) {
        expect(s.left).toBeGreaterThanOrEqual(40);
        expect(s.right).toBeLessThanOrEqual(120);
        expect(s.top).toBeGreaterThanOrEqual(y);
        expect(s.bottom).toBeLessThanOrEqual(y + h + 1e-9);
      }
    }
  });
});
