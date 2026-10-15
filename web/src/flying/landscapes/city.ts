// City: canal houses against an evening sky; the obstacles are stacks of houses
import { polygon, rect, type Landscape } from "./types";

const BRICKS = ["#8b3a2b", "#6f4a3a", "#9a5b3c", "#5e3b4a"];

/** A canal house far away: a dark front with a stepped gable and lit windows */
const house = (x: number, w: number, h: number) => {
  const top = 560 - h;
  let windows = "";
  for (let wy = top + 30; wy < 540; wy += 34) {
    for (let wx = x + 8; wx + 10 <= x + w - 8; wx += 20) windows += rect(wx, wy, 10, 16, (wx + wy) % 3 ? "#f6c76b" : "#3b2d5e");
  }
  const s = w / 6;
  return rect(x, top, w, h, "#2c2150") +
    polygon([[x, top], [x + s, top], [x + s, top - 12], [x + 2 * s, top - 12], [x + 2 * s, top - 24],
      [x + 4 * s, top - 24], [x + 4 * s, top - 12], [x + 5 * s, top - 12], [x + 5 * s, top], [x + w, top]], "#2c2150") +
    windows;
};

let far = "";
for (let k = 0, x = 0; x < 800; k++) {
  const w = 56 + ((k * 37) % 30);
  far += house(x, w, 160 + ((k * 53) % 110));
  x += w + 4;
}

export const city: Landscape = {
  name: "city",
  label: "city",
  sky: ["#2b1e4f", "#f08a5d"],
  far,
  ground: rect(0, 560, 800, 40, "#1f3557") + rect(0, 566, 800, 3, "#4f77a8") + rect(0, 584, 800, 2, "#35557f"),
  obstacle(x, y, w, h, gapAt) {
    // Houses of 60 high on top of each other, the gable facing the gap
    let out = "";
    let k = 0;
    for (let top = y; top < y + h; top += 60, k++) {
      const height = Math.min(60, y + h - top);
      out += rect(x, top, w, height, BRICKS[k % BRICKS.length]!);
      for (let wx = x + 12; wx + 14 <= x + w - 8; wx += 26) {
        if (height >= 34) out += rect(wx, top + 14, 14, 20, "#f6c76b") + rect(wx, top + 14, 14, 3, "#ffffff");
      }
      out += rect(x, top, w, 3, "#3a2230");
    }
    const edge = gapAt === "bottom" ? y + h - 14 : y;
    return out + rect(x, edge, w, 14, "#e9e2d0") + rect(x + w / 2 - 8, edge + 3, 16, 8, "#2c2150");
  },
};
