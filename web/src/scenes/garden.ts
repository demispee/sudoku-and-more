// Scene: Flower Garden
import { seeded } from "./helpers";
import type { Has, Difference, Scene } from "./types";

const SUNFLOWERS = [{ x: 60, y: 190 }, { x: 115, y: 162 }, { x: 170, y: 200 }];
const TULIPS = [{ x: 60, c: "#e0302a" }, { x: 95, c: "#ff7aa8" }, { x: 130, c: "#ffd23f" }, { x: 165, c: "#9a5bd1" }];
const ROSES = [215, 255, 295, 335];
const DAISIES = Array.from({ length: 8 }, (_, k) => ({ x: 450 + k * 44, y: 524 + (k % 2) * 16 }));

function cloud(cx: number, cy: number, w: number): string {
  return `<ellipse cx="${cx}" cy="${cy + 6}" rx="${w}" ry="${w * 0.28}" fill="#dcecf8"/>
    <ellipse cx="${cx - w * 0.4}" cy="${cy}" rx="${w * 0.42}" ry="${w * 0.3}" fill="#fff"/>
    <ellipse cx="${cx + w * 0.1}" cy="${cy - w * 0.15}" rx="${w * 0.5}" ry="${w * 0.4}" fill="#fff"/>
    <ellipse cx="${cx + w * 0.55}" cy="${cy + 2}" rx="${w * 0.4}" ry="${w * 0.26}" fill="#fff"/>`;
}

function sunflower(x: number, y: number, petal: string): string {
  let s = `<path d="M${x},${y} Q${x + 6},${y + 90} ${x},${y + 190}" stroke="#4f8a2b" stroke-width="5" fill="none"/>
    <path d="M${x + 2},${y + 80} q20,-14 28,2 q-16,8 -28,-2 M${x + 2},${y + 120} q-20,-14 -28,2 q16,8 28,-2" fill="#5fa133"/>`;
  for (let a = 0; a < 360; a += 24) {
    s += `<ellipse cx="${x}" cy="${y - 16}" rx="5.5" ry="11" fill="${petal}" transform="rotate(${a},${x},${y})"/>`;
  }
  return s + `<circle cx="${x}" cy="${y}" r="11" fill="#6b3a12"/><circle cx="${x - 3}" cy="${y - 3}" r="4" fill="#8f5420"/>`;
}

function butterfly(x: number, y: number, wing: string, edge: string): string {
  return `<g>
    <ellipse cx="${x - 11}" cy="${y - 7}" rx="12" ry="9" fill="${wing}" stroke="${edge}" stroke-width="2" transform="rotate(-25,${x - 11},${y - 7})"/>
    <ellipse cx="${x + 11}" cy="${y - 7}" rx="12" ry="9" fill="${wing}" stroke="${edge}" stroke-width="2" transform="rotate(25,${x + 11},${y - 7})"/>
    <ellipse cx="${x - 8}" cy="${y + 7}" rx="8" ry="6" fill="${wing}" stroke="${edge}" stroke-width="2"/>
    <ellipse cx="${x + 8}" cy="${y + 7}" rx="8" ry="6" fill="${wing}" stroke="${edge}" stroke-width="2"/>
    <circle cx="${x - 13}" cy="${y - 8}" r="2.5" fill="#fff"/><circle cx="${x + 13}" cy="${y - 8}" r="2.5" fill="#fff"/>
    <ellipse cx="${x}" cy="${y}" rx="2.5" ry="12" fill="#2b2b33"/>
    <path d="M${x},${y - 11} q-4,-8 -8,-9 M${x},${y - 11} q4,-8 8,-9" stroke="#2b2b33" stroke-width="1.2" fill="none"/>
  </g>`;
}

function bee(x: number, y: number): string {
  return `<g>
    <ellipse cx="${x - 3}" cy="${y - 9}" rx="6" ry="8" fill="#e8f6ff" opacity="0.85" stroke="#9cc"/>
    <ellipse cx="${x + 5}" cy="${y - 9}" rx="6" ry="8" fill="#e8f6ff" opacity="0.85" stroke="#9cc"/>
    <ellipse cx="${x}" cy="${y}" rx="11" ry="7.5" fill="#ffc21a"/>
    <path d="M${x - 4},${y - 7} v14 M${x + 3},${y - 7} v14" stroke="#2b2b33" stroke-width="3"/>
    <circle cx="${x + 10}" cy="${y - 1}" r="4" fill="#2b2b33"/><path d="M${x - 11},${y} l-4,1" stroke="#2b2b33" stroke-width="2"/>
  </g>`;
}

