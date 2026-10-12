// Scene: A Day at the Beach
import { seeded, starPath } from "./helpers";
import type { Has, Difference, Scene, Point } from "./types";

const APEX: Point = [600, 268];
const CANOPY_LEFT = 490, CANOPY_RIGHT = 710, CANOPY_BASE = 330, WEDGES = 6;
// Towel corners: top-left, top-right, bottom-right, bottom-left
const TOWEL: Point[] = [[500, 505], [700, 505], [720, 565], [480, 565]];
const BALL = { cx: 380, cy: 482, r: 28 };

function lerp(a: Point, b: Point, t: number): Point {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

function gull(x: number, y: number, size: number): string {
  return `<path d="M${x - size},${y} Q${x - size / 2},${y - size * 0.6} ${x},${y} Q${x + size / 2},${y - size * 0.6} ${x + size},${y}" stroke="#3a4a5e" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
}

function cloud(x: number, y: number, scale: number): string {
  return `<g fill="#ffffff" opacity="0.92" transform="translate(${x},${y}) scale(${scale})">
    <ellipse cx="0" cy="0" rx="42" ry="14"/><ellipse cx="-14" cy="-10" rx="18" ry="14"/><ellipse cx="12" cy="-14" rx="22" ry="17"/>
    <ellipse cx="0" cy="6" rx="40" ry="6" fill="#d8ecf8"/></g>`;
}

function drawBeach(has: Has): string {
  const random = seeded(41);
  let s = `<defs>
    <linearGradient id="beachSky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#5ab4ea"/><stop offset="1" stop-color="#c9ecfb"/>
    </linearGradient>
    <linearGradient id="beachSea" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1f7fb8"/><stop offset="0.6" stop-color="#2fa8c8"/><stop offset="1" stop-color="#6fd6d0"/>
    </linearGradient>
    <linearGradient id="beachSand" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f2d9a2"/><stop offset="1" stop-color="#e2b874"/>
    </linearGradient>
    <radialGradient id="beachSun"><stop offset="0" stop-color="#fffbe0"/><stop offset="0.5" stop-color="#ffe680"/><stop offset="1" stop-color="#ffd040" stop-opacity="0"/></radialGradient>
    <radialGradient id="beachShade" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#a8804a" stop-opacity="0.45"/><stop offset="1" stop-color="#a8804a" stop-opacity="0"/></radialGradient>
    <radialGradient id="beachBallShine" cx="35%" cy="30%" r="70%">
      <stop offset="0" stop-color="#fff" stop-opacity="0.6"/><stop offset="0.5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.25"/>
    </radialGradient>
  </defs>
  <rect width="800" height="600" fill="url(#beachSky)"/>`;

  // Sun, clouds and seagulls
  s += `<circle cx="650" cy="92" r="80" fill="url(#beachSun)"/><circle cx="650" cy="92" r="36" fill="#fff4b0"/>`;
  s += cloud(320, 70, 1.1) + cloud(520, 160, 0.7);
  if (!has("cloud")) s += cloud(130, 72, 0.85);
  s += gull(470, 100, 13) + gull(330, 150, 10) + gull(760, 190, 9);
  if (!has("seagull")) s += gull(420, 124, 14);

  // Sea with waves, a sailboat and a buoy
  s += `<rect y="240" width="800" height="160" fill="url(#beachSea)"/>
    <rect y="240" width="800" height="3" fill="#ffffff" opacity="0.4"/>
    <g stroke="#ffffff" stroke-linecap="round" fill="none">`;
  for (let k = 0; k < 40; k++) {
    const y = 250 + random() * 130, x = random() * 800, w = 10 + (y - 240) * 0.2 + random() * 12;
    s += `<path d="M${x.toFixed(0)},${y.toFixed(0)} q${(w / 2).toFixed(0)},-4 ${w.toFixed(0)},0" stroke-width="${(1 + (y - 240) / 80).toFixed(1)}" opacity="${(0.35 + random() * 0.35).toFixed(2)}"/>`;
  }
  s += "</g>";
  s += `<path d="M185,255 L255,255 L245,268 L195,268 Z" fill="#7a3e1e"/><rect x="185" y="253" width="70" height="4" fill="#f4f4f4"/>
    <line x1="220" y1="255" x2="220" y2="178" stroke="#5a3a20" stroke-width="2.5"/>
    <path d="M223,183 L223,250 L264,250 Z" fill="#fbfbf6"/>
    <path d="M217,195 L217,250 L190,250 Z" fill="#f0eee6"/>
    <path d="M223,${183 + 67 * 0.5} L223,${183 + 67 * 0.65} L${223 + 41 * 0.65},${183 + 67 * 0.65} L${223 + 41 * 0.5},${183 + 67 * 0.5} Z" fill="${has("sail") ? "#2a6fd0" : "#e2402e"}"/>
    <path d="M220,178 L232,182 L220,186 Z" fill="#e2402e"/>
    <path d="M190,272 q10,-4 20,0 M230,272 q10,-4 20,0" stroke="#fff" stroke-width="1.5" fill="none" opacity="0.6"/>`;
  if (!has("buoy")) {
    s += `<path d="M471,326 L489,326 L485,312 L475,312 Z" fill="#e2402e"/><rect x="474" y="316" width="12" height="4" fill="#fff"/>
      <line x1="480" y1="312" x2="480" y2="302" stroke="#3a3a3a" stroke-width="2"/><circle cx="480" cy="301" r="2.5" fill="#ffd040"/>
      <ellipse cx="480" cy="327" rx="14" ry="3" fill="#fff" opacity="0.5"/>`;
  }

  // Shore with foam and the sand
  s += `<path d="M0,384 Q50,374 100,384 T200,384 T300,384 T400,384 T500,384 T600,384 T700,384 T800,384 L800,600 L0,600 Z" fill="#e8c88e"/>
    <path d="M0,396 Q60,388 120,398 T240,398 T360,398 T480,398 T600,398 T720,398 T840,398 L800,600 L0,600 Z" fill="url(#beachSand)"/>
    <path d="M0,384 Q50,374 100,384 T200,384 T300,384 T400,384 T500,384 T600,384 T700,384 T800,384" stroke="#ffffff" stroke-width="4" fill="none" opacity="0.85"/>`;
  s += '<g fill="#c9995a" opacity="0.5">';
  for (let k = 0; k < 90; k++) s += `<circle cx="${(random() * 800).toFixed(0)}" cy="${(405 + random() * 195).toFixed(0)}" r="${(0.8 + random() * 1.2).toFixed(1)}"/>`;
  s += "</g>";

  // Towel
  s += `<path d="M${TOWEL.map(p => p.join(",")).join(" L")} Z" fill="#000" opacity="0.08" transform="translate(6,6)"/>`;
  const towelColors = ["#2a9fd6", "#ffffff", "#ffd040", "#ffffff", "#2a9fd6"];
  towelColors.forEach((c, j) => {
    const fill = j === 3 && has("towelStripe") ? "#f59cc0" : c;
    const a = lerp(TOWEL[0]!, TOWEL[1]!, j / 5), b = lerp(TOWEL[0]!, TOWEL[1]!, (j + 1) / 5);
    const cc = lerp(TOWEL[3]!, TOWEL[2]!, (j + 1) / 5), d = lerp(TOWEL[3]!, TOWEL[2]!, j / 5);
    s += `<path d="M${a.join(",")} L${b.join(",")} L${cc.join(",")} L${d.join(",")} Z" fill="${fill}"/>`;
  });
  s += `<path d="M${TOWEL.map(p => p.join(",")).join(" L")} Z" fill="none" stroke="#1d6f9a" stroke-width="1.5"/>`;

  // Striped parasol with its shadow
  s += `<ellipse cx="560" cy="480" rx="120" ry="18" fill="url(#beachShade)"/>
    <line x1="${APEX[0]}" y1="${APEX[1]}" x2="640" y2="478" stroke="#f4f4f4" stroke-width="5"/>
    <line x1="${APEX[0]}" y1="${APEX[1]}" x2="640" y2="478" stroke="#8a8a8a" stroke-width="1.5" opacity="0.5"/>`;
  for (let k = 0; k < WEDGES; k++) {
    const x0 = CANOPY_LEFT + (CANOPY_RIGHT - CANOPY_LEFT) * k / WEDGES, x1 = CANOPY_LEFT + (CANOPY_RIGHT - CANOPY_LEFT) * (k + 1) / WEDGES;
    const fill = k === 4 && has("parasolStripe") ? "#2a9fd6" : k % 2 === 0 ? "#e2402e" : "#fffaf0";
    s += `<path d="M${APEX[0]},${APEX[1]} L${x0.toFixed(1)},${CANOPY_BASE} Q${((x0 + x1) / 2).toFixed(1)},${CANOPY_BASE + 12} ${x1.toFixed(1)},${CANOPY_BASE} Z" fill="${fill}" stroke="#c8301f" stroke-width="1"/>`;
  }
  s += `<path d="M${CANOPY_LEFT},${CANOPY_BASE} Q${APEX[0]},${APEX[1] - 4} ${CANOPY_RIGHT},${CANOPY_BASE}" fill="#ffffff" opacity="0.18"/>
    <circle cx="${APEX[0]}" cy="${APEX[1] - 4}" r="5" fill="#e2402e"/>`;

  // Sandcastle with a bucket and spade
  s += `<ellipse cx="172" cy="502" rx="80" ry="10" fill="#b8905a" opacity="0.4"/>
    <g fill="#d9b06a" stroke="#b88a48" stroke-width="1.5">
      <rect x="122" y="440" width="100" height="60"/>
      <path d="M122,440 v-8 h12 v8 h12 v-8 h12 v8 h12 v-8 h12 v8 h12 v-8 h12 v8 h16 v-8 h-4"/>
      <rect x="108" y="420" width="26" height="80"/><path d="M106,420 L121,402 L136,420 Z"/>
      <rect x="210" y="420" width="26" height="80"/><path d="M208,420 L223,402 L238,420 Z"/>
      <rect x="152" y="396" width="40" height="46"/>
      <path d="M152,396 v-8 h8 v8 h8 v-8 h8 v8 h8 v-8 h8 v8"/>
    </g>
    <g fill="#b88a48" opacity="0.6"><rect x="167" y="408" width="10" height="12" rx="5"/><rect x="117" y="440" width="8" height="10" rx="4"/><rect x="219" y="440" width="8" height="10" rx="4"/></g>`;
  if (!has("castleDoor")) s += '<path d="M162,500 L162,484 Q172,470 182,484 L182,500 Z" fill="#8a6230"/>';
  s += '<line x1="172" y1="388" x2="172" y2="362" stroke="#5a3a20" stroke-width="2"/>';
  if (!has("castleFlag")) s += '<path d="M173,362 L192,368 L173,374 Z" fill="#2a9fd6"/>';
  s += `<path d="M258,476 L292,476 L286,508 L264,508 Z" fill="#ffd040" stroke="#d4a420" stroke-width="1.5"/>
    <ellipse cx="275" cy="476" rx="17" ry="4" fill="#e8b830"/>
    <path d="M259,478 Q275,452 291,478" stroke="#e2402e" stroke-width="2" fill="none"/>
    <line x1="300" y1="470" x2="318" y2="430" stroke="#2a9fd6" stroke-width="3"/><path d="M296,478 L304,462 L312,470 L304,486 Z" fill="#e2402e"/>`;

  // Beach ball
  const ballColors = ["#e2402e", "#ffffff", "#ffd040", "#ffffff", "#2a9fd6", "#ffffff"];
  s += `<ellipse cx="${BALL.cx + 4}" cy="${BALL.cy + BALL.r}" rx="${BALL.r}" ry="5" fill="#a8804a" opacity="0.4"/>`;
  ballColors.forEach((c, k) => {
    const fill = k === 2 && has("ballColor") ? "#3fb34f" : c;
    const a0 = (k * 60 - 90) * Math.PI / 180, a1 = ((k + 1) * 60 - 90) * Math.PI / 180;
    const p0: Point = [BALL.cx + BALL.r * Math.cos(a0), BALL.cy + BALL.r * Math.sin(a0)], p1: Point = [BALL.cx + BALL.r * Math.cos(a1), BALL.cy + BALL.r * Math.sin(a1)];
    s += `<path d="M${BALL.cx - 6},${BALL.cy - 8} L${p0[0].toFixed(1)},${p0[1].toFixed(1)} A${BALL.r},${BALL.r} 0 0,1 ${p1[0].toFixed(1)},${p1[1].toFixed(1)} Z" fill="${fill}"/>`;
  });
  s += `<circle cx="${BALL.cx}" cy="${BALL.cy}" r="${BALL.r}" fill="url(#beachBallShine)" stroke="#c9a070" stroke-width="1"/>
    <circle cx="${BALL.cx - 6}" cy="${BALL.cy - 8}" r="4" fill="#fff"/>`;

  // Crab
  s += `<g fill="#e2402e" stroke="#a82416" stroke-width="1.2">
      <path d="M284,566 l-12,6 M284,570 l-10,10 M316,566 l12,6 M316,570 l10,10" fill="none" stroke-width="3"/>
      <ellipse cx="300" cy="566" rx="20" ry="12"/>
      <path d="M288,558 L278,546" fill="none" stroke-width="3"/><path d="M270,540 Q274,532 282,540 L278,546 Z"/>`;
  if (!has("crabClaw")) s += '<path d="M312,558 L322,546" fill="none" stroke-width="3"/><path d="M330,540 Q326,532 318,540 L322,546 Z"/>';
  s += `</g><line x1="294" y1="556" x2="292" y2="548" stroke="#a82416" stroke-width="2"/><line x1="306" y1="556" x2="308" y2="548" stroke="#a82416" stroke-width="2"/>
    <circle cx="292" cy="547" r="3" fill="#fff"/><circle cx="308" cy="547" r="3" fill="#fff"/><circle cx="292" cy="547" r="1.5" fill="#111"/><circle cx="308" cy="547" r="1.5" fill="#111"/>`;

  // Shells and a starfish
  s += `<g transform="translate(90,560) rotate(-15)"><path d="M0,10 L-14,-6 Q0,-16 14,-6 Z" fill="#f6c8c0" stroke="#d48a80" stroke-width="1"/>
    <path d="M0,10 L-7,-10 M0,10 L0,-12 M0,10 L7,-10" stroke="#d48a80" stroke-width="1"/></g>`;
  if (!has("shell")) {
    s += `<g transform="translate(470,575) rotate(20)"><path d="M-12,4 Q-14,-10 0,-10 Q12,-10 12,0 Q12,8 2,8 Q-6,8 -6,0 Q-6,-5 0,-5 Q5,-5 5,0" fill="#f2e2c8" stroke="#b8946a" stroke-width="1.5"/></g>`;
  }
  if (!has("starfish")) s += `<path d="${starPath(730, 556, 17, 7, 5)}" fill="#f28a3a" stroke="#c8601f" stroke-width="1.5" stroke-linejoin="round"/>`;
  return s;
}

function beachDifferences(): Difference[] {
  return [
    { id: "cloud", x: 130, y: 66, r: 38 },
    { id: "seagull", x: 420, y: 120, r: 20 },
    { id: "sail", x: 236, y: 222, r: 18 },
    { id: "buoy", x: 480, y: 314, r: 18 },
    { id: "parasolStripe", x: 637, y: 310, r: 28 },
    { id: "towelStripe", x: 644, y: 535, r: 28 },
    { id: "castleFlag", x: 180, y: 368, r: 16 },
    { id: "castleDoor", x: 172, y: 488, r: 16 },
    { id: "ballColor", x: BALL.cx, y: BALL.cy, r: 30 },
    { id: "crabClaw", x: 324, y: 542, r: 14 },
    { id: "shell", x: 470, y: 575, r: 16 },
    { id: "starfish", x: 730, y: 556, r: 20 },
  ];
}

export const beach: Scene = { name: "A Day at the Beach", draw: drawBeach, differences: beachDifferences() };
