// Scene: Haunted House
import { seeded, sparkle, SHARED_DEFS } from "./helpers";
import type { Has, Difference, Scene } from "./types";

function bat(x: number, y: number, w: number): string {
  return `<path d="M${x},${y} q${-w * 0.3},${-w * 0.35} ${-w * 0.55},${-w * 0.2} q${-w * 0.25},${-w * 0.25} ${-w * 0.45},${w * 0.05}
    q${w * 0.2},0 ${w * 0.25},${w * 0.18} q${w * 0.15},${-w * 0.12} ${w * 0.3},${w * 0.02} q${w * 0.2},${-w * 0.1} ${w * 0.45},${w * 0.1}
    q${w * 0.25},${-w * 0.2} ${w * 0.45},${-w * 0.1} q${w * 0.15},${-w * 0.14} ${w * 0.3},${-w * 0.02} q${w * 0.05},${-w * 0.18} ${w * 0.25},${-w * 0.18}
    q${-w * 0.2},${-w * 0.3} ${-w * 0.45},${-w * 0.05} q${-w * 0.25},${-w * 0.15} ${-w * 0.55},${w * 0.2} Z" fill="#1a1028"/>
    <circle cx="${x}" cy="${y + w * 0.02}" r="${w * 0.12}" fill="#1a1028"/>`;
}

function pumpkin(x: number, y: number, r: number, face: boolean): string {
  let s = `<ellipse cx="${x}" cy="${y + r * 0.8}" rx="${r * 1.2}" ry="${r * 0.18}" fill="#000" opacity="0.35"/>
    <path d="M${x},${y - r * 0.8} q${r * 0.1},${-r * 0.35} ${r * 0.3},${-r * 0.45}" stroke="#4a6a2a" stroke-width="${r * 0.18}" fill="none" stroke-linecap="round"/>
    <ellipse cx="${x - r * 0.5}" cy="${y}" rx="${r * 0.6}" ry="${r * 0.82}" fill="url(#hauntedPumpkin)"/>
    <ellipse cx="${x + r * 0.5}" cy="${y}" rx="${r * 0.6}" ry="${r * 0.82}" fill="url(#hauntedPumpkin)"/>
    <ellipse cx="${x}" cy="${y}" rx="${r * 0.62}" ry="${r * 0.86}" fill="url(#hauntedPumpkin)" stroke="#b8440a" stroke-width="1"/>
    <ellipse cx="${x - r * 0.25}" cy="${y - r * 0.4}" rx="${r * 0.12}" ry="${r * 0.28}" fill="#fff" opacity="0.25"/>`;
  if (face) {
    s += `<g fill="#ffe27a" filter="url(#glow)">
      <path d="M${x - r * 0.5},${y - r * 0.1} l${r * 0.18},${-r * 0.3} l${r * 0.18},${r * 0.3} Z M${x + r * 0.14},${y - r * 0.1} l${r * 0.18},${-r * 0.3} l${r * 0.18},${r * 0.3} Z"/>
      <path d="M${x - r * 0.55},${y + r * 0.15} Q${x},${y + r * 0.7} ${x + r * 0.55},${y + r * 0.15} L${x + r * 0.3},${y + r * 0.3} L${x + r * 0.15},${y + r * 0.18} L${x},${y + r * 0.34} L${x - r * 0.15},${y + r * 0.18} L${x - r * 0.3},${y + r * 0.3} Z"/>
    </g>`;
  }
  return s;
}

function gravestone(x: number, base: number, w: number, h: number, cross: boolean): string {
  const shade = `<ellipse cx="${x}" cy="${base}" rx="${w * 0.8}" ry="5" fill="#000" opacity="0.35"/>`;
  if (cross) {
    return shade + `<path d="M${x - w * 0.15},${base} V${base - h * 0.62} H${x - w * 0.45} V${base - h * 0.8} H${x - w * 0.15} V${base - h} H${x + w * 0.15} V${base - h * 0.8} H${x + w * 0.45} V${base - h * 0.62} H${x + w * 0.15} V${base} Z" fill="url(#hauntedStone)"/>`;
  }
  return shade + `<path d="M${x - w / 2},${base} V${base - h + w / 2} A${w / 2},${w / 2} 0 0,1 ${x + w / 2},${base - h + w / 2} V${base} Z" fill="url(#hauntedStone)"/>
    <path d="M${x - w * 0.25},${base - h * 0.55} H${x + w * 0.25} M${x - w * 0.2},${base - h * 0.4} H${x + w * 0.2}" stroke="#4a4a66" stroke-width="2.5" stroke-linecap="round"/>`;
}

