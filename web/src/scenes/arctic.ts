// Scene: The North Pole
import { seeded, sparkle, star, SHARED_DEFS } from "./helpers";
import type { Has, Difference, Scene } from "./types";

const PRINTS = Array.from({ length: 9 }, (_, k) => ({ x: 214 + k * 30, y: 586 - k * 5 + (k % 2) * 9 }));
const LOST_PRINTS = [3, 4, 5];

// Polar bear facing right; (x, y) is the middle of its body
function bear(x: number, y: number, s: number): string {
  return `<g transform="translate(${x},${y}) scale(${s})">
    <ellipse cx="0" cy="40" rx="60" ry="7" fill="#7f9cc0" opacity="0.45"/>
    <path d="M-44,10 v28 h14 v-22 M-14,14 v24 h14 v-22 M22,10 v28 h14 v-24 M40,6 v32 h14 v-26" fill="url(#arcticFur)" stroke="#a9bcd6" stroke-width="1.5"/>
    <ellipse cx="0" cy="0" rx="58" ry="30" fill="url(#arcticFur)"/>
    <path d="M-50,-8 q-10,4 -10,12" stroke="#c9d6e6" stroke-width="4" fill="none"/>
    <path d="M40,-14 Q60,-26 78,-14 Q88,-6 84,4 Q70,10 50,6 Z" fill="url(#arcticFur)"/>
    <circle cx="56" cy="-22" r="5" fill="#eef4fb" stroke="#a9bcd6"/>
    <circle cx="72" cy="-12" r="2.2" fill="#111"/><ellipse cx="85" cy="-4" rx="4" ry="3" fill="#111"/>
    <path d="M78,4 q-6,3 -12,0" stroke="#5a6a80" stroke-width="1.5" fill="none"/>
  </g>`;
}

function seal(x: number, y: number, flip: number): string {
  return `<g transform="translate(${x},${y}) scale(${flip},1)">
    <path d="M-30,6 Q-26,-8 0,-8 Q14,-10 20,-22 Q28,-30 34,-20 Q36,-6 28,6 Z" fill="url(#arcticSeal)"/>
    <path d="M-30,6 l-10,-6 l2,10 Z" fill="#5c6a7c"/><path d="M4,4 q4,-8 10,-2" stroke="#4a5666" stroke-width="2" fill="none"/>
    <circle cx="29" cy="-21" r="2" fill="#111"/><circle cx="35" cy="-17" r="1.5" fill="#222"/>
    <path d="M34,-16 l8,-2 M34,-15 l8,2" stroke="#ddd" stroke-width="0.8"/>
  </g>`;
}

