// The colour palettes for the Mastermind pegs (.openspec/specs/007-mastermind, Requirement 9).
// Every palette has 8 colours that differ in hue or lightness; classic uses the first 6.

export interface Palette {
  name: string;
  colours: string[];
}

export const PALETTES: Palette[] = [
  // red, orange, yellow, green, blue, purple, cyan, pink
  { name: "vivid", colours: ["#ff1744", "#ff7a00", "#ffee00", "#00e65c", "#2563ff", "#b000ff", "#00e5ff", "#ff5cc8"] },
  { name: "warm", colours: ["#d7002f", "#ff6a00", "#ffc800", "#fff3d6", "#ff7c9c", "#7a1f5c", "#6b3410", "#a3b00e"] },
  { name: "cool", colours: ["#1f4fff", "#00d7ff", "#5cffb0", "#c4b2ff", "#7225ff", "#009e94", "#c9ecff", "#557089"] },
  { name: "tropical", colours: ["#ff3d8b", "#ffa800", "#a6ff00", "#00965a", "#00d6d6", "#ff5233", "#b347ff", "#fff066"] },
];

/** A palette by name; an unknown name gives vivid */
export function palette(name: string | null): Palette {
  return PALETTES.find(p => p.name === name) ?? PALETTES[0]!;
}