function daisy(x: number, y: number): string {
  let s = `<path d="M${x},${y} V${y + 40}" stroke="#4f8a2b" stroke-width="3"/>`;
  for (let a = 0; a < 360; a += 30) s += `<ellipse cx="${x}" cy="${y - 8}" rx="3.2" ry="7" fill="#fff" stroke="#e0e0e0" stroke-width="0.6" transform="rotate(${a},${x},${y})"/>`;
  return s + `<circle cx="${x}" cy="${y}" r="4.5" fill="#ffc21a"/>`;
}

function drawGarden(has: Has): string {
  const random = seeded(88);
  let s = `<defs>
    <linearGradient id="gardenSky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#4fa3e8"/><stop offset="1" stop-color="#d4effc"/>
    </linearGradient>
    <linearGradient id="gardenLawn" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#8bd160"/><stop offset="1" stop-color="#4a9a35"/>
    </linearGradient>
    <linearGradient id="gardenHedge" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3f9a4a"/><stop offset="1" stop-color="#1f6030"/>
    </linearGradient>
    <linearGradient id="gardenSoil" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#8a5a36"/><stop offset="1" stop-color="#5a3820"/>
    </linearGradient>
    <linearGradient id="gardenStone" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#e4e0d8"/><stop offset="0.5" stop-color="#c4beb2"/><stop offset="1" stop-color="#8e887c"/>
    </linearGradient>
    <linearGradient id="gardenCan" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#5fc08a"/><stop offset="0.4" stop-color="#9ee6bb"/><stop offset="1" stop-color="#2f8a5a"/>
    </linearGradient>
    <radialGradient id="gardenSun" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#fff6b0"/><stop offset="0.6" stop-color="#ffd23f" stop-opacity="0.6"/><stop offset="1" stop-color="#ffd23f" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="800" height="600" fill="url(#gardenSky)"/>`;

  // Sun with rays and clouds
  s += '<circle cx="700" cy="75" r="80" fill="url(#gardenSun)"/><g stroke="#ffd23f" stroke-width="4" stroke-linecap="round">';
  for (let a = 0; a < 360; a += 30) {
    const c = Math.cos(a * Math.PI / 180), n = Math.sin(a * Math.PI / 180);
    s += `<line x1="${(700 + 44 * c).toFixed(1)}" y1="${(75 + 44 * n).toFixed(1)}" x2="${(700 + 60 * c).toFixed(1)}" y2="${(75 + 60 * n).toFixed(1)}"/>`;
  }
  s += '</g><circle cx="700" cy="75" r="34" fill="#ffd23f" stroke="#fff2a8" stroke-width="3"/>';
  s += cloud(210, 70, 56);
  if (!has("cloud")) s += cloud(445, 112, 38);

  // Hedge and picket fence
  let hedge = "M0,330 L0,236";
  for (let x = 0; x < 800; x += 50) hedge += ` Q${x + 25},${x % 100 ? 206 : 214} ${x + 50},${x % 100 ? 238 : 232}`;
  s += `<path d="${hedge} L800,330 Z" fill="url(#gardenHedge)"/>`;
  s += '<g fill="#2f7a3a" opacity="0.6">';
  for (let k = 0; k < 30; k++) s += `<circle cx="${(random() * 800).toFixed(0)}" cy="${(235 + random() * 30).toFixed(0)}" r="${(4 + random() * 5).toFixed(1)}"/>`;
  s += '</g><g fill="#fdfcf7" stroke="#c9c2b0" stroke-width="1">';
  for (let x = 8; x < 800; x += 32) s += `<path d="M${x},342 V262 L${x + 10},250 L${x + 20},262 V342 Z"/>`;
  s += '<rect x="0" y="276" width="800" height="8"/><rect x="0" y="316" width="800" height="8"/></g>';
  if (!has("birdhouse")) {
    s += `<rect x="297" y="236" width="6" height="22" fill="#7a4a24"/>
      <rect x="284" y="208" width="32" height="30" fill="#5aa9e6" stroke="#2d6fa0" stroke-width="1.5"/>
      <path d="M279,210 L300,190 L321,210 Z" fill="#c43d2e"/>
      <circle cx="300" cy="222" r="5" fill="#2b2b33"/><rect x="298" y="230" width="4" height="5" fill="#7a4a24"/>`;
  }

  // Lawn with tufts and tiny flowers
  s += '<path d="M0,336 Q400,322 800,338 L800,600 L0,600 Z" fill="url(#gardenLawn)"/>';
  s += '<g stroke="#3f8a2e" stroke-width="2" stroke-linecap="round">';
  for (let k = 0; k < 45; k++) {
    const x = random() * 800, y = 350 + random() * 130;
    s += `<path d="M${x.toFixed(0)},${y.toFixed(0)} l-3,-7 M${x.toFixed(0)},${y.toFixed(0)} l3,-8"/>`;
  }
  s += "</g>";
  for (let k = 0; k < 14; k++) {
    const x = random() * 800, y = 360 + random() * 110;
    s += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="2.5" fill="${k % 2 ? "#fff" : "#ffe14d"}"/>`;
  }

  // Stepping stones across the lawn
  [[70, 466, 24], [130, 440, 20], [186, 418, 17], [520, 470, 22], [560, 440, 18]].forEach(([x, y, w]) => {
    s += `<ellipse cx="${x}" cy="${y! + 3}" rx="${w}" ry="${w! * 0.42}" fill="#3f7a2e" opacity="0.5"/>
      <ellipse cx="${x}" cy="${y}" rx="${w}" ry="${w! * 0.4}" fill="url(#gardenStone)"/>`;
  });

  // Tall sunflowers against the fence
  SUNFLOWERS.forEach(({ x, y }, k) => { s += sunflower(x, y, k === 1 && has("sunflower") ? "#f06a1f" : "#ffc21a"); });

  // Bees and butterflies
  s += bee(232, 148) + bee(395, 455);
  if (!has("bee")) s += bee(178, 112);
  s += butterfly(520, 190, has("butterfly") ? "#5b8ff0" : "#f59a23", "#2b2b33") + butterfly(660, 262, "#c58cf0", "#5a2a8a");

  // Birdbath with a bird
  s += `<ellipse cx="430" cy="474" rx="40" ry="8" fill="#2f6b24" opacity="0.35"/>
    <path d="M406,474 L414,460 L420,410 L440,410 L446,460 L454,474 Z" fill="url(#gardenStone)"/>
    <path d="M378,392 Q430,436 482,392 Z" fill="url(#gardenStone)"/>
    <ellipse cx="430" cy="392" rx="54" ry="11" fill="#c4beb2"/>
    <ellipse cx="430" cy="392" rx="46" ry="7.5" fill="#7fc4ec"/><path d="M406,391 q10,-3 20,0" stroke="#fff" stroke-width="1.5" fill="none" opacity="0.8"/>`;
  if (!has("bird")) {
    s += `<path d="M458,374 Q452,388 470,388 Q484,386 482,376 Z" fill="#4b7bd1"/>
      <circle cx="463" cy="372" r="7" fill="#4b7bd1"/><path d="M456,371 L449,373 L456,375 Z" fill="#f0a020"/>
      <circle cx="461" cy="370" r="1.4" fill="#111"/><path d="M478,378 L490,372 L486,382 Z" fill="#2f5aa8"/>
      <ellipse cx="468" cy="382" rx="7" ry="4" fill="#f2f2f2"/><path d="M466,388 V392 M472,388 V392" stroke="#f0a020" stroke-width="1.5"/>`;
  }

  // Garden gnome
  s += `<ellipse cx="630" cy="472" rx="30" ry="6" fill="#2f6b24" opacity="0.35"/>
    <path d="M608,472 L612,424 Q630,414 648,424 L652,472 Z" fill="#3e6fb3"/>
    <rect x="610" y="446" width="40" height="6" fill="#5a3b24"/><rect x="626" y="445" width="8" height="8" fill="#e2b54a"/>
    <ellipse cx="618" cy="472" rx="10" ry="5" fill="#5a3b24"/><ellipse cx="642" cy="472" rx="10" ry="5" fill="#5a3b24"/>
    <circle cx="630" cy="410" r="12" fill="#f5c9a0"/>
    <path d="M616,412 Q630,450 644,412 Q630,420 616,412 Z" fill="#f4f4f4"/>
    <circle cx="630" cy="414" r="4" fill="#f09a8a"/><circle cx="625" cy="407" r="1.6" fill="#111"/><circle cx="635" cy="407" r="1.6" fill="#111"/>
    <path d="M612,404 Q624,356 640,362 Q646,378 648,404 Z" fill="${has("gnomeHat") ? "#2f9a5a" : "#d63a2f"}"/>
    <path d="M612,404 Q630,410 648,404" stroke="#fff" stroke-opacity="0.35" stroke-width="3" fill="none"/>
    <path d="M652,430 L664,452 M660,452 h10 l-2,8 h-6 Z" stroke="#6b4a2a" stroke-width="3" fill="#9aa"/>`;

  // Watering can with a ladybug
  s += `<ellipse cx="275" cy="456" rx="42" ry="6" fill="#2f6b24" opacity="0.35"/>
    <path d="M300,438 L334,410" stroke="#2f8a5a" stroke-width="7" stroke-linecap="round"/>
    <path d="M247,420 Q244,392 270,392 Q296,392 293,420" stroke="#2f8a5a" stroke-width="5" fill="none"/>
    <path d="M240,412 L304,412 L300,454 L244,454 Z" fill="url(#gardenCan)"/>
    <ellipse cx="272" cy="412" rx="32" ry="5" fill="#2f8a5a"/>
    <path d="M244,426 H300" stroke="#2f8a5a" stroke-width="2" opacity="0.6"/>`;
  if (!has("canRose")) {
    s += `<ellipse cx="340" cy="406" rx="6" ry="10" fill="#2f8a5a" transform="rotate(50,340,406)"/>
      <g fill="#7fc4ec">${[[348, 418], [354, 428], [344, 432], [358, 412]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2"/>`).join("")}</g>`;
  }
  if (!has("ladybug")) {
    s += `<ellipse cx="262" cy="436" rx="8" ry="6.5" fill="#e0302a"/><circle cx="270" cy="436" r="3.5" fill="#2b2b33"/>
      <line x1="262" y1="430" x2="262" y2="442" stroke="#2b2b33" stroke-width="1"/>
      <circle cx="259" cy="434" r="1.5" fill="#2b2b33"/><circle cx="265" cy="438" r="1.5" fill="#2b2b33"/><circle cx="258" cy="439" r="1.2" fill="#2b2b33"/>`;
  }

  // Flower beds
  s += `<path d="M30,500 Q200,478 380,500 L380,580 Q200,596 30,580 Z" fill="url(#gardenSoil)"/>
    <path d="M420,508 Q600,488 780,508 L780,584 Q600,598 420,584 Z" fill="url(#gardenSoil)"/>
    <path d="M30,500 Q200,478 380,500 M420,508 Q600,488 780,508" stroke="#c4beb2" stroke-width="5" fill="none"/>`;
  TULIPS.forEach(({ x, c }, k) => {
    const color = k === 2 && has("tulip") ? "#e0302a" : c;
    s += `<path d="M${x},${560} V${506}" stroke="#4f8a2b" stroke-width="3"/>
      <path d="M${x},${552} q-14,-16 -8,-30 q4,16 8,22 Z" fill="#5fa133"/>
      <path d="M${x - 9},${504} Q${x - 10},${488} ${x - 5},${484} L${x - 2},${492} L${x},${482} L${x + 2},${492} L${x + 5},${484} Q${x + 10},${488} ${x + 9},${504} Q${x},${512} ${x - 9},${504} Z" fill="${color}"/>`;
  });
  ROSES.forEach((x, k) => {
    s += `<g fill="#3f8a2e"><ellipse cx="${x - 10}" cy="532" rx="10" ry="6"/><ellipse cx="${x + 10}" cy="534" rx="10" ry="6"/><ellipse cx="${x}" cy="540" rx="12" ry="7"/></g>`;
    if (!(k === 2 && has("rose"))) {
      s += `<circle cx="${x}" cy="518" r="11" fill="#d1264a"/>
        <path d="M${x - 5},${518} a5,5 0 1,1 5,5 a3,3 0 1,1 -3,-3" stroke="#8a0f2a" stroke-width="1.5" fill="none"/>`;
    }
  });
  DAISIES.forEach(({ x, y }, k) => {
    if (k === 4 && has("daisy")) return;
    s += daisy(x, y);
  });
  return s;
}

function gardenDifferences(): Difference[] {
  const flower = SUNFLOWERS[1]!, d = DAISIES[4]!;
  return [
    { id: "cloud", x: 452, y: 108, r: 34 },
    { id: "bee", x: 180, y: 108, r: 18 },
    { id: "sunflower", x: flower.x, y: flower.y, r: 28 },
    { id: "butterfly", x: 520, y: 192, r: 24 },
    { id: "birdhouse", x: 300, y: 222, r: 32 },
    { id: "bird", x: 468, y: 380, r: 20 },
    { id: "gnomeHat", x: 630, y: 385, r: 24 },
    { id: "canRose", x: 346, y: 414, r: 18 },
    { id: "ladybug", x: 263, y: 436, r: 14 },
    { id: "tulip", x: TULIPS[2]!.x, y: 496, r: 16 },
    { id: "rose", x: ROSES[2]!, y: 518, r: 16 },
    { id: "daisy", x: d.x, y: d.y, r: 16 },
  ];
}

export const garden: Scene = { name: "Flower Garden", draw: drawGarden, differences: gardenDifferences() };
