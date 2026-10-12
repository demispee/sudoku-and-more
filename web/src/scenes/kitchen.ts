// Scene: Kitchen Shelf
import { seeded } from "./helpers";
import type { Has, Difference, Scene } from "./types";

const SPICE_LIDS = ["#c8283a", "#2e7bd1", "#e2a020", "#3f8a3a", "#8a4ab8", "#e06a2a"];
const SPICE_FILLS = ["#b8401e", "#e8c84a", "#6a8a2a", "#8a4a20", "#d8742a", "#5a3a1a"];

// A wooden shelf board with two brackets; y is the top surface
function shelf(y: number, random: () => number): string {
  let s = `<path d="M30,${y + 14} L60,${y + 14} L60,${y + 50} Z M770,${y + 14} L740,${y + 14} L740,${y + 50} Z" fill="#7a4a24"/>
    <rect x="10" y="${y + 18}" width="780" height="6" fill="#000" opacity="0.12"/>
    <rect x="10" y="${y}" width="780" height="16" rx="2" fill="url(#kitchenWood)"/>
    <rect x="10" y="${y}" width="780" height="3" fill="#e0a868" opacity="0.7"/>`;
  for (let k = 0; k < 6; k++) {
    const x = 20 + random() * 700, w = 40 + random() * 60;
    s += `<path d="M${x.toFixed(0)},${(y + 6 + random() * 6).toFixed(0)} h${w.toFixed(0)}" stroke="#6a3a18" stroke-width="1" opacity="0.4"/>`;
  }
  return s;
}

function pan(cx: number, cy: number, r: number): string {
  return `<path d="M${cx},58 V${cy - r - 2}" stroke="#5a3a20" stroke-width="${r * 0.22}" stroke-linecap="round"/>
    <circle cx="${cx}" cy="64" r="4" fill="none" stroke="#3a3a3a" stroke-width="2"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#kitchenCopper)"/>
    <circle cx="${cx}" cy="${cy}" r="${r * 0.78}" fill="none" stroke="#7a3a14" stroke-width="2" opacity="0.5"/>
    <ellipse cx="${cx - r * 0.35}" cy="${cy - r * 0.35}" rx="${r * 0.22}" ry="${r * 0.4}" fill="#fff" opacity="0.35" transform="rotate(35 ${cx - r * 0.35} ${cy - r * 0.35})"/>`;
}

function cup(cx: number, base: number, color: string, handleLeft: boolean): string {
  const hx = handleLeft ? cx - 18 : cx + 18, dir = handleLeft ? -1 : 1;
  return `<ellipse cx="${cx}" cy="${base}" rx="22" ry="3" fill="#000" opacity="0.15"/>
    <path d="M${hx},${base - 24} q${dir * 14},2 ${dir * 2},18" stroke="${color}" stroke-width="5" fill="none"/>
    <path d="M${cx - 18},${base - 32} H${cx + 18} Q${cx + 17},${base} ${cx},${base} Q${cx - 17},${base} ${cx - 18},${base - 32} Z" fill="${color}"/>
    <ellipse cx="${cx}" cy="${base - 32}" rx="18" ry="4" fill="#fff"/><ellipse cx="${cx}" cy="${base - 31}" rx="14" ry="2.5" fill="#8a5a3a" opacity="0.6"/>
    <path d="M${cx - 12},${base - 26} q2,14 8,20" stroke="#fff" stroke-width="2.5" opacity="0.35" fill="none"/>`;
}

function lemon(x: number, y: number, rot: number): string {
  return `<g transform="rotate(${rot} ${x} ${y})"><ellipse cx="${x}" cy="${y}" rx="17" ry="12" fill="url(#kitchenLemon)"/>
    <path d="M${x - 19},${y} l4,-2 v4 Z M${x + 19},${y} l-4,-2 v4 Z" fill="#e8b818"/>
    <ellipse cx="${x - 5}" cy="${y - 5}" rx="5" ry="2.5" fill="#fff" opacity="0.5"/></g>`;
}

