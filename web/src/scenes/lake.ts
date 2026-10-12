// Scene: Mountain Lake
import { seeded } from "./helpers";
import type { Has, Difference, Scene, Point } from "./types";

const FAR_RANGE: Point[] = [[0, 230], [60, 170], [120, 120], [170, 165], [220, 140], [300, 90], [360, 150], [420, 200], [470, 170], [560, 70], [640, 140], [720, 110], [800, 170]];
const NEAR_RANGE: Point[] = [[0, 262], [80, 216], [150, 242], [230, 176], [310, 246], [400, 282], [460, 272], [520, 240], [640, 158], [720, 226], [800, 206]];
const LOST_SNOW: Point = [560, 70];
const DUCKS: [number, number, number][] = [[470, 560, 1], [500, 566, 0.6], [522, 572, 0.6], [544, 577, 0.6]];
const LOST_DUCK = 2;

// Snow caps on every peak of a range; the cap follows both slopes down by h
function snowCaps(range: Point[], h: number, skip?: Point): string {
  let s = "";
  for (let k = 1; k < range.length - 1; k++) {
    const [lx, ly] = range[k - 1]!, [px, py] = range[k]!, [rx, ry] = range[k + 1]!;
    if (py >= ly || py >= ry || (skip && skip[0] === px && skip[1] === py)) continue;
    const wl = h * (px - lx) / (ly - py), wr = h * (rx - px) / (ry - py);
    s += `<path d="M${px},${py} L${(px + wr).toFixed(1)},${py + h} L${(px + wr * 0.4).toFixed(1)},${py + h - 9} L${(px + wr * 0.05).toFixed(1)},${py + h + 3} L${(px - wl * 0.4).toFixed(1)},${py + h - 8} L${(px - wl).toFixed(1)},${py + h} Z" fill="url(#lakeSnow)"/>`;
  }
  return s;
}

function pine(x: number, base: number, h: number, fill: string): string {
  let s = `<rect x="${x - h * 0.03}" y="${base - h * 0.15}" width="${h * 0.06}" height="${h * 0.15}" fill="#3a2414"/>`;
  for (let k = 0; k < 3; k++) {
    const top = base - h + k * h * 0.22, bottom = base - h * 0.55 + k * h * 0.2, w = h * (0.16 + k * 0.08);
    s += `<path d="M${x},${top.toFixed(1)} L${(x + w).toFixed(1)},${bottom.toFixed(1)} H${(x - w).toFixed(1)} Z" fill="${fill}"/>`;
  }
  return s;
}

// Sun, mountains and the shoreline forest: drawn once, and once mirrored in the lake
function world(has: Has): string {
  const random = seeded(4410);
  const range = (pts: Point[]): string => `M${pts.map(([x, y]) => `${x},${y}`).join(" L")} V304 H0 Z`;
  let s = `<circle cx="430" cy="180" r="110" fill="url(#lakeSunGlow)"/><circle cx="430" cy="180" r="30" fill="#ffe08a" stroke="#fff4c8" stroke-width="3"/>
    <path d="${range(FAR_RANGE)}" fill="url(#lakeFar)"/>${snowCaps(FAR_RANGE, 34, has("snowCap") ? LOST_SNOW : undefined)}
    <path d="${range(NEAR_RANGE)}" fill="url(#lakeNear)"/>
    <path d="M230,176 L260,212 L250,250 L310,246 Z M640,158 L680,192 L670,240 L720,226 Z" fill="#2a3458" opacity="0.35"/>
    ${snowCaps(NEAR_RANGE, 30)}`;
  for (let x = -6; x < 810; x += 11) {
    const h = 24 + random() * 30 - (x > 360 && x < 500 ? 14 : 0);
    s += pine(x + random() * 6, 305, h, random() < 0.5 ? "#1c4a38" : "#24563f");
  }
  if (!has("shorePine")) s += pine(300, 306, 78, "#1a4434");
  return s;
}

