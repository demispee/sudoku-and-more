// Scene: City at Night
import { seeded, sparkle, SHARED_DEFS } from "./helpers";
import type { Has, Difference, Scene } from "./types";

const BASE = 370;
const BUILDINGS = [
  { x: 0, w: 70, top: 200, fill: "#1d2448" }, { x: 62, w: 60, top: 150, fill: "#252c58" },
  { x: 115, w: 80, top: 232, fill: "#1a2044" }, { x: 190, w: 55, top: 120, fill: "#2a2f5e" },
  { x: 240, w: 90, top: 210, fill: "#1f2650" }, { x: 325, w: 70, top: 180, fill: "#262b56" },
  { x: 390, w: 60, top: 250, fill: "#1b2147" }, { x: 445, w: 85, top: 140, fill: "#232a57" },
  { x: 525, w: 65, top: 222, fill: "#1d2349" }, { x: 585, w: 90, top: 180, fill: "#272d5c" },
  { x: 670, w: 60, top: 240, fill: "#1c2246" }, { x: 725, w: 80, top: 160, fill: "#242a55" },
];
const WINDOW_COLORS = ["#ffd97a", "#ffe9a8", "#ffc85a", "#fff3cf"];
const TOWERS = [170, 630];

function car(x: number, y: number, fill: string, right: boolean, beam: boolean): string {
  const front = right ? x + 46 : x - 2;
  let s = `<path d="M${x},${y} L${x + 46},${y} L${x + 46},${y - 9} L${x + 34},${y - 10} L${x + 28},${y - 18} L${x + 12},${y - 18} L${x + 6},${y - 10} L${x},${y - 9} Z" fill="${fill}"/>
    <path d="M${x + 13},${y - 16} L${x + 27},${y - 16} L${x + 31},${y - 10} L${x + 9},${y - 10} Z" fill="#9fb4e0" opacity="0.6"/>
    <circle cx="${x + 11}" cy="${y}" r="4.5" fill="#0b0d1c"/><circle cx="${x + 35}" cy="${y}" r="4.5" fill="#0b0d1c"/>
    <circle cx="${front + 1}" cy="${y - 5}" r="2.5" fill="#fffbe0"/>
    <circle cx="${right ? x : x + 46}" cy="${y - 5}" r="2" fill="#ff3b3b"/>`;
  if (beam) {
    const d = right ? 1 : -1;
    s += `<path d="M${front},${y - 5} L${front + 48 * d},${y - 14} L${front + 48 * d},${y + 4} Z" fill="url(#${right ? "cityBeam" : "cityBeamLeft"})" opacity="0.8"/>`;
  }
  return s;
}

function lamp(x: number, on: boolean): string {
  return `<line x1="${x}" y1="410" x2="${x}" y2="345" stroke="#3c4270" stroke-width="3"/>
    <path d="M${x},347 Q${x + 4},340 ${x + 12},343" stroke="#3c4270" stroke-width="3" fill="none"/>
    ${on ? `<circle cx="${x + 12}" cy="347" r="14" fill="url(#cityGlow)"/>` : ""}
    <ellipse cx="${x + 12}" cy="346" rx="5" ry="3.5" fill="${on ? "#fff2b0" : "#4a4f78"}"/>`;
}

