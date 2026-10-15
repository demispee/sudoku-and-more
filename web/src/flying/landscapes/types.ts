// What a Flying Schubert landscape is made of (.openspec/specs/008-flying-schubert,
// Requirement 7). Drawings are SVG strings in the 800 × 600 field.

export interface Landscape {
  /** Kept in localStorage */
  name: string;
  /** Shown on the button */
  label: string;
  /** The sky, from top to bottom */
  sky: [string, string];
  /** The far background, 800 wide and down to the ground; drawn twice side by side to scroll */
  far: string;
  /** The ground, from y = 560 to 600 */
  ground: string;
  /**
   * One part of an obstacle, filling the box from (x, y), `width` by `height`. `gapAt`
   * says which side of the box borders the gap: the top part has it at the bottom.
   */
  obstacle(x: number, y: number, width: number, height: number, gapAt: "top" | "bottom"): string;
}

export const rect = (x: number, y: number, w: number, h: number, fill: string, extra = "") =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"${extra ? " " + extra : ""}/>`;

export const polygon = (points: [number, number][], fill: string) =>
  `<polygon points="${points.map(p => p.join(",")).join(" ")}" fill="${fill}"/>`;

export const circle = (cx: number, cy: number, r: number, fill: string, extra = "") =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"${extra ? " " + extra : ""}/>`;

/** A blinking light, for the data centre */
export const blink = (seconds: number) =>
  `<animate attributeName="opacity" values="1;0.15;1" dur="${seconds}s" repeatCount="indefinite"/>`;

export const light = (cx: number, cy: number, r: number, fill: string, seconds: number) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}">${blink(seconds)}</circle>`;
