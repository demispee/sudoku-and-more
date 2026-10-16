// Snowy mountains: white peaks; the obstacles are pillars of ice
import { polygon, rect, type Landscape } from "./types";

const peak = (cx: number, top: number, width: number, rock: string) => {
  const snow = 0.32; // the part of the height under snow
  const left = cx - width / 2, right = cx + width / 2;
  const sx = (width / 2) * snow;
  const sy = top + (560 - top) * snow;
  return polygon([[left, 560], [cx, top], [right, 560]], rock) +
    polygon([[cx - sx, sy], [cx, top], [cx + sx, sy], [cx + sx / 3, sy - 14], [cx - sx / 4, sy + 6]], "#f7fbff");
};

export const mountains: Landscape = {
  name: "mountains",
  label: "snowy mountains",
  sky: ["#a9cdee", "#eef5fb"],
  far:
    peak(140, 170, 420, "#8ea4bb") + peak(470, 120, 520, "#7f97b0") + peak(760, 200, 380, "#8ea4bb") +
    peak(300, 330, 360, "#a3b6c9") + peak(640, 310, 400, "#a3b6c9"),
  ground: rect(0, 560, 800, 40, "#e8f0f8") + rect(0, 560, 800, 5, "#ffffff"),
  // The Christmas hat, flopping to the right, with a white brim and pompom
  hat:
    `<g transform="translate(0 -1.4)">` +
    '<path d="M17.5 10 C18 3.5 25 0.5 33 2.8 C30.5 4.5 29.5 7 29 10 Z" fill="#e5252a"/>' +
    '<path d="M24 10 C25 6 28 4 33 2.8 C30.5 4.5 29.5 7 29 10 Z" fill="#c41c21"/>' +
    rect(16.5, 9.4, 13, 3.4, "#e3f3f8", 'rx="1.7"') +
    '<circle cx="33.5" cy="2.8" r="2.3" fill="#e3f3f8"/>' +
    "</g>",
  obstacle(x, y, w, h, gapAt) {
    const end = gapAt === "bottom" ? y + h : y;
    const dir = gapAt === "bottom" ? -1 : 1; // icicles point into the pillar's box
    const icicles: [number, number][][] = [];
    for (let k = 0; k < 4; k++) {
      const left = x + 4 + k * ((w - 8) / 4);
      const right = left + (w - 8) / 4;
      icicles.push([[left, end], [(left + right) / 2, end + dir * Math.min(18, h)], [right, end]]);
    }
    const cap = gapAt === "bottom" ? y + h - 16 : y;
    return rect(x + 8, y, w - 16, h, "#bfe4f4") +
      rect(x + 16, y, 10, h, "#e4f6fd") +
      rect(x + w - 20, y, 6, h, "#9ccfe6") +
      rect(x, cap, w, 16, "#d6f0fb") +
      icicles.map(points => polygon(points, "#9ccfe6")).join("");
  },
};
