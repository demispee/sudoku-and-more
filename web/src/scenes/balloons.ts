// Scene: Hot-Air Balloons
import { seeded } from "./helpers";
import type { Has, Difference, Scene, Point } from "./types";

const FIELD_COLORS = ["#8cc152", "#a8d06a", "#6aa84f", "#d8c060", "#e8d890", "#b89a5a", "#7cb85a", "#c8d878"];
const ROWS = [250, 262, 278, 300, 330, 370, 425, 500, 600];
const VP: Point = [400, 120];
const ODD_FIELD = { row: 3, col: 9 };
const RIVER: Point[] = [[318, 250], [350, 272], [300, 304], [330, 340], [430, 372], [470, 420], [400, 470], [430, 530], [540, 600]];

// Where the k-th field boundary line crosses height y (lines meet at the vanishing point)
function fieldX(k: number, y: number): number {
  return VP[0] + (-1200 + k * 200 - VP[0]) * (y - VP[1]) / (600 - VP[1]);
}

function catmull(points: Point[], steps: number): Point[] {
  const out: Point[] = [];
  for (let k = 0; k < points.length - 1; k++) {
    const p0 = points[Math.max(k - 1, 0)]!, p1 = points[k]!, p2 = points[k + 1]!, p3 = points[Math.min(k + 2, points.length - 1)]!;
    for (let t = 0; t < 1; t += 1 / steps) {
      const t2 = t * t, t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number): number => 0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (3 * b - a - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(points[points.length - 1]!);
  return out;
}

function house(x: number, base: number, s: number, wall: string, roof: string): string {
  return `<rect x="${x - 10 * s}" y="${base - 12 * s}" width="${20 * s}" height="${12 * s}" fill="${wall}"/>
    <path d="M${x - 13 * s},${base - 11 * s} L${x},${base - 22 * s} L${x + 13 * s},${base - 11 * s} Z" fill="${roof}"/>
    <rect x="${x - 6 * s}" y="${base - 8 * s}" width="${4 * s}" height="${4 * s}" fill="#5a4a3a"/><rect x="${x + 2 * s}" y="${base - 8 * s}" width="${4 * s}" height="${8 * s}" fill="#7a4a2a"/>
    <path d="M${x + 10 * s},${base - 12 * s} V${base}" stroke="#000" stroke-opacity="0.15" stroke-width="${3 * s}"/>`;
}

function tree(x: number, y: number, s: number): string {
  return `<ellipse cx="${x + 4 * s}" cy="${y + 2 * s}" rx="${9 * s}" ry="${3 * s}" fill="#000" opacity="0.18"/>
    <rect x="${x - 1.2 * s}" y="${y - 6 * s}" width="${2.4 * s}" height="${7 * s}" fill="#5a3a1e"/>
    <circle cx="${x}" cy="${y - 10 * s}" r="${7 * s}" fill="#3f7a35"/><circle cx="${x - 2 * s}" cy="${y - 12 * s}" r="${3.5 * s}" fill="#6aa850"/>`;
}

function person(x: number, y: number, shirt: string, wave: number): string {
  let s = `<rect x="${x - 4}" y="${y}" width="8" height="10" rx="3" fill="${shirt}"/><circle cx="${x}" cy="${y - 4}" r="4.5" fill="#f2c8a0"/>`;
  if (wave) s += `<path d="M${x + 3 * wave},${y + 2} L${x + 8 * wave},${y - 10}" stroke="${shirt}" stroke-width="3" stroke-linecap="round"/><circle cx="${x + 8 * wave}" cy="${y - 11}" r="2" fill="#f2c8a0"/>`;
  return s;
}

interface Balloon { cx: number; cy: number; w: number; colors: string[]; band?: string; people: number; skip?: number }

function balloon(i: number, b: Balloon, extra = ""): string {
  const { cx, cy, w, colors } = b, h = w * 1.15, n = w * 0.24, top = cy - w, bottom = cy + h;
  const env = `M${cx - w},${cy} A${w},${w} 0 0 1 ${cx + w},${cy} C${cx + w},${cy + h * 0.45} ${cx + n * 1.4},${cy + h * 0.75} ${cx + n},${bottom} L${cx - n},${bottom} C${cx - n * 1.4},${cy + h * 0.75} ${cx - w},${cy + h * 0.45} ${cx - w},${cy} Z`;
  let s = `<clipPath id="balloonsClip${i}"><path d="${env}"/></clipPath><path d="${env}" fill="${colors[0]!}"/><g clip-path="url(#balloonsClip${i})">`;
  for (let j = 1; j < 5; j++) {
    const dx = 2 * w * (1 - j * 0.22);
    s += `<path d="M${cx},${top} Q${cx + dx},${cy} ${cx},${bottom} Q${cx - dx},${cy} ${cx},${top} Z" fill="${colors[j % colors.length]!}"/>`;
  }
  if (b.band) {
    const y = cy + w * 0.3, zig = w / 5;
    let d = `M${cx - w},${y}`;
    for (let x = cx - w; x <= cx + w + 1; x += zig) d += ` L${x + zig / 2},${y - zig * 0.6} L${x + zig},${y}`;
    s += `<path d="M${cx - w},${y - 4} H${cx + w} V${y + w * 0.12} H${cx - w} Z" fill="${b.band}"/><path d="${d}" fill="none" stroke="#fff" stroke-width="${w * 0.05}"/>`;
  }
  const bw = w * 0.5, bh = w * 0.34, by = bottom + w * 0.22;
  s += `</g><path d="${env}" fill="url(#balloonsShade)"/>
    <rect x="${cx - n}" y="${bottom - w * 0.06}" width="${2 * n}" height="${w * 0.08}" rx="2" fill="#5a3a20"/>
    <path d="M${cx - n},${bottom} L${cx - bw / 2},${by} M${cx + n},${bottom} L${cx + bw / 2},${by} M${cx - n * 0.3},${bottom} L${cx - bw / 6},${by} M${cx + n * 0.3},${bottom} L${cx + bw / 6},${by}" stroke="#4a3020" stroke-width="${Math.max(1, w / 60)}"/>
    <path d="M${cx - w * 0.06},${bottom + w * 0.04} Q${cx},${bottom - w * 0.08} ${cx + w * 0.06},${bottom + w * 0.04} Z" fill="#ffb020"/>`;
  for (let k = 0; k < b.people; k++) {
    if (k === b.skip) continue;
    const px = cx - bw / 2 + bw * (k + 1) / (b.people + 1);
    s += person(px, by - 8, ["#d8283a", "#2e6fd1", "#3f9a5a"][k % 3]!, k === 0 ? -1 : k === 2 ? 1 : 0);
  }
  s += `${extra}<rect x="${cx - bw / 2}" y="${by}" width="${bw}" height="${bh}" rx="${w * 0.04}" fill="url(#balloonsWicker)"/>
    <path d="M${cx - bw / 2},${by + bh / 3} h${bw} M${cx - bw / 2},${by + bh * 2 / 3} h${bw}" stroke="#7a4a1e" stroke-width="${Math.max(0.6, w / 70)}" opacity="0.6"/>
    <rect x="${cx - bw / 2 - 1}" y="${by - 1}" width="${bw + 2}" height="${w * 0.06}" rx="1.5" fill="#6a3a18"/>`;
  return s;
}

function cloud(x: number, y: number, s: number): string {
  return `<g opacity="0.92"><ellipse cx="${x}" cy="${y}" rx="${46 * s}" ry="${14 * s}" fill="#fff4ec"/>
    <circle cx="${x - 16 * s}" cy="${y - 8 * s}" r="${15 * s}" fill="#fff4ec"/><circle cx="${x + 10 * s}" cy="${y - 13 * s}" r="${19 * s}" fill="#fff"/>
    <ellipse cx="${x}" cy="${y + 6 * s}" rx="${40 * s}" ry="${6 * s}" fill="#f4c8b8" opacity="0.6"/></g>`;
}

function bird(x: number, y: number, s: number): string {
  return `<path d="M${x - 8 * s},${y - 3 * s} Q${x - 4 * s},${y - 6 * s} ${x},${y} Q${x + 4 * s},${y - 6 * s} ${x + 8 * s},${y - 3 * s}" stroke="#3a2a4a" stroke-width="${1.8 * s}" fill="none" stroke-linecap="round"/>`;
}

function drawBalloons(has: Has): string {
  const random = seeded(9131);
  let s = `<defs>
    <linearGradient id="balloonsSky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#4a6ab8"/><stop offset="0.45" stop-color="#c8a0c8"/><stop offset="0.8" stop-color="#ffc0a0"/><stop offset="1" stop-color="#ffe0a8"/>
    </linearGradient>
    <radialGradient id="balloonsSunGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#fff4c0" stop-opacity="0.95"/><stop offset="1" stop-color="#ffc0a0" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="balloonsShade" cx="35%" cy="28%" r="80%">
      <stop offset="0" stop-color="#fff" stop-opacity="0.45"/><stop offset="0.45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#2a1030" stop-opacity="0.5"/>
    </radialGradient>
    <linearGradient id="balloonsWicker" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#d8a060"/><stop offset="1" stop-color="#8a5428"/>
    </linearGradient>
    <linearGradient id="balloonsRiver" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffd8b8"/><stop offset="1" stop-color="#4a8ac8"/>
    </linearGradient>
    <linearGradient id="balloonsHaze" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffe0c0" stop-opacity="0.75"/><stop offset="1" stop-color="#ffe0c0" stop-opacity="0"/>
    </linearGradient>
    <pattern id="balloonsFurrow" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
      <rect width="8" height="3" fill="#000" opacity="0.1"/>
    </pattern>
  </defs>
  <rect width="800" height="600" fill="url(#balloonsSky)"/>
  <circle cx="640" cy="250" r="150" fill="url(#balloonsSunGlow)"/><circle cx="640" cy="250" r="40" fill="#ffe890" stroke="#fff4c8" stroke-width="4"/>
  <path d="M0,252 Q60,234 140,246 Q220,228 320,246 Q420,232 520,248 Q620,236 700,246 Q760,238 800,244 V260 H0 Z" fill="#9a9ac0"/>`;

  // Patchwork of fields in perspective
  for (let r = 0; r < ROWS.length - 1; r++) {
    const y0 = ROWS[r]!, y1 = ROWS[r + 1]!;
    for (let k = 0; k < 16; k++) {
      const color = FIELD_COLORS[Math.floor(random() * FIELD_COLORS.length)]!, furrow = random() < 0.35;
      const odd = r === ODD_FIELD.row && k === ODD_FIELD.col && has("field");
      const d = `M${fieldX(k, y0).toFixed(1)},${y0} L${fieldX(k + 1, y0).toFixed(1)},${y0} L${fieldX(k + 1, y1).toFixed(1)},${y1} L${fieldX(k, y1).toFixed(1)},${y1} Z`;
      s += `<path d="${d}" fill="${odd ? "#b48ad8" : color}" stroke="#4a7a3a" stroke-width="${(0.8 + r * 0.5).toFixed(1)}"/>`;
      if (furrow) s += `<path d="${d}" fill="url(#balloonsFurrow)"/>`;
    }
  }
  s += `<rect y="248" width="800" height="70" fill="url(#balloonsHaze)"/>`;

  // River with its banks
  const pts = catmull(RIVER, 10);
  const half = (y: number): number => 2 + (y - 250) * 0.05;
  const left = pts.map(([x, y]) => `${(x - half(y)).toFixed(1)},${y.toFixed(1)}`), right = pts.map(([x, y]) => `${(x + half(y)).toFixed(1)},${y.toFixed(1)}`).reverse();
  s += `<path d="M${left.join(" L")} L${right.join(" L")} Z" fill="url(#balloonsRiver)" stroke="#3f6a3a" stroke-width="2"/>
    <path d="M${pts.map(([x, y]) => `${(x - half(y) * 0.3).toFixed(1)},${y.toFixed(1)}`).join(" L")}" stroke="#fff" stroke-width="1.5" opacity="0.4" fill="none"/>`;
  if (!has("boat")) {
    s += `<path d="M458,424 h24 l-4,6 h-16 Z" fill="#8a4a20"/><path d="M470,422 V404 L482,420 Z" fill="#fff"/><path d="M470,404 V424" stroke="#5a3a20" stroke-width="1.5"/>`;
  }

  // Trees along hedges
  const trees: [number, number, number][] = [[60, 300, 0.8], [250, 336, 1], [520, 290, 0.7], [610, 470, 1.4], [300, 560, 1.6], [740, 330, 1.1], [360, 420, 1.2], [560, 560, 1.7], [200, 420, 1.3], [770, 520, 1.5]];
  for (const [x, y, sz] of trees) s += tree(x, y, sz);

  // Distant village with a church tower
  s += house(440, 300, 0.6, "#f4e8d0", "#c8583a") + house(462, 302, 0.55, "#f0e0c0", "#a84a30") + house(486, 298, 0.6, "#f4e8d0", "#c8583a");
  s += `<rect x="102" y="324" width="16" height="44" fill="#d8ccb4"/><rect x="118" y="340" width="40" height="28" fill="#e8dcc4"/>
    <path d="M114,340 L138,326 L162,340 Z" fill="#8a4a3a"/><rect x="102" y="324" width="5" height="44" fill="#fff" opacity="0.3"/>
    <path d="M107,344 a3,3 0 0,1 6,0 v8 h-6 Z" fill="#4a3a3a"/><circle cx="110" cy="332" r="4" fill="#fff8e0" stroke="#6a5a40"/>`;
  s += has("spire") ? `<path d="M100,324 H120 L110,318 Z" fill="#5a6a8a"/>` : `<path d="M100,324 H120 L110,288 Z" fill="#5a6a8a"/><path d="M110,288 V280 M106,284 H114" stroke="#e2b54a" stroke-width="1.5"/>`;
  s += house(70, 378, 0.9, "#f4e8d0", "#c8583a") + house(176, 382, 0.9, "#f0e0c0", "#a84a30");

  // Village in front
  s += house(80, 520, 1.6, "#f4e8d0", "#c8583a") + house(124, 540, 1.5, "#f8f0dc", "#a84a30");
  s += house(176, 512, 1.6, "#f0e0c0", has("roof") ? "#3a6ab8" : "#c8583a") + house(222, 548, 1.5, "#f4e8d0", "#a84a30");
  s += `<path d="M40,580 Q160,560 260,575 T420,600" stroke="#e8d8b0" stroke-width="7" fill="none"/>`;

  // Windmill
  const sail = has("windmill") ? 45 : 0;
  s += `<path d="M676,452 L682,396 H698 L704,452 Z" fill="#f0e4cc"/><path d="M676,452 L682,396 H688 L684,452 Z" fill="#fff" opacity="0.35"/>
    <path d="M678,398 Q690,382 702,398 Z" fill="#7a4a2a"/><path d="M686,452 v-12 a4,4 0 0,1 8,0 v12 Z" fill="#6a3a18"/><g transform="rotate(${15 + sail} 690 396)">`;
  for (let k = 0; k < 4; k++) {
    s += `<g transform="rotate(${k * 90} 690 396)"><path d="M690,396 V362" stroke="#5a3a20" stroke-width="2.5"/><rect x="691" y="362" width="9" height="28" fill="#fff8ec" stroke="#8a6a4a" stroke-width="1"/>
      <path d="M691,369 h9 M691,376 h9 M691,383 h9" stroke="#8a6a4a" stroke-width="0.8"/></g>`;
  }
  s += `</g><circle cx="690" cy="396" r="3.5" fill="#3a2a1a"/>`;

  // Clouds and birds
  s += cloud(150, 222, 1.1) + cloud(360, 34, 0.8);
  if (!has("cloud")) s += cloud(686, 74, 1);
  const birds: [number, number, number][] = [[380, 90, 1], [400, 78, 0.9], [418, 98, 0.8], [436, 66, 0.85]];
  birds.forEach(([x, y, sz], k) => { if (k !== 3 || !has("bird")) s += bird(x, y, sz); });

  // Balloons, far to near
  if (!has("smallBalloon")) s += balloon(0, { cx: 420, cy: 196, w: 18, colors: ["#ffd23a", "#d8283a"], people: 0 });
  s += balloon(1, { cx: 80, cy: 90, w: 36, colors: ["#3f9a5a", "#ffe8a0", "#d8283a"], people: 1 });
  s += balloon(2, { cx: 730, cy: 170, w: 40, colors: ["#2e6fd1", "#ffffff"], band: has("band") ? undefined : "#d8283a", people: 2 });
  s += balloon(3, { cx: 540, cy: 120, w: 56, colors: ["#8a4ab8", "#ff8a3a", has("stripe") ? "#3fb8c8" : "#ffd23a"], band: "#2a3a8a", people: 2 });
  const bags = has("sandbag") ? "" : `<path d="M222,302 V314 M220,302 v0" stroke="#4a3020" stroke-width="1"/><path d="M216,314 q6,-4 12,0 q2,10 -6,10 q-8,0 -6,-10 Z" fill="#c8a878" stroke="#8a6a4a"/>`;
  s += balloon(4, { cx: 260, cy: 190, w: 80, colors: ["#d8283a", "#ffd23a", "#2e6fd1"], band: "#3f9a5a", people: 3, skip: has("person") ? 2 : undefined }, bags);
  return s;
}

function balloonsDifferences(): Difference[] {
  return [
    { id: "bird", x: 436, y: 64, r: 14 },
    { id: "cloud", x: 686, y: 66, r: 30 },
    { id: "stripe", x: 540, y: 116, r: 28 },
    { id: "band", x: 730, y: 184, r: 26 },
    { id: "smallBalloon", x: 420, y: 202, r: 26 },
    { id: "person", x: 272, y: 290, r: 16 },
    { id: "sandbag", x: 222, y: 316, r: 14 },
    { id: "spire", x: 110, y: 302, r: 20 },
    { id: "field", x: 521, y: 315, r: 18 },
    { id: "boat", x: 470, y: 416, r: 18 },
    { id: "roof", x: 176, y: 488, r: 22 },
    { id: "windmill", x: 690, y: 396, r: 38 },
  ];
}

export const balloons: Scene = { name: "Hot-Air Balloons", draw: drawBalloons, differences: balloonsDifferences() };
