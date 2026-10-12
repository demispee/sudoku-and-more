// Scene: The Steam Train
import { seeded } from "./helpers";
import type { Has, Difference, Scene } from "./types";

const PIERS = [186, 280, 374, 468, 562, 656];
const CARRIAGES = [{ x: 205, color: "#d6453a" }, { x: 300, color: "#2f7fc4" }, { x: 395, color: "#f0b830" }];
const PUFFS: [number, number, number][] = [[604, 216, 12], [580, 198, 16], [548, 184, 20], [506, 172, 24], [456, 166, 21], [408, 162, 17], [366, 160, 13]];
const LOST_PUFF = 3;

function cloud(cx: number, cy: number, w: number): string {
  return `<g>
    <ellipse cx="${cx}" cy="${cy + 6}" rx="${w}" ry="${w * 0.28}" fill="#d6e6f5"/>
    <ellipse cx="${cx - w * 0.4}" cy="${cy}" rx="${w * 0.42}" ry="${w * 0.3}" fill="#fff"/>
    <ellipse cx="${cx + w * 0.1}" cy="${cy - w * 0.15}" rx="${w * 0.5}" ry="${w * 0.4}" fill="#fff"/>
    <ellipse cx="${cx + w * 0.55}" cy="${cy + 2}" rx="${w * 0.4}" ry="${w * 0.26}" fill="#fff"/>
  </g>`;
}

function pine(x: number, base: number, h: number): string {
  return `<rect x="${x - 3}" y="${base - 8}" width="6" height="10" fill="#5a3a1e"/>
    <path d="M${x},${base - h} L${x + h * 0.3},${base - h * 0.45} H${x + h * 0.18} L${x + h * 0.38},${base - 6} H${x - h * 0.38} L${x - h * 0.18},${base - h * 0.45} H${x - h * 0.3} Z" fill="url(#trainPine)"/>`;
}

function roundTree(x: number, base: number, r: number): string {
  return `<rect x="${x - 4}" y="${base - r}" width="8" height="${r}" fill="#6a4424"/>
    <circle cx="${x}" cy="${base - r * 1.5}" r="${r}" fill="#3f8a34"/><circle cx="${x - r * 0.3}" cy="${base - r * 1.8}" r="${r * 0.55}" fill="#6cb84a"/>`;
}

// A cow facing right (dir 1) or left (dir -1); size 1 is about 70 px long
function cow(x: number, y: number, dir: number, size: number): string {
  return `<g transform="translate(${x},${y}) scale(${dir * size},${size})">
    <ellipse cx="0" cy="24" rx="34" ry="4" fill="#2f6b24" opacity="0.35"/>
    <path d="M-20,8 V24 M-10,10 V24 M12,10 V24 M22,8 V24" stroke="#f6f2ea" stroke-width="6" stroke-linecap="round"/>
    <ellipse cx="0" cy="0" rx="30" ry="15" fill="#f6f2ea" stroke="#cfc8bb"/>
    <path d="M-14,-10 q10,-4 12,6 q-4,10 -14,4 Z M6,2 q10,-2 12,6 q-6,6 -14,0 Z" fill="#2b2b33"/>
    <path d="M-30,-4 q-8,6 -4,18" stroke="#cfc8bb" stroke-width="2" fill="none"/>
    <path d="M26,-10 L40,-14 L46,4 L34,8 Z" fill="#f6f2ea" stroke="#cfc8bb"/>
    <ellipse cx="42" cy="5" rx="8" ry="6" fill="#f2b8c0"/><circle cx="35" cy="-6" r="1.6" fill="#111"/>
    <path d="M28,-12 q-4,-6 0,-9 M38,-14 q4,-6 0,-9" stroke="#e8dcc4" stroke-width="3" fill="none" stroke-linecap="round"/>
  </g>`;
}

