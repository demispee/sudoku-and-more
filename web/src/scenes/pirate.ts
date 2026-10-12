// Scene: Pirate Cove
import { seeded, sparkle, SHARED_DEFS } from "./helpers";
import type { Has, Difference, Scene } from "./types";

const HORIZON = 300;
const GULLS: [number, number, number][] = [[90, 150, 1], [560, 108, 0.8], [604, 140, 1.1], [700, 90, 0.7]];
const LOST_GULL = 2;

function gull(x: number, y: number, size: number): string {
  return `<path d="M${x - 16 * size},${y} q${8 * size},${-10 * size} ${16 * size},0 q${8 * size},${-10 * size} ${16 * size},0" stroke="#3a2a3a" stroke-width="${2.5 * size}" fill="none" stroke-linecap="round"/>`;
}

function palm(x: number, base: number, topX: number, topY: number, coconuts: boolean): string {
  let s = `<path d="M${x - 8},${base} Q${(x + topX) / 2 - 20},${(base + topY) / 2} ${topX - 4},${topY} L${topX + 4},${topY} Q${(x + topX) / 2 - 8},${(base + topY) / 2} ${x + 8},${base} Z" fill="#8a5a2e"/>`;
  for (let k = 0; k < 7; k++) s += `<path d="M${x - 6 + k * 0.5},${base - 14 - k * ((base - topY) / 7)} q8,-3 14,0" stroke="#5e3a1a" stroke-width="1.5" fill="none" transform="translate(${((topX - x) * k / 7).toFixed(0)},0)"/>`;
  [[-60, 14], [-40, 30], [-6, 40], [40, 28], [62, 12], [20, -20], [-26, -18]].forEach(([dx, dy], k) => {
    s += `<path d="M${topX},${topY} Q${topX + dx! * 0.5},${topY - 26 + (dy! < 0 ? dy! : 0)} ${topX + dx!},${topY + dy!} Q${topX + dx! * 0.45},${topY - 10} ${topX},${topY + 4} Z" fill="${k % 2 ? "#2a8a3a" : "#3aa84a"}"/>`;
  });
  if (coconuts) s += `<g fill="#6a3e1a"><circle cx="${topX - 7}" cy="${topY + 8}" r="6"/><circle cx="${topX + 6}" cy="${topY + 9}" r="6"/><circle cx="${topX}" cy="${topY + 16}" r="6"/></g>`;
  return s;
}