function drawCity(has: Has): string {
  const random = seeded(88);
  let s = `<defs>${SHARED_DEFS}
    <linearGradient id="citySky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#070a24"/><stop offset="0.65" stop-color="#2a2160"/><stop offset="1" stop-color="#6b3a7a"/>
    </linearGradient>
    <linearGradient id="cityRiver" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1c1f4a"/><stop offset="1" stop-color="#05061a"/>
    </linearGradient>
    <linearGradient id="cityReflect" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3a3f78" stop-opacity="0.55"/><stop offset="1" stop-color="#3a3f78" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="cityMoon" cx="40%" cy="40%" r="70%">
      <stop offset="0" stop-color="#fffdf0"/><stop offset="1" stop-color="#e6dcae"/>
    </radialGradient>
    <radialGradient id="cityGlow"><stop offset="0" stop-color="#ffe9a0" stop-opacity="0.8"/><stop offset="1" stop-color="#ffe9a0" stop-opacity="0"/></radialGradient>
    <linearGradient id="cityBeam" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fff6c8" stop-opacity="0.9"/><stop offset="1" stop-color="#fff6c8" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="cityBeamLeft" x1="1" y1="0" x2="0" y2="0">
      <stop offset="0" stop-color="#fff6c8" stop-opacity="0.9"/><stop offset="1" stop-color="#fff6c8" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#citySky)"/>`;

  // Stars, a bright star, a plane and the moon
  for (let k = 0; k < 80; k++) {
    s += `<circle cx="${(random() * 800).toFixed(0)}" cy="${(random() * 230).toFixed(0)}" r="${(0.5 + random()).toFixed(1)}" fill="#fff" opacity="${(0.3 + random() * 0.6).toFixed(2)}"/>`;
  }
  if (!has("brightStar")) s += sparkle(470, 50, 10);
  if (!has("plane")) {
    s += `<g transform="rotate(-8,160,60)"><path d="M140,60 L180,60 L184,57 L180,63 L140,63 Z" fill="#8a90b8"/>
      <path d="M158,61 L150,72 L156,72 L168,61 Z M158,61 L152,52 L157,52 L166,61 Z" fill="#6d739c"/>
      <circle cx="140" cy="61" r="2.5" fill="#ff4b4b" filter="url(#glow)"/><circle cx="184" cy="59" r="2" fill="#7dffb0" filter="url(#glow)"/></g>`;
  }
  s += `<circle cx="700" cy="82" r="60" fill="url(#cityGlow)" opacity="0.5"/>
    <circle cx="700" cy="82" r="34" fill="url(#cityMoon)"/>
    <circle cx="690" cy="72" r="7" fill="#d8cc98" opacity="0.5"/><circle cx="712" cy="94" r="5" fill="#d8cc98" opacity="0.5"/><circle cx="706" cy="70" r="3" fill="#d8cc98" opacity="0.5"/>`;

  // Distant skyline
  s += '<g fill="#3a2f6e" opacity="0.8">';
  for (let x = 0; x < 800; x += 34) s += `<rect x="${x}" y="${(250 + random() * 70).toFixed(0)}" width="30" height="130"/>`;
  s += "</g>";

  // Buildings with lit windows
  BUILDINGS.forEach((b, i) => {
    s += `<rect x="${b.x}" y="${b.top}" width="${b.w}" height="${BASE - b.top}" fill="${b.fill}"/>
      <rect x="${b.x}" y="${b.top}" width="${b.w * 0.25}" height="${BASE - b.top}" fill="#fff" opacity="0.04"/>
      <rect x="${b.x - 2}" y="${b.top - 4}" width="${b.w + 4}" height="5" fill="#363d72"/>`;
    for (let y = b.top + 12; y < BASE - 12; y += 16) {
      for (let x = b.x + 7; x < b.x + b.w - 10; x += 12) {
        let lit = random() < 0.45;
        const c = WINDOW_COLORS[Math.floor(random() * WINDOW_COLORS.length)]!;
        if (i === 10 && y === b.top + 28) lit = !has("darkWindows");
        s += `<rect x="${x}" y="${y}" width="6" height="9" fill="${lit ? c : "#12162e"}" opacity="${lit ? 0.9 : 1}"/>`;
      }
    }
  });
  const tall = BUILDINGS[3]!, wide = BUILDINGS[5]!, tank = BUILDINGS[8]!, spire = BUILDINGS[7]!;
  s += `<path d="M${spire.x + 30},${spire.top - 4} L${spire.x + 42},${spire.top - 40} L${spire.x + 54},${spire.top - 4} Z" fill="#2c336a"/>`;
  if (!has("antenna")) {
    s += `<line x1="${tall.x + 27}" y1="${tall.top - 4}" x2="${tall.x + 27}" y2="${tall.top - 50}" stroke="#7d84b8" stroke-width="2.5"/>
      <line x1="${tall.x + 20}" y1="${tall.top - 22}" x2="${tall.x + 34}" y2="${tall.top - 22}" stroke="#7d84b8" stroke-width="2"/>
      <circle cx="${tall.x + 27}" cy="${tall.top - 52}" r="3.5" fill="#ff3b3b" filter="url(#glow)"/>`;
  }
  if (!has("waterTower")) {
    s += `<g fill="#4a3a52"><rect x="${tank.x + 22}" y="${tank.top - 26}" width="3" height="22"/><rect x="${tank.x + 42}" y="${tank.top - 26}" width="3" height="22"/>
      <rect x="${tank.x + 18}" y="${tank.top - 44}" width="31" height="24" rx="3" fill="#6b4e5a"/><path d="M${tank.x + 16},${tank.top - 44} L${tank.x + 33},${tank.top - 56} L${tank.x + 51},${tank.top - 44} Z"/></g>`;
  }

  // Billboard on the roof
  const board = has("billboard") ? "#2bb3c0" : "#e8418f";
  s += `<g stroke="#5a5f8c" stroke-width="3"><line x1="${wide.x + 14}" y1="${wide.top - 4}" x2="${wide.x + 14}" y2="${wide.top - 14}"/><line x1="${wide.x + 56}" y1="${wide.top - 4}" x2="${wide.x + 56}" y2="${wide.top - 14}"/></g>
    <rect x="${wide.x - 4}" y="${wide.top - 52}" width="78" height="40" rx="3" fill="${board}" stroke="#ffd1e8" stroke-width="2" filter="url(#glow)"/>
    <text x="${wide.x + 35}" y="${wide.top - 26}" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="17" fill="#fff">Dinner</text>`;

  // Road along the river with cars and street lamps
  s += `<rect y="${BASE}" width="800" height="40" fill="#22243e"/>
    <line x1="0" y1="${BASE + 20}" x2="800" y2="${BASE + 20}" stroke="#e8d27a" stroke-width="2" stroke-dasharray="18 14" opacity="0.6"/>
    <rect y="408" width="800" height="4" fill="#4a4f78"/>`;
  s += car(70, 400, "#d8d8e6", true, !has("carHeadlight"));
  s += car(390, 388, "#e2a83a", false, true);
  s += car(690, 400, "#4a8ad8", true, true);
  [40, 260, 480, 720].forEach(x => { s += lamp(x, !(x === 480 && has("streetLamp"))); });

  // River with reflections
  s += '<rect y="412" width="800" height="188" fill="url(#cityRiver)"/>';
  BUILDINGS.forEach(b => { s += `<rect x="${b.x}" y="412" width="${b.w}" height="${((BASE - b.top) * 0.75).toFixed(0)}" fill="url(#cityReflect)"/>`; });
  s += '<g stroke-linecap="round">';
  for (let k = 0; k < 70; k++) {
    const x = random() * 800, y = 418 + random() * 170, w = 4 + random() * 14, c = WINDOW_COLORS[Math.floor(random() * WINDOW_COLORS.length)]!;
    s += `<line x1="${x.toFixed(0)}" y1="${y.toFixed(0)}" x2="${(x + w).toFixed(0)}" y2="${y.toFixed(0)}" stroke="${c}" stroke-width="1.5" opacity="${(0.15 + random() * 0.35).toFixed(2)}"/>`;
  }
  s += "</g>";
  if (!has("moonReflection")) {
    s += `<g stroke="#fff6d6" stroke-linecap="round" opacity="0.7"><line x1="684" y1="542" x2="716" y2="542" stroke-width="3"/>
      <line x1="690" y1="552" x2="712" y2="552" stroke-width="2.5"/><line x1="680" y1="562" x2="720" y2="562" stroke-width="2"/><line x1="693" y1="572" x2="707" y2="572" stroke-width="2"/></g>`;
  }

  // Suspension bridge with lights
  const deck = 455;
  TOWERS.forEach(x => {
    s += `<rect x="${x}" y="290" width="22" height="${deck - 290 + 60}" fill="#3a3270"/>
      <rect x="${x}" y="290" width="6" height="${deck - 230}" fill="#5a52a0"/>
      <rect x="${x - 4}" y="330" width="30" height="7" fill="#2a2458"/><rect x="${x - 4}" y="390" width="30" height="7" fill="#2a2458"/>`;
    if (!(x === 630 && has("towerLight"))) s += `<circle cx="${x + 11}" cy="284" r="4.5" fill="#ff3b3b" filter="url(#glow)"/>`;
  });
  const cable = (x: number): number => x < 181 ? 330 - 40 * (x / 181) : x > 641 ? 290 + 40 * ((x - 641) / 159) : 290 + 150 * (1 - Math.pow((x - 411) / 230, 2));
  let d = "M0,330";
  for (let x = 10; x <= 800; x += 10) d += ` L${x},${cable(x).toFixed(1)}`;
  s += `<path d="${d}" stroke="#8a84c8" stroke-width="2.5" fill="none"/>`;
  s += '<g stroke="#8a84c8" stroke-width="1" opacity="0.7">';
  for (let x = 20; x < 800; x += 20) if (Math.abs(x - 181) > 12 && Math.abs(x - 641) > 12) s += `<line x1="${x}" y1="${cable(x).toFixed(1)}" x2="${x}" y2="${deck}"/>`;
  s += '</g><g fill="#ffe9a0" filter="url(#glow)">';
  for (let x = 40; x < 800; x += 40) if (Math.abs(x - 181) > 15 && Math.abs(x - 641) > 15) s += `<circle cx="${x}" cy="${cable(x).toFixed(1)}" r="2.2"/>`;
  s += "</g>";
  s += car(278, deck - 2, has("carColor") ? "#3b6fd8" : "#d8343b", true, true);
  s += car(540, deck - 2, "#e8e2d0", false, true);
  s += `<rect y="${deck}" width="800" height="13" fill="#2e2862"/><rect y="${deck}" width="800" height="3" fill="#6d66b0"/>
    <g fill="#ffd97a">`;
  for (let x = 10; x < 800; x += 30) s += `<rect x="${x}" y="${deck + 6}" width="8" height="3" rx="1.5"/>`;
  s += "</g>";
  s += '<g stroke="#ffd97a" stroke-width="1.5" opacity="0.25">';
  for (let x = 10; x < 800; x += 60) s += `<path d="M${x + 4},${deck + 22} q4,6 0,12 q-4,6 0,12"/>`;
  s += "</g>";

  // A little boat
  if (!has("boat")) {
    s += `<path d="M395,548 L445,548 L438,560 L402,560 Z" fill="#c8c2e0"/><rect x="410" y="536" width="20" height="12" fill="#5a52a0"/>
      <rect x="414" y="539" width="5" height="5" fill="#ffd97a"/><rect x="422" y="539" width="5" height="5" fill="#ffd97a"/>
      <line x1="400" y1="566" x2="440" y2="566" stroke="#ffd97a" stroke-width="1.5" opacity="0.4"/>`;
  }
  return s;
}

function cityDifferences(): Difference[] {
  return [
    { id: "plane", x: 162, y: 61, r: 26 },
    { id: "brightStar", x: 470, y: 50, r: 16 },
    { id: "antenna", x: 217, y: 94, r: 26 },
    { id: "billboard", x: 360, y: 148, r: 30 },
    { id: "waterTower", x: 558, y: 190, r: 22 },
    { id: "darkWindows", x: 697, y: 272, r: 24 },
    { id: "towerLight", x: 641, y: 284, r: 14 },
    { id: "streetLamp", x: 490, y: 346, r: 18 },
    { id: "carHeadlight", x: 140, y: 395, r: 24 },
    { id: "carColor", x: 301, y: 443, r: 24 },
    { id: "boat", x: 420, y: 550, r: 28 },
    { id: "moonReflection", x: 700, y: 557, r: 26 },
  ];
}

export const city: Scene = { name: "City at Night", draw: drawCity, differences: cityDifferences() };
