// Scene: The Reading Nook
import { seeded } from "./helpers";
import type { Has, Difference, Scene } from "./types";

const BOOK_COLORS = ["#c8283a", "#2a4a8a", "#e2a020", "#3f7a4a", "#8a3ab0", "#e06a2a", "#1e8a8a", "#6a3a1e", "#d86a8a", "#f0e0c0"];
const SHELF_BASES = [120, 210, 300, 390, 466];
const ODD_BOOK = { shelf: 0, index: 6 };
const LOST_BOOK = { shelf: 3, index: 4 };

interface Book { x: number; w: number; h: number; color: string; bands: boolean; lean: boolean }

function book(b: Book, base: number, color: string): string {
  const { x, w, h } = b, t = b.lean ? ` transform="rotate(12 ${x + w} ${base})"` : "";
  let s = `<g${t}><rect x="${x}" y="${base - h}" width="${w}" height="${h}" rx="1.5" fill="${color}"/>
    <rect x="${x + 1}" y="${base - h}" width="${w * 0.3}" height="${h}" fill="#fff" opacity="0.18"/><rect x="${x + w - 2}" y="${base - h}" width="2" height="${h}" fill="#000" opacity="0.2"/>`;
  if (b.bands) s += `<path d="M${x + 1},${base - h + 8} h${w - 2} M${x + 1},${base - 10} h${w - 2}" stroke="#ffe8a0" stroke-width="2"/>`;
  else s += `<rect x="${x + 3}" y="${base - h * 0.65}" width="${w - 6}" height="${h * 0.2}" fill="#fff" opacity="0.5"/>`;
  return s + "</g>";
}

function leaf(x: number, y: number, len: number, angle: number): string {
  return `<g transform="rotate(${angle} ${x} ${y})"><path d="M${x},${y} Q${x + len * 0.35},${y - len * 0.5} ${x},${y - len} Q${x - len * 0.35},${y - len * 0.5} ${x},${y} Z" fill="url(#readingLeaf)"/>
    <path d="M${x},${y} V${y - len * 0.9}" stroke="#2a5a2a" stroke-width="1.2"/></g>`;
}

