// Tests for .openspec/specs/007-mastermind/spec.md, Requirement 9: every palette has 8
// colours that are easy to tell apart.
import { describe, expect, test } from "vitest";
import { palette, PALETTES } from "../web/src/mastermind/palettes";

/** A colour in OKLab, where distances match how different colours look */
function oklab(hex: string) {
  const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const [r, g, b] = [1, 3, 5].map(i => lin(parseInt(hex.slice(i, i + 2), 16) / 255)) as [number, number, number];
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

describe("Requirement 9: colour palettes", () => {
  test.each(PALETTES.map(p => [p.name, p.colours] as const))("%s has 8 colours that differ enough", (_, colours) => {
    expect(colours).toHaveLength(8);
    for (let i = 0; i < colours.length; i++) {
      for (let j = i + 1; j < colours.length; j++) {
        const [a, b] = [oklab(colours[i]!), oklab(colours[j]!)];
        const distance = Math.hypot(a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!);
        expect(distance, `${colours[i]} and ${colours[j]}`).toBeGreaterThan(0.1);
      }
    }
  });

  test.each(PALETTES.map(p => [p.name, p.studio] as const))("%s has a studio with a dark floor", (_, studio) => {
    for (const colour of Object.values(studio)) expect(colour).toMatch(/^#[0-9a-f]{6}$/);
    // A dark floor and wall keep the pegs standing out
    expect(oklab(studio.low)[0]).toBeLessThan(0.25);
    expect(oklab(studio.high)[0]).toBeLessThan(0.5);
  });

  test("the names are vivid, warm, cool and tropical; an unknown name gives vivid", () => {
    expect(PALETTES.map(p => p.name)).toEqual(["vivid", "warm", "cool", "tropical"]);
    expect(palette("disco").name).toBe("vivid");
    expect(palette(null).name).toBe("vivid");
  });
});