function drawTrain(has: Has): string {
  const random = seeded(1825);
  let s = `<defs>
    <linearGradient id="trainSky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3f8fe0"/><stop offset="1" stop-color="#c8e6fb"/>
    </linearGradient>
    <linearGradient id="trainHills" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#9ccf7a"/><stop offset="1" stop-color="#6aa84f"/>
    </linearGradient>
    <linearGradient id="trainGrass" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#7cc456"/><stop offset="1" stop-color="#3f8a2e"/>
    </linearGradient>
    <linearGradient id="trainStone" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#d8c8aa"/><stop offset="1" stop-color="#9a8466"/>
    </linearGradient>
    <linearGradient id="trainRiver" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#9ad4f0"/><stop offset="1" stop-color="#2f7fc4"/>
    </linearGradient>
    <linearGradient id="trainPine" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#2f7a3e"/><stop offset="1" stop-color="#174a26"/>
    </linearGradient>
    <linearGradient id="trainBoiler" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#5cc27a"/><stop offset="0.45" stop-color="#1f8a44"/><stop offset="1" stop-color="#0c4a22"/>
    </linearGradient>
    <linearGradient id="trainShine" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity="0.35"/><stop offset="0.5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.25"/>
    </linearGradient>
    <radialGradient id="trainSun" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#fff6b0"/><stop offset="0.6" stop-color="#ffd23f"/><stop offset="1" stop-color="#ffd23f" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="800" height="600" fill="url(#trainSky)"/>`;

  // Sun, clouds and the far hills
  s += '<circle cx="700" cy="80" r="70" fill="url(#trainSun)"/><circle cx="700" cy="80" r="30" fill="#ffd23f" stroke="#fff2a8" stroke-width="3"/>';
  s += cloud(150, 80, 55) + cloud(620, 128, 40);
  if (!has("cloud")) s += cloud(420, 52, 44);
  s += `<path d="M0,280 Q150,220 300,262 Q450,205 600,252 Q700,232 800,242 V600 H0 Z" fill="url(#trainHills)" opacity="0.85"/>`;
  for (let k = 0; k < 26; k++) {
    const x = random() * 800, y = 262 + random() * 40;
    s += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(4 + random() * 4).toFixed(1)}" fill="#4f9a3e" opacity="0.8"/>`;
  }

  // Valley with the river
  s += `<path d="M0,330 H196 Q300,430 420,440 Q560,430 650,330 H800 V600 H0 Z" fill="#6fb24c"/>
    <path d="M400,440 Q420,436 440,444 Q470,500 452,540 Q432,580 480,600 H340 Q370,560 390,520 Q410,480 400,440 Z" fill="url(#trainRiver)"/>
    <path d="M396,500 q14,-4 26,0 M380,552 q20,-4 40,0" stroke="#fff" stroke-width="2" opacity="0.6" fill="none"/>`;

  // Stone viaduct with arches
  let arches = "M180,330 H662 V570 H180 Z";
  for (let k = 0; k < PIERS.length - 1; k++) {
    const x1 = PIERS[k]! + 9, x2 = PIERS[k + 1]! - 9;
    arches += ` M${x1},570 V${400} A${(x2 - x1) / 2},${(x2 - x1) / 2} 0 0,1 ${x2},400 V570 Z`;
  }
  s += `<path d="${arches}" fill="url(#trainStone)" fill-rule="evenodd" stroke="#7a6448" stroke-width="2"/>
    <g stroke="#8a7456" stroke-width="1" opacity="0.6">`;
  for (let y = 344; y < 570; y += 14) {
    for (let k = 0; k < PIERS.length; k++) {
      const off = (y / 14) % 2 ? 0 : 5;
      s += `<path d="M${PIERS[k]! - 9},${y} h18 M${PIERS[k]! - 4 + off},${y} v14"/>`;
    }
  }
  s += `</g><rect x="176" y="324" width="490" height="10" fill="#b8a482"/><path d="M180,346 H662" stroke="#7a6448" stroke-width="2"/>`;

  // Hill with the tunnel, pines and signal
  s += `<path d="M640,334 Q652,234 740,196 Q780,184 800,188 V600 H640 Z" fill="url(#trainGrass)"/>
    <path d="M694,334 V286 A38,38 0 0,1 770,286 V334 Z" fill="#9a8466" stroke="#6a5438" stroke-width="2"/>
    <path d="M704,334 V290 A28,28 0 0,1 760,290 V334 Z" fill="#1a1612"/>
    <path d="M722,254 h20 l-3,10 h-14 Z" fill="#b8a482" stroke="#6a5438"/>`;
  s += pine(705, 228, 46) + pine(784, 196, 54);
  if (!has("pine")) s += pine(745, 204, 62);
  s += `<path d="M668,330 V230" stroke="#3a3a44" stroke-width="4"/><circle cx="668" cy="228" r="3" fill="#3a3a44"/>
    <g transform="rotate(${has("signal") ? -40 : 0},668,236)"><rect x="668" y="232" width="32" height="8" fill="#d6303a"/><rect x="690" y="232" width="4" height="8" fill="#fff"/></g>
    <rect x="662" y="246" width="12" height="18" rx="2" fill="#2a2a30"/><circle cx="668" cy="251" r="3" fill="#ff4a3a"/><circle cx="668" cy="259" r="3" fill="#3ad66a"/>`;

  // Station on the left plateau
  s += `<rect x="0" y="322" width="198" height="14" fill="#b0a898"/><rect x="0" y="320" width="198" height="4" fill="#e8e0d0"/>
    <rect x="20" y="236" width="150" height="86" fill="#f4e6c8"/>
    <path d="M8,238 L95,188 L182,238 Z" fill="#b84a2e"/><path d="M8,238 H182" stroke="#7a2a18" stroke-width="5"/>
    <circle cx="95" cy="216" r="14" fill="#fff" stroke="url(#trainStone)" stroke-width="3"/>`;
  s += has("stationClock")
    ? '<path d="M95,216 L95,207 M95,216 L88,220" stroke="#222" stroke-width="2" stroke-linecap="round"/>'
    : '<path d="M95,216 L95,205 M95,216 L102,216" stroke="#222" stroke-width="2" stroke-linecap="round"/>';
  s += `<rect x="62" y="244" width="66" height="14" fill="#1f5a3a"/><text x="95" y="255" text-anchor="middle" font-family="Georgia, serif" font-size="10" fill="#fff">STEAMVALE</text>
    <rect x="80" y="276" width="30" height="46" fill="#1f5a3a"/><circle cx="104" cy="300" r="2" fill="#e2b54a"/>
    <rect x="34" y="266" width="30" height="30" fill="#9ad4f0" stroke="#7a2a18" stroke-width="3"/><rect x="128" y="266" width="30" height="30" fill="#9ad4f0" stroke="#7a2a18" stroke-width="3"/>
    <rect x="32" y="296" width="34" height="7" fill="#7a4a24"/><rect x="126" y="296" width="34" height="7" fill="#7a4a24"/>
    <g fill="#e84a6a"><circle cx="38" cy="294" r="3"/><circle cx="48" cy="293" r="3"/><circle cx="58" cy="294" r="3"/><circle cx="134" cy="294" r="3"/><circle cx="144" cy="293" r="3"/><circle cx="154" cy="294" r="3"/></g>`;

  // Conductor waving a flag
  s += `<path d="M174,302 V320 M182,302 V320" stroke="#1d2a4a" stroke-width="5"/>
    <path d="M168,280 H188 L190,304 H166 Z" fill="#24346a"/><path d="M178,282 V302" stroke="#e2b54a" stroke-width="1" stroke-dasharray="2 4"/>
    <path d="M169,284 L156,272" stroke="#24346a" stroke-width="5" stroke-linecap="round"/>
    <circle cx="178" cy="272" r="7" fill="#f5d0b0"/><path d="M170,268 H186 V262 H172 Z M168,268 H188" stroke="#1d2a4a" stroke-width="2" fill="#24346a"/>
    <path d="M155,274 V250" stroke="#5a3a1e" stroke-width="2"/>
    <path d="M155,250 H138 V264 H155 Z" fill="${has("conductorFlag") ? "#d6303a" : "#2fa84a"}"/>`;

  // Rails, carriages and locomotive
  s += '<path d="M0,330 H700" stroke="#4a4a52" stroke-width="4"/>';
  CARRIAGES.forEach(({ x, color }, k) => {
    const body = k === 1 && has("carriageColor") ? "#8a4ac4" : color;
    s += `<rect x="${x + 4}" y="306" width="80" height="10" fill="#2a2a30"/>
      <rect x="${x}" y="274" width="88" height="40" rx="4" fill="${body}"/><rect x="${x}" y="274" width="88" height="40" rx="4" fill="url(#trainShine)"/>
      <path d="M${x - 3},276 Q${x + 44},258 ${x + 91},276 Z" fill="#3a3a44"/>
      <path d="M${x},306 H${x + 88}" stroke="#fff" stroke-width="2" opacity="0.5"/>
      ${[10, 35, 60].map(dx => `<rect x="${x + dx}" y="282" width="18" height="18" rx="3" fill="#fdf4d8" stroke="#2a2a30" stroke-width="1.5"/>`).join("")}
      <circle cx="${x + 20}" cy="322" r="8" fill="#2a2a30"/><circle cx="${x + 68}" cy="322" r="8" fill="#2a2a30"/>
      <circle cx="${x + 20}" cy="322" r="3" fill="#c0c0c8"/><circle cx="${x + 68}" cy="322" r="3" fill="#c0c0c8"/>
      <rect x="${x + 88}" y="304" width="7" height="4" fill="#2a2a30"/>`;
  });
  if (!has("passenger")) s += '<path d="M240,300 q9,-6 18,0 v0 Z" fill="#2fa84a"/><circle cx="249" cy="292" r="7" fill="#f5d0b0"/><circle cx="246.5" cy="291" r="1" fill="#222"/><circle cx="251.5" cy="291" r="1" fill="#222"/><path d="M240,286 H258 M243,286 V279 H255 V286" stroke="#6a3a1a" stroke-width="2.5" fill="#6a3a1a"/>';
  const driver = has("locoWheel") ? "#f0c020" : "#d6303a";
  s += `<rect x="500" y="248" width="48" height="60" rx="3" fill="#d6303a"/><rect x="500" y="248" width="48" height="60" fill="url(#trainShine)"/>
    <rect x="494" y="240" width="60" height="10" rx="3" fill="#1a1a20"/>
    <rect x="510" y="258" width="26" height="20" rx="3" fill="#fdf4d8" stroke="#1a1a20" stroke-width="2"/>
    <rect x="544" y="270" width="96" height="34" rx="6" fill="url(#trainBoiler)"/>
    <path d="M566,270 V304 M598,270 V304 M628,270 V304" stroke="#e2b54a" stroke-width="3"/>
    <path d="M576,270 a9,9 0 0,1 18,0 Z" fill="#e2b54a"/>
    <path d="M612,270 V244 H626 V270 Z" fill="#1a1a20"/><rect x="607" y="236" width="24" height="8" rx="2" fill="#1a1a20"/>
    <rect x="636" y="272" width="8" height="32" rx="2" fill="#1a1a20"/><circle cx="645" cy="282" r="5" fill="#fff6b0" stroke="#1a1a20" stroke-width="2"/>
    <rect x="498" y="302" width="150" height="6" fill="#1a1a20"/>
    <path d="M640,308 L658,328 H640 Z" fill="#d6303a" stroke="#1a1a20" stroke-width="1.5"/>
    <circle cx="522" cy="321" r="9" fill="#1a1a20"/><circle cx="522" cy="321" r="4" fill="#d6303a"/>
    <circle cx="565" cy="316" r="14" fill="#1a1a20"/><circle cx="565" cy="316" r="10" fill="${driver}"/>
    <circle cx="597" cy="316" r="14" fill="#1a1a20"/><circle cx="597" cy="316" r="10" fill="#d6303a"/>
    <circle cx="632" cy="322" r="8" fill="#1a1a20"/><circle cx="632" cy="322" r="4" fill="#d6303a"/>
    <path d="M565,320 H597" stroke="#c0c0c8" stroke-width="4" stroke-linecap="round"/>
    <circle cx="565" cy="316" r="3" fill="#1a1a20"/><circle cx="597" cy="316" r="3" fill="#1a1a20"/>`;

  // Steam puffs
  PUFFS.forEach(([x, y, r], k) => {
    if (k === LOST_PUFF && has("steamPuff")) return;
    s += `<circle cx="${x}" cy="${y + 3}" r="${r}" fill="#cfd8e2" opacity="0.9"/><circle cx="${x - r * 0.2}" cy="${y - r * 0.15}" r="${r * 0.85}" fill="#fff" opacity="0.92"/>`;
  });

  // Foreground fields, trees and cows
  s += `<path d="M0,470 Q120,454 250,480 Q330,500 372,600 H0 Z" fill="url(#trainGrass)"/>
    <path d="M520,600 Q550,520 650,494 Q730,478 800,486 V600 Z" fill="url(#trainGrass)"/>
    <path d="M20,500 H230 M20,520 H240" stroke="#f3ead8" stroke-width="4"/>
    ${[24, 70, 116, 162, 208].map(x => `<rect x="${x - 3}" y="490" width="6" height="40" fill="#f3ead8" stroke="#a8977a"/>`).join("")}`;
  s += '<g stroke="#2f7524" stroke-width="2" stroke-linecap="round">';
  for (let k = 0; k < 30; k++) {
    const left = random() < 0.5, x = left ? random() * 320 : 560 + random() * 240, y = 540 + random() * 55;
    s += `<path d="M${x.toFixed(0)},${y.toFixed(0)} l-3,-7 M${x.toFixed(0)},${y.toFixed(0)} l3,-8"/>`;
  }
  s += "</g>";
  s += roundTree(290, 500, 22) + roundTree(780, 500, 18) + pine(560, 540, 50);
  s += cow(80, 554, 1, 0.9) + cow(745, 548, -1, 0.85);
  if (!has("calf")) s += cow(178, 566, -1, 0.55);
  if (!has("cow")) s += cow(640, 556, 1, 0.75);
  if (!has("boat")) {
    s += `<path d="M404,520 H442 L436,530 H410 Z" fill="#b84a2e" stroke="#6a2a18"/>
      <circle cx="422" cy="512" r="4" fill="#f5d0b0"/><path d="M418,516 h8 v5 h-8 Z" fill="#f0b830"/>
      <path d="M408,524 L398,514 M436,524 L446,514" stroke="#7a4a24" stroke-width="2"/>`;
  }
  return s;
}

function trainDifferences(): Difference[] {
  const [px, py] = PUFFS[LOST_PUFF]!;
  return [
    { id: "cloud", x: 424, y: 50, r: 36 },
    { id: "stationClock", x: 95, y: 214, r: 18 },
    { id: "conductorFlag", x: 148, y: 258, r: 16 },
    { id: "passenger", x: 249, y: 292, r: 15 },
    { id: "carriageColor", x: 344, y: 295, r: 30 },
    { id: "steamPuff", x: px, y: py, r: 26 },
    { id: "locoWheel", x: 565, y: 316, r: 16 },
    { id: "signal", x: 686, y: 228, r: 20 },
    { id: "pine", x: 745, y: 172, r: 30 },
    { id: "boat", x: 422, y: 518, r: 24 },
    { id: "calf", x: 180, y: 564, r: 26 },
    { id: "cow", x: 642, y: 552, r: 32 },
  ];
}

export const train: Scene = { name: "The Steam Train", draw: drawTrain, differences: trainDifferences() };