function drawReading(has: Has): string {
  const random = seeded(5150);
  let s = `<defs>
    <linearGradient id="readingWall" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#6a3a3a"/><stop offset="1" stop-color="#8a5040"/>
    </linearGradient>
    <pattern id="readingPaper" width="40" height="40" patternUnits="userSpaceOnUse">
      <rect width="20" height="40" fill="#fff" opacity="0.04"/><circle cx="30" cy="20" r="3" fill="#e2b54a" opacity="0.25"/><circle cx="10" cy="0" r="2" fill="#e2b54a" opacity="0.2"/><circle cx="10" cy="40" r="2" fill="#e2b54a" opacity="0.2"/>
    </pattern>
    <linearGradient id="readingFloor" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#8a5428"/><stop offset="1" stop-color="#5a3418"/>
    </linearGradient>
    <linearGradient id="readingWood" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#7a4a24"/><stop offset="0.5" stop-color="#a86a38"/><stop offset="1" stop-color="#6a3a1a"/>
    </linearGradient>
    <linearGradient id="readingNight" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2a3a5a"/><stop offset="1" stop-color="#6a7a9a"/>
    </linearGradient>
    <linearGradient id="readingVelvet" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#3fa8a0"/><stop offset="1" stop-color="#14524e"/>
    </linearGradient>
    <radialGradient id="readingLight" cx="50%" cy="40%" r="50%">
      <stop offset="0" stop-color="#ffe8a0" stop-opacity="0.55"/><stop offset="1" stop-color="#ffe8a0" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="readingLeaf" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#7ac85a"/><stop offset="1" stop-color="#2f7a3a"/>
    </linearGradient>
    <radialGradient id="readingGlobe" cx="35%" cy="35%" r="70%">
      <stop offset="0" stop-color="#9ad4f4"/><stop offset="1" stop-color="#2a6ab0"/>
    </radialGradient>
    <clipPath id="readingGlass"><rect x="598" y="68" width="164" height="226"/></clipPath>
  </defs>
  <rect width="800" height="470" fill="url(#readingWall)"/><rect width="800" height="470" fill="url(#readingPaper)"/>
  <rect y="470" width="800" height="130" fill="url(#readingFloor)"/>
  <path d="M0,500 H800 M0,536 H800 M0,574 H800 M120,470 V500 M380,500 V536 M620,470 V500 M240,536 V574 M700,536 V574 M480,574 V600" stroke="#3a2010" stroke-width="2" opacity="0.5"/>
  <rect y="462" width="800" height="12" fill="#4a2a14"/><rect y="462" width="800" height="3" fill="#a87a4a"/>
  <circle cx="266" cy="200" r="190" fill="url(#readingLight)"/>`;

  // Bookshelf full of books, with a globe on the second shelf
  s += `<rect x="12" y="30" width="232" height="444" fill="url(#readingWood)"/><rect x="24" y="42" width="208" height="424" fill="#2e1a0e"/>`;
  SHELF_BASES.forEach((base, shelf) => {
    const end = shelf === 1 ? 150 : 228;
    const books: Book[] = [];
    for (let x = 26; ; ) {
      const w = 12 + random() * 10, h = 52 + random() * 20, color = BOOK_COLORS[Math.floor(random() * BOOK_COLORS.length)]!, bands = random() < 0.5;
      if (x + w > end) break;
      books.push({ x, w, h, color, bands, lean: false });
      x += w + 1;
    }
    books[books.length - 1]!.lean = shelf % 2 === 0;
    books.forEach((b, k) => {
      if (shelf === LOST_BOOK.shelf && k === LOST_BOOK.index && has("bookMissing")) return;
      const odd = shelf === ODD_BOOK.shelf && k === ODD_BOOK.index && has("bookColor");
      s += book(b, base, odd ? "#5ad0e8" : b.color);
    });
    s += `<rect x="20" y="${base}" width="216" height="8" fill="url(#readingWood)"/><rect x="20" y="${base + 8}" width="216" height="3" fill="#000" opacity="0.3"/>`;
  });
  s += `<path d="M180,210 h28 l-4,-6 h-20 Z" fill="#e2b54a"/><path d="M194,204 V196" stroke="#a8803a" stroke-width="4"/>
    <circle cx="194" cy="166" r="26" fill="url(#readingGlobe)"/>
    <path d="M178,150 q10,-6 16,2 q-2,10 -10,10 q-8,4 -6,-12 Z M200,176 q8,-4 12,4 q-4,10 -12,8 Z" fill="#6ab04a"/>`;
  if (!has("globe")) s += `<path d="M190,160 q12,-4 16,8 q2,10 -8,14 q-10,2 -12,-8 q-4,-8 4,-14 Z" fill="#6ab04a"/>`;
  s += `<path d="M164,170 A30,30 0 0,1 218,148" stroke="#e2b54a" stroke-width="3" fill="none"/><ellipse cx="186" cy="156" rx="7" ry="5" fill="#fff" opacity="0.35"/>`;

  // Floor lamp with a glowing shade
  const shade = has("lamp") ? "#a83a5a" : "#3f8a5a";
  s += `<ellipse cx="266" cy="548" rx="30" ry="7" fill="#2a1a10"/><path d="M266,548 V200" stroke="#c8a050" stroke-width="5"/>
    <path d="M246,150 H286 L306,202 H226 Z" fill="${shade}"/><path d="M246,150 H286 L306,202 H226 Z" fill="#ffe8a0" opacity="0.3"/>
    <path d="M226,202 H306" stroke="#e2b54a" stroke-width="3"/><path d="M252,150 L238,202" stroke="#fff" stroke-width="3" opacity="0.25"/>
    <ellipse cx="266" cy="203" rx="34" ry="5" fill="#fff8d0" opacity="0.8"/><path d="M280,204 V226" stroke="#c8a050" stroke-width="1.5"/><circle cx="280" cy="228" r="3" fill="#e2b54a"/>`;

  // Painting on the wall
  s += `<rect x="334" y="58" width="144" height="116" rx="3" fill="url(#gold)"/><rect x="344" y="68" width="124" height="96" fill="#9ad0e8"/>
    <path d="M344,164 L380,112 L404,140 L430,104 L468,154 V164 Z" fill="#5a7a9a"/><path d="M344,164 Q400,140 468,158 V164 Z" fill="#5a9a4a"/>
    <path d="M380,112 L372,124 L388,124 Z M430,104 L420,118 L440,118 Z" fill="#fff"/>`;
  if (!has("picture")) s += `<circle cx="446" cy="88" r="10" fill="#ffd84a"/>`;

  // Rug
  s += `<ellipse cx="420" cy="548" rx="300" ry="44" fill="#8a2a3a"/><ellipse cx="420" cy="548" rx="282" ry="36" fill="none" stroke="#e2b54a" stroke-width="4"/>
    <ellipse cx="420" cy="548" rx="220" ry="24" fill="#2a4a6a"/><ellipse cx="420" cy="548" rx="120" ry="12" fill="#e2b54a" opacity="0.8"/>`;

  // Armchair with a throw pillow
  s += `<path d="M330,520 v18 M510,520 v18" stroke="#3a2010" stroke-width="8" stroke-linecap="round"/>
    <path d="M330,420 V290 Q330,248 420,248 Q510,248 510,290 V420 Z" fill="url(#readingVelvet)"/>
    <path d="M350,410 V296 Q350,268 420,268 Q490,268 490,296 V410" stroke="#0e3a36" stroke-width="2" fill="none" opacity="0.5"/>
    <rect x="336" y="404" width="168" height="40" rx="12" fill="#2a8a84"/><rect x="340" y="406" width="160" height="8" rx="4" fill="#fff" opacity="0.15"/>
    <rect x="330" y="436" width="180" height="86" rx="8" fill="url(#readingVelvet)"/>
    <rect x="296" y="350" width="52" height="172" rx="22" fill="#2a8a84"/><rect x="492" y="350" width="52" height="172" rx="22" fill="#1e6e68"/>
    <rect x="302" y="356" width="14" height="150" rx="7" fill="#fff" opacity="0.15"/>`;
  const pillow = has("cushion") ? "#e8708a" : "#e2a020";
  s += `<path d="M386,330 Q420,314 454,330 Q466,362 450,394 Q420,404 390,394 Q374,362 386,330 Z" fill="${pillow}"/>
    <path d="M394,340 Q420,330 446,340 M420,330 V396" stroke="#fff" stroke-width="2" opacity="0.35" fill="none"/><circle cx="420" cy="362" r="4" fill="#8a5418"/>`;

  // Window with rain, curtains and the window seat
  s += `<rect x="586" y="56" width="188" height="250" fill="#f0e4cc"/><rect x="598" y="68" width="164" height="226" fill="url(#readingNight)"/>
    <g clip-path="url(#readingGlass)"><path d="M598,240 h30 v-40 h24 v20 h30 v-50 h26 v40 h20 v-20 h34 V294 H598 Z" fill="#1e2a40"/>
    <rect x="636" y="216" width="6" height="8" fill="#ffd870"/><rect x="694" y="186" width="6" height="8" fill="#ffd870"/><rect x="742" y="236" width="6" height="8" fill="#ffd870"/>`;
  for (let k = 0; k < 40; k++) {
    const x = 600 + random() * 160, y = 70 + random() * 220, len = 6 + random() * 14, drop = random() < 0.4;
    s += drop ? `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="2" ry="3" fill="#cfe4f8" opacity="0.7"/>` : `<path d="M${x.toFixed(1)},${y.toFixed(1)} l-2,${len.toFixed(1)}" stroke="#cfe4f8" stroke-width="1.2" opacity="0.5"/>`;
  }
  s += `</g><path d="M680,68 V294 M598,170 H762" stroke="#f0e4cc" stroke-width="6"/>
    <rect x="560" y="44" width="240" height="8" rx="4" fill="#6a3a18"/>
    <path d="M566,48 Q600,120 584,200 Q600,250 572,320 H614 Q598,250 612,200 Q612,120 610,48 Z" fill="#c8a040"/>
    <path d="M758,48 Q756,120 756,200 Q768,250 754,320 H796 Q788,250 800,200 V48 Z" fill="${has("curtain") ? "#5a6ac8" : "#c8a040"}"/>
    <path d="M578,60 V310 M772,60 V310" stroke="#000" stroke-width="3" opacity="0.12"/>
    <rect x="560" y="332" width="240" height="134" fill="url(#readingWood)"/><rect x="560" y="332" width="240" height="6" fill="#c88a4a"/>
    <rect x="576" y="360" width="96" height="80" rx="3" fill="none" stroke="#5a3418" stroke-width="3"/><rect x="688" y="360" width="96" height="80" rx="3" fill="none" stroke="#5a3418" stroke-width="3"/>
    <rect x="566" y="316" width="234" height="18" rx="8" fill="#d8c8a8"/><path d="M572,322 H796" stroke="#a83a3a" stroke-width="3" stroke-dasharray="10 8"/>`;

  // Potted plant on the window seat
  s += `<path d="M618,316 Q610,286 590,262 M618,316 Q620,280 616,248 M618,316 Q632,290 650,276" stroke="#3f7a3a" stroke-width="2.5" fill="none"/>`;
  s += leaf(618, 300, 44, -40) + leaf(618, 296, 52, -8) + leaf(620, 300, 40, 36) + leaf(616, 304, 34, -70);
  if (!has("plant")) s += leaf(620, 292, 42, 14);
  s += `<path d="M600,292 H638 L632,320 H606 Z" fill="#c8643a"/><rect x="597" y="288" width="44" height="8" rx="2" fill="#b0542e"/>`;

  // Sleeping cat on a cushion
  s += `<ellipse cx="712" cy="314" rx="54" ry="12" fill="#a83a5a"/><ellipse cx="712" cy="310" rx="50" ry="8" fill="#c84a6a"/>
    <ellipse cx="716" cy="292" rx="36" ry="19" fill="#e8963a"/><path d="M692,284 q20,-10 44,-4 M700,300 q14,4 30,0" stroke="#b8681e" stroke-width="3" fill="none"/>
    <circle cx="684" cy="296" r="14" fill="#e8963a"/><path d="M673,288 L674,274 L683,284 Z M688,283 L696,272 L697,287 Z" fill="#e8963a"/><path d="M676,284 L677,278 L681,283 Z" fill="#f8b8a8"/>
    <path d="M676,296 q3,2 6,0 M687,296 q3,2 6,0" stroke="#4a2a14" stroke-width="1.5" fill="none"/><circle cx="684" cy="301" r="1.5" fill="#d86a6a"/>`;
  if (!has("cat")) s += `<path d="M748,298 Q760,310 740,312 Q714,314 700,308" stroke="#e8963a" stroke-width="8" fill="none" stroke-linecap="round"/>`;

  // Side table with tea and reading glasses
  s += `<path d="M590,414 V520 M572,526 H608" stroke="#5a3418" stroke-width="8" stroke-linecap="round"/>
    <ellipse cx="590" cy="414" rx="56" ry="12" fill="#7a4a24"/><ellipse cx="590" cy="410" rx="56" ry="12" fill="#a86a38"/>
    <ellipse cx="572" cy="408" rx="20" ry="5" fill="#f4f4f4" stroke="#c8c8c8"/>
    <path d="M560,388 H584 Q584,408 572,408 Q560,408 560,388 Z" fill="#fff"/><path d="M584,392 q8,0 6,8 q-2,4 -8,3" stroke="#fff" stroke-width="3" fill="none"/>
    <ellipse cx="572" cy="388" rx="12" ry="3" fill="#b8682a"/><path d="M562,396 h20" stroke="#4a8ac8" stroke-width="2"/>`;
  if (!has("tea")) s += `<path d="M568,380 q-6,-8 0,-14 q6,-6 0,-14 M577,380 q-6,-8 0,-14" stroke="#fff" stroke-width="2" fill="none" opacity="0.6" stroke-linecap="round"/>`;
  if (!has("glasses")) {
    s += `<circle cx="604" cy="406" r="7" fill="#cfe4f8" fill-opacity="0.35" stroke="#2a1a10" stroke-width="2"/><circle cx="622" cy="406" r="7" fill="#cfe4f8" fill-opacity="0.35" stroke="#2a1a10" stroke-width="2"/>
      <path d="M611,405 q2,-2 4,0 M629,405 l10,-4" stroke="#2a1a10" stroke-width="2" fill="none"/>`;
  }

  // Stack of books on the floor
  const stack: [number, number, string][] = [[660, 96, "#2a4a8a"], [666, 84, "#c8283a"], [658, 90, "#e2a020"], [668, 76, "#3f7a4a"]];
  stack.forEach(([x, w, c], k) => {
    if (k === 3 && has("stack")) return;
    const y = 572 - k * 15;
    s += `<rect x="${x}" y="${y}" width="${w}" height="14" rx="2" fill="${c}"/><rect x="${x + w - 8}" y="${y + 2}" width="6" height="10" fill="#f8f0dc"/>
      <path d="M${x + 4},${y + 4} h${w - 16}" stroke="#ffe8a0" stroke-width="1.5"/>`;
  });
  s += `<ellipse cx="708" cy="587" rx="58" ry="4" fill="#000" opacity="0.3"/>`;
  return s;
}

function readingDifferences(): Difference[] {
  return [
    { id: "bookColor", x: 140, y: 86, r: 24 },
    { id: "bookMissing", x: 110, y: 356, r: 26 },
    { id: "globe", x: 198, y: 170, r: 20 },
    { id: "lamp", x: 266, y: 176, r: 28 },
    { id: "picture", x: 446, y: 88, r: 14 },
    { id: "cushion", x: 420, y: 360, r: 30 },
    { id: "curtain", x: 776, y: 220, r: 20 },
    { id: "plant", x: 628, y: 268, r: 20 },
    { id: "cat", x: 730, y: 306, r: 22 },
    { id: "tea", x: 572, y: 366, r: 16 },
    { id: "glasses", x: 616, y: 404, r: 18 },
    { id: "stack", x: 706, y: 534, r: 22 },
  ];
}

export const reading: Scene = { name: "The Reading Nook", draw: drawReading, differences: readingDifferences() };