function drawKitchen(has: Has): string {
  const random = seeded(4242);
  let s = `<defs>
    <linearGradient id="kitchenWall" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f8ecd4"/><stop offset="1" stop-color="#ead2a8"/>
    </linearGradient>
    <pattern id="kitchenTile" width="40" height="40" patternUnits="userSpaceOnUse">
      <rect width="40" height="40" fill="none" stroke="#d8bc8c" stroke-width="1"/><circle cx="20" cy="20" r="2.5" fill="#d8bc8c"/>
    </pattern>
    <pattern id="kitchenCheck" width="14" height="14" patternUnits="userSpaceOnUse">
      <rect width="14" height="14" fill="#fff8f0"/><rect width="7" height="14" fill="#d8283a" opacity="0.55"/><rect width="14" height="7" fill="#d8283a" opacity="0.55"/>
    </pattern>
    <pattern id="kitchenCheckBlue" width="14" height="14" patternUnits="userSpaceOnUse">
      <rect width="14" height="14" fill="#fff8f0"/><rect width="7" height="14" fill="#2e6fd1" opacity="0.55"/><rect width="14" height="7" fill="#2e6fd1" opacity="0.55"/>
    </pattern>
    <linearGradient id="kitchenSky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#7cc4f0"/><stop offset="1" stop-color="#d4effc"/>
    </linearGradient>
    <linearGradient id="kitchenWood" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#c88a4a"/><stop offset="1" stop-color="#8a5428"/>
    </linearGradient>
    <radialGradient id="kitchenCopper" cx="35%" cy="35%" r="75%">
      <stop offset="0" stop-color="#ffc08a"/><stop offset="0.5" stop-color="#d8783a"/><stop offset="1" stop-color="#8a3a14"/>
    </radialGradient>
    <radialGradient id="kitchenLemon" cx="35%" cy="35%" r="70%">
      <stop offset="0" stop-color="#fff8a0"/><stop offset="1" stop-color="#f0c820"/>
    </radialGradient>
    <radialGradient id="kitchenPot" cx="35%" cy="30%" r="80%">
      <stop offset="0" stop-color="#e8f0f8"/><stop offset="1" stop-color="#7a9ab8"/>
    </radialGradient>
    <linearGradient id="kitchenGlass" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fff" stop-opacity="0.5"/><stop offset="0.3" stop-color="#fff" stop-opacity="0.15"/><stop offset="1" stop-color="#fff" stop-opacity="0.35"/>
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#kitchenWall)"/>
  <rect width="800" height="600" fill="url(#kitchenTile)" opacity="0.6"/>`;

  // Window with a view and checked curtains
  s += `<rect x="60" y="40" width="220" height="200" rx="4" fill="#f4f4f4" stroke="#c8b8a0" stroke-width="2"/>
    <rect x="74" y="54" width="192" height="172" fill="url(#kitchenSky)"/>
    <path d="M74,190 Q130,160 190,182 Q230,168 266,178 V226 H74 Z" fill="#7ab85a"/>
    <path d="M74,206 Q150,190 266,204 V226 H74 Z" fill="#5a9a42"/>
    <circle cx="110" cy="92" r="16" fill="#fff4a0"/>`;
  if (!has("cloud")) s += '<path d="M168,124 q4,-16 20,-12 q8,-12 22,-4 q14,-2 14,12 q6,4 0,8 H168 q-8,-2 0,-4 Z" fill="#fff"/>';
  s += `<path d="M170,54 V226 M74,140 H266" stroke="#f4f4f4" stroke-width="6"/>
    <rect x="52" y="236" width="236" height="12" rx="2" fill="#f4f4f4" stroke="#c8b8a0" stroke-width="1.5"/>
    <path d="M40,60 Q70,140 58,250 L102,250 Q86,160 104,60 Z" fill="url(#kitchenCheck)"/>
    <path d="M236,60 Q254,160 238,250 L282,250 Q270,140 300,60 Z" fill="url(#${has("curtain") ? "kitchenCheckBlue" : "kitchenCheck"})"/>
    <path d="M58,250 L102,250 M238,250 L282,250" stroke="#000" stroke-opacity="0.12" stroke-width="2"/>
    <rect x="32" y="34" width="276" height="34" rx="4" fill="url(#kitchenCheck)"/>
    <path d="M32,68 Q60,80 88,68 Q116,80 144,68 Q172,80 200,68 Q228,80 256,68 Q284,80 308,68" fill="url(#kitchenCheck)" stroke="#b8202e" stroke-width="1.5"/>
    <rect x="28" y="30" width="284" height="6" rx="3" fill="#8a5428"/>`;

  // Rail with copper pans and a ladle
  s += `<rect x="350" y="52" width="290" height="6" rx="3" fill="#4a4a4a"/>
    <circle cx="354" cy="55" r="6" fill="#3a3a3a"/><circle cx="636" cy="55" r="6" fill="#3a3a3a"/>`;
  s += pan(410, 166, 42) + pan(530, 150, 32);
  if (!has("pan")) s += pan(606, 136, 22);
  if (!has("ladle")) {
    s += `<circle cx="470" cy="64" r="4" fill="none" stroke="#3a3a3a" stroke-width="2"/>
      <path d="M470,68 V158" stroke="#b8c0c8" stroke-width="5" stroke-linecap="round"/>
      <path d="M456,160 a14,12 0 0,0 28,0 Z" fill="#a0a8b0"/><path d="M460,162 a10,6 0 0,0 14,4" stroke="#fff" stroke-width="2" opacity="0.6" fill="none"/>`;
  }

  // Wall clock
  const hour = has("clock") ? 120 : 60;
  s += `<circle cx="722" cy="114" r="50" fill="#8a5428"/><circle cx="722" cy="114" r="42" fill="#fffaf0"/>
    <circle cx="722" cy="114" r="42" fill="none" stroke="#000" stroke-opacity="0.1" stroke-width="4"/>`;
  for (let k = 0; k < 12; k++) {
    const a = k * Math.PI / 6;
    s += `<line x1="${(722 + 34 * Math.sin(a)).toFixed(1)}" y1="${(114 - 34 * Math.cos(a)).toFixed(1)}" x2="${(722 + 38 * Math.sin(a)).toFixed(1)}" y2="${(114 - 38 * Math.cos(a)).toFixed(1)}" stroke="#3a2a1a" stroke-width="${k % 3 ? 1.5 : 3}"/>`;
  }
  s += `<line x1="722" y1="114" x2="722" y2="82" stroke="#3a2a1a" stroke-width="3" stroke-linecap="round"/>
    <line x1="722" y1="114" x2="${(722 + 22 * Math.sin(hour * Math.PI / 180)).toFixed(1)}" y2="${(114 - 22 * Math.cos(hour * Math.PI / 180)).toFixed(1)}" stroke="#3a2a1a" stroke-width="5" stroke-linecap="round"/>
    <circle cx="722" cy="114" r="4" fill="#c8283a"/>`;

  // Upper shelf: spice jars, teapot, cups and cookbooks
  s += shelf(320, random);
  for (let k = 0; k < 6; k++) {
    const x = 56 + k * 40, h = 44 + random() * 16, top = 320 - h;
    const lid = k === 1 && has("spiceLid") ? "#f0f0f0" : SPICE_LIDS[k]!;
    s += `<rect x="${x - 15}" y="${top + 8}" width="30" height="${h - 8}" rx="4" fill="#eef6fa" opacity="0.85"/>
      <rect x="${x - 13}" y="${top + 18}" width="26" height="${h - 20}" rx="3" fill="${SPICE_FILLS[k]!}"/>
      <rect x="${x - 11}" y="${top + 24}" width="22" height="12" rx="1.5" fill="#fffaf0"/>
      <path d="M${x - 7},${top + 30} h14" stroke="#8a6a4a" stroke-width="1.5"/>
      <rect x="${x - 14}" y="${top}" width="28" height="10" rx="3" fill="${lid}"/>
      <rect x="${x - 11}" y="${top + 10}" width="4" height="${h - 14}" fill="#fff" opacity="0.5"/>`;
  }
  s += `<ellipse cx="384" cy="320" rx="44" ry="4" fill="#000" opacity="0.15"/>
    <path d="M346,292 Q326,286 318,262 Q330,266 340,280" stroke="url(#kitchenPot)" stroke-width="9" fill="none" stroke-linecap="round"/>
    <path d="M420,270 Q446,272 440,296 Q436,308 418,310" stroke="#7a9ab8" stroke-width="6" fill="none"/>
    <ellipse cx="384" cy="290" rx="42" ry="30" fill="url(#kitchenPot)"/>
    <path d="M346,292 Q384,306 422,292" stroke="#2e6fd1" stroke-width="3" fill="none"/>
    <circle cx="372" cy="286" r="4" fill="#2e6fd1"/><circle cx="384" cy="290" r="4" fill="#2e6fd1"/><circle cx="396" cy="286" r="4" fill="#2e6fd1"/>
    <ellipse cx="384" cy="262" rx="22" ry="6" fill="#a8c0d8"/><circle cx="384" cy="253" r="6" fill="#7a9ab8"/>
    <rect x="366" y="316" width="36" height="5" rx="2" fill="#7a9ab8"/>`;
  s += cup(476, 320, "#e8708a", false) + cup(540, 320, "#5ab07a", has("cupHandle"));
  const books: [number, number, number, string][] = [[600, 22, 82, "#c8283a"], [624, 18, 72, "#2a4a8a"], [644, 24, 88, "#e2a020"], [670, 20, 76, "#3f7a4a"]];
  books.forEach(([x, w, h, c], k) => {
    const color = k === 2 && has("book") ? "#7a3ab0" : c;
    s += `<rect x="${x}" y="${320 - h}" width="${w}" height="${h}" rx="2" fill="${color}"/>
      <path d="M${x + 3},${330 - h} h${w - 6} M${x + 3},${314} h${w - 6}" stroke="#ffe8a0" stroke-width="2"/>
      <rect x="${x + 4}" y="${340 - h}" width="${w - 8}" height="14" fill="#fff" opacity="0.25"/>`;
  });
  s += `<path d="M692,320 L716,240 L734,246 L712,320 Z" fill="#8a3a2a"/><path d="M700,312 L720,246" stroke="#ffe8a0" stroke-width="2"/>
    <path d="M740,320 V280 Q740,268 760,268 Q780,268 780,280 V320 Z" fill="#f4e8d0" stroke="#c8b8a0"/>
    <rect x="736" y="262" width="48" height="10" rx="4" fill="#c8283a"/><text x="760" y="302" font-size="11" font-family="Georgia, serif" text-anchor="middle" fill="#8a5a3a">SALT</text>`;

  // Lower shelf: plates, herb pot, bowl of lemons, canisters
  s += shelf(460, random);
  [[80, "#2e6fd1"], [136, "#2e6fd1"], [192, has("plate") ? "#3f9a5a" : "#2e6fd1"]].forEach(([x, rim]) => {
    s += `<circle cx="${x}" cy="420" r="40" fill="#fdfdfd" stroke="#c8c8d0" stroke-width="1.5"/>
      <circle cx="${x}" cy="420" r="34" fill="none" stroke="${rim}" stroke-width="5"/>
      <circle cx="${x}" cy="420" r="22" fill="#f4f4f8"/><circle cx="${x}" cy="420" r="8" fill="none" stroke="${rim}" stroke-width="2"/>`;
  });
  s += `<rect x="60" y="456" width="160" height="5" fill="#8a5428"/>`;
  s += `<path d="M320,420 Q312,396 300,384 M320,420 Q318,390 324,364 M320,420 Q330,398 344,388" stroke="#3f7a3a" stroke-width="3" fill="none"/>
    <ellipse cx="298" cy="382" rx="11" ry="7" fill="#4aa040" transform="rotate(-30 298 382)"/>
    <ellipse cx="324" cy="362" rx="8" ry="12" fill="#5ab84a"/><ellipse cx="310" cy="400" rx="10" ry="6" fill="#3f8a3a" transform="rotate(20 310 400)"/>
    <ellipse cx="332" cy="404" rx="10" ry="6" fill="#4aa040" transform="rotate(-20 332 404)"/>`;
  if (!has("herb")) {
    s += `<path d="M322,420 Q340,396 360,380" stroke="#3f7a3a" stroke-width="3" fill="none"/>
      <ellipse cx="358" cy="380" rx="11" ry="7" fill="#5ab84a" transform="rotate(-35 358 380)"/><ellipse cx="342" cy="394" rx="9" ry="5" fill="#3f8a3a" transform="rotate(-50 342 394)"/>`;
  } else {
    s += '<ellipse cx="346" cy="386" rx="11" ry="7" fill="#5ab84a" transform="rotate(-30 346 386)"/>';
  }
  s += `<path d="M296,418 H344 L338,460 H302 Z" fill="#c8643a"/><rect x="292" y="414" width="56" height="10" rx="2" fill="#b0542e"/>
    <path d="M300,420 h6 v40 h-4 Z" fill="#fff" opacity="0.2"/>`;
  s += lemon(454, 420, -10) + lemon(500, 421, 15) + lemon(478, 424, 0);
  if (!has("lemon")) s += lemon(476, 404, 8);
  s += `<path d="M424,432 H532 Q528,460 478,460 Q428,460 424,432 Z" fill="#fffaf0" stroke="#d8c8b0"/>
    <path d="M430,440 H526" stroke="#2e6fd1" stroke-width="3"/><path d="M436,448 Q478,454 520,448" stroke="#2e6fd1" stroke-width="1.5" fill="none"/>`;
  [[610, "#f4e8d0", "FLOUR"], [672, "#f4e8d0", "SUGAR"], [734, "#f4e8d0", "TEA"]].forEach(([x, c, label]) => {
    const cx = Number(x);
    s += `<rect x="${cx - 26}" y="396" width="52" height="64" rx="6" fill="${c}" stroke="#c8b8a0"/>
      <rect x="${cx - 28}" y="388" width="56" height="12" rx="4" fill="#8a5428"/><circle cx="${cx}" cy="386" r="4" fill="#6a3a18"/>
      <text x="${cx}" y="434" font-size="10" font-family="Georgia, serif" text-anchor="middle" fill="#8a5a3a">${label}</text>
      <rect x="${cx - 22}" y="404" width="5" height="50" fill="#fff" opacity="0.5"/>`;
  });

  // Counter top with a cutting board, rolling pin, whisk and tea towel
  s += `<rect x="0" y="524" width="800" height="76" fill="#6a3a18"/>
    <rect x="0" y="516" width="800" height="18" fill="url(#kitchenWood)"/>
    <path d="M0,534 H800" stroke="#000" stroke-opacity="0.2" stroke-width="2"/>
    <path d="M200,534 V600 M400,534 V600 M600,534 V600" stroke="#4a2810" stroke-width="3"/>
    <circle cx="190" cy="566" r="4" fill="#e2b54a"/><circle cx="210" cy="566" r="4" fill="#e2b54a"/><circle cx="590" cy="566" r="4" fill="#e2b54a"/><circle cx="610" cy="566" r="4" fill="#e2b54a"/>
    <rect x="60" y="530" width="70" height="70" fill="url(#kitchenCheck)"/><rect x="58" y="526" width="74" height="8" rx="3" fill="#f4f4f4"/>
    <ellipse cx="360" cy="522" rx="80" ry="3" fill="#000" opacity="0.2"/>
    <path d="M276,513 h20 M424,513 h20" stroke="#b8884a" stroke-width="6" stroke-linecap="round"/>
    <rect x="296" y="502" width="128" height="20" rx="9" fill="#e8c088"/><rect x="300" y="506" width="120" height="4" rx="2" fill="#fff" opacity="0.35"/>`;
  if (!has("whisk")) {
    s += `<path d="M640,514 L672,510" stroke="#c8283a" stroke-width="7" stroke-linecap="round"/>
      <path d="M672,510 Q700,494 724,508 Q700,522 672,510 M672,510 Q702,502 724,508 M672,510 Q702,516 724,508" stroke="#a0a8b0" stroke-width="2" fill="none"/>`;
  }
  return s;
}

function kitchenDifferences(): Difference[] {
  return [
    { id: "cloud", x: 194, y: 116, r: 24 },
    { id: "curtain", x: 268, y: 170, r: 26 },
    { id: "ladle", x: 470, y: 142, r: 30 },
    { id: "pan", x: 606, y: 138, r: 26 },
    { id: "clock", x: 728, y: 108, r: 26 },
    { id: "spiceLid", x: 96, y: 268, r: 18 },
    { id: "cupHandle", x: 540, y: 302, r: 30 },
    { id: "book", x: 656, y: 278, r: 28 },
    { id: "plate", x: 192, y: 420, r: 38 },
    { id: "herb", x: 350, y: 386, r: 18 },
    { id: "lemon", x: 476, y: 404, r: 20 },
    { id: "whisk", x: 684, y: 510, r: 44 },
  ];
}

export const kitchen: Scene = { name: "Kitchen Shelf", draw: drawKitchen, differences: kitchenDifferences() };
