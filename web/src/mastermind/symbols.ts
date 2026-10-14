// A shape per colour, for players who can't tell colours apart
// (.openspec/specs/007-mastermind, Requirement 10). SVG paths in a 24 × 24 box.

export const SYMBOLS = [
  { name: "circle", path: "M12,5 a7,7 0 1,0 0.01,0 Z" },
  { name: "triangle", path: "M12,4 L20,19 H4 Z" },
  { name: "square", path: "M5,5 H19 V19 H5 Z" },
  { name: "diamond", path: "M12,3 L21,12 L12,21 L3,12 Z" },
  { name: "star", path: "M12,3 L14.6,9.2 L21.3,9.6 L16.2,14 L17.8,20.6 L12,17 L6.2,20.6 L7.8,14 L2.7,9.6 L9.4,9.2 Z" },
  { name: "cross", path: "M9,4 H15 V9 H20 V15 H15 V20 H9 V15 H4 V9 H9 Z" },
  { name: "ring", path: "M12,4 a8,8 0 1,0 0.01,0 Z M12,8.5 a3.5,3.5 0 1,1 -0.01,0 Z" },
  { name: "hexagon", path: "M12,3 L20,7.5 V16.5 L12,21 L4,16.5 V7.5 Z" },
] as const;
