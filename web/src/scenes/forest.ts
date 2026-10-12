// Scene: Autumn Forest
import { seeded } from "./helpers";
import type { Has, Difference, Scene } from "./types";

const LEAF_COLORS = ["#e8742a", "#c8401f", "#f2b33d", "#d9581f", "#a8321a", "#f5c858"];

function leaf(x: number, y: number, size: number, angle: number, fill: string): string {
  return `<g transform="translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${angle.toFixed(0)})">
    <path d="M0,${-size} Q${size * 0.75},0 0,${size} Q${-size * 0.75},0 0,${-size} Z" fill="${fill}"/>
    <line x1="0" y1="${-size * 0.8}" x2="0" y2="${size * 1.25}" stroke="#6b2a10" stroke-width="0.8" opacity="0.6"/>
  </g>`;
}

function crown(clusters: [number, number, number][], colors: string[]): string {
  let s = "";
  clusters.forEach(([x, y, r], k) => {
    s += `<circle cx="${x}" cy="${y}" r="${r}" fill="${colors[k % colors.length]!}"/>`;
  });
  clusters.forEach(([x, y, r]) => {
    s += `<circle cx="${x - r * 0.3}" cy="${y - r * 0.35}" r="${r * 0.45}" fill="#fff3c4" opacity="0.18"/>`;
  });
  return s;
}

function mushroom(x: number, y: number, w: number, cap: string, spots: boolean): string {
  let s = `<ellipse cx="${x}" cy="${y + w * 0.95}" rx="${w * 0.8}" ry="${w * 0.15}" fill="#3b1f0e" opacity="0.35"/>
    <path d="M${x - w * 0.22},${y + w * 0.95} Q${x - w * 0.28},${y + w * 0.3} ${x - w * 0.16},${y} L${x + w * 0.16},${y} Q${x + w * 0.28},${y + w * 0.3} ${x + w * 0.22},${y + w * 0.95} Z" fill="#f4ead2"/>
    <path d="M${x - w},${y + 2} Q${x - w * 0.9},${y - w * 1.1} ${x},${y - w * 1.05} Q${x + w * 0.9},${y - w * 1.1} ${x + w},${y + 2} Z" fill="${cap}"/>
    <path d="M${x - w * 0.6},${y - w * 0.55} Q${x - w * 0.2},${y - w * 0.95} ${x + w * 0.2},${y - w * 0.85}" stroke="#fff" stroke-width="3" fill="none" opacity="0.3" stroke-linecap="round"/>`;
  if (spots) {
    s += `<g fill="#fffaf0"><circle cx="${x - w * 0.5}" cy="${y - w * 0.3}" r="${w * 0.13}"/><circle cx="${x}" cy="${y - w * 0.7}" r="${w * 0.15}"/>
      <circle cx="${x + w * 0.5}" cy="${y - w * 0.35}" r="${w * 0.12}"/><circle cx="${x + w * 0.1}" cy="${y - w * 0.25}" r="${w * 0.09}"/></g>`;
  }
  return s;
}

