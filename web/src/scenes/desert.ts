// Scene: Desert Oasis
import { seeded } from "./helpers";
import type { Has, Difference, Scene } from "./types";

// Palm tree from the foot of the trunk (bx, by) to the crown (tx, ty)
function palm(bx: number, by: number, tx: number, ty: number, coconuts: boolean): string {
  const mx = (bx + tx) / 2 + (tx > bx ? -18 : 18), my = (by + ty) / 2;
  let s = `<path d="M${bx},${by} Q${mx},${my} ${tx},${ty}" stroke="url(#desertTrunk)" stroke-width="14" fill="none" stroke-linecap="round"/>`;
  for (let k = 1; k < 9; k++) {
    const t = k / 9, u = 1 - t;
    const x = u * u * bx + 2 * u * t * mx + t * t * tx, y = u * u * by + 2 * u * t * my + t * t * ty;
    s += `<path d="M${(x - 7).toFixed(1)},${y.toFixed(1)} q7,-5 14,0" stroke="#6b4423" stroke-width="2" fill="none"/>`;
  }
  const fronds: [number, number][] = [[-78, 18], [-62, -22], [-24, -46], [24, -44], [64, -20], [80, 20], [-40, 38], [44, 40]];
  fronds.forEach(([dx, dy], k) => {
    const ex = tx + dx, ey = ty + dy, cx = tx + dx * 0.5, cy = ty + Math.min(dy, 0) - 26;
    const fill = k % 2 ? "url(#desertFrondDark)" : "url(#desertFrond)";
    s += `<path d="M${tx},${ty} Q${cx},${cy - 10} ${ex},${ey} Q${cx},${cy + 12} ${tx},${ty} Z" fill="${fill}"/>
      <path d="M${tx},${ty} Q${cx},${cy} ${ex},${ey}" stroke="#1d5a2a" stroke-width="1.5" fill="none"/>`;
  });
  if (coconuts) {
    s += `<circle cx="${tx - 8}" cy="${ty + 8}" r="7" fill="#6b4423"/><circle cx="${tx + 7}" cy="${ty + 9}" r="7" fill="#5a3818"/>
      <circle cx="${tx}" cy="${ty + 16}" r="7" fill="#7a5030"/><circle cx="${tx - 10}" cy="${ty + 6}" r="2" fill="#fff" opacity="0.3"/>`;
  }
  return s;
}

function jar(x: number, base: number, h: number, fill: string, band: string): string {
  const w = h * 0.42;
  return `<ellipse cx="${x}" cy="${base}" rx="${w + 6}" ry="5" fill="#8a5a2a" opacity="0.35"/>
    <path d="M${x - w * 0.45},${base - h} Q${x - w * 0.5},${base - h * 0.82} ${x - w},${base - h * 0.55} Q${x - w * 1.05},${base - h * 0.1} ${x - w * 0.5},${base} H${x + w * 0.5} Q${x + w * 1.05},${base - h * 0.1} ${x + w},${base - h * 0.55} Q${x + w * 0.5},${base - h * 0.82} ${x + w * 0.45},${base - h} Z" fill="${fill}"/>
    <rect x="${x - w * 0.55}" y="${base - h - 4}" width="${w * 1.1}" height="6" rx="2" fill="${fill}" stroke="#000" stroke-opacity="0.2"/>
    <path d="M${x - w * 0.98},${base - h * 0.5} H${x + w * 0.98}" stroke="${band}" stroke-width="4"/>
    <path d="M${x - w * 0.6},${base - h * 0.75} Q${x - w * 0.75},${base - h * 0.45} ${x - w * 0.5},${base - h * 0.15}" stroke="#fff" stroke-width="3" opacity="0.3" fill="none"/>`;
}