function drawLake(has: Has): string {
  const random = seeded(77);
  const none: Has = () => false;
  let s = `<defs>
    <linearGradient id="lakeSky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2c3a7a"/><stop offset="0.45" stop-color="#b47ab0"/><stop offset="0.8" stop-color="#ffb08a"/><stop offset="1" stop-color="#ffd8a0"/>
    </linearGradient>
    <linearGradient id="lakeWater" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffc8a0"/><stop offset="0.25" stop-color="#b47ab0"/><stop offset="1" stop-color="#1c2a60"/>
    </linearGradient>
    <linearGradient id="lakeFar" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#9a8ac8"/><stop offset="1" stop-color="#c8a0c0"/>
    </linearGradient>
    <linearGradient id="lakeNear" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#5a6aa0"/><stop offset="1" stop-color="#3a4a78"/>
    </linearGradient>
    <linearGradient id="lakeSnow" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#f0c8d8"/>
    </linearGradient>
    <radialGradient id="lakeSunGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#fff0b0" stop-opacity="0.9"/><stop offset="1" stop-color="#ffb08a" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="lakeBank" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#6aa04a"/><stop offset="1" stop-color="#2f5a2a"/>
    </linearGradient>
    <linearGradient id="lakeLogs" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#a0643a"/><stop offset="1" stop-color="#6a3a1e"/>
    </linearGradient>
    <clipPath id="lakeClip"><rect y="302" width="800" height="298"/></clipPath>
  </defs>
  <rect width="800" height="600" fill="url(#lakeSky)"/>
  <rect y="300" width="800" height="300" fill="url(#lakeWater)"/>`;

  // Rosy cloud streaks and the eagle
  s += `<g fill="#ffc8d0" opacity="0.75"><ellipse cx="130" cy="52" rx="72" ry="8"/><ellipse cx="170" cy="64" rx="46" ry="6"/><ellipse cx="380" cy="96" rx="50" ry="6"/></g>`;
  if (!has("cloud")) s += '<g fill="#ffc8d0" opacity="0.75"><ellipse cx="650" cy="50" rx="42" ry="8"/><ellipse cx="676" cy="62" rx="30" ry="6"/></g>';
  if (!has("eagle")) {
    s += `<g transform="translate(250,70)">
      <path d="M0,0 Q-14,-14 -32,-10 l-4,4 l5,0 l-4,4 l6,-1 l-3,4 Q-16,-2 -4,6 Z M0,0 Q14,-14 32,-10 l4,4 l-5,0 l4,4 l-6,-1 l3,4 Q16,-2 4,6 Z" fill="#4a2e1a"/>
      <ellipse cx="0" cy="4" rx="5" ry="9" fill="#5a3820"/><circle cx="0" cy="-4" r="4.5" fill="#fff"/><path d="M-1,-2 l1,4 l2,-3 Z" fill="#f0b020"/>
      <path d="M-4,12 L0,18 L4,12 Z" fill="#fff"/></g>`;
  }

  // World and its reflection in the calm water
  s += world(has);
  s += `<g clip-path="url(#lakeClip)"><g transform="matrix(1,0,0,-1,0,606)" opacity="0.55">${world(none)}</g></g>
    <rect y="300" width="800" height="300" fill="#1c2a60" opacity="0.18"/>
    <rect y="299" width="800" height="4" fill="#fff4e0" opacity="0.35"/>`;
  s += '<g stroke="#fff" stroke-linecap="round" opacity="0.35">';
  for (let k = 0; k < 46; k++) {
    const y = 312 + random() * 280, x = random() * 800, w = 10 + (y - 300) * 0.12 * random();
    s += `<path d="M${x.toFixed(0)},${y.toFixed(0)} h${w.toFixed(0)}" stroke-width="${(1 + (y - 300) / 200).toFixed(1)}"/>`;
  }
  s += "</g>";
  for (let k = 0; k < 9; k++) s += `<path d="M${430 - 18 + k * 3 + (k % 2) * 8},${312 + k * 13} h${30 - k * 2}" stroke="#ffe8a0" stroke-width="2.5" opacity="${(0.8 - k * 0.07).toFixed(2)}"/>`;

  // Sailboat and its reflection
  const sail = has("sailColor") ? "#3a78c8" : "#e8553a";
  const boat = (main: string, jib: boolean): string => `<path d="M562,302 V362" stroke="#3a2a1a" stroke-width="2"/>
    <path d="M565,304 L565,356 L598,356 Z" fill="${main}"/>${jib ? '<path d="M559,312 L559,356 L534,356 Z" fill="#fff8ec"/>' : ""}
    <path d="M528,360 H596 L588,370 H536 Z" fill="#2a3a6a"/><path d="M530,362 H594" stroke="#fff" stroke-width="1.5"/>`;
  s += `<g transform="matrix(1,0,0,-1,0,740)" opacity="0.4">${boat("#e8553a", !has("jibReflection"))}</g>${boat(sail, true)}`;

  // Left bank with the log cabin, jetty and rowing boat
  s += `<path d="M0,395 Q100,400 200,430 Q280,455 310,520 Q330,570 320,600 H0 Z" fill="url(#lakeBank)"/>
    <path d="M206,444 V472 M256,444 V476 M306,444 V480 M356,444 V482 M384,444 V482" stroke="#4a2e1a" stroke-width="5"/>
    <path d="M306,482 v14 M356,484 v16 M384,484 v16" stroke="#4a2e1a" stroke-width="4" opacity="0.3"/>
    <path d="M190,436 H392 V444 H190 Z" fill="#b07a4a"/><path d="M190,444 H392 V448 H190 Z" fill="#6a4426"/>
    <path d="M230,436 v8 M270,436 v8 M310,436 v8 M350,436 v8" stroke="#6a4426" stroke-width="1"/>
    <path d="M384,446 Q392,462 404,470" stroke="#d8c8a0" stroke-width="1.5" fill="none"/>
    <path d="M372,470 H452 Q448,486 430,489 H394 Q376,486 372,470 Z" fill="#b84a2e" stroke="#6a2a18" stroke-width="1.5"/>
    <path d="M374,472 H450" stroke="#e8c890" stroke-width="3"/>
    <path d="M376,492 H448" stroke="#b84a2e" stroke-width="5" opacity="0.25"/>
    <path d="M384,474 L352,494" stroke="#d8b078" stroke-width="3" stroke-linecap="round"/>`;
  if (!has("oar")) s += '<path d="M440,474 L472,494" stroke="#d8b078" stroke-width="3" stroke-linecap="round"/><ellipse cx="474" cy="495" rx="7" ry="3" fill="#d8b078" transform="rotate(32,474,495)"/>';
  s += `<rect x="140" y="318" width="14" height="30" fill="#8a8494"/><rect x="137" y="314" width="20" height="6" fill="#6a6474"/>`;
  if (!has("cabinSmoke")) s += '<g fill="#e8e0f0" opacity="0.7"><circle cx="150" cy="304" r="6"/><circle cx="156" cy="290" r="8"/><circle cx="166" cy="274" r="10"/></g>';
  s += `<rect x="40" y="360" width="130" height="68" fill="url(#lakeLogs)"/>
    <g stroke="#4a2814" stroke-width="1.5">${[369, 378, 387, 396, 405, 414, 423].map(y => `<line x1="40" y1="${y}" x2="170" y2="${y}"/>`).join("")}</g>
    <path d="M26,366 L105,310 L184,366 Z" fill="#7a2e22"/><path d="M26,366 L105,310 L184,366" stroke="#4a1810" stroke-width="5" fill="none" stroke-linejoin="round"/>
    <circle cx="105" cy="340" r="7" fill="#ffd890" stroke="#4a2814" stroke-width="2"/>
    <rect x="92" y="384" width="24" height="44" fill="#4a2814"/><circle cx="111" cy="408" r="2" fill="#e2b54a"/>
    <rect x="52" y="378" width="28" height="22" fill="${has("cabinWindow") ? "#2a3458" : "#ffd890"}" stroke="#4a2814" stroke-width="3"/>
    <rect x="128" y="378" width="28" height="22" fill="#ffd890" stroke="#4a2814" stroke-width="3"/>
    <path d="M66,378 V400 M52,389 H80 M142,378 V400 M128,389 H156" stroke="#4a2814" stroke-width="2"/>`;

  // Ducks on the water
  DUCKS.forEach(([x, y, size], k) => {
    if (k === LOST_DUCK && has("duckling")) return;
    const body = size < 1 ? "#e8c860" : "#8a6a4a";
    s += `<g transform="translate(${x},${y}) scale(${size})">
      <ellipse cx="0" cy="6" rx="20" ry="3" fill="#fff" opacity="0.3"/>
      <path d="M-16,0 Q-14,8 0,8 Q14,8 16,-2 Q6,2 -4,-4 Z" fill="${body}"/>
      <circle cx="-12" cy="-6" r="6" fill="${size < 1 ? body : "#2a6a3a"}"/><path d="M-18,-6 L-24,-4 L-18,-3 Z" fill="#f0a020"/>
      <circle cx="-13" cy="-7" r="1.3" fill="#111"/></g>`;
  });

  // Right bank with the deer and a tall pine
  s += `<path d="M800,410 Q700,415 640,450 Q580,500 560,600 H800 Z" fill="url(#lakeBank)"/>
    <path d="M688,428 L686,452 M694,430 L694,454 M714,430 L716,452 M720,428 L722,450" stroke="#7a4a24" stroke-width="4" stroke-linecap="round"/>
    <ellipse cx="704" cy="424" rx="22" ry="11" fill="#a8683a"/><ellipse cx="704" cy="430" rx="14" ry="4" fill="#e8c8a0"/>
    <path d="M724,418 q6,-2 4,8" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
    <path d="M688,420 L680,398 L690,396 L696,416 Z" fill="#a8683a"/>
    <ellipse cx="678" cy="398" rx="9" ry="6" fill="#a8683a" transform="rotate(-20,678,398)"/>
    <circle cx="670" cy="400" r="2" fill="#2a1a10"/><circle cx="676" cy="396" r="1.4" fill="#111"/>
    <ellipse cx="688" cy="390" rx="5" ry="2.5" fill="#8a5028" transform="rotate(-30,688,390)"/>`;
  if (!has("antlers")) s += '<path d="M680,392 L676,376 L670,368 M676,376 L682,368 M684,392 L688,376 L694,370 M688,376 L686,366" stroke="#e8d8b8" stroke-width="2.5" fill="none" stroke-linecap="round"/>';
  s += pine(772, 480, 190, "#1e4a36");

  // Wildflowers on both banks
  for (let k = 0; k < 60; k++) {
    const right = k % 3 === 0, x = right ? 610 + random() * 190 : random() * 300, y = right ? 540 + random() * 56 : 460 + random() * 136;
    const color = ["#ffe060", "#ff7aa0", "#ffffff", "#b07ae8"][Math.floor(random() * 4)]!;
    s += `<path d="M${x.toFixed(0)},${(y + 8).toFixed(0)} v-8" stroke="#2f6a2a" stroke-width="1.5"/><circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="3" fill="${color}"/>`;
  }
  const lupin = (x: number, base: number, color: string): string => `<path d="M${x},${base} V${base - 40}" stroke="#2f6a2a" stroke-width="2"/>${[0, 1, 2, 3, 4, 5].map(k => `<ellipse cx="${x}" cy="${base - 14 - k * 5}" rx="${5 - k * 0.6}" ry="3" fill="${color}"/>`).join("")}`;
  s += lupin(40, 560, "#7a5ad8") + lupin(60, 572, "#e86aa8") + lupin(260, 590, "#7a5ad8");
  if (!has("lupins")) s += lupin(696, 572, "#7a5ad8") + lupin(714, 580, "#e86aa8") + lupin(732, 570, "#7a5ad8");
  return s;
}

function lakeDifferences(): Difference[] {
  const [dx, dy] = DUCKS[LOST_DUCK]!;
  return [
    { id: "cloud", x: 660, y: 55, r: 34 },
    { id: "eagle", x: 250, y: 66, r: 32 },
    { id: "snowCap", x: 560, y: 90, r: 24 },
    { id: "shorePine", x: 300, y: 270, r: 30 },
    { id: "cabinSmoke", x: 160, y: 288, r: 24 },
    { id: "sailColor", x: 580, y: 334, r: 26 },
    { id: "jibReflection", x: 548, y: 408, r: 22 },
    { id: "cabinWindow", x: 66, y: 389, r: 16 },
    { id: "oar", x: 458, y: 486, r: 18 },
    { id: "duckling", x: dx - 2, y: dy - 2, r: 16 },
    { id: "antlers", x: 682, y: 378, r: 18 },
    { id: "lupins", x: 714, y: 554, r: 28 },
  ];
}

export const lake: Scene = { name: "Mountain Lake", draw: drawLake, differences: lakeDifferences() };