function drawArctic(has: Has): string {
  const random = seeded(909);
  let s = `<defs>${SHARED_DEFS}
    <linearGradient id="arcticSky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#040820"/><stop offset="0.6" stop-color="#0d2248"/><stop offset="1" stop-color="#235177"/>
    </linearGradient>
    <linearGradient id="arcticAurora" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#b46bff" stop-opacity="0"/><stop offset="0.35" stop-color="#7a5cff" stop-opacity="0.45"/>
      <stop offset="0.7" stop-color="#3dffb0" stop-opacity="0.8"/><stop offset="1" stop-color="#3dffb0" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="arcticWater" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#16406a"/><stop offset="1" stop-color="#050f22"/>
    </linearGradient>
    <linearGradient id="arcticIce" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffffff"/><stop offset="0.55" stop-color="#cfe6fb"/><stop offset="1" stop-color="#7fa9d6"/>
    </linearGradient>
    <linearGradient id="arcticSnow" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f4f9ff"/><stop offset="1" stop-color="#b8cde6"/>
    </linearGradient>
    <linearGradient id="arcticFur" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fffdf4"/><stop offset="1" stop-color="#d9d3c0"/>
    </linearGradient>
    <linearGradient id="arcticSeal" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#9aa8b8"/><stop offset="1" stop-color="#5c6a7c"/>
    </linearGradient>
    <linearGradient id="arcticWalrus" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#c08a62"/><stop offset="1" stop-color="#7a4e32"/>
    </linearGradient>
    <linearGradient id="arcticTrail" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff"/>
    </linearGradient>
    <radialGradient id="arcticLamp" cx="50%" cy="70%" r="70%">
      <stop offset="0" stop-color="#fff2b0"/><stop offset="1" stop-color="#f08a24"/>
    </radialGradient>
    <filter id="arcticSoft" x="-50%" y="-20%" width="200%" height="140%"><feGaussianBlur stdDeviation="2"/></filter>
    <filter id="arcticBlur" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
  </defs>
  <rect width="800" height="600" fill="url(#arcticSky)"/>`;

  // Stars, the moon and the northern lights
  for (let k = 0; k < 100; k++) {
    s += `<circle cx="${(random() * 800).toFixed(0)}" cy="${(random() * 300).toFixed(0)}" r="${(0.5 + random() * 1.3).toFixed(1)}" fill="#fff" opacity="${(0.35 + random() * 0.6).toFixed(2)}"/>`;
  }
  s += sparkle(90, 50, 8) + sparkle(420, 26, 7);
  if (!has("brightStar")) s += sparkle(560, 44, 12);
  s += `<circle cx="736" cy="64" r="26" fill="#fffbe8" filter="url(#glow)"/><circle cx="748" cy="56" r="24" fill="#071030"/>
    <g filter="url(#arcticBlur)">
      <path d="M0,200 C140,90 300,210 450,120 S680,40 800,100 L800,170 C680,120 590,200 450,190 S160,170 0,260 Z" fill="url(#arcticAurora)"/>
      <path d="M100,150 C250,60 380,140 520,80 S720,90 800,60 L800,100 C700,120 620,110 520,130 S260,110 100,190 Z" fill="url(#arcticAurora)" opacity="0.7"/>
    </g>
    <g stroke="#7dffc8" stroke-width="4" opacity="0.3" filter="url(#arcticSoft)">`;
  for (let k = 0; k < 40; k++) {
    const x = random() * 800, t = 160 - x * 0.1 + Math.sin(x / 110) * 30;
    s += `<line x1="${x.toFixed(0)}" y1="${(t - 30 - random() * 30).toFixed(0)}" x2="${(x + 4).toFixed(0)}" y2="${(t + 20).toFixed(0)}"/>`;
  }
  s += "</g>";
  if (has("shootingStar")) {
    s += `<path d="M262,96 L318,64" stroke="url(#arcticTrail)" stroke-width="3" stroke-linecap="round"/>${sparkle(318, 64, 7)}`;
  }

  // Distant ice mountains and the dark sea
  s += `<path d="M0,330 L60,300 L110,318 L180,288 L260,322 L330,296 L420,326 L520,302 L600,324 L700,292 L800,318 L800,340 L0,340 Z" fill="#8fb0d4" opacity="0.6"/>
    <rect y="336" width="800" height="264" fill="url(#arcticWater)"/>
    <ellipse cx="420" cy="420" rx="300" ry="30" fill="#3dffb0" opacity="0.08" filter="url(#arcticBlur)"/>
    <g stroke="#9fd0ff" stroke-width="1.5" opacity="0.35">`;
  for (let k = 0; k < 30; k++) {
    const x = random() * 780, y = 350 + random() * 240;
    s += `<line x1="${x.toFixed(0)}" y1="${y.toFixed(0)}" x2="${(x + 14 + random() * 26).toFixed(0)}" y2="${y.toFixed(0)}"/>`;
  }
  s += "</g>";

  // Icebergs, with the snowy owl on the right one
  s += '<path d="M20,372 L70,388 L190,392 L236,372 Z" fill="#7fb8e6" opacity="0.35"/>';
  if (!has("icebergPeak")) s += '<path d="M150,250 L194,204 L228,372 L160,372 Z" fill="url(#arcticIce)"/>';
  s += `<path d="M10,372 L36,270 L78,240 L118,168 L156,232 L200,300 L236,372 Z" fill="url(#arcticIce)"/>
    <path d="M118,168 L132,250 L110,372 L236,372 L200,300 L156,232 Z" fill="#7fa9d6" opacity="0.45"/>
    <path d="M10,372 L236,372" stroke="#e8f4ff" stroke-width="3"/>
    <path d="M560,352 L590,282 L630,252 L660,216 L700,242 L742,278 L772,352 Z" fill="url(#arcticIce)"/>
    <path d="M660,216 L668,290 L640,352 L772,352 L742,278 L700,242 Z" fill="#7fa9d6" opacity="0.45"/>
    <path d="M560,352 L772,352" stroke="#e8f4ff" stroke-width="3"/>`;
  if (!has("owl")) {
    s += `<g transform="translate(660,200)">
      <ellipse cx="0" cy="0" rx="12" ry="16" fill="#fbfbf6" stroke="#9aa8b8"/>
      <circle cx="0" cy="-16" r="10" fill="#fbfbf6" stroke="#9aa8b8"/>
      <circle cx="-4" cy="-17" r="3" fill="#ffd21a"/><circle cx="4" cy="-17" r="3" fill="#ffd21a"/>
      <circle cx="-4" cy="-17" r="1.3" fill="#111"/><circle cx="4" cy="-17" r="1.3" fill="#111"/>
      <path d="M-1.5,-13 L0,-9 L1.5,-13 Z" fill="#333"/>
      <path d="M-6,-2 h2 M2,2 h2 M-4,6 h2 M4,8 h2" stroke="#444" stroke-width="1.5"/>
    </g>`;
  }

  // Small floe with seals, and a leaping fish
  s += `<path d="M322,392 Q330,374 380,376 Q450,372 488,382 Q494,394 470,398 Q400,404 340,400 Z" fill="url(#arcticSnow)"/>
    <path d="M322,392 Q400,404 470,398 Q494,394 488,382 L486,392 Q420,410 330,402 Z" fill="#6f98c4"/>`;
  s += seal(372, 376, 1);
  if (!has("seal")) s += seal(448, 376, -1);
  if (!has("fishJump")) {
    s += `<path d="M560,432 Q572,404 596,410" stroke="#cfe6fb" stroke-width="1.5" fill="none" stroke-dasharray="3 3"/>
      <g transform="translate(600,414) rotate(30)"><ellipse cx="0" cy="0" rx="12" ry="5" fill="#b8c8d8"/><path d="M-11,0 l-8,-6 v12 Z" fill="#8aa0bc"/><circle cx="7" cy="-1" r="1.3" fill="#111"/></g>
      <path d="M552,434 q8,-8 16,0" stroke="#e8f4ff" stroke-width="2" fill="none"/>`;
  }

  // The big ice floe in front
  s += `<path d="M0,442 Q120,430 260,444 Q420,436 572,458 L590,600 L0,600 Z" fill="url(#arcticSnow)"/>
    <path d="M572,458 L590,600 L606,600 L586,470 Z" fill="#6f98c4"/>
    <path d="M40,520 q60,-10 120,4 M300,520 q80,-12 160,2" stroke="#a9c2e0" stroke-width="2" fill="none"/>`;

  // Igloo
  s += `<ellipse cx="124" cy="482" rx="74" ry="10" fill="#9ab4d4" opacity="0.6"/>
    <path d="M58,482 A64,64 0 0,1 186,482 Z" fill="url(#arcticIce)"/>
    <g stroke="#8fb0d4" stroke-width="1.5" fill="none">
      <path d="M62,460 H182 M72,438 H174 M88,420 H160 M106,429 V420 M140,429 V420 M84,449 V438 M120,449 V438 M156,449 V438 M100,471 V460 M138,471 V460 M76,471 V460"/>
    </g>
    <path d="M160,482 v-22 a18,18 0 0,1 36,0 v22 Z" fill="url(#arcticIce)" stroke="#8fb0d4" stroke-width="1.5"/>
    <path d="M168,482 v-18 a10,10 0 0,1 20,0 v18 Z" fill="${has("iglooLight") ? "#152a48" : "url(#arcticLamp)"}"/>`;

  // Arctic fox
  if (!has("foxTail")) s += '<path d="M78,548 Q46,546 40,526 Q52,532 64,530 Q78,532 86,540 Z" fill="#eef3fa" stroke="#8aa0bc" stroke-width="1.5"/>';
  s += `<ellipse cx="102" cy="562" rx="26" ry="5" fill="#9ab4d4" opacity="0.6"/>
    <path d="M86,546 v14 M96,548 v14 M110,548 v14 M118,546 v14" stroke="#c9d6e6" stroke-width="4" stroke-linecap="round"/>
    <ellipse cx="102" cy="540" rx="22" ry="11" fill="#eef3fa" stroke="#8aa0bc" stroke-width="1.5"/>
    <path d="M118,534 L120,518 L126,526 L132,518 L134,530 Q142,536 136,542 Q128,546 118,540 Z" fill="#eef3fa" stroke="#8aa0bc" stroke-width="1.5"/>
    <circle cx="128" cy="531" r="1.6" fill="#111"/><circle cx="140" cy="538" r="2" fill="#111"/>`;

  // Paw prints, the polar bear and her cub
  PRINTS.forEach((p, k) => {
    if (has("pawPrints") && LOST_PRINTS.includes(k)) return;
    s += `<g fill="#9ab4d4"><ellipse cx="${p.x}" cy="${p.y}" rx="6" ry="4"/><circle cx="${p.x + 6}" cy="${p.y - 5}" r="1.8"/><circle cx="${p.x + 8}" cy="${p.y}" r="1.8"/></g>`;
  });
  s += bear(340, 462, 1);
  if (!has("bearCub")) s += bear(246, 484, 0.45);

  // North Pole signpost
  s += `<ellipse cx="500" cy="552" rx="22" ry="5" fill="#9ab4d4" opacity="0.7"/>`;
  for (let k = 0; k < 8; k++) {
    s += `<rect x="495" y="${440 + k * 14}" width="10" height="14" fill="${k % 2 ? "#fff" : "#d8202e"}"/>`;
  }
  s += `<path d="M456,458 H536 L548,469 L536,480 H456 Z" fill="#d8202e" stroke="#8c1018" stroke-width="2"/>
    <text x="496" y="473" text-anchor="middle" font-family="Georgia, serif" font-weight="bold" font-size="12" fill="#fff">North Pole</text>
    <circle cx="500" cy="440" r="6" fill="url(#gold)"/>`;
  if (!has("signStar")) s += star(500, 420, 13, 5.5, 5, "url(#gold)", 'stroke="#8c6418" stroke-width="1"');

  // Walrus on its floe
  s += `<path d="M612,520 Q640,490 720,494 Q790,492 800,500 L800,600 L630,600 Q612,560 612,520 Z" fill="url(#arcticSnow)"/>
    <path d="M612,520 Q612,560 630,600 L616,600 Q600,560 604,522 Z" fill="#6f98c4"/>
    <ellipse cx="730" cy="530" rx="62" ry="10" fill="#9ab4d4" opacity="0.6"/>
    <path d="M660,506 Q680,470 730,476 Q786,480 790,520 Q780,534 740,532 L680,532 Q662,526 660,506 Z" fill="url(#arcticWalrus)"/>
    <path d="M680,530 q-14,4 -18,-4 M770,528 l18,8 l-4,-14" fill="#7a4e32"/>
    <circle cx="662" cy="500" r="20" fill="url(#arcticWalrus)"/>
    <ellipse cx="654" cy="510" rx="14" ry="9" fill="#d4a27a"/>
    <circle cx="660" cy="491" r="2.2" fill="#111"/>
    <g stroke="#5a3a24" stroke-width="1"><path d="M646,508 l-8,-2 M646,512 l-8,1 M660,510 l8,-2 M660,514 l8,1"/></g>`;
  if (!has("walrusTusks")) {
    s += `<path d="M648,515 Q646,530 650,540 Q652,530 653,516 Z M658,516 Q657,532 662,541 Q663,530 663,516 Z" fill="#fffbe8" stroke="#b8a888" stroke-width="1"/>`;
  }
  return s;
}

function arcticDifferences(): Difference[] {
  return [
    { id: "brightStar", x: 560, y: 44, r: 16 },
    { id: "shootingStar", x: 292, y: 80, r: 30 },
    { id: "icebergPeak", x: 196, y: 262, r: 34 },
    { id: "owl", x: 660, y: 194, r: 24 },
    { id: "seal", x: 448, y: 370, r: 24 },
    { id: "fishJump", x: 582, y: 422, r: 26 },
    { id: "iglooLight", x: 178, y: 472, r: 16 },
    { id: "bearCub", x: 254, y: 482, r: 30 },
    { id: "signStar", x: 500, y: 420, r: 16 },
    { id: "foxTail", x: 60, y: 538, r: 22 },
    { id: "pawPrints", x: 324, y: 576, r: 24 },
    { id: "walrusTusks", x: 655, y: 528, r: 16 },
  ];
}

export const arctic: Scene = { name: "The North Pole", draw: drawArctic, differences: arcticDifferences() };