function drawForest(has: Has): string {
  const random = seeded(71);
  let s = `<defs>
    <linearGradient id="forestSky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f9e7bf"/><stop offset="0.6" stop-color="#f3c995"/><stop offset="1" stop-color="#e3a36d"/>
    </linearGradient>
    <linearGradient id="forestGround" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#b8682e"/><stop offset="1" stop-color="#6a3417"/>
    </linearGradient>
    <linearGradient id="forestPath" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f0cf9c"/><stop offset="1" stop-color="#d49a5e"/>
    </linearGradient>
    <linearGradient id="forestBark" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#3a2214"/><stop offset="0.45" stop-color="#6e4428"/><stop offset="1" stop-color="#2c180c"/>
    </linearGradient>
    <linearGradient id="forestFox" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f08a3a"/><stop offset="1" stop-color="#c2531b"/>
    </linearGradient>
    <radialGradient id="forestSun" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#fffbe8"/><stop offset="0.4" stop-color="#fff0c0" stop-opacity="0.8"/><stop offset="1" stop-color="#fff0c0" stop-opacity="0"/>
    </radialGradient>
    <filter id="forestBlur" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="10"/></filter>
  </defs>
  <rect width="800" height="600" fill="url(#forestSky)"/>
  <circle cx="560" cy="105" r="110" fill="url(#forestSun)"/>
  <circle cx="560" cy="105" r="34" fill="#fffbea" opacity="0.9"/>`;

  // Light rays from the sun
  s += '<g fill="#fff8dc" opacity="0.16">';
  [[300, 420], [430, 520], [600, 690]].forEach(([a, b]) => { s += `<path d="M560,105 L${a},600 L${b},600 Z"/>`; });
  s += "</g>";

  // A bird in the sky
  if (!has("bird")) s += '<path d="M366,72 Q374,62 382,70 Q390,62 398,72 Q390,68 382,75 Q374,68 366,72 Z" fill="#6b3a1f"/>';

  // Distant trees in the mist
  s += '<g fill="#d9a07a" opacity="0.7">';
  for (let x = -20; x < 820; x += 46) {
    const h = 50 + random() * 50;
    s += `<ellipse cx="${x}" cy="${(330 - h * 0.5).toFixed(0)}" rx="30" ry="${(h * 0.6).toFixed(0)}"/>`;
  }
  s += "</g>";
  s += '<rect x="-40" y="290" width="880" height="60" fill="#fff4e0" opacity="0.6" filter="url(#forestBlur)"/>';

  // Ground and the winding path
  s += `<rect y="330" width="800" height="270" fill="url(#forestGround)"/>
    <path d="M290,600 C330,540 470,520 440,470 C410,425 470,395 505,365 C520,350 525,340 520,330 L532,330 C540,345 535,362 520,378 C490,405 455,430 480,468 C520,530 470,560 560,600 Z" fill="url(#forestPath)"/>
    <rect x="-40" y="320" width="880" height="40" fill="#fff4e0" opacity="0.45" filter="url(#forestBlur)"/>`;

  // Leaves on the ground
  for (let k = 0; k < 70; k++) {
    const x = random() * 800, y = 345 + random() * 255, a = random() * 180, c = LEAF_COLORS[Math.floor(random() * LEAF_COLORS.length)]!;
    s += `<ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="${(3 + (y - 330) / 50).toFixed(1)}" ry="2" fill="${c}" opacity="0.85" transform="rotate(${a.toFixed(0)},${x.toFixed(0)},${y.toFixed(0)})"/>`;
  }

  // Small far tree
  s += `<rect x="462" y="250" width="12" height="90" fill="url(#forestBark)"/>
    ${crown([[468, 236, 34], [446, 256, 24], [490, 254, 24]], ["#f2b33d", "#e8892a", "#f5c858"])}`;

  // Red tree in the middle
  s += `<path d="M244,410 L250,190 L262,190 L270,410 Z" fill="url(#forestBark)"/>
    <path d="M256,250 L224,214 M258,230 L292,196" stroke="#4a2c18" stroke-width="5" stroke-linecap="round"/>
    <ellipse cx="257" cy="410" rx="36" ry="7" fill="#3b1f0e" opacity="0.35"/>
    ${crown([[230, 175, 45], [282, 158, 42], [256, 122, 40], [214, 212, 32], [270, 204, 30]], ["#c8401f", "#a8321a", "#d9581f", "#b8381c", "#c8401f"])}`;
  s += `<circle cx="306" cy="196" r="22" fill="${has("redCanopy") ? "#f2b33d" : "#b8381c"}"/>`;

  // Big orange tree on the left with a hollow
  s += `<path d="M50,540 Q70,420 66,160 L112,160 Q110,420 132,540 Z" fill="url(#forestBark)"/>
    <path d="M76,200 Q78,350 72,500 M98,220 Q102,360 108,500" stroke="#2c180c" stroke-width="2" fill="none" opacity="0.6"/>
    <path d="M40,540 Q60,520 70,510 M120,512 Q135,525 150,542" stroke="#3a2214" stroke-width="10" stroke-linecap="round" fill="none"/>`;
  if (!has("trunkHole")) s += '<ellipse cx="90" cy="330" rx="10" ry="14" fill="#1c0e06"/><path d="M80,326 Q90,312 100,326" stroke="#8a5a36" stroke-width="2" fill="none"/>';
  s += crown([[40, 90, 70], [125, 70, 75], [95, 160, 62], [180, 135, 50], [10, 175, 48], [70, 20, 55]], ["#e8742a", "#d9581f", "#f08a3a", "#e8742a", "#c8521f", "#f29a3a"]);

  // Golden tree on the right with a squirrel on a branch
  s += `<path d="M665,520 Q682,400 676,150 L716,150 Q712,400 732,520 Z" fill="url(#forestBark)"/>
    <path d="M688,190 Q690,350 684,500 M706,200 Q708,360 716,500" stroke="#2c180c" stroke-width="2" fill="none" opacity="0.6"/>
    <path d="M680,300 Q630,290 572,296" stroke="#4a2c18" stroke-width="9" stroke-linecap="round" fill="none"/>
    <path d="M600,294 Q590,280 584,268" stroke="#4a2c18" stroke-width="4" stroke-linecap="round" fill="none"/>
    ${leaf(584, 262, 9, -20, "#f2b33d")}
    ${crown([[700, 95, 80], [620, 150, 50], [770, 160, 55], [690, 185, 50], [770, 50, 50], [640, 70, 45]], ["#f2b33d", "#e8a02a", "#f5c858", "#e8892a", "#f2b33d", "#f5c858"])}`;
  s += `<g transform="translate(625,270) scale(1.5)" fill="#b5541f">
      <path d="M8,10 C26,8 30,-14 18,-24 C12,-28 6,-22 12,-18 C20,-12 14,0 6,2 Z" fill="#c8662a"/>
      <ellipse cx="0" cy="4" rx="8" ry="11"/>
      <ellipse cx="-2" cy="7" rx="4" ry="6" fill="#f2d2a8"/>
      <circle cx="-4" cy="-10" r="6.5"/>
      <path d="M-6,-15 L-4,-22 L0,-15 Z"/>
      <circle cx="-6.5" cy="-11" r="1.2" fill="#1a0e06"/>
      <circle cx="-10.5" cy="-9" r="1" fill="#1a0e06"/>
    </g>`;
  if (!has("squirrelAcorn")) {
    s += `<ellipse cx="611" cy="274" rx="6" ry="7.5" fill="#9a5a24"/><path d="M604,269 Q611,262 618,269 Z" fill="#5a3214"/>
      <line x1="611" y1="264" x2="612" y2="260" stroke="#5a3214" stroke-width="2"/>`;
  }

  // The fox on the path
  s += `<ellipse cx="440" cy="468" rx="62" ry="8" fill="#3b1f0e" opacity="0.3"/>
    <path d="M468,430 C495,412 520,396 540,404 C532,422 505,442 470,446 Z" fill="url(#forestFox)"/>`;
  s += `<ellipse cx="533" cy="406" rx="11" ry="8" fill="${has("foxTailTip") ? "#e07a30" : "#fdf6ea"}" transform="rotate(-20,533,406)"/>`;
  s += `<g fill="#3a1c0c"><rect x="400" y="440" width="7" height="24" rx="3"/><rect x="414" y="442" width="7" height="22" rx="3"/>
      <rect x="452" y="440" width="7" height="24" rx="3"/><rect x="466" y="438" width="7" height="24" rx="3"/></g>
    <ellipse cx="438" cy="432" rx="42" ry="18" fill="url(#forestFox)"/>
    <path d="M404,438 Q420,450 440,446" stroke="#fdf6ea" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M386,398 L394,377 L402,400 Z" fill="#c2531b"/>`;
  if (!has("foxEar")) s += '<path d="M372,402 L370,380 L384,396 Z" fill="#a8441a"/><path d="M373,399 L372,386 L380,396 Z" fill="#3a1c0c"/>';
  s += `<circle cx="388" cy="412" r="17" fill="url(#forestFox)"/>
    <path d="M374,412 L350,420 L378,428 Z" fill="#fdf6ea"/>
    <path d="M378,404 L352,418 L376,414 Z" fill="#e07a30"/>
    <circle cx="350" cy="419" r="3" fill="#1a0e06"/>
    <path d="M378,408 q4,-3 7,0" stroke="#1a0e06" stroke-width="2" fill="none" stroke-linecap="round"/>`;

  // Path stones
  s += '<g fill="#a89a88" stroke="#7a6e60" stroke-width="1.5">';
  s += '<ellipse cx="420" cy="512" rx="11" ry="6"/><ellipse cx="500" cy="420" rx="8" ry="4.5"/>';
  if (!has("pathStone")) s += '<ellipse cx="470" cy="568" rx="15" ry="8"/>';
  s += "</g>";

  // Mushrooms
  s += mushroom(170, 520, 30, "#d02a1f", !has("mushroomSpots"));
  s += mushroom(128, 548, 18, "#a0682e", false);
  if (!has("smallMushroom")) s += mushroom(214, 548, 15, "#d02a1f", true);

  // Hedgehog with an apple
  s += `<g transform="translate(-45,0)"><ellipse cx="630" cy="552" rx="48" ry="8" fill="#3b1f0e" opacity="0.35"/>
    <path d="M590,550 Q600,500 645,498 Q680,500 680,550 Z" fill="#5a3a22"/>
    <g stroke="#3a2214" stroke-width="2.5" stroke-linecap="round">`;
  for (let k = 0; k < 13; k++) {
    const a = Math.PI * (1.05 + k * 0.075), x = 638 + 40 * Math.cos(a), y = 550 + 46 * Math.sin(a);
    s += `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${(x + 12 * Math.cos(a)).toFixed(1)}" y2="${(y + 12 * Math.sin(a)).toFixed(1)}"/>`;
  }
  s += `</g>
    <path d="M598,550 Q592,528 572,538 Q566,544 574,550 Z" fill="#e8c9a0"/>
    <circle cx="571" cy="540" r="3" fill="#1a0e06"/><circle cx="586" cy="534" r="2" fill="#1a0e06"/>`;
  if (!has("hedgehogApple")) {
    s += `<circle cx="640" cy="492" r="10" fill="#c8202a"/><circle cx="636" cy="488" r="3" fill="#fff" opacity="0.4"/>
      <line x1="641" y1="482" x2="643" y2="476" stroke="#4a2c18" stroke-width="2"/>${leaf(648, 478, 5, 60, "#5a8a2a")}`;
  }
  s += "</g>";

  // Leaf pile
  s += '<g>';
  for (let k = 0; k < 18; k++) {
    s += leaf(705 + random() * 60, 552 + random() * 28, 8, random() * 360, LEAF_COLORS[Math.floor(random() * LEAF_COLORS.length)]!);
  }
  s += "</g>";

  // Falling leaves and the soft mist
  for (let k = 0; k < 26; k++) {
    s += leaf(random() * 800, 40 + random() * 440, 5 + random() * 4, random() * 360, LEAF_COLORS[Math.floor(random() * LEAF_COLORS.length)]!);
  }
  if (!has("fallingLeaf")) s += leaf(530, 210, 13, 35, "#c8401f");
  s += '<rect x="-40" y="440" width="880" height="50" fill="#fff4e0" opacity="0.18" filter="url(#forestBlur)"/>';
  return s;
}

function forestDifferences(): Difference[] {
  return [
    { id: "bird", x: 382, y: 69, r: 22 },
    { id: "redCanopy", x: 306, y: 196, r: 24 },
    { id: "trunkHole", x: 90, y: 328, r: 20 },
    { id: "squirrelAcorn", x: 611, y: 268, r: 14 },
    { id: "foxTailTip", x: 533, y: 406, r: 16 },
    { id: "foxEar", x: 376, y: 390, r: 14 },
    { id: "pathStone", x: 470, y: 568, r: 18 },
    { id: "mushroomSpots", x: 170, y: 506, r: 24 },
    { id: "smallMushroom", x: 214, y: 545, r: 18 },
    { id: "hedgehogApple", x: 597, y: 486, r: 16 },
    { id: "fallingLeaf", x: 530, y: 210, r: 18 },
  ];
}

export const forest: Scene = { name: "Autumn Forest", draw: drawForest, differences: forestDifferences() };
