// Scene: Picnic in the Park
import { seeded } from "./helpers";
import type { Has, Difference, Scene, Point } from "./types";

const FLOWER_COLORS = ["#ff6a8a", "#ffd23a", "#ffffff", "#b86ae8"];
const ODD_FLOWER: Point = [36, 486];
const KITE_TAIL: Point[] = [[560, 180], [540, 206], [556, 232], [536, 258], [550, 286]];

function cloud(x: number, y: number, s: number): string {
  return `<g><ellipse cx="${x}" cy="${y}" rx="${50 * s}" ry="${14 * s}" fill="#fff"/><circle cx="${x - 18 * s}" cy="${y - 8 * s}" r="${16 * s}" fill="#fff"/>
    <circle cx="${x + 10 * s}" cy="${y - 14 * s}" r="${20 * s}" fill="#fff"/><ellipse cx="${x}" cy="${y + 7 * s}" rx="${42 * s}" ry="${5 * s}" fill="#cfe4f4"/></g>`;
}

function flower(x: number, y: number, color: string): string {
  let s = `<path d="M${x},${y} v14" stroke="#3f8a3a" stroke-width="1.5"/>`;
  for (let k = 0; k < 5; k++) {
    const a = k * 72 * Math.PI / 180;
    s += `<circle cx="${(x + 4 * Math.cos(a)).toFixed(1)}" cy="${(y + 4 * Math.sin(a)).toFixed(1)}" r="3.4" fill="${color}"/>`;
  }
  return s + `<circle cx="${x}" cy="${y}" r="2.4" fill="#e8a020"/>`;
}

function duck(x: number, y: number, s: number, dir: number): string {
  return `<g transform="translate(${x} ${y}) scale(${dir * s} ${s})"><ellipse cx="0" cy="6" rx="18" ry="4" fill="#2a6a9a" opacity="0.5"/>
    <path d="M-16,0 Q-16,-12 0,-10 Q12,-10 16,-4 Q12,6 -10,6 Q-16,4 -16,0 Z" fill="#f4f0e4"/><path d="M-6,-6 Q4,-12 10,-4" stroke="#c8c0b0" stroke-width="2" fill="none"/>
    <circle cx="12" cy="-16" r="7" fill="#2a8a4a"/><path d="M18,-17 l8,2 l-8,2 Z" fill="#f0a020"/><circle cx="14" cy="-18" r="1.4" fill="#111"/></g>`;
}

function cup(x: number, y: number, color: string): string {
  return `<ellipse cx="${x}" cy="${y + 2}" rx="16" ry="4" fill="#000" opacity="0.2"/><path d="M${x - 12},${y - 26} H${x + 12} L${x + 9},${y} H${x - 9} Z" fill="${color}"/>
    <ellipse cx="${x}" cy="${y - 26}" rx="12" ry="3.5" fill="#fff"/><ellipse cx="${x}" cy="${y - 25}" rx="10" ry="2.5" fill="#f8e070"/>
    <path d="M${x - 8},${y - 20} l1,16" stroke="#fff" stroke-width="2.5" opacity="0.4"/>`;
}

function sandwich(x: number, y: number, rot: number): string {
  return `<g transform="rotate(${rot} ${x} ${y})"><path d="M${x - 20},${y + 8} L${x + 20},${y + 8} L${x},${y - 16} Z" fill="#f4dca8" stroke="#c89a5a" stroke-width="2" stroke-linejoin="round"/>
    <path d="M${x - 17},${y + 6} L${x + 17},${y + 6}" stroke="#5ab04a" stroke-width="3"/><path d="M${x - 15},${y + 3} L${x + 15},${y + 3}" stroke="#e05a4a" stroke-width="2"/></g>`;
}

