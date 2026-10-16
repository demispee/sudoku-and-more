// Meadow: green hills under a blue sky; the obstacles are fence posts
import { circle, polygon, rect, type Landscape } from "./types";

const hill = (cx: number, top: number, width: number, fill: string) => {
  const points: [number, number][] = [];
  for (let k = 0; k <= 16; k++) {
    const x = cx - width / 2 + (width * k) / 16;
    points.push([x, 560 - (560 - top) * Math.sin((Math.PI * k) / 16)]);
  }
  return polygon(points, fill);
};

const cloud = (x: number, y: number) =>
  circle(x, y, 18, "#ffffff") + circle(x + 22, y - 8, 24, "#ffffff") + circle(x + 48, y, 18, "#ffffff");

const tree = (x: number) =>
  rect(x - 4, 470, 8, 40, "#6b4a2b") + circle(x, 460, 24, "#3f8f3f") + circle(x - 14, 474, 16, "#3f8f3f");

export const meadow: Landscape = {
  name: "meadow",
  label: "meadow",
  sky: ["#7cc6f2", "#dff3fd"],
  far:
    cloud(90, 90) + cloud(430, 150) + cloud(650, 70) +
    hill(120, 400, 420, "#8fcf72") + hill(520, 380, 520, "#7cc163") + hill(820, 410, 360, "#8fcf72") +
    tree(330) + tree(610) +
    hill(260, 470, 520, "#5fae4c") + hill(680, 480, 460, "#5fae4c"),
  ground: rect(0, 560, 800, 40, "#4f8f37") + rect(0, 560, 800, 6, "#6dbb4f"),
  // A straw hat with a red band
  hat:
    `<g transform="translate(0 -2.2)">` +
    '<ellipse cx="23" cy="11.2" rx="10.5" ry="2.4" fill="#e2b85a"/>' +
    '<path d="M17.6 11 C17.6 4.8 28.4 4.8 28.4 11 Z" fill="#edca72"/>' +
    rect(17.7, 8.6, 10.6, 1.6, "#b8452f") +
    '<ellipse cx="23" cy="11.4" rx="9" ry="1.4" fill="none" stroke="#f3d98f" stroke-width="0.5"/>' +
    "</g>",
  obstacle(x, y, w, h, gapAt) {
    const cap = gapAt === "bottom" ? y + h - 22 : y;
    // A wooden post, with a wider top board where the gap is
    return rect(x + 10, y, w - 20, h, "#a8743f") +
      rect(x + 14, y, 6, h, "#bf8a52") +
      rect(x + w - 24, y, 4, h, "#8a5d31") +
      rect(x, cap, w, 22, "#8a5d31") +
      rect(x + 4, cap + 4, w - 8, 14, "#a8743f");
  },
};
