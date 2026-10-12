// Scene: Japanese Garden
import { quadPoint, seeded } from "./helpers";
import type { Has, Difference, Scene, Point } from "./types";

const BLOSSOMS: [number, number, number][] = [[210, 150, 34], [250, 108, 36], [298, 92, 32], [338, 128, 30], [362, 170, 26], [282, 150, 34], [228, 192, 26], [320, 186, 26], [196, 110, 22]];
const LOST_BLOSSOM: [number, number, number] = [352, 80, 22];
const KOI: [number, number, number, number, string, string][] = [
  [238, 446, 20, 1, "#fff6ec", "#e8501e"], [300, 502, -10, 1, "#f0a020", "#fff2c0"], [360, 485, 8, -1, "#fff6ec", "#d81e1e"],
  [452, 506, -6, 1, "#f4f0ea", "#222"], [520, 478, 14, -1, "#e8601e", "#fff6ec"], [562, 414, -14, -1, "#fff6ec", "#e8501e"],
];
const STONES: [number, number, number, number][] = [[150, 578, 26, 12], [222, 554, 24, 11], [300, 572, 26, 12], [372, 546, 22, 10]];

function koi(x: number, y: number, angle: number, flip: number, body: string, spot: string): string {
  return `<g transform="translate(${x} ${y}) rotate(${angle}) scale(${flip} 1)">
    <ellipse cx="2" cy="5" rx="18" ry="5" fill="#0a3040" opacity="0.25"/>
    <path d="M-13,0 Q-20,-2 -27,-9 Q-23,0 -27,9 Q-20,2 -13,0 Z" fill="${body}" opacity="0.9"/>
    <path d="M2,-4 L-4,-11 L-6,-4 Z M2,4 L-4,11 L-6,4 Z" fill="${body}" opacity="0.85"/>
    <ellipse rx="16" ry="6" fill="${body}"/><ellipse cx="4" cy="-1" rx="6" ry="3.4" fill="${spot}"/><ellipse cx="-7" cy="1" rx="4" ry="2.6" fill="${spot}"/>
    <path d="M-10,-3 Q2,-6 12,-3" stroke="#fff" stroke-width="1.5" opacity="0.5" fill="none"/><circle cx="11" cy="-2" r="1.2" fill="#222"/></g>`;
}

function roof(cx: number, y: number, w: number): string {
  const h = w * 0.16;
  return `<path d="M${cx - w / 2 - 8},${y - 8} Q${cx - w / 2 + 6},${y + 2} ${cx - w / 3},${y - h * 0.55} L${cx - w / 6},${y - h} H${cx + w / 6} L${cx + w / 3},${y - h * 0.55} Q${cx + w / 2 - 6},${y + 2} ${cx + w / 2 + 8},${y - 8} Q${cx},${y + 8} ${cx - w / 2 - 8},${y - 8} Z" fill="url(#japaneseRoof)"/>
    <path d="M${cx - w / 2 + 2},${y - 2} Q${cx},${y + 6} ${cx + w / 2 - 2},${y - 2}" stroke="#7a2a1a" stroke-width="3" fill="none"/>`;
}