function drawDesert(has: Has): string {
  const random = seeded(214);
  let s = `<defs>
    <linearGradient id="desertSky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3b2a6e"/><stop offset="0.45" stop-color="#c8507a"/><stop offset="0.8" stop-color="#f59a4a"/><stop offset="1" stop-color="#ffd27a"/>
    </linearGradient>
    <radialGradient id="desertSun" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#fffbe0"/><stop offset="0.6" stop-color="#ffd860"/><stop offset="1" stop-color="#ff9a3a"/>
    </radialGradient>
    <radialGradient id="desertHalo" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#ffe29a" stop-opacity="0.6"/><stop offset="1" stop-color="#ffe29a" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="desertFar" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#e8a060"/><stop offset="1" stop-color="#d08848"/>
    </linearGradient>
    <linearGradient id="desertSand" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f6cf7e"/><stop offset="1" stop-color="#d9a04e"/>
    </linearGradient>
    <linearGradient id="desertFront" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f2c06a"/><stop offset="1" stop-color="#c88a3c"/>
    </linearGradient>
    <linearGradient id="desertPyramid" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#f0b46a"/><stop offset="0.5" stop-color="#e09a52"/><stop offset="0.5" stop-color="#b8723a"/><stop offset="1" stop-color="#a0602e"/>
    </linearGradient>
    <linearGradient id="desertWater" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#5fd0d8"/><stop offset="1" stop-color="#1f7f9e"/>
    </linearGradient>
    <linearGradient id="desertTrunk" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#a87444"/><stop offset="1" stop-color="#7a5030"/>
    </linearGradient>
    <linearGradient id="desertFrond" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#5fbf4a"/><stop offset="1" stop-color="#2f8a3a"/>
    </linearGradient>
    <linearGradient id="desertFrondDark" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3fa040"/><stop offset="1" stop-color="#1f6a2e"/>
    </linearGradient>
    <linearGradient id="desertCactus" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#5aa860"/><stop offset="0.5" stop-color="#3c8a48"/><stop offset="1" stop-color="#25643a"/>
    </linearGradient>
    <linearGradient id="desertCamel" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#d8a868"/><stop offset="1" stop-color="#a87840"/>
    </linearGradient>
    <linearGradient id="desertTent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fff4e0"/><stop offset="1" stop-color="#d8c4a4"/>
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#desertSky)"/>`;

  // Sun, clouds and birds
  s += `<circle cx="600" cy="250" r="150" fill="url(#desertHalo)"/>
    <circle cx="600" cy="250" r="82" fill="url(#desertSun)"/>
    <path d="M520,232 H680 M530,262 H672" stroke="#e8708a" stroke-width="5" stroke-linecap="round" opacity="0.6"/>
    <path d="M80,120 q30,-22 70,-6 q24,-16 56,2 q20,2 26,12 H76 Z" fill="#f7b0a0" opacity="0.55"/>`;
  if (!has("cloud")) s += '<path d="M352,160 q22,-18 52,-6 q20,-12 44,2 q16,2 20,10 H348 Z" fill="#f7b0a0" opacity="0.6"/>';
  const bird = (x: number, y: number, w: number) => `<path d="M${x - w},${y} q${w / 2},${-w * 0.6} ${w},0 q${w / 2},${-w * 0.6} ${w},0" stroke="#3b2240" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
  s += bird(220, 80, 12) + bird(256, 96, 9);
  if (!has("bird")) s += bird(296, 66, 10);

  // Distant pyramids behind the far dunes
  const pyramid = (cx: number, base: number, w: number, h: number) =>
    `<path d="M${cx - w / 2},${base} L${cx},${base - h} L${cx + w / 2},${base} Z" fill="url(#desertPyramid)"/>
    <path d="M${cx - w * 0.3},${base - h * 0.4} H${cx + w * 0.3} M${cx - w * 0.15},${base - h * 0.7} H${cx + w * 0.15}" stroke="#7a4a24" stroke-width="1" opacity="0.4"/>`;
  s += pyramid(190, 340, 210, 120) + pyramid(310, 340, 120, 70);
  if (!has("pyramid")) s += pyramid(48, 340, 84, 60);
  s += `<path d="M0,330 Q120,310 260,334 Q400,350 520,322 Q660,300 800,326 L800,400 L0,400 Z" fill="url(#desertFar)"/>
    <path d="M0,370 Q160,336 340,372 Q520,404 660,360 Q740,340 800,352 L800,600 L0,600 Z" fill="url(#desertSand)"/>
    <path d="M340,372 Q520,404 660,360 Q560,392 340,372 Z" fill="#c88a3c" opacity="0.4"/>`;

  // Sand ripples
  for (let k = 0; k < 26; k++) {
    const x = random() * 800, y = 395 + random() * 200, w = 20 + random() * 30;
    s += `<path d="M${x.toFixed(0)},${y.toFixed(0)} q${(w / 2).toFixed(0)},-5 ${w.toFixed(0)},0" stroke="#b07a38" stroke-width="1.5" fill="none" opacity="0.35"/>`;
  }

  // Tent with a flag
  s += `<ellipse cx="120" cy="452" rx="96" ry="10" fill="#a06a30" opacity="0.4"/>
    <path d="M30,450 L120,352 L210,450 Z" fill="url(#desertTent)"/>
    <path d="M60,418 L180,418 M45,434 L195,434" stroke="#c84a3a" stroke-width="5"/>
    <path d="M120,352 L210,450 L160,450 Z" fill="#000" opacity="0.08"/>
    <line x1="120" y1="354" x2="120" y2="312" stroke="#5a3a20" stroke-width="3"/>`;
  s += `<path d="M121,313 L148,320 L121,328 Z" fill="${has("flag") ? "#2e7bd1" : "#c84a3a"}"/>`;
  if (has("tentDoor")) {
    s += '<path d="M120,382 L98,450 H142 Z" fill="#e8d6b6" stroke="#b8a080" stroke-width="1.5"/><path d="M120,382 V450" stroke="#b8a080" stroke-width="1.5"/>';
  } else {
    s += '<path d="M120,382 L102,450 H138 Z" fill="#3a2414"/><path d="M120,382 L98,450 L108,450 Z M120,382 L142,450 L132,450 Z" fill="#e8d6b6"/>';
  }

  // Pottery jars
  s += jar(46, 552, 54, "#c86a3a", "#2a6a8a") + jar(92, 560, 40, "#d88a4a", "#7a2a1a");
  if (!has("jar")) s += jar(132, 556, 46, "#b85a32", "#e8c060");

  // Small cactus with a flower
  s += `<rect x="222" y="440" width="18" height="56" rx="9" fill="url(#desertCactus)"/>
    <path d="M222,470 h-8 a6,6 0 0,1 -6,-6 v-12" stroke="url(#desertCactus)" stroke-width="10" fill="none" stroke-linecap="round"/>
    <circle cx="231" cy="440" r="6" fill="#ff6fa0"/><circle cx="231" cy="440" r="2" fill="#ffe060"/>
    <ellipse cx="231" cy="497" rx="20" ry="4" fill="#a06a30" opacity="0.4"/>`;

  // Oasis pool with palms
  s += `<ellipse cx="400" cy="474" rx="138" ry="40" fill="#8ac06a"/>
    <ellipse cx="400" cy="474" rx="124" ry="32" fill="url(#desertWater)"/>
    <path d="M320,470 q20,-5 40,0 M400,488 q22,-5 44,0 M430,462 q16,-4 32,0" stroke="#d8fbff" stroke-width="2" fill="none" opacity="0.7"/>
    <path d="M300,462 q-4,-18 4,-24 M310,464 q2,-20 10,-26 M496,460 q4,-18 -2,-26 M486,462 q-2,-16 -10,-22" stroke="#3f8a3a" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  s += palm(318, 470, 340, 290, !has("coconuts")) + palm(486, 468, 470, 304, true);
  s += '<ellipse cx="380" cy="478" rx="11" ry="4" fill="#3fa040"/>';
  if (!has("lotus")) {
    s += `<ellipse cx="448" cy="484" rx="13" ry="4" fill="#3fa040"/>
      <path d="M440,482 Q442,470 448,466 Q454,470 456,482 Z" fill="#ffb0cc"/><path d="M444,482 Q448,472 452,482 Z" fill="#ff7aa8"/>`;
  }

  // Camel with a saddle blanket
  s += `<ellipse cx="642" cy="478" rx="74" ry="8" fill="#a06a30" opacity="0.4"/>
    <path d="M606,418 L600,474 M620,420 L622,474 M662,420 L660,474 M678,416 L686,474" stroke="#a87840" stroke-width="9" stroke-linecap="round"/>
    <ellipse cx="642" cy="404" rx="60" ry="26" fill="url(#desertCamel)"/>
    <path d="M600,398 Q630,338 672,396 Z" fill="url(#desertCamel)"/>
    <path d="M684,398 Q708,392 718,354" stroke="url(#desertCamel)" stroke-width="18" fill="none" stroke-linecap="round"/>
    <ellipse cx="730" cy="350" rx="18" ry="10" fill="#c89858" transform="rotate(12 730 350)"/>
    <path d="M716,340 l-4,-8 l8,4 Z" fill="#a87840"/>
    <circle cx="728" cy="345" r="2.2" fill="#2a1a10"/><path d="M744,356 q-4,3 -8,1" stroke="#5a3a20" stroke-width="1.5" fill="none"/>
    <path d="M714,346 L744,354 M716,358 L742,360" stroke="#c84a3a" stroke-width="2"/>`;
  s += `<path d="M604,396 Q632,346 668,394 L664,410 Q634,398 608,412 Z" fill="${has("saddle") ? "#2f8a5a" : "#c84a3a"}"/>
    <path d="M608,404 Q634,392 664,402" stroke="#ffd060" stroke-width="3" fill="none"/>
    <path d="M612,410 v8 M624,405 v8 M636,402 v8 M648,403 v8 M660,406 v8" stroke="#ffd060" stroke-width="2.5" stroke-linecap="round"/>`;
  if (!has("camelTail")) {
    s += '<path d="M584,398 Q570,410 576,432" stroke="#a87840" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M576,430 l-4,10 l8,-2 Z" fill="#6b4423"/>';
  }

  // Big cactus on the right
  s += `<ellipse cx="752" cy="552" rx="30" ry="5" fill="#a06a30" opacity="0.4"/>
    <rect x="740" y="440" width="24" height="112" rx="12" fill="url(#desertCactus)"/>
    <path d="M764,494 h10 a8,8 0 0,0 8,-8 v-22" stroke="url(#desertCactus)" stroke-width="14" fill="none" stroke-linecap="round"/>`;
  if (!has("cactusArm")) s += '<path d="M740,480 h-10 a8,8 0 0,1 -8,-8 v-18" stroke="url(#desertCactus)" stroke-width="14" fill="none" stroke-linecap="round"/>';
  s += '<path d="M746,452 V546 M752,446 V548 M758,452 V546" stroke="#1d5a2a" stroke-width="1" opacity="0.5"/>';

  // Lizard on a rock
  s += `<path d="M520,560 Q530,530 568,528 Q604,530 612,560 Z" fill="#a08a78"/>
    <path d="M530,548 Q548,534 572,536" stroke="#fff" stroke-width="3" opacity="0.25" fill="none"/>`;
  if (!has("lizard")) {
    s += `<path d="M548,532 Q566,522 586,528 Q596,530 604,526" stroke="#4aa838" stroke-width="6" fill="none" stroke-linecap="round"/>
      <path d="M548,532 Q536,538 528,530" stroke="#4aa838" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M558,528 l-4,-6 M558,530 l-2,6 M580,526 l2,-6 M580,529 l4,5" stroke="#3a8a2a" stroke-width="2" stroke-linecap="round"/>
      <circle cx="602" cy="524" r="1.5" fill="#111"/>`;
  }

  // Scattered pebbles
  s += '<g fill="#b08060" opacity="0.6">';
  for (let k = 0; k < 30; k++) {
    s += `<ellipse cx="${(random() * 800).toFixed(0)}" cy="${(500 + random() * 96).toFixed(0)}" rx="${(1.5 + random() * 2.5).toFixed(1)}" ry="${(1 + random() * 1.5).toFixed(1)}"/>`;
  }
  s += "</g>";
  return s;
}

function desertDifferences(): Difference[] {
  return [
    { id: "bird", x: 296, y: 64, r: 16 },
    { id: "cloud", x: 408, y: 160, r: 30 },
    { id: "pyramid", x: 48, y: 302, r: 26 },
    { id: "flag", x: 134, y: 320, r: 15 },
    { id: "tentDoor", x: 120, y: 420, r: 30 },
    { id: "jar", x: 132, y: 534, r: 26 },
    { id: "coconuts", x: 340, y: 300, r: 18 },
    { id: "lotus", x: 448, y: 477, r: 15 },
    { id: "saddle", x: 636, y: 390, r: 30 },
    { id: "camelTail", x: 578, y: 420, r: 18 },
    { id: "cactusArm", x: 726, y: 466, r: 16 },
    { id: "lizard", x: 572, y: 528, r: 34 },
  ];
}

export const desert: Scene = { name: "Desert Oasis", draw: drawDesert, differences: desertDifferences() };
