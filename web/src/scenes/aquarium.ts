// Scene: The Aquarium
import { seeded, SHARED_DEFS } from "./helpers";
import type { Has, Difference, Scene } from "./types";

// Tank glass and water
const TANK = { x: 100, y: 112, w: 600, h: 336 };
const WATER_TOP = 138, GRAVEL_TOP = 400;

// Goldfish swimming to the left (flip = -1) or right (flip = 1)
function goldfish(x: number, y: number, size: number, flip: number): string {
  return `<g transform="translate(${x},${y}) scale(${flip * size},${size})">
    <path d="M-18,0 Q-34,-16 -40,-12 Q-34,0 -40,12 Q-34,16 -18,0 Z" fill="#ff9a3a" opacity="0.9"/>
    <ellipse cx="0" cy="0" rx="22" ry="14" fill="url(#aquariumGold)"/>
    <path d="M-6,-12 Q2,-24 12,-11 Z M-2,12 Q4,20 10,11 Z" fill="#ff9a3a"/>
    <path d="M10,-11 Q4,0 10,11" stroke="#d8601a" stroke-width="1.5" fill="none"/>
    <circle cx="14" cy="-3" r="3.5" fill="#fff"/><circle cx="15" cy="-3" r="2" fill="#111"/>
    <ellipse cx="-2" cy="-6" rx="9" ry="3" fill="#fff" opacity="0.35"/></g>`;
}

function guppy(x: number, y: number, tail: string): string {
  return `<g transform="translate(${x},${y})">
    <path d="M-7,0 L-20,-8 Q-23,0 -20,8 Z" fill="${tail}" opacity="0.9"/>
    <ellipse cx="0" cy="0" rx="9" ry="4.5" fill="#cfd8e0"/><circle cx="5" cy="-1" r="1.5" fill="#111"/></g>`;
}