function drawPirate(has: Has): string {
  const random = seeded(1717);
  let s = `<defs>${SHARED_DEFS}
    <linearGradient id="pirateSky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#4a7ad8"/><stop offset="0.55" stop-color="#ffb07a"/><stop offset="1" stop-color="#ffe0a0"/>
    </linearGradient>
    <linearGradient id="pirateSea" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2ab8c0"/><stop offset="0.5" stop-color="#3ad0c8"/><stop offset="1" stop-color="#8aeedd"/>
    </linearGradient>
    <linearGradient id="pirateSand" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fbe4a8"/><stop offset="1" stop-color="#e0b874"/>
    </linearGradient>
    <linearGradient id="pirateHull" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#8a4e26"/><stop offset="1" stop-color="#4a2410"/>
    </linearGradient>
    <linearGradient id="pirateSail" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fff8e4"/><stop offset="1" stop-color="#e2d2a8"/>
    </linearGradient>
    <radialGradient id="pirateSun" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#fff6c0"/><stop offset="0.35" stop-color="#ffd870" stop-opacity="0.9"/><stop offset="1" stop-color="#ffb07a" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="pirateBarrel" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#6a3a1a"/><stop offset="0.45" stop-color="#b07a42"/><stop offset="1" stop-color="#5a2e14"/>
    </linearGradient>
    <linearGradient id="pirateIron" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#6a6e78"/><stop offset="1" stop-color="#22242a"/>
    </linearGradient>
  </defs>
  <rect width="800" height="${HORIZON}" fill="url(#pirateSky)"/>
  <circle cx="470" cy="250" r="110" fill="url(#pirateSun)"/><circle cx="470" cy="250" r="34" fill="#fff0b0"/>
  <rect y="${HORIZON}" width="800" height="300" fill="url(#pirateSea)"/>`;

  // Clouds and seagulls
  const cloud = (x: number, y: number): string => `<g fill="#fff" opacity="0.85"><ellipse cx="${x}" cy="${y}" rx="34" ry="12"/><ellipse cx="${x - 14}" cy="${y - 8}" rx="16" ry="12"/><ellipse cx="${x + 10}" cy="${y - 12}" rx="18" ry="14"/></g>`;
  s += cloud(150, 70) + cloud(250, 40);
  if (!has("cloud")) s += cloud(500, 60);
  GULLS.forEach(([x, y, size], k) => { if (!(k === LOST_GULL && has("seagull"))) s += gull(x, y, size); });

  // Island with palm trees on the right
  s += `<path d="M560,328 Q600,286 680,282 Q760,280 800,300 V336 H560 Z" fill="#4a9a4a"/>
    <path d="M548,334 Q620,312 720,316 Q780,318 800,326 V344 H548 Z" fill="url(#pirateSand)"/>
    <path d="M540,344 H800" stroke="#fff" stroke-width="3" opacity="0.6"/>`;
  s += palm(660, 320, 632, 176, !has("coconuts")) + palm(740, 318, 764, 200, true);

  // Pirate ship
  s += `<path d="M150,300 L430,300 L410,360 Q290,372 176,360 Z" fill="url(#pirateHull)" stroke="#2a1408" stroke-width="2"/>
    <path d="M150,300 L196,276 L430,284 L430,300 Z" fill="#6a3418"/><path d="M380,284 L430,274 L440,300 L430,300 Z" fill="#5a2a12"/>
    <path d="M156,312 L426,312 M164,334 L418,334" stroke="#e2b54a" stroke-width="3"/>
    ${[200, 250, 300, 350].map(x => `<circle cx="${x}" cy="323" r="5" fill="#1a0e06" stroke="#e2b54a" stroke-width="1.5"/>`).join("")}
    <path d="M430,292 L486,270" stroke="#4a2410" stroke-width="4"/>
    <line x1="240" y1="120" x2="240" y2="300" stroke="#4a2410" stroke-width="7"/><line x1="340" y1="74" x2="340" y2="300" stroke="#4a2410" stroke-width="8"/>
    <path d="M340,90 L486,270 M240,130 L160,296" stroke="#3a2a1a" stroke-width="1.2"/>
    <path d="M194,140 Q240,132 286,140 Q292,170 284,196 Q240,188 196,196 Q188,170 194,140 Z" fill="url(#pirateSail)" stroke="#a89a78"/>
    <path d="M190,206 Q240,198 290,206 Q298,240 288,272 Q240,262 192,272 Q182,240 190,206 Z" fill="url(#pirateSail)" stroke="#a89a78"/>
    <path d="M286,96 Q340,88 394,96 Q402,130 392,162 Q340,154 288,162 Q278,130 286,96 Z" fill="url(#pirateSail)" stroke="#a89a78"/>
    <path d="M282,172 Q340,164 398,172 Q408,214 396,256 Q340,246 284,256 Q272,214 282,172 Z" fill="url(#pirateSail)" stroke="#a89a78"/>
    <rect x="322" y="112" width="36" height="12" fill="#5a2a12"/>
    <path d="M241,112 L268,118 L241,124 Z" fill="#c8203a"/>`;
  if (!has("sailStripe")) s += '<path d="M186,232 Q240,224 294,232 V246 Q240,238 186,246 Z" fill="#c8203a" opacity="0.9"/>';
  s += '<path d="M276,206 Q340,198 402,206 V220 Q340,212 278,220 Z" fill="#c8203a" opacity="0.9"/>';
  // Skull flag (red in the changed picture)
  s += `<g transform="translate(340,48)"><path d="M0,0 Q20,-4 40,2 Q36,14 40,26 Q20,20 0,26 Z" fill="${has("flag") ? "#c8203a" : "#1a1a1e"}"/>
    <circle cx="20" cy="10" r="6" fill="#fff"/><rect x="16.5" y="14" width="7" height="4" fill="#fff"/>
    <circle cx="17.8" cy="10" r="1.6" fill="#1a1a1e"/><circle cx="22.2" cy="10" r="1.6" fill="#1a1a1e"/>
    <path d="M12,16 L28,23 M28,16 L12,23" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/></g>
    <line x1="340" y1="44" x2="340" y2="76" stroke="#4a2410" stroke-width="3"/>`;

  // Waves and glints on the water
  s += '<g stroke="#fff" stroke-linecap="round" fill="none" opacity="0.55">';
  for (let k = 0; k < 40; k++) {
    const x = random() * 780, y = 370 + random() * 120, w = 10 + random() * 16;
    s += `<path d="M${x.toFixed(0)},${y.toFixed(0)} q${(w / 2).toFixed(0)},-5 ${w.toFixed(0)},0" stroke-width="2"/>`;
  }
  s += "</g>" + sparkle(420, 318, 8) + sparkle(520, 330, 10) + sparkle(260, 400, 7) + sparkle(560, 470, 8);
  s += '<path d="M150,364 Q290,380 420,362" stroke="#1a6a78" stroke-width="6" opacity="0.35" fill="none"/>';

  // Shark fin circling and the rowing boat
  if (!has("sharkFin")) s += '<path d="M452,430 Q470,404 474,396 Q478,416 494,430 Z" fill="#5a6a7a"/><path d="M440,432 q14,-6 28,0 q14,6 34,0" stroke="#fff" stroke-width="2" fill="none"/>';
  const boat = has("boatColor") ? "#3a8a4a" : "#d84a2a";
  s += `<g transform="translate(0,-34)"><path d="M612,430 H684 Q678,452 660,456 H630 Q614,452 612,430 Z" fill="${boat}" stroke="#4a1a0a" stroke-width="1.5"/>
    <path d="M612,434 H684" stroke="#f8e0b0" stroke-width="3"/><path d="M620,442 L586,462 M676,442 L708,462" stroke="#b07a42" stroke-width="3" stroke-linecap="round"/>
    <path d="M612,460 Q648,468 684,460" stroke="#fff" stroke-width="2" fill="none" opacity="0.7"/></g>`;

  // Foreground beach
  s += `<path d="M0,470 Q160,454 320,480 Q520,510 800,490 V600 H0 Z" fill="url(#pirateSand)"/>
    <path d="M0,470 Q160,454 320,480 Q520,510 800,490" stroke="#fff" stroke-width="5" fill="none" opacity="0.75"/>`;
  for (let k = 0; k < 70; k++) s += `<circle cx="${(random() * 800).toFixed(0)}" cy="${(500 + random() * 96).toFixed(0)}" r="1.4" fill="#c8a060" opacity="0.7"/>`;
  s += '<path d="M480,560 l6,-10 l6,10 l-6,4 Z M496,580 l4,-6 l4,6 Z" fill="#ff9a8a"/><path d="M740,580 a10,6 0 0,1 20,0 Z" fill="#fff4e0" stroke="#d8b080"/>';

  // Barrel with a treasure map and the parrot on top
  s += `<path d="M78,440 Q70,490 78,544 H162 Q170,490 162,440 Z" fill="url(#pirateBarrel)"/>
    <ellipse cx="120" cy="440" rx="42" ry="9" fill="#8a5a2e" stroke="#4a2a10" stroke-width="2"/>
    <path d="M74,462 Q120,470 166,462 M72,522 Q120,530 168,522" stroke="#3a3a40" stroke-width="5" fill="none"/>
    <path d="M96,480 L146,482 L144,524 L98,522 Z" fill="#f4e2b0" stroke="#a8844a" stroke-width="1.5"/>
    <path d="M102,512 Q114,494 126,506 T140,490" stroke="#a8844a" stroke-width="1.5" stroke-dasharray="3 2" fill="none"/>
    <circle cx="121" cy="481" r="2.5" fill="#c8203a"/>`;
  if (!has("mapX")) s += '<path d="M132,494 l10,10 M142,494 l-10,10" stroke="#c8203a" stroke-width="3" stroke-linecap="round"/>';
  const parrot = has("parrot") ? ["#2a9a4a", "#5ad06a"] : ["#d8202a", "#ff6a4a"];
  s += `<g transform="translate(116,412)"><path d="M-4,10 Q-16,30 -18,44 Q-8,34 0,18 Z" fill="#2a5ad8"/>
    <ellipse cx="0" cy="6" rx="11" ry="17" fill="${parrot[0]}"/><path d="M2,0 Q14,8 6,22 Q-2,16 2,0 Z" fill="#2a5ad8"/>
    <circle cx="0" cy="-12" r="10" fill="${parrot[1]}"/><path d="M-8,-14 Q-18,-12 -14,-2 Q-12,-8 -6,-8 Z" fill="#f4e2b0" stroke="#3a3a3a"/>
    <circle cx="-2" cy="-14" r="3" fill="#fff"/><circle cx="-2.5" cy="-14" r="1.6" fill="#111"/>
    <path d="M-4,22 v6 M4,22 v6" stroke="#4a4a4a" stroke-width="2"/></g>`;

  // Telescope lying on the sand
  if (!has("telescope")) {
    s += `<g transform="rotate(-18,232,560)"><rect x="196" y="553" width="30" height="14" rx="2" fill="#6a3a1a"/><rect x="224" y="555" width="24" height="10" fill="url(#gold)"/>
      <rect x="246" y="557" width="20" height="6" fill="#6a3a1a"/><rect x="192" y="551" width="6" height="18" rx="2" fill="url(#gold)"/></g>
      <ellipse cx="232" cy="572" rx="38" ry="4" fill="#b08a50" opacity="0.4"/>`;
  }

  // Cannon with a stack of cannon balls
  s += `<ellipse cx="370" cy="550" rx="58" ry="8" fill="#b08a50" opacity="0.45"/>
    <path d="M326,526 L406,506 Q418,504 420,514 Q420,524 410,526 L334,544 Q318,544 320,534 Z" fill="url(#pirateIron)"/>
    <circle cx="322" cy="534" r="9" fill="#3a3c44"/><rect x="342" y="526" width="46" height="18" fill="#7a4a22" stroke="#4a2a10"/>
    <circle cx="350" cy="544" r="10" fill="#8a5a2e" stroke="#4a2a10" stroke-width="2"/><circle cx="382" cy="544" r="10" fill="#8a5a2e" stroke="#4a2a10" stroke-width="2"/>
    <path d="M410,512 Q414,519 410,526" stroke="#8a8e98" stroke-width="2" fill="none"/>`;
  const balls: [number, number][] = [[420, 572], [440, 572], [430, 556]];
  balls.forEach(([x, y], k) => { if (!(k === 2 && has("cannonBall"))) s += `<circle cx="${x}" cy="${y}" r="9" fill="url(#pirateIron)"/><circle cx="${x - 3}" cy="${y - 3}" r="2.5" fill="#fff" opacity="0.35"/>`; });

  // Treasure chest with gold coins spilling out
  s += `<ellipse cx="600" cy="560" rx="62" ry="8" fill="#b08a50" opacity="0.45"/>
    <path d="M552,512 L548,476 Q600,456 652,476 L648,512 Z" fill="#6a3a1a" stroke="#3a1e0a" stroke-width="2"/>
    <ellipse cx="600" cy="516" rx="48" ry="8" fill="url(#gold)"/>
    ${[0, 1, 2, 3, 4, 5, 6].map(k => `<circle cx="${566 + k * 11}" cy="${512 - (k % 3) * 4}" r="6" fill="url(#gold)" stroke="#8c6418" stroke-width="0.8"/>`).join("")}
    <rect x="552" y="516" width="96" height="40" fill="#8a4e22" stroke="#3a1e0a" stroke-width="2"/>
    <path d="M552,530 H648 M572,516 V556 M628,516 V556" stroke="url(#gold)" stroke-width="4"/>
    <rect x="593" y="524" width="14" height="16" rx="2" fill="url(#gold)" stroke="#8c6418"/>`;
  s += sparkle(574, 500, 9) + sparkle(624, 504, 7);
  if (!has("coinPile")) {
    s += [[664, 572], [676, 568], [688, 574], [670, 562], [682, 560], [676, 552]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="8" ry="4" fill="url(#gold)" stroke="#8c6418" stroke-width="0.8"/>`).join("");
  }
  return s;
}

function pirateDifferences(): Difference[] {
  const [gx, gy, gs] = GULLS[LOST_GULL]!;
  return [
    { id: "flag", x: 360, y: 60, r: 28 },
    { id: "cloud", x: 502, y: 56, r: 36 },
    { id: "seagull", x: gx, y: gy - 4, r: 16 * gs + 6 },
    { id: "coconuts", x: 632, y: 188, r: 20 },
    { id: "sailStripe", x: 240, y: 238, r: 28 },
    { id: "sharkFin", x: 472, y: 418, r: 26 },
    { id: "boatColor", x: 648, y: 410, r: 38 },
    { id: "parrot", x: 112, y: 412, r: 30 },
    { id: "mapX", x: 137, y: 499, r: 14 },
    { id: "telescope", x: 230, y: 560, r: 38 },
    { id: "cannonBall", x: 430, y: 556, r: 14 },
    { id: "coinPile", x: 676, y: 564, r: 22 },
  ];
}

export const pirate: Scene = { name: "Pirate Cove", draw: drawPirate, differences: pirateDifferences() };
