// Data centre: rows of blinking lights; the obstacles are server racks
import { light, rect, type Landscape } from "./types";

const LIGHTS = ["#1ee8ed", "#4ade80", "#1ee8ed", "#f59e0b"];

/** A rack in the background: a dark cabinet with a column of blinking lights */
const rack = (x: number, top: number) => {
  let out = rect(x, top, 70, 560 - top, "#0e2030") + rect(x + 4, top + 4, 62, 556 - top, "#0a1825");
  for (let k = 0, ly = top + 16; ly < 550; k++, ly += 22) {
    out += rect(x + 8, ly - 6, 54, 12, "#11283b");
    out += light(x + 54, ly, 2.5, LIGHTS[(k + x) % LIGHTS.length]!, 0.8 + ((k * 7 + x) % 13) / 10);
  }
  return out;
};

let far = "";
for (let x = 10; x < 800; x += 100) far += rack(x, 200 + ((x * 3) % 90));

export const datacentre: Landscape = {
  name: "datacentre",
  label: "data centre",
  sky: ["#030812", "#0b1d2e"],
  far,
  ground: rect(0, 560, 800, 40, "#0d1b2a") + rect(0, 560, 800, 3, "#1ee8ed"),
  obstacle(x, y, w, h, gapAt) {
    // A rack: units of 20 high with a light each; a lit band where the gap is
    let out = rect(x, y, w, h, "#16293a") + rect(x + 4, y, w - 8, h, "#0f2132");
    for (let uy = y + 6, k = 0; uy + 12 <= y + h - 6; uy += 20, k++) {
      out += rect(x + 8, uy, w - 16, 12, "#1b3349");
      out += light(x + w - 16, uy + 6, 2.5, LIGHTS[k % LIGHTS.length]!, 0.7 + (k % 5) / 4);
    }
    const band = gapAt === "bottom" ? y + h - 6 : y;
    return out + rect(x, band, w, 6, "#1ee8ed");
  },
};