function drawAquarium(has: Has): string {
  const random = seeded(2911);
  let s = `<defs>${SHARED_DEFS}
    <linearGradient id="aquariumWall" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f3e2c4"/><stop offset="1" stop-color="#e2c9a0"/>
    </linearGradient>
    <linearGradient id="aquariumWater" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#7fd8e8"/><stop offset="0.6" stop-color="#2a9ab8"/><stop offset="1" stop-color="#16627e"/>
    </linearGradient>
    <linearGradient id="aquariumWood" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#9a5e32"/><stop offset="1" stop-color="#5e341a"/>
    </linearGradient>
    <linearGradient id="aquariumFloor" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#b07a48"/><stop offset="1" stop-color="#7a4e2a"/>
    </linearGradient>
    <radialGradient id="aquariumGold" cx="40%" cy="35%" r="70%">
      <stop offset="0" stop-color="#ffd27a"/><stop offset="0.6" stop-color="#ff8a1e"/><stop offset="1" stop-color="#d8501a"/>
    </radialGradient>
    <linearGradient id="aquariumStone" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#b8b0a8"/><stop offset="0.5" stop-color="#e2dcd2"/><stop offset="1" stop-color="#8a8078"/>
    </linearGradient>
    <linearGradient id="aquariumBeam" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fffbe0" stop-opacity="0.45"/><stop offset="1" stop-color="#fffbe0" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="aquariumLampGlow" cx="50%" cy="20%" r="60%">
      <stop offset="0" stop-color="#fff4c0" stop-opacity="0.8"/><stop offset="1" stop-color="#fff4c0" stop-opacity="0"/>
    </radialGradient>
    <clipPath id="aquariumClip"><rect x="${TANK.x}" y="${WATER_TOP}" width="${TANK.w}" height="${TANK.y + TANK.h - WATER_TOP}"/></clipPath>
  </defs>
  <rect width="800" height="600" fill="url(#aquariumWall)"/>`;

  // Striped wallpaper, wooden floor and skirting board
  s += '<g fill="#d8b888" opacity="0.35">';
  for (let x = 0; x < 800; x += 40) s += `<rect x="${x}" width="14" height="540"/>`;
  s += `</g><rect y="530" width="800" height="70" fill="url(#aquariumFloor)"/><rect y="524" width="800" height="10" fill="#f8efe0"/>
    <g stroke="#5e3a1e" stroke-width="1.5" opacity="0.5">${[552, 576].map(y => `<line x1="0" y1="${y}" x2="800" y2="${y}"/>`).join("")}
    ${[60, 210, 380, 520, 690].map((x, k) => `<line x1="${x + (k % 2) * 40}" y1="${534 + (k % 2) * 18}" x2="${x + (k % 2) * 40}" y2="${552 + (k % 2) * 24}"/>`).join("")}</g>`;

  // Pendant lamp hanging over the tank
  const shade = has("lampShade") ? "#c8423a" : "#3a8a5a";
  s += `<ellipse cx="400" cy="120" rx="250" ry="70" fill="url(#aquariumLampGlow)"/>
    <line x1="400" y1="0" x2="400" y2="40" stroke="#4a3a2a" stroke-width="3"/>
    <path d="M362,74 Q364,40 400,38 Q436,40 438,74 Z" fill="${shade}" stroke="#2a2a2a" stroke-width="2"/>
    <path d="M372,66 Q376,46 396,44" stroke="#fff" stroke-width="3" fill="none" opacity="0.4"/>
    <ellipse cx="400" cy="76" rx="14" ry="6" fill="#fff6c8"/>`;

  // Wall clock and a framed fish picture
  s += `<circle cx="750" cy="96" r="30" fill="#fff8ec" stroke="#6a4426" stroke-width="5"/>
    ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(k => { const a = k * Math.PI / 6; return `<circle cx="${(750 + 22 * Math.sin(a)).toFixed(1)}" cy="${(96 - 22 * Math.cos(a)).toFixed(1)}" r="1.6" fill="#4a3a2a"/>`; }).join("")}`;
  s += has("clockHands")
    ? '<path d="M750,96 L734,96 M750,96 L762,80" stroke="#2a2a2a" stroke-width="3" stroke-linecap="round"/>'
    : '<path d="M750,96 L750,80 M750,96 L766,104" stroke="#2a2a2a" stroke-width="3" stroke-linecap="round"/>';
  s += `<circle cx="750" cy="96" r="2.5" fill="#c8423a"/>
    <rect x="18" y="160" width="64" height="80" fill="#e8f4f8" stroke="#8a5a32" stroke-width="5"/>
    <path d="M30,210 Q50,190 70,210 Q50,226 30,210 Z" fill="#4aa8c8"/><path d="M30,210 L22,200 L22,220 Z" fill="#4aa8c8"/>`;

  // Wooden cabinet with two doors
  s += `<rect x="80" y="448" width="640" height="16" fill="#6e3e1e"/>
    <rect x="90" y="462" width="620" height="66" fill="url(#aquariumWood)"/>
    <rect x="104" y="472" width="284" height="48" rx="3" fill="none" stroke="#3e220e" stroke-width="2"/>
    <rect x="412" y="472" width="284" height="48" rx="3" fill="none" stroke="#3e220e" stroke-width="2"/>
    <rect x="374" y="482" width="6" height="28" rx="3" fill="url(#gold)"/>`;
  if (!has("cabinetHandle")) s += '<rect x="420" y="482" width="6" height="28" rx="3" fill="url(#gold)"/>';

  // Water, light beams and the gravel bed
  s += `<rect x="${TANK.x}" y="${WATER_TOP}" width="${TANK.w}" height="${TANK.y + TANK.h - WATER_TOP}" fill="url(#aquariumWater)"/>
    <rect x="${TANK.x}" y="${TANK.y}" width="${TANK.w}" height="${WATER_TOP - TANK.y}" fill="#dff4fa" opacity="0.35"/>
    <g clip-path="url(#aquariumClip)">
    <path d="M330,138 L250,400 H340 L380,138 Z M420,138 L460,400 H540 L470,138 Z" fill="url(#aquariumBeam)"/>
    <path d="M100,${GRAVEL_TOP} Q200,388 300,398 Q420,408 520,394 Q620,384 700,398 V448 H100 Z" fill="#c8a878"/>`;
  const gravel = ["#e8d0a0", "#a88a60", "#d8b8c8", "#f0e8d8", "#8a7a6a"];
  for (let k = 0; k < 220; k++) {
    const x = 102 + random() * 596, y = 402 + random() * 44, c = gravel[Math.floor(random() * gravel.length)]!;
    s += `<ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="${(2 + random() * 2.5).toFixed(1)}" ry="2" fill="${c}"/>`;
  }
  s += `<path d="M100,138 Q160,134 220,138 T340,138 T460,138 T580,138 T700,138" stroke="#fff" stroke-width="2.5" fill="none" opacity="0.7"/>`;

  // Plants: a tall leafy one on the left, grassy tufts and a bushy one on the right
  const leaves: [number, number, number][] = [[128, 360, -30], [140, 330, 30], [126, 300, -30], [140, 268, 30], [130, 236, -20]];
  s += '<path d="M134,412 Q126,320 134,220" stroke="#2a7a3a" stroke-width="4" fill="none"/>';
  leaves.forEach(([x, y, a], k) => {
    if (k === 2 && has("plantLeaf")) return;
    s += `<ellipse cx="${x + (a < 0 ? -12 : 12)}" cy="${y}" rx="22" ry="8" fill="${k % 2 ? "#3aa84a" : "#4cc05a"}" transform="rotate(${a},${x + (a < 0 ? -12 : 12)},${y})"/>`;
  });
  for (let k = 0; k < 14; k++) {
    const x = 170 + k * 34 + random() * 16, h = 30 + random() * 40;
    s += `<path d="M${x.toFixed(0)},412 q${(-6 + random() * 12).toFixed(0)},${(-h / 2).toFixed(0)} ${(-4 + random() * 8).toFixed(0)},${(-h).toFixed(0)}" stroke="#3a9a4a" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  }
  s += '<g fill="#2a8a5a">' + [[640, 360], [660, 340], [676, 366], [650, 316], [672, 300]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="10" ry="26" transform="rotate(${x! - 660},${x},${y})"/>`).join("") + "</g>";

  // Castle ornament
  s += `<g stroke="#6a625a" stroke-width="1.5">
    <rect x="520" y="340" width="70" height="70" fill="url(#aquariumStone)"/>
    <rect x="574" y="300" width="28" height="110" fill="url(#aquariumStone)"/>
    <path d="M520,340 v-10 h10 v10 h10 v-10 h10 v10 h10 v-10 h10 v10 M574,300 v-10 h8 v10 h6 v-10 h8 v10 h6 v-10" fill="none"/>
    <path d="M538,410 V380 Q552,364 566,380 V410 Z" fill="#2a2420"/><rect x="583" y="320" width="10" height="16" rx="5" fill="#2a2420"/></g>
    <line x1="588" y1="290" x2="588" y2="264" stroke="#4a3a2a" stroke-width="2"/>`;
  if (!has("castleFlag")) s += '<path d="M589,264 L608,270 L589,277 Z" fill="#e8403a"/>';

  // Treasure chest with gold and rising bubbles
  s += `<path d="M198,376 L190,350 Q218,336 246,350 L252,376 Z" fill="#6a3e1a" stroke="#4a2a10" stroke-width="1.5"/><path d="M194,362 H248" stroke="url(#gold)" stroke-width="3"/>
    <rect x="198" y="376" width="54" height="30" fill="#8a5a2a" stroke="#4a2a10" stroke-width="1.5"/>
    <ellipse cx="225" cy="377" rx="24" ry="5" fill="url(#gold)"/>
    <path d="M198,386 H252 M216,376 V406 M234,376 V406" stroke="url(#gold)" stroke-width="3"/>
    <circle cx="208" cy="374" r="4" fill="url(#gold)"/><circle cx="240" cy="373" r="4" fill="url(#gold)"/>`;
  const bubbles = [0, 1, 2, 3, 4, 5].map(k => [226 + Math.sin(k * 1.7) * 6, 360 - k * 14, 3 + k * 0.7] as const);
  if (!has("chestBubbles")) s += bubbles.map(([x, y, r]) => `<circle cx="${x.toFixed(1)}" cy="${y}" r="${r.toFixed(1)}" fill="#fff" fill-opacity="0.25" stroke="#fff" stroke-width="1.2"/>`).join("");

  // Diver figure with his air hose
  const suit = has("diverSuit") ? "#c8423a" : "#e8c040";
  s += `<path d="M330,346 Q350,250 380,${WATER_TOP}" stroke="#4a4a4a" stroke-width="3" fill="none"/>
    <rect x="306" y="366" width="28" height="30" rx="6" fill="${suit}" stroke="#6a5010" stroke-width="1.5"/>
    <rect x="308" y="394" width="10" height="16" fill="${suit}"/><rect x="322" y="394" width="10" height="16" fill="${suit}"/>
    <rect x="305" y="406" width="14" height="6" rx="2" fill="#3a3a3a"/><rect x="321" y="406" width="14" height="6" rx="2" fill="#3a3a3a"/>
    <path d="M306,372 L296,388 M334,372 L344,386" stroke="${suit}" stroke-width="7" stroke-linecap="round"/>
    <circle cx="320" cy="352" r="16" fill="url(#gold)" stroke="#8c6418" stroke-width="1.5"/>
    <circle cx="320" cy="352" r="8" fill="#9ad8f0" stroke="#5a4010" stroke-width="2"/><circle cx="317" cy="349" r="2.5" fill="#fff" opacity="0.8"/>`;

  // Fish: goldfish, a betta and a little school of guppies
  s += goldfish(230, 210, 1, 1);
  if (!has("goldfish")) s += goldfish(420, 182, 0.9, -1);
  const betta = has("bettaColor") ? ["#3a5ad8", "#6a8aff"] : ["#c8203a", "#ff5a6a"];
  s += `<g transform="translate(510,244)">
    <path d="M-10,0 Q-40,-34 -50,-6 Q-46,10 -50,24 Q-34,30 -10,4 Z" fill="${betta[1]}" opacity="0.9"/>
    <path d="M-12,-6 Q-4,-34 12,-8 Z M-10,6 Q0,34 10,6 Z" fill="${betta[1]}" opacity="0.85"/>
    <ellipse cx="0" cy="0" rx="18" ry="9" fill="${betta[0]}"/><circle cx="11" cy="-2" r="2.5" fill="#111"/>
    <path d="M-30,-14 Q-36,4 -34,18 M-22,-10 Q-26,4 -24,14" stroke="#fff" stroke-width="1" fill="none" opacity="0.4"/></g>`;
  const guppies: [number, number, string][] = [[310, 264, "#ff6ad0"], [338, 252, "#ffd040"], [350, 280, "#5ad0ff"], [388, 270, "#a070ff"]];
  guppies.forEach(([x, y, c], k) => { if (!(k === 3 && has("guppy"))) s += guppy(x, y, c); });

  // Shell on the gravel and a snail on the glass
  if (!has("shell")) s += '<path d="M428,428 Q440,408 452,428 Z" fill="#ffb0c0" stroke="#d8708a" stroke-width="1.5"/><path d="M440,428 V414 M434,428 L438,416 M446,428 L442,416" stroke="#d8708a" stroke-width="1"/>';
  s += "</g>";

  // Filter in the back corner with its stream of bubbles
  s += `<rect x="646" y="124" width="34" height="140" rx="6" fill="#4a5058" stroke="#2a2e34" stroke-width="2"/>
    <rect x="652" y="140" width="22" height="80" rx="3" fill="#6a7078"/>${[150, 162, 174, 186, 198, 210].map(y => `<line x1="655" y1="${y}" x2="671" y2="${y}" stroke="#3a4048" stroke-width="2"/>`).join("")}
    ${[0, 1, 2, 3, 4].map(k => `<circle cx="${640 - k * 4}" cy="${150 - k * 3}" r="${2 + k * 0.4}" fill="none" stroke="#fff" stroke-width="1"/>`).join("")}`;

  // Glass frame, reflections and lid
  s += `<g fill="#fff" opacity="0.14"><path d="M150,${TANK.y} L210,${TANK.y} L130,448 L100,448 L100,330 Z"/><path d="M560,${TANK.y} L590,${TANK.y} L500,448 L470,448 Z"/></g>
    <rect x="${TANK.x}" y="${TANK.y}" width="${TANK.w}" height="${TANK.h}" fill="none" stroke="#1e2a32" stroke-width="10"/>
    <rect x="${TANK.x - 8}" y="${TANK.y - 14}" width="${TANK.w + 16}" height="14" rx="3" fill="#2a3640"/>
    <rect x="${TANK.x - 8}" y="${TANK.y - 14}" width="${TANK.w + 16}" height="4" rx="2" fill="#4a5a66"/>
    <rect x="${TANK.x + 12}" y="${TANK.y + 8}" width="6" height="${TANK.h - 16}" fill="#fff" opacity="0.2"/>`;
  if (!has("snail")) {
    s += `<g transform="translate(150,172) scale(1.4)"><path d="M-14,8 Q-2,4 16,8 Q18,12 -14,12 Z" fill="#d8c0a0"/>
      <circle cx="0" cy="0" r="11" fill="#b8703a" stroke="#6a3a1a" stroke-width="1.5"/><path d="M0,0 m-6,0 a6,6 0 1,1 6,6 a3,3 0 1,1 -3,-3" stroke="#6a3a1a" stroke-width="1.5" fill="none"/>
      <path d="M14,8 L18,-2 M16,8 L22,0" stroke="#d8c0a0" stroke-width="1.5"/></g>`;
  }
  return s;
}

function aquariumDifferences(): Difference[] {
  return [
    { id: "lampShade", x: 400, y: 58, r: 30 },
    { id: "clockHands", x: 750, y: 94, r: 26 },
    { id: "snail", x: 152, y: 176, r: 26 },
    { id: "goldfish", x: 422, y: 182, r: 34 },
    { id: "bettaColor", x: 500, y: 246, r: 38 },
    { id: "castleFlag", x: 596, y: 272, r: 16 },
    { id: "plantLeaf", x: 114, y: 300, r: 24 },
    { id: "guppy", x: 382, y: 270, r: 18 },
    { id: "chestBubbles", x: 226, y: 326, r: 26 },
    { id: "diverSuit", x: 320, y: 388, r: 26 },
    { id: "shell", x: 440, y: 420, r: 16 },
    { id: "cabinetHandle", x: 423, y: 496, r: 18 },
  ];
}

export const aquarium: Scene = { name: "The Aquarium", draw: drawAquarium, differences: aquariumDifferences() };