function hauntedWindow(x: number, y: number, w: number, h: number, lit: boolean): string {
  return `<rect x="${x - 3}" y="${y - 3}" width="${w + 6}" height="${h + 6}" fill="#2a1a2a"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${lit ? "url(#hauntedLight)" : "#1e2340"}"/>
    <path d="M${x + w / 2},${y} V${y + h} M${x},${y + h / 2} H${x + w}" stroke="#2a1a2a" stroke-width="2.5"/>`;
}

function drawHaunted(has: Has): string {
  const random = seeded(1031);
  let s = `<defs>${SHARED_DEFS}
    <linearGradient id="hauntedSky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#140c33"/><stop offset="0.6" stop-color="#3a2468"/><stop offset="1" stop-color="#6b3f86"/>
    </linearGradient>
    <radialGradient id="hauntedMoon" cx="40%" cy="40%" r="70%">
      <stop offset="0" stop-color="#fffbe6"/><stop offset="1" stop-color="#f0d890"/>
    </radialGradient>
    <radialGradient id="hauntedHalo" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#fff2b0" stop-opacity="0.45"/><stop offset="1" stop-color="#fff2b0" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="hauntedLight" cx="50%" cy="50%" r="70%">
      <stop offset="0" stop-color="#fff6c0"/><stop offset="1" stop-color="#f5a623"/>
    </radialGradient>
    <radialGradient id="hauntedPumpkin" cx="40%" cy="35%" r="70%">
      <stop offset="0" stop-color="#ffb04a"/><stop offset="1" stop-color="#d8580e"/>
    </radialGradient>
    <linearGradient id="hauntedStone" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#a8a8c4"/><stop offset="1" stop-color="#686888"/>
    </linearGradient>
    <linearGradient id="hauntedWall" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#5a4a6e"/><stop offset="1" stop-color="#3a2e4e"/>
    </linearGradient>
    <linearGradient id="hauntedHill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2e4a3e"/><stop offset="1" stop-color="#17281f"/>
    </linearGradient>
    <linearGradient id="hauntedGhost" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#d4dcf4" stop-opacity="0.85"/>
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#hauntedSky)"/>`;

  // Stars, moon and bats
  for (let k = 0; k < 70; k++) {
    s += `<circle cx="${(random() * 800).toFixed(0)}" cy="${(random() * 300).toFixed(0)}" r="${(0.5 + random()).toFixed(1)}" fill="#fff" opacity="${(0.3 + random() * 0.6).toFixed(2)}"/>`;
  }
  s += sparkle(300, 46, 8);
  if (!has("star")) s += sparkle(470, 56, 11);
  s += `<circle cx="640" cy="112" r="120" fill="url(#hauntedHalo)"/>
    <circle cx="640" cy="112" r="58" fill="url(#hauntedMoon)"/>
    <circle cx="622" cy="96" r="10" fill="#e0c878" opacity="0.4"/><circle cx="660" cy="130" r="7" fill="#e0c878" opacity="0.4"/><circle cx="652" cy="92" r="5" fill="#e0c878" opacity="0.4"/>`;
  s += bat(620, 120, 40) + bat(160, 150, 30) + bat(520, 170, 26);
  if (!has("bat")) s += bat(236, 104, 28);

  // Spider web in the top-left corner
  s += '<g stroke="#e8e8f8" stroke-width="1.2" fill="none" opacity="0.7">';
  for (let k = 0; k <= 5; k++) {
    const a = (k / 5) * Math.PI / 2;
    s += `<path d="M0,0 L${(130 * Math.cos(a)).toFixed(1)},${(130 * Math.sin(a)).toFixed(1)}"/>`;
  }
  for (const r of [30, 55, 80, 105]) {
    let d = `M${r},0`;
    for (let k = 1; k <= 5; k++) {
      const a = (k / 5) * Math.PI / 2, m = ((k - 0.5) / 5) * Math.PI / 2;
      d += ` Q${(r * 0.85 * Math.cos(m)).toFixed(1)},${(r * 0.85 * Math.sin(m)).toFixed(1)} ${(r * Math.cos(a)).toFixed(1)},${(r * Math.sin(a)).toFixed(1)}`;
    }
    s += `<path d="${d}"/>`;
  }
  s += "</g>";
  if (!has("spider")) {
    s += `<path d="M64,64 V112" stroke="#e8e8f8" stroke-width="1"/>
      <path d="M56,108 l-8,-6 M56,114 l-9,0 M56,120 l-8,6 M72,108 l8,-6 M72,114 l9,0 M72,120 l8,6" stroke="#1a1028" stroke-width="2" stroke-linecap="round"/>
      <ellipse cx="64" cy="116" rx="9" ry="10" fill="#1a1028"/><circle cx="61" cy="113" r="1.6" fill="#fff"/><circle cx="67" cy="113" r="1.6" fill="#fff"/>`;
  }

  // Hill and the crooked house
  s += `<path d="M0,400 Q120,300 300,318 Q460,330 560,390 L560,600 L0,600 Z" fill="url(#hauntedHill)"/>
    <path d="M420,600 Q560,420 800,430 L800,600 Z" fill="#1f3529"/>
    <g transform="rotate(-3 300 330)">
    <rect x="226" y="196" width="128" height="134" fill="url(#hauntedWall)"/>
    <path d="M214,200 L290,128 L366,200 Z" fill="#2a1e3a"/>
    <path d="M214,200 L290,128 L296,134 L226,200 Z" fill="#4a3a5e"/>
    <rect x="248" y="140" width="16" height="40" fill="#3a2e4e"/><rect x="244" y="136" width="24" height="7" fill="#2a1e3a"/>
    <rect x="344" y="160" width="46" height="170" fill="url(#hauntedWall)"/>
    <path d="M336,164 L367,84 L398,164 Z" fill="#2a1e3a"/>
    <path d="M226,250 H354 M226,300 H344" stroke="#2a1e3a" stroke-width="1.5" opacity="0.6"/>
    ${hauntedWindow(244, 214, 26, 30, true)}${hauntedWindow(310, 214, 26, 30, !has("window"))}
    ${hauntedWindow(244, 268, 26, 30, true)}${hauntedWindow(356, 190, 22, 30, true)}${hauntedWindow(356, 256, 22, 28, false)}
    <path d="M296,330 V290 a14,14 0 0,1 28,0 V330 Z" fill="#2a1a2a"/><circle cx="318" cy="312" r="2" fill="#e2b54a"/>
    <rect x="280" y="328" width="58" height="6" fill="#2a1e3a"/>`;
  if (!has("weathervane")) {
    s += '<path d="M367,86 V58 M356,66 H380 L374,61 M380,66 L374,71" stroke="#1a1028" stroke-width="2.5" fill="none" stroke-linecap="round"/><circle cx="367" cy="76" r="3" fill="#1a1028"/>';
  }
  s += "</g>";

  // Friendly ghost
  s += `<g transform="translate(486,268)">
    <ellipse cx="0" cy="62" rx="24" ry="5" fill="#000" opacity="0.18"/>
    <path d="M-26,36 V0 A26,26 0 0,1 26,0 V36 q-4,8 -9,0 q-4,8 -9,0 q-4,8 -8,0 q-4,8 -9,0 q-4,8 -9,0 Z" fill="url(#hauntedGhost)"/>
    <path d="M-24,10 q-14,-2 -16,-14 M24,10 q14,2 18,-12" stroke="#f2f4ff" stroke-width="8" stroke-linecap="round" fill="none"/>
    <ellipse cx="-9" cy="-2" rx="4" ry="5.5" fill="#2a1a3a"/><ellipse cx="9" cy="-2" rx="4" ry="5.5" fill="#2a1a3a"/>
    <circle cx="-8" cy="-4" r="1.4" fill="#fff"/><circle cx="10" cy="-4" r="1.4" fill="#fff"/>
    <path d="M-5,9 Q0,15 5,9" stroke="#2a1a3a" stroke-width="2" fill="none" stroke-linecap="round"/>
    <circle cx="-16" cy="7" r="4" fill="#ffb0c8" opacity="0.7"/><circle cx="16" cy="7" r="4" fill="#ffb0c8" opacity="0.7"/>`;
  if (!has("ghostBow")) {
    s += '<path d="M10,-22 L-2,-30 L-2,-16 Z M10,-22 L22,-30 L22,-16 Z" fill="#ff6fa8"/><circle cx="10" cy="-23" r="3.5" fill="#e04888"/>';
  }
  s += "</g>";

  // Bare tree with an owl
  s += `<path d="M676,470 Q690,380 680,300 Q676,250 690,210" stroke="#1a1020" stroke-width="22" fill="none" stroke-linecap="round"/>
    <path d="M664,470 Q660,476 640,480 M690,470 Q700,476 720,478" stroke="#1a1020" stroke-width="10" stroke-linecap="round"/>
    <path d="M682,320 Q640,300 596,296 M640,304 Q624,280 628,262 M688,250 Q660,220 650,186 M690,212 Q700,180 690,150 M690,212 Q720,190 736,170" stroke="#1a1020" stroke-width="8" fill="none" stroke-linecap="round"/>`;
  if (!has("branch")) s += '<path d="M684,290 Q730,276 772,240 M748,262 Q762,264 776,276" stroke="#1a1020" stroke-width="7" fill="none" stroke-linecap="round"/>';
  if (!has("owl")) {
    s += `<g transform="translate(616,276)">
      <path d="M-14,-24 l4,-10 l6,8 Z M14,-24 l-4,-10 l-6,8 Z" fill="#7a5a3a"/>
      <ellipse cx="0" cy="-6" rx="16" ry="21" fill="#7a5a3a"/><ellipse cx="0" cy="2" rx="10" ry="12" fill="#c8a878"/>
      <circle cx="-7" cy="-14" r="6.5" fill="#fff6c0"/><circle cx="7" cy="-14" r="6.5" fill="#fff6c0"/>
      <circle cx="-7" cy="-14" r="3" fill="#1a1028"/><circle cx="7" cy="-14" r="3" fill="#1a1028"/>
      <path d="M-3,-8 L0,-3 L3,-8 Z" fill="#e2a040"/>
    </g>`;
  }

  // Wrought-iron fence and gate
  s += '<g stroke="#120a1c" stroke-width="4" fill="#120a1c">';
  s += '<path d="M0,452 H340 M460,452 H800 M0,500 H340 M460,500 H800" fill="none"/>';
  for (let x = 12; x < 800; x += 26) {
    if (x > 330 && x < 470) continue;
    s += `<path d="M${x},512 V440" fill="none"/><path d="M${x - 5},442 L${x},430 L${x + 5},442 Z" stroke="none"/>`;
  }
  s += `<path d="M340,520 V404 M460,520 V404" stroke-width="8"/>
    <path d="M346,520 V444 Q400,404 454,444 V520 M346,470 H454 M346,500 H454 M374,520 V432 M400,520 V424 M426,520 V432" fill="none" stroke-width="3"/>
    <circle cx="340" cy="398" r="7" stroke="none"/><circle cx="460" cy="398" r="7" stroke="none"/>
    <path d="M388,452 q12,-12 24,0 q-12,12 -24,0" fill="none" stroke-width="2.5"/>
  </g>`;

  // Front lawn, path and gravestones
  s += `<path d="M0,500 Q400,486 800,500 L800,600 L0,600 Z" fill="#1a2c22"/>
    <path d="M370,520 Q400,540 380,600 H460 Q440,540 430,520 Z" fill="#4a4060" opacity="0.7"/>`;
  // Grass tufts
  s += '<g stroke="#2e4a3e" stroke-width="2" fill="none" stroke-linecap="round">';
  for (let k = 0; k < 40; k++) {
    const x = random() * 800, y = 520 + random() * 76;
    s += `<path d="M${x.toFixed(0)},${y.toFixed(0)} l-3,-8 M${x.toFixed(0)},${y.toFixed(0)} l3,-9"/>`;
  }
  s += "</g>";
  s += gravestone(560, 528, 46, 62, false) + gravestone(640, 548, 50, 70, has("crossStone")) + gravestone(744, 532, 44, 58, false);
  s += `<g fill="#0c0612">
    <ellipse cx="560" cy="452" rx="13" ry="17"/><circle cx="560" cy="428" r="11"/>
    <path d="M551,422 l2,-12 l7,8 Z M569,422 l-2,-12 l-7,8 Z"/>
  </g>
  <ellipse cx="556" cy="427" rx="2.5" ry="3" fill="#ffe040"/><ellipse cx="564" cy="427" rx="2.5" ry="3" fill="#ffe040"/>`;
  if (!has("catTail")) s += '<path d="M570,464 Q592,462 590,440 Q588,428 596,424" stroke="#0c0612" stroke-width="5" fill="none" stroke-linecap="round"/>';

  // Pumpkins
  s += pumpkin(112, 532, 36, !has("pumpkinFace")) + pumpkin(196, 554, 26, true);
  if (!has("smallPumpkin")) s += pumpkin(262, 566, 18, false);

  return s;
}

function hauntedDifferences(): Difference[] {
  return [
    { id: "star", x: 470, y: 56, r: 15 },
    { id: "bat", x: 236, y: 102, r: 22 },
    { id: "spider", x: 64, y: 106, r: 20 },
    { id: "window", x: 318, y: 229, r: 20 },
    { id: "weathervane", x: 354, y: 64, r: 17 },
    { id: "ghostBow", x: 496, y: 245, r: 16 },
    { id: "owl", x: 616, y: 266, r: 26 },
    { id: "branch", x: 740, y: 262, r: 32 },
    { id: "catTail", x: 588, y: 446, r: 16 },
    { id: "crossStone", x: 640, y: 512, r: 32 },
    { id: "pumpkinFace", x: 112, y: 536, r: 30 },
    { id: "smallPumpkin", x: 262, y: 566, r: 24 },
  ];
}

export const haunted: Scene = { name: "Haunted House", draw: drawHaunted, differences: hauntedDifferences() };