function drawPicnic(has: Has): string {
  const random = seeded(6262);
  let s = `<defs>
    <linearGradient id="picnicSky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#5ab0ea"/><stop offset="1" stop-color="#d8f0fc"/>
    </linearGradient>
    <linearGradient id="picnicGrass" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#8ac85a"/><stop offset="1" stop-color="#4a9a3a"/>
    </linearGradient>
    <radialGradient id="picnicSun" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#fff8c0"/><stop offset="0.4" stop-color="#ffe070" stop-opacity="0.7"/><stop offset="1" stop-color="#ffe070" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="picnicLeaves" cx="40%" cy="35%" r="70%">
      <stop offset="0" stop-color="#7ac850"/><stop offset="1" stop-color="#2f7a2e"/>
    </radialGradient>
    <linearGradient id="picnicPond" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#8ad0f0"/><stop offset="1" stop-color="#3a8ac0"/>
    </linearGradient>
    <linearGradient id="picnicWicker" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#e0aa68"/><stop offset="1" stop-color="#9a6030"/>
    </linearGradient>
    <linearGradient id="picnicJug" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fff8b0"/><stop offset="0.5" stop-color="#f8e070"/><stop offset="1" stop-color="#e8c040"/>
    </linearGradient>
    <pattern id="picnicCheck" width="28" height="28" patternUnits="userSpaceOnUse">
      <rect width="28" height="28" fill="#fff6ee"/><rect width="14" height="28" fill="#d8283a" opacity="0.6"/><rect width="28" height="14" fill="#d8283a" opacity="0.6"/>
    </pattern>
  </defs>
  <rect width="800" height="600" fill="url(#picnicSky)"/>
  <circle cx="720" cy="70" r="80" fill="url(#picnicSun)"/><circle cx="720" cy="70" r="28" fill="#fff4a0"/>`;
  s += cloud(300, 96, 1) + cloud(660, 180, 0.8);
  if (!has("cloud")) s += cloud(436, 52, 0.75);

  // Hills, far trees and the meadow
  s += `<path d="M0,262 Q120,220 260,250 Q400,214 540,248 Q680,222 800,244 V300 H0 Z" fill="#9ad07a"/>`;
  for (let x = 250; x < 800; x += 26 + random() * 20) {
    const r = 12 + random() * 10;
    s += `<circle cx="${x.toFixed(0)}" cy="${(262 - r * 0.4).toFixed(0)}" r="${r.toFixed(0)}" fill="${random() < 0.5 ? "#4a9a4a" : "#5aaa50"}"/>`;
  }
  s += `<rect y="262" width="800" height="338" fill="url(#picnicGrass)"/>
    <path d="M0,262 Q200,252 400,264 T800,260 V272 H0 Z" fill="#a8d878" opacity="0.6"/>`;

  // Kite with a bowed tail, flown by a child beyond the pond
  const panel = has("kite") ? "#3fb8a0" : "#ffd23a";
  s += `<path d="M560,140 Q680,200 760,272" stroke="#fff" stroke-width="1" fill="none" opacity="0.8"/>
    <path d="M560,70 L522,118 L560,118 Z" fill="${panel}"/><path d="M560,70 L600,118 L560,118 Z" fill="#d8283a"/>
    <path d="M522,118 L560,180 L560,118 Z" fill="#2e6fd1"/><path d="M600,118 L560,180 L560,118 Z" fill="#ffd23a"/>
    <path d="M560,70 V180 M522,118 H600" stroke="#6a3a18" stroke-width="1.5"/>
    <path d="M${KITE_TAIL.map(([x, y]) => `${x},${y}`).join(" L")}" stroke="#6a3a18" stroke-width="1.2" fill="none"/>`;
  KITE_TAIL.slice(1).forEach(([x, y], k) => {
    s += `<path d="M${x - 7},${y - 4} L${x + 7},${y + 4} L${x + 7},${y - 4} L${x - 7},${y + 4} Z" fill="${["#d8283a", "#2e6fd1", "#ffd23a", "#3f9a5a"][k]!}"/>`;
  });
  s += `<path d="M770,312 v-24" stroke="#2e6fd1" stroke-width="7" stroke-linecap="round"/><circle cx="770" cy="280" r="6" fill="#f2c8a0"/>
    <path d="M770,292 L762,274" stroke="#2e6fd1" stroke-width="3" stroke-linecap="round"/><path d="M767,312 l-2,10 M773,312 l2,10" stroke="#3a3a4a" stroke-width="3"/>`;

  // Duck pond with reeds and ducks
  s += `<ellipse cx="620" cy="346" rx="134" ry="34" fill="#5a9a3a"/><ellipse cx="620" cy="344" rx="126" ry="30" fill="url(#picnicPond)"/>
    <path d="M540,336 h40 M620,352 h50 M660,334 h30" stroke="#fff" stroke-width="2" opacity="0.5"/>
    <ellipse cx="560" cy="356" rx="12" ry="4" fill="#3f8a3a"/><circle cx="562" cy="354" r="3" fill="#ff8ab0"/>
    <path d="M496,346 q-4,-30 2,-44 M504,350 q2,-28 -2,-40 M736,346 q4,-30 -2,-42 M744,350 q-2,-26 4,-36" stroke="#4a7a2a" stroke-width="3" fill="none"/>
    <rect x="495" y="300" width="5" height="14" rx="2.5" fill="#7a4a24"/><rect x="736" y="302" width="5" height="14" rx="2.5" fill="#7a4a24"/>`;
  s += duck(590, 340, 1, 1) + duck(704, 336, 0.6, -1);
  if (!has("duck")) s += duck(650, 352, 1, -1);

  // Big shady tree with a bench and a bird
  s += `<ellipse cx="150" cy="420" rx="150" ry="30" fill="#2f6a2a" opacity="0.4"/>
    <path d="M70,428 Q90,330 84,220 L118,220 Q112,330 132,428 Z" fill="#6a4020"/><path d="M84,300 Q80,360 76,420" stroke="#4a2a10" stroke-width="3" fill="none"/>
    <path d="M110,250 Q160,220 214,214 M90,260 Q50,230 30,232" stroke="#6a4020" stroke-width="8" fill="none" stroke-linecap="round"/>`;
  const blobs: [number, number, number][] = [[50, 150, 70], [130, 90, 90], [210, 150, 64], [100, 190, 64], [170, 50, 54], [20, 70, 54]];
  for (const [x, y, r] of blobs) s += `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#picnicLeaves)"/>`;
  for (let k = 0; k < 30; k++) s += `<circle cx="${(random() * 260).toFixed(0)}" cy="${(20 + random() * 200).toFixed(0)}" r="${(4 + random() * 6).toFixed(0)}" fill="#9ad868" opacity="0.4"/>`;
  if (!has("treeBird")) {
    s += `<ellipse cx="236" cy="210" rx="9" ry="7" fill="#7a4a2a"/><circle cx="244" cy="203" r="5" fill="#7a4a2a"/><ellipse cx="238" cy="213" rx="6" ry="4" fill="#e85a2a"/>
      <path d="M248,203 l5,1 l-5,2 Z" fill="#f0a020"/><path d="M228,208 l-8,-2 l2,6 Z" fill="#5a3418"/><circle cx="245" cy="202" r="1.2" fill="#111"/>`;
  }
  s += `<path d="M172,336 v24 M284,336 v24 M180,316 v20 M276,316 v20" stroke="#3a3a3a" stroke-width="4"/>
    <rect x="166" y="290" width="124" height="9" rx="2" fill="#3f7a4a"/><rect x="166" y="303" width="124" height="9" rx="2" fill="#3f7a4a"/>
    <rect x="162" y="330" width="132" height="8" rx="2" fill="#4a8a54"/><rect x="162" y="330" width="132" height="2" fill="#fff" opacity="0.3"/>`;
  if (!has("bench")) s += `<ellipse cx="256" cy="328" rx="18" ry="5" fill="#e8c86a"/><path d="M246,328 Q246,314 256,314 Q266,314 266,328 Z" fill="#e8c86a"/><path d="M246,325 h20" stroke="#d8283a" stroke-width="3"/>`;

  // Bicycle on its stand
  const frame = has("bike") ? "#2e6fd1" : "#d8283a";
  s += `<circle cx="350" cy="344" r="24" fill="none" stroke="#2a2a2a" stroke-width="4"/><circle cx="424" cy="344" r="24" fill="none" stroke="#2a2a2a" stroke-width="4"/>
    <path d="M350,322 V366 M328,344 H372 M424,322 V366 M402,344 H446" stroke="#9a9a9a" stroke-width="1"/>
    <path d="M350,344 L376,344 L408,316 L372,316 Z M376,344 L364,306 M408,316 L424,344 M404,306 L408,316" stroke="${frame}" stroke-width="4" fill="none" stroke-linejoin="round"/>
    <path d="M356,304 h16" stroke="#3a2a1a" stroke-width="5" stroke-linecap="round"/><path d="M398,302 q6,-6 14,-2" stroke="#3a3a3a" stroke-width="3" fill="none"/>
    <circle cx="376" cy="344" r="5" fill="#5a5a5a"/>`;

  // Flowers in the grass
  for (let k = 0; k < 34; k++) {
    const x = random() * 800, y = 372 + random() * 228, color = FLOWER_COLORS[Math.floor(random() * FLOWER_COLORS.length)]!;
    const onBlanket = y > 384 && y < 600 && x > 150 - (y - 404) * 0.6 && x < 660 + (y - 404) * 0.5;
    const nearDog = x > 640 && x < 800 && y < 470;
    if (!onBlanket && !nearDog && Math.hypot(x - ODD_FLOWER[0], y - ODD_FLOWER[1]) > 24) s += flower(x, y, color);
  }
  s += flower(ODD_FLOWER[0], ODD_FLOWER[1], has("flower") ? "#ff8a2a" : "#ff6a8a") + flower(60, 540, "#ffd23a");

  // Dog chasing a ball
  s += `<ellipse cx="704" cy="452" rx="38" ry="6" fill="#2f6a2a" opacity="0.4"/>
    <path d="M676,426 l-16,18 M686,430 l-6,22 M716,428 l14,22 M724,424 l20,14" stroke="#f4ece0" stroke-width="7" stroke-linecap="round"/>
    <ellipse cx="702" cy="418" rx="32" ry="15" fill="#f4ece0"/><ellipse cx="694" cy="414" rx="12" ry="9" fill="#b8742e"/>
    <path d="M672,412 Q656,398 660,390" stroke="#f4ece0" stroke-width="6" fill="none" stroke-linecap="round"/>
    <circle cx="736" cy="402" r="14" fill="#f4ece0"/><ellipse cx="752" cy="408" rx="9" ry="6" fill="#f4ece0"/><circle cx="760" cy="406" r="3" fill="#2a1a10"/>
    <path d="M728,392 q-10,6 -6,20 q8,-4 10,-14 Z" fill="#b8742e"/><circle cx="742" cy="398" r="2" fill="#2a1a10"/>
    <path d="M752,414 q4,6 8,2" stroke="#e85a6a" stroke-width="3" fill="none"/>`;
  const ball = has("ball") ? "#3f6ad8" : "#e8d040";
  s += `<circle cx="774" cy="438" r="11" fill="${ball}"/><path d="M764,434 Q774,442 784,434" stroke="#fff" stroke-width="2" fill="none"/><circle cx="770" cy="433" r="3" fill="#fff" opacity="0.6"/>`;

  // Checked blanket with the picnic
  s += `<path d="M156,404 L660,404 L760,600 L40,600 Z" fill="url(#picnicCheck)"/><path d="M156,404 L660,404" stroke="#b81e2e" stroke-width="3"/>
    <path d="M156,404 L40,600 M660,404 L760,600" stroke="#000" stroke-opacity="0.12" stroke-width="4"/>`;
  s += `<path d="M196,430 Q240,370 284,430" stroke="#8a5428" stroke-width="7" fill="none"/><ellipse cx="240" cy="482" rx="56" ry="8" fill="#000" opacity="0.2"/>
    <path d="M186,430 H294 L284,480 H196 Z" fill="url(#picnicWicker)"/><path d="M190,446 H290 M192,462 H288" stroke="#7a4a1e" stroke-width="2" opacity="0.6"/>
    <path d="M200,430 Q230,418 262,428 L272,444 Q236,436 206,446 Z" fill="#2e6fd1"/><rect x="182" y="424" width="116" height="10" rx="4" fill="#a86a38"/>`;
  // Fruit bowl
  s += `<circle cx="398" cy="430" r="12" fill="#d8283a"/><circle cx="420" cy="426" r="12" fill="#e8402a"/><circle cx="408" cy="420" r="11" fill="#7ac84a"/>
    <path d="M426,420 Q446,412 452,426" stroke="#f0d030" stroke-width="8" fill="none" stroke-linecap="round"/>
    <circle cx="436" cy="432" r="5" fill="#8a3ab0"/><circle cx="444" cy="430" r="5" fill="#8a3ab0"/><circle cx="440" cy="438" r="5" fill="#7a2aa0"/>
    <path d="M382,432 H458 Q454,458 420,458 Q386,458 382,432 Z" fill="#f4f4f4" stroke="#c8c8d0"/><path d="M388,442 H452" stroke="#2e6fd1" stroke-width="3"/>
    <path d="M398,420 q1,-6 4,-8" stroke="#5a3a1a" stroke-width="1.5" fill="none"/>`;
  // Lemonade jug
  s += `<ellipse cx="566" cy="472" rx="30" ry="6" fill="#000" opacity="0.2"/>
    <path d="M586,422 q20,4 14,28 q-4,12 -16,10" stroke="#e8eef4" stroke-width="5" fill="none"/>
    <path d="M546,410 H586 L592,470 H540 Z" fill="url(#picnicJug)" opacity="0.95"/><path d="M542,408 H590 L586,416 H546 Z" fill="#e8eef4"/>
    <rect x="552" y="440" width="10" height="10" rx="2" fill="#fff" opacity="0.6" transform="rotate(15 557 445)"/><path d="M548,418 l-3,46" stroke="#fff" stroke-width="3" opacity="0.5"/>`;
  if (!has("lemonade")) s += `<circle cx="574" cy="438" r="10" fill="#fff8a0" stroke="#f0c020" stroke-width="2.5"/><path d="M574,428 V448 M564,438 H584 M567,431 L581,445 M581,431 L567,445" stroke="#f0d040" stroke-width="1"/>`;
  s += cup(480, 470, "#e8708a") + cup(636, 506, has("cup") ? "#3f9a5a" : "#2e9ad8");
  // Sandwich plate
  s += `<ellipse cx="320" cy="530" rx="62" ry="20" fill="#fdfdfd" stroke="#c8c8d0" stroke-width="1.5"/><ellipse cx="320" cy="530" rx="48" ry="14" fill="none" stroke="#e8708a" stroke-width="2"/>`;
  s += sandwich(296, 526, -8) + sandwich(342, 528, 10);
  if (!has("sandwich")) s += sandwich(320, 520, 180);
  // Watermelon slice with or without a bite
  s += `<ellipse cx="526" cy="574" rx="60" ry="6" fill="#000" opacity="0.2"/><path d="M470,568 A56,56 0 0,1 582,568 Z" fill="#3f8a3a"/><path d="M476,568 A50,50 0 0,1 576,568 Z" fill="#e8f8c8"/><path d="M482,568 A44,44 0 0,1 570,568 Z" fill="#f04a5a"/>
    <path d="M470,568 H582" stroke="#3f8a3a" stroke-width="2"/>`;
  [[506, 572], [526, 562], [546, 572], [516, 584], [536, 584]].forEach(([x, y]) => { s += `<ellipse cx="${x}" cy="${y! - 20}" rx="2.5" ry="4" fill="#2a1a10"/>`; });
  if (has("watermelon")) s += `<circle cx="560" cy="526" r="13" fill="url(#picnicCheck)"/><circle cx="574" cy="538" r="10" fill="url(#picnicCheck)"/>`;
  // Ants marching to the crumbs
  s += `<circle cx="226" cy="560" r="3" fill="#f4dca8"/><circle cx="236" cy="566" r="2.5" fill="#f4dca8"/>`;
  for (let k = 0; k < 6; k++) {
    const x = 90 + k * 22, y = 588 - k * 5;
    s += `<g fill="#1a1a1a"><circle cx="${x}" cy="${y}" r="2.6"/><circle cx="${x + 5}" cy="${y - 1}" r="2"/><circle cx="${x - 5}" cy="${y + 1}" r="3"/></g>
      <path d="M${x - 3},${y - 3} l-2,-3 M${x + 1},${y - 3} l1,-3 M${x - 3},${y + 3} l-2,3 M${x + 1},${y + 3} l1,3" stroke="#1a1a1a" stroke-width="0.8"/>`;
  }
  return s;
}

function picnicDifferences(): Difference[] {
  return [
    { id: "cloud", x: 436, y: 46, r: 30 },
    { id: "kite", x: 548, y: 104, r: 18 },
    { id: "treeBird", x: 238, y: 208, r: 18 },
    { id: "bench", x: 256, y: 322, r: 18 },
    { id: "bike", x: 384, y: 326, r: 28 },
    { id: "duck", x: 654, y: 342, r: 22 },
    { id: "ball", x: 774, y: 438, r: 14 },
    { id: "flower", x: 36, y: 490, r: 14 },
    { id: "lemonade", x: 574, y: 438, r: 14 },
    { id: "cup", x: 636, y: 492, r: 18 },
    { id: "sandwich", x: 320, y: 518, r: 20 },
    { id: "watermelon", x: 564, y: 532, r: 18 },
  ];
}

export const picnic: Scene = { name: "Picnic in the Park", draw: drawPicnic, differences: picnicDifferences() };
