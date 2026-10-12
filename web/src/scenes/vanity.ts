// Scene 3: Perfume & Pearls
import { seeded, star, sparkle, diamond, pearl, SHARED_DEFS } from "./helpers";
import type { Point, Has, Difference, Scene } from "./types";

const PEARL_LOOP = { cx: 250, cy: 555, rx: 95, ry: 22, count: 26 };
function loopPearl(k: number): Point {
  const a = 2 * Math.PI * k / PEARL_LOOP.count;
  return [PEARL_LOOP.cx + PEARL_LOOP.rx * Math.cos(a), PEARL_LOOP.cy + PEARL_LOOP.ry * Math.sin(a)];
}

function drawVanity(has: Has): string {
  const random = seeded(5);
  let s = `<defs>${SHARED_DEFS}
    <linearGradient id="vBg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f9dfe4"/><stop offset="1" stop-color="#e3a2b4"/>
    </linearGradient>
    <linearGradient id="vGlass" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#c3cfe4"/>
    </linearGradient>
    <linearGradient id="vMarble" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fdfbfa"/><stop offset="1" stop-color="#e6dedb"/>
    </linearGradient>
    <linearGradient id="vPink" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffd6e6" stop-opacity="0.95"/><stop offset="1" stop-color="#f06292" stop-opacity="0.9"/>
    </linearGradient>
    <linearGradient id="vViolet" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#efe0ff" stop-opacity="0.95"/><stop offset="1" stop-color="#9c6ade" stop-opacity="0.9"/>
    </linearGradient>
    <linearGradient id="vAmber" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#b86a12"/><stop offset="0.5" stop-color="#f3b34a"/><stop offset="1" stop-color="#a0560a"/>
    </linearGradient>
    <clipPath id="vMirrorClip"><ellipse cx="400" cy="205" rx="152" ry="116"/></clipPath>
  </defs>
  <rect width="800" height="600" fill="url(#vBg)"/>`;

  // Wallpaper lattice
  s += '<g stroke="#c9963a" stroke-width="1" opacity="0.25">';
  for (let x = -400; x < 800; x += 50) {
    s += `<line x1="${x}" y1="0" x2="${x + 400}" y2="400"/><line x1="${x + 400}" y1="0" x2="${x}" y2="400"/>`;
  }
  s += "</g>";

  // Mirror
  s += `<ellipse cx="400" cy="205" rx="152" ry="116" fill="url(#vGlass)"/>
    <g clip-path="url(#vMirrorClip)" fill="#fff" opacity="0.55">
      <path d="M260,250 L380,90 L410,90 L290,250 Z"/><path d="M320,320 L470,110 L485,110 L335,320 Z"/>
    </g>
    <ellipse cx="400" cy="205" rx="160" ry="124" fill="none" stroke="url(#gold)" stroke-width="16"/>
    <path d="M360,86 Q400,40 440,86 Q420,76 400,80 Q380,76 360,86 Z" fill="url(#gold)"/>
    ${star(400, 52, 10, 4, 5, "url(#gold)")}
    <circle cx="400" cy="70" r="7" fill="${has("mirrorCrown") ? "url(#gemSapphire)" : "url(#gemRuby)"}" stroke="#fff1b8" stroke-width="1.5"/>`;
  if (!has("mirrorSparkle")) s += sparkle(312, 145, 16, "#d4a63a");
  s += sparkle(478, 262, 10, "#d4a63a");

  // Marble table
  s += `<rect y="400" width="800" height="200" fill="url(#vMarble)"/>
    <rect y="398" width="800" height="6" fill="url(#gold)"/>`;
  s += '<g stroke="#b9b0ad" fill="none" opacity="0.45">';
  for (let k = 0; k < 7; k++) {
    const x = random() * 800, y = 420 + random() * 160;
    s += `<path d="M${x.toFixed(0)},${y.toFixed(0)} q${(30 + random() * 40).toFixed(0)},${(-10 + random() * 20).toFixed(0)} ${(80 + random() * 60).toFixed(0)},${(-5 + random() * 30).toFixed(0)} t${(60 + random() * 60).toFixed(0)},${(-10 + random() * 20).toFixed(0)}" stroke-width="${(0.8 + random()).toFixed(1)}"/>`;
  }
  s += "</g>";

  // Pink ostrich feather behind the rose
  s += '<path d="M706,395 C700,300 690,230 640,160" stroke="#f3a9c4" stroke-width="2.5" fill="none"/>';
  s += '<g stroke="#ffc6da" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.85">';
  for (let k = 0; k <= 40; k++) {
    const t = 0.25 + 0.75 * k / 40, u = 1 - t;
    const x = u * u * u * 706 + 3 * u * u * t * 700 + 3 * u * t * t * 690 + t * t * t * 640;
    const y = u * u * u * 395 + 3 * u * u * t * 300 + 3 * u * t * t * 230 + t * t * t * 160;
    const len = 18 + 14 * Math.sin(Math.PI * k / 40);
    s += `<path d="M${x.toFixed(1)},${y.toFixed(1)} q${(-len * 0.7).toFixed(1)},${(len * 0.2).toFixed(1)} ${(-len).toFixed(1)},${(len * 0.65).toFixed(1)}"/>`;
    s += `<path d="M${x.toFixed(1)},${y.toFixed(1)} q${(len * 0.7).toFixed(1)},${(-len * 0.1).toFixed(1)} ${len.toFixed(1)},${(len * 0.55).toFixed(1)}"/>`;
  }
  s += "</g>";

  // Rose in a crystal vase
  s += `<path d="M700,395 C698,340 702,300 700,250" stroke="#2e7d32" stroke-width="4" fill="none"/>
    <path d="M699,330 Q672,318 668,300 Q690,302 699,330 Z" fill="#43a047"/>`;
  if (!has("roseLeaf")) s += '<path d="M701,300 Q728,290 734,270 Q710,272 701,300 Z" fill="#43a047"/>';
  s += `<circle cx="700" cy="240" r="24" fill="#b0102e"/>
    <path d="M680,236 Q700,210 720,236 Q700,226 680,236 Z" fill="#d81b45"/>
    <path d="M686,246 Q700,232 714,246 Q700,256 686,246 Z" fill="#8a0a22"/>
    <path d="M692,238 Q700,228 708,238" stroke="#ff5577" stroke-width="2" fill="none"/>
    <path d="M684,390 L716,390 L722,500 L678,500 Z" fill="#fff" fill-opacity="0.35" stroke="#fff" stroke-width="2"/>
    <line x1="690" y1="400" x2="686" y2="490" stroke="#fff" stroke-width="3" opacity="0.6"/>`;

  // Bottle 1: faceted pink, with a label
  s += `<ellipse cx="175" cy="502" rx="56" ry="7" fill="#000" opacity="0.12"/>
    <path d="M140,420 L210,420 L228,460 L210,500 L140,500 L122,460 Z" fill="url(#vPink)" stroke="#fff" stroke-width="1.5"/>
    <path d="M140,420 L158,460 L140,500 M210,420 L192,460 L210,500 M122,460 L158,460 M192,460 L228,460" stroke="#fff" stroke-opacity="0.6" fill="none"/>
    <rect x="165" y="404" width="20" height="17" fill="url(#gold)"/>
    <circle cx="175" cy="390" r="16" fill="url(#gold)"/>
    <rect x="152" y="448" width="46" height="22" rx="3" fill="#fff8f0" stroke="#d4a63a"/>
    <text x="175" y="464" font-family="Georgia, serif" font-size="13" text-anchor="middle" fill="#5a3b0a">${has("label") ? "N°8" : "N°5"}</text>`;

  // Bottle 2: round, with an atomizer bulb and tassel
  s += `<ellipse cx="320" cy="502" rx="48" ry="7" fill="#000" opacity="0.12"/>
    <circle cx="320" cy="455" r="45" fill="url(#vViolet)" stroke="#fff" stroke-width="1.5"/>
    <path d="M296,430 Q300,418 314,414" stroke="#fff" stroke-width="4" fill="none" opacity="0.7" stroke-linecap="round"/>
    <rect x="311" y="398" width="18" height="14" fill="url(#gold)"/>
    <path d="M329,404 Q360,384 380,392" stroke="url(#gold)" stroke-width="3" fill="none"/>
    <ellipse cx="395" cy="394" rx="16" ry="20" fill="#9c1446"/>
    <path d="M383,384 L407,404 M383,404 L407,384 M395,374 L395,414" stroke="#e2b54a" stroke-width="1" opacity="0.8"/>`;
  const tassel = has("tassel") ? "#ff4f9a" : "#e2b54a";
  s += `<g stroke="${tassel}" stroke-width="2.5" stroke-linecap="round">
    <line x1="395" y1="414" x2="395" y2="424"/>
    <line x1="395" y1="424" x2="388" y2="446"/><line x1="395" y1="424" x2="393" y2="448"/>
    <line x1="395" y1="424" x2="398" y2="448"/><line x1="395" y1="424" x2="403" y2="446"/>
  </g><circle cx="395" cy="424" r="4" fill="${tassel}"/>`;

  // Bottle 3: tall amber with a crystal stopper
  const liquidTop = has("liquidLevel") ? 430 : 395;
  s += `<ellipse cx="470" cy="507" rx="30" ry="5" fill="#000" opacity="0.12"/>
    <rect x="448" y="360" width="44" height="145" rx="6" fill="#fff" fill-opacity="0.3" stroke="#fff" stroke-width="1.5"/>
    <rect x="450" y="${liquidTop}" width="40" height="${503 - liquidTop}" rx="4" fill="url(#vAmber)" opacity="0.9"/>
    <line x1="456" y1="368" x2="456" y2="495" stroke="#fff" stroke-width="3" opacity="0.6"/>
    <rect x="462" y="344" width="16" height="16" fill="url(#gold)"/>`;
  s += has("stopper")
    ? `<circle cx="470" cy="328" r="15" fill="url(#gemWhite)" stroke="#fff"/>`
    : diamond(470, 326, 32, "url(#gemWhite)");

  // Lipstick
  const lipstick = has("lipstick") ? "#7b1fa2" : "#c4002f";
  s += `<ellipse cx="585" cy="506" rx="20" ry="4" fill="#000" opacity="0.12"/>
    <path d="M576,430 L576,410 Q585,398 594,402 L594,430 Z" fill="${lipstick}"/>
    <rect x="573" y="428" width="24" height="22" fill="#d9d9e0"/>
    <rect x="569" y="448" width="32" height="58" rx="3" fill="url(#gold)"/>
    <line x1="575" y1="452" x2="575" y2="502" stroke="#fff1b8" stroke-width="2"/>`;

  // Pearl loop on the table
  for (let k = 0; k < PEARL_LOOP.count; k++) {
    const [x, y] = loopPearl(k);
    s += pearl(x, y, 7, k === 8 && has("pearlGold") ? "url(#goldPearl)" : "url(#pearl)");
  }

  // Earrings in a golden dish
  s += `<ellipse cx="530" cy="566" rx="54" ry="15" fill="url(#gold)"/>
    <ellipse cx="530" cy="563" rx="44" ry="10" fill="#f3d27a"/>
    <path d="M508,546 q-7,-8 0,-14" stroke="#c9963a" stroke-width="2" fill="none"/>
    ${diamond(508, 553, 14, "url(#gemWhite)")}`;
  if (!has("earring")) {
    s += `<path d="M548,548 q7,-8 0,-14" stroke="#c9963a" stroke-width="2" fill="none"/>${diamond(548, 555, 14, "url(#gemWhite)")}`;
  }
  return s;
}

function vanityDifferences(): Difference[] {
  const goldPearl = loopPearl(8);
  return [
    { id: "mirrorCrown", x: 400, y: 70, r: 14 },
    { id: "mirrorSparkle", x: 312, y: 145, r: 18 },
    { id: "label", x: 175, y: 459, r: 22 },
    { id: "tassel", x: 395, y: 432, r: 18 },
    { id: "stopper", x: 470, y: 326, r: 20 },
    { id: "liquidLevel", x: 470, y: 412, r: 24 },
    { id: "lipstick", x: 585, y: 416, r: 18 },
    { id: "roseLeaf", x: 718, y: 286, r: 18 },
    { id: "pearlGold", x: goldPearl[0], y: goldPearl[1], r: 12 },
    { id: "earring", x: 548, y: 552, r: 16 },
  ];
}

export const vanity: Scene = { name: "Perfume & Pearls", draw: drawVanity, differences: vanityDifferences() };