function drawJapanese(has: Has): string {
  const random = seeded(8086);
  let s = `<defs>
    <linearGradient id="japaneseSky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#8ac4ec"/><stop offset="0.7" stop-color="#e8eef4"/><stop offset="1" stop-color="#fbe4e4"/>
    </linearGradient>
    <linearGradient id="japaneseFuji" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#5a6aa8"/><stop offset="1" stop-color="#9aa8d0"/>
    </linearGradient>
    <linearGradient id="japaneseGrass" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#7aa848"/><stop offset="1" stop-color="#3f7a30"/>
    </linearGradient>
    <radialGradient id="japanesePond" cx="50%" cy="40%" r="60%">
      <stop offset="0" stop-color="#4ab0b8"/><stop offset="1" stop-color="#1a5a78"/>
    </radialGradient>
    <linearGradient id="japaneseRoof" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#5a5a68"/><stop offset="1" stop-color="#22222c"/>
    </linearGradient>
    <linearGradient id="japaneseStone" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#c8c4b8"/><stop offset="1" stop-color="#7a766a"/>
    </linearGradient>
    <linearGradient id="japaneseBamboo" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#8ab848"/><stop offset="0.5" stop-color="#c8e07a"/><stop offset="1" stop-color="#5a8a2a"/>
    </linearGradient>
    <radialGradient id="japaneseGlow"><stop offset="0" stop-color="#ffe890" stop-opacity="0.9"/><stop offset="1" stop-color="#ffe890" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="800" height="600" fill="url(#japaneseSky)"/>
  <circle cx="720" cy="80" r="34" fill="#f06a4a" opacity="0.85"/>
  <path d="M330,300 L470,170 Q520,124 560,122 Q600,124 650,170 L800,290 V300 Z" fill="url(#japaneseFuji)"/>
  <path d="M458,182 L470,170 Q520,124 560,122 Q600,124 650,170 L662,182 L640,178 L624,196 L604,178 L586,202 L566,182 L546,204 L526,180 L506,198 L486,178 Z" fill="#fff"/>
  <path d="M560,122 Q600,124 650,170 L662,182 L640,178 L624,196 L604,178 L586,202 L566,182 Z" fill="#d8e0f0"/>
  <path d="M0,292 Q150,252 300,282 Q450,262 600,288 Q700,272 800,282 V330 H0 Z" fill="#4a7a4a"/>
  <rect y="300" width="800" height="300" fill="url(#japaneseGrass)"/>`;
  [[400, 70], [428, 88], [455, 62]].forEach(([x, y], k) => {
    if (k === 2 && has("birds")) return;
    s += `<path d="M${x! - 10},${y} Q${x! - 5},${y! - 7} ${x},${y} Q${x! + 5},${y! - 7} ${x! + 10},${y}" stroke="#3a3a4a" stroke-width="2.2" fill="none"/>`;
  });

  // Pagoda
  const tiers: [number, number][] = [[312, 160], [264, 136], [220, 114], [180, 94]];
  s += `<rect x="62" y="318" width="136" height="18" fill="#c8c0b0"/><rect x="62" y="318" width="136" height="4" fill="#fff" opacity="0.4"/>`;
  tiers.forEach(([y, w], k) => {
    const bottom = k === 0 ? 318 : tiers[k - 1]![0] - 12, bw = w * 0.5;
    s += `<rect x="${130 - bw / 2}" y="${y - 4}" width="${bw}" height="${bottom - y + 4}" fill="#c8402a"/>
      <rect x="${130 - bw / 2 + 6}" y="${y + 4}" width="${bw - 12}" height="${bottom - y - 10}" fill="#f4ead8"/>
      <path d="M130,${y + 4} V${bottom - 6}" stroke="#c8402a" stroke-width="3"/>`;
  });
  tiers.forEach(([y, w]) => { s += roof(130, y, w); });
  if (!has("spire")) {
    s += `<path d="M130,166 V104" stroke="#8a6a2a" stroke-width="4"/>`;
    for (let k = 0; k < 5; k++) s += `<ellipse cx="130" cy="${150 - k * 9}" rx="${8 - k * 0.6}" ry="2.5" fill="#c8a040"/>`;
    s += `<circle cx="130" cy="100" r="5" fill="#e2b54a"/>`;
  }

  // Torii gate
  s += `<rect x="644" y="196" width="14" height="146" fill="#d23a22"/><rect x="722" y="196" width="14" height="146" fill="#d23a22"/>
    <rect x="640" y="334" width="22" height="10" fill="#222"/><rect x="718" y="334" width="22" height="10" fill="#222"/>
    <rect x="626" y="216" width="128" height="10" fill="#d23a22"/><rect x="685" y="196" width="10" height="20" fill="#d23a22"/>
    <rect x="636" y="192" width="108" height="8" fill="#b02a18"/>
    <path d="M618,174 Q690,190 762,174 L758,188 Q690,198 622,188 Z" fill="${has("toriiTop") ? "#d23a22" : "#262222"}"/>
    <rect x="652" y="200" width="4" height="138" fill="#fff" opacity="0.25"/><rect x="730" y="200" width="4" height="138" fill="#fff" opacity="0.25"/>`;

  // Bamboo grove behind the fountain
  for (let k = 0; k < 6; k++) {
    const x = 758 + k * 8 + random() * 4;
    s += `<rect x="${x.toFixed(1)}" y="250" width="6" height="240" fill="url(#japaneseBamboo)"/>`;
    for (let n = 0; n < 5; n++) s += `<rect x="${x.toFixed(1)}" y="${(270 + n * 46 + random() * 10).toFixed(0)}" width="6" height="2" fill="#4a6a20"/>`;
  }

  // Azalea bushes and grass tufts
  [[36, 372, 34, "#3f8a3a"], [118, 384, 30, "#4a9a3a"], [574, 334, 30, "#3f8a3a"], [612, 350, 24, "#4a9a3a"], [20, 520, 26, "#3f8a3a"]].forEach(([x, y, r, c]) => {
    const bx = Number(x), by = Number(y), br = Number(r);
    s += `<ellipse cx="${bx}" cy="${by + br * 0.5}" rx="${br * 1.1}" ry="${br * 0.25}" fill="#000" opacity="0.15"/>
      <ellipse cx="${bx}" cy="${by}" rx="${br}" ry="${br * 0.6}" fill="${c}"/><ellipse cx="${bx - br * 0.2}" cy="${by - br * 0.2}" rx="${br * 0.6}" ry="${br * 0.35}" fill="#6ab84a" opacity="0.6"/>`;
    for (let k = 0; k < 6; k++) s += `<circle cx="${(bx + (random() - 0.5) * br * 1.4).toFixed(1)}" cy="${(by + (random() - 0.6) * br * 0.8).toFixed(1)}" r="3.5" fill="#f06a9a"/>`;
  });
  for (let k = 0; k < 30; k++) {
    const x = random() * 800, y = 330 + random() * 260;
    s += `<path d="M${x.toFixed(0)},${y.toFixed(0)} l-3,-8 M${x.toFixed(0)},${y.toFixed(0)} l1,-10 M${x.toFixed(0)},${y.toFixed(0)} l5,-7" stroke="#2f6a2a" stroke-width="1.5"/>`;
  }

  // Koi pond with rim stones, lily pads and koi
  s += `<ellipse cx="420" cy="442" rx="246" ry="90" fill="#6a6a5a"/>
    <ellipse cx="420" cy="440" rx="240" ry="85" fill="url(#japanesePond)"/>`;
  for (let k = 0; k < 34; k++) {
    const a = k / 34 * Math.PI * 2 + random() * 0.08, w = 12 + random() * 8;
    s += `<ellipse cx="${(420 + 244 * Math.cos(a)).toFixed(1)}" cy="${(442 + 88 * Math.sin(a)).toFixed(1)}" rx="${w.toFixed(1)}" ry="${(w * 0.55).toFixed(1)}" fill="url(#japaneseStone)"/>`;
  }
  s += `<path d="M300,450 Q420,520 540,450" stroke="#b8302a" stroke-width="18" opacity="0.18" fill="none"/>`;
  [[230, 412], [470, 442], [625, 450]].forEach(([x, y]) => {
    s += `<path d="M${x},${y} m-13,0 a13,8 0 1,0 5,-7 L${x},${y} Z" fill="#4a9a3a"/><path d="M${x},${y} l-10,3" stroke="#2a6a2a" stroke-width="1"/>`;
  });
  if (!has("lotus")) s += `<path d="M625,446 l-8,-4 l5,-6 l3,-8 l3,8 l5,6 Z" fill="#f4a0c0"/><path d="M625,446 l-4,-6 l4,-10 l4,10 Z" fill="#ffd0e0"/>`;
  KOI.forEach(([x, y, a, f, b, sp], k) => {
    if (k === 4 && has("koiMissing")) return;
    s += koi(x, y, a, k === 2 && has("koiTurn") ? -f : f, b, sp);
  });

  // Red arched bridge
  const top: [Point, Point, Point] = [[286, 424], [420, 300], [554, 424]];
  const under: [Point, Point, Point] = [[300, 436], [420, 330], [540, 436]];
  for (const t of [0.22, 0.78]) {
    const [x, y] = quadPoint(...under, t);
    s += `<rect x="${(x - 5).toFixed(1)}" y="${y.toFixed(1)}" width="10" height="${(470 - y).toFixed(1)}" fill="#8a2418"/>`;
  }
  s += `<path d="M286,424 Q420,300 554,424 L540,436 Q420,330 300,436 Z" fill="#c8301e"/>
    <path d="M286,424 Q420,300 554,424" stroke="#e8604a" stroke-width="3" fill="none"/>`;
  for (let k = 0; k <= 10; k++) {
    const [x, y] = quadPoint(...top, 0.04 + k * 0.092);
    s += `<rect x="${(x - 3).toFixed(1)}" y="${(y - 26).toFixed(1)}" width="6" height="26" fill="#d23a22"/>`;
    if (k === 0 || k === 10) s += `<circle cx="${x.toFixed(1)}" cy="${(y - 30).toFixed(1)}" r="5" fill="#e2b54a"/>`;
  }
  s += `<path d="M297,382 Q420,262 543,382" stroke="#d23a22" stroke-width="6" fill="none"/>
    <path d="M297,380 Q420,260 543,380" stroke="#ff8a6a" stroke-width="1.5" fill="none"/>`;

  // Cherry tree
  s += `<path d="M272,352 Q282,290 266,236 Q258,200 230,170 M266,236 Q290,190 330,150 M268,250 Q300,220 350,200 M262,210 Q260,150 290,110" stroke="#4a2a20" stroke-width="10" fill="none" stroke-linecap="round"/>
    <path d="M262,356 Q276,300 260,240 L276,240 Q292,300 284,356 Z" fill="#4a2a20"/>`;
  const cluster = (x: number, y: number, r: number, dots: number[]): string => {
    let c = `<circle cx="${x}" cy="${y}" r="${r}" fill="#f4a8c4"/><circle cx="${x - r * 0.2}" cy="${y - r * 0.25}" r="${r * 0.7}" fill="#f8c4d8"/>`;
    for (let k = 0; k + 2 < dots.length; k += 3) c += `<circle cx="${(x + (dots[k]! - 0.5) * r * 1.4).toFixed(1)}" cy="${(y + (dots[k + 1]! - 0.5) * r * 1.4).toFixed(1)}" r="${(2 + dots[k + 2]! * 3).toFixed(1)}" fill="${dots[k + 2]! > 0.5 ? "#fff0f6" : "#e07aa0"}"/>`;
    return c;
  };
  const dotsFor = (): number[] => Array.from({ length: 18 }, () => random());
  const lostDots = dotsFor();
  BLOSSOMS.forEach(([x, y, r]) => { s += cluster(x, y, r, dotsFor()); });
  if (!has("blossom")) s += cluster(...LOST_BLOSSOM, lostDots);

  // Stone lantern
  s += `<ellipse cx="70" cy="572" rx="38" ry="6" fill="#000" opacity="0.2"/>
    <rect x="44" y="556" width="52" height="14" rx="3" fill="url(#japaneseStone)"/>
    <rect x="60" y="500" width="20" height="58" fill="url(#japaneseStone)"/>
    <rect x="40" y="490" width="60" height="12" rx="3" fill="url(#japaneseStone)"/>
    <rect x="50" y="456" width="40" height="34" fill="url(#japaneseStone)"/>
    <rect x="61" y="463" width="18" height="18" fill="${has("lanternLight") ? "#ffd860" : "#3a3530"}"/>
    ${has("lanternLight") ? '<circle cx="70" cy="472" r="20" fill="url(#japaneseGlow)"/>' : ""}
    <path d="M28,458 Q50,450 60,434 H80 Q90,450 112,458 Z" fill="url(#japaneseStone)"/><circle cx="70" cy="428" r="7" fill="url(#japaneseStone)"/>`;

  // Stepping stones
  STONES.forEach(([x, y, rx, ry], k) => {
    if (k === 2 && has("stone")) return;
    s += `<ellipse cx="${x}" cy="${y + 3}" rx="${rx}" ry="${ry}" fill="#000" opacity="0.2"/><ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="url(#japaneseStone)"/>
      <ellipse cx="${x - rx * 0.3}" cy="${y - ry * 0.35}" rx="${rx * 0.4}" ry="${ry * 0.3}" fill="#fff" opacity="0.3"/>`;
  });

  // Raked gravel with a rock
  s += `<path d="M430,600 V552 Q440,532 480,532 H800 V600 Z" fill="#e8e0cc"/>`;
  for (let y = 544; y < 600; y += 8) s += `<path d="M${y < 552 ? 470 : 432},${y} Q560,${y - 4} 640,${y} T800,${y}" stroke="#c8bea4" stroke-width="2" fill="none"/>`;
  s += `<ellipse cx="520" cy="570" rx="44" ry="20" fill="#e8e0cc"/>`;
  for (const rr of [44, 36]) s += `<ellipse cx="520" cy="570" rx="${rr}" ry="${rr * 0.45}" stroke="#c8bea4" stroke-width="2" fill="none"/>`;
  if (!has("rock")) s += `<path d="M498,578 Q500,556 518,552 Q540,554 544,578 Z" fill="url(#japaneseStone)"/><path d="M506,566 Q512,558 520,557" stroke="#fff" stroke-width="2" opacity="0.4" fill="none"/>`;

  // Bonsai
  s += `<rect x="584" y="562" width="72" height="8" rx="2" fill="#5a3418"/><rect x="590" y="570" width="6" height="22" fill="#5a3418"/><rect x="644" y="570" width="6" height="22" fill="#5a3418"/>
    <path d="M598,532 H642 L636,562 H604 Z" fill="${has("bonsaiPot") ? "#b8402a" : "#2a5a8a"}"/><rect x="594" y="528" width="52" height="7" rx="2" fill="${has("bonsaiPot") ? "#9a3020" : "#1e4a74"}"/>
    <path d="M620,530 Q612,516 624,506 Q636,496 616,486" stroke="#4a2a18" stroke-width="5" fill="none"/>
    <ellipse cx="606" cy="498" rx="16" ry="8" fill="#2f6a2a"/><ellipse cx="634" cy="490" rx="15" ry="7" fill="#3f7a30"/><ellipse cx="618" cy="478" rx="13" ry="7" fill="#2f6a2a"/>`;

  // Shishi-odoshi bamboo fountain
  const tilt = has("bamboo") ? 25 : -25;
  s += `<ellipse cx="708" cy="482" rx="40" ry="14" fill="url(#japaneseStone)"/><ellipse cx="708" cy="478" rx="28" ry="8" fill="#2a7a90"/>
    <rect x="782" y="366" width="12" height="118" fill="url(#japaneseBamboo)"/><path d="M782,384 H770" stroke="#8ab848" stroke-width="8"/>
    <path d="M770,388 q-2,6 0,12" stroke="#a8d8f0" stroke-width="2" fill="none"/>
    <rect x="722" y="426" width="5" height="48" fill="#8a6a3a"/><rect x="734" y="426" width="5" height="48" fill="#8a6a3a"/>
    <g transform="rotate(${tilt} 730 426)"><rect x="688" y="420" width="84" height="12" rx="3" fill="url(#japaneseBamboo)"/>
      <path d="M712,420 v12 M748,420 v12" stroke="#4a6a20" stroke-width="2"/><ellipse cx="772" cy="426" rx="3" ry="6" fill="#4a6a20"/></g>
    <circle cx="730" cy="426" r="3" fill="#4a2a18"/>`;

  // Falling petals
  for (let k = 0; k < 38; k++) {
    const x = 150 + random() * 460, y = 40 + random() * 500, a = random() * 180;
    s += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="4" ry="2.4" fill="#f8b4cc" transform="rotate(${a.toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
  }
  return s;
}

function japaneseDifferences(): Difference[] {
  return [
    { id: "birds", x: 455, y: 60, r: 16 },
    { id: "spire", x: 130, y: 132, r: 30 },
    { id: "toriiTop", x: 690, y: 184, r: 30 },
    { id: "blossom", x: 352, y: 80, r: 24 },
    { id: "lanternLight", x: 70, y: 472, r: 20 },
    { id: "koiTurn", x: 360, y: 485, r: 24 },
    { id: "koiMissing", x: 520, y: 478, r: 22 },
    { id: "lotus", x: 625, y: 440, r: 18 },
    { id: "stone", x: 300, y: 572, r: 26 },
    { id: "rock", x: 520, y: 566, r: 26 },
    { id: "bonsaiPot", x: 620, y: 545, r: 20 },
    { id: "bamboo", x: 730, y: 426, r: 40 },
  ];
}

export const japanese: Scene = { name: "Japanese Garden", draw: drawJapanese, differences: japaneseDifferences() };
