// Scene: The Farm
import { seeded } from "./helpers";
import type { Has, Difference, Scene } from "./types";

const MILL = { cx: 660, cy: 145, len: 78 };
const MISSING_BLADE = 30;
const SUNFLOWERS = Array.from({ length: 10 }, (_, k) => ({ x: 300 + k * 32, y: 318 + (k % 2) * 10 }));
const LOST_SUNFLOWER = 8;

function cloud(cx: number, cy: number, w: number): string {
  return `<g>
    <ellipse cx="${cx}" cy="${cy + 6}" rx="${w}" ry="${w * 0.28}" fill="#d6e6f5"/>
    <ellipse cx="${cx - w * 0.4}" cy="${cy}" rx="${w * 0.42}" ry="${w * 0.3}" fill="#fff"/>
    <ellipse cx="${cx + w * 0.1}" cy="${cy - w * 0.15}" rx="${w * 0.5}" ry="${w * 0.4}" fill="#fff"/>
    <ellipse cx="${cx + w * 0.55}" cy="${cy + 2}" rx="${w * 0.4}" ry="${w * 0.26}" fill="#fff"/>
  </g>`;
}

function sunflower(x: number, y: number): string {
  let s = `<path d="M${x},${y} Q${x - 4},${y + 40} ${x},${y + 72}" stroke="#4f8a2b" stroke-width="4" fill="none"/>
    <path d="M${x - 1},${y + 40} q-14,-8 -18,4 q12,4 18,-4 M${x},${y + 52} q14,-8 18,4 q-12,4 -18,-4" fill="#5fa133"/>`;
  for (let a = 0; a < 360; a += 30) {
    s += `<ellipse cx="${x}" cy="${y - 11}" rx="4.5" ry="8" fill="#ffc21a" transform="rotate(${a},${x},${y})"/>`;
  }
  return s + `<circle cx="${x}" cy="${y}" r="7" fill="#6b3a12"/><circle cx="${x - 2}" cy="${y - 2}" r="2.5" fill="#8f5420"/>`;
}

function chicken(x: number, y: number, flip: boolean): string {
  return `<g transform="translate(${x},${y}) scale(${flip ? -1 : 1},1)">
    <ellipse cx="0" cy="0" rx="14" ry="11" fill="#fffaf0" stroke="#d9cbb0"/>
    <path d="M-12,-4 L-22,-14 L-18,2 Z" fill="#fffaf0" stroke="#d9cbb0"/>
    <circle cx="11" cy="-11" r="7" fill="#fffaf0" stroke="#d9cbb0"/>
    <path d="M8,-18 q2,-6 4,-1 q2,-5 4,1 Z" fill="#e0302a"/>
    <path d="M17,-12 L23,-10 L17,-8 Z" fill="#f0a020"/><circle cx="13" cy="-12" r="1.3" fill="#111"/>
    <path d="M14,-7 q2,5 -1,6" fill="#e0302a"/>
    <path d="M-2,10 V18 M4,10 V18" stroke="#f0a020" stroke-width="2"/>
  </g>`;
}

function drawFarm(has: Has): string {
  const random = seeded(42);
  let s = `<defs>
    <linearGradient id="farmSky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#5aa9e6"/><stop offset="1" stop-color="#cdeafc"/>
    </linearGradient>
    <linearGradient id="farmHillFar" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#9fd27a"/><stop offset="1" stop-color="#6aa84f"/>
    </linearGradient>
    <linearGradient id="farmGrass" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#7cc456"/><stop offset="1" stop-color="#3f8a2e"/>
    </linearGradient>
    <linearGradient id="farmBarn" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#d63a2f"/><stop offset="1" stop-color="#9a1f1a"/>
    </linearGradient>
    <linearGradient id="farmStone" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fbf6ea"/><stop offset="1" stop-color="#cfc4ae"/>
    </linearGradient>
    <radialGradient id="farmHay" cx="40%" cy="40%" r="65%">
      <stop offset="0" stop-color="#f7dc7a"/><stop offset="1" stop-color="#c99a2e"/>
    </radialGradient>
    <radialGradient id="farmSun" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#fff6b0"/><stop offset="0.6" stop-color="#ffd23f"/><stop offset="1" stop-color="#ffd23f" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="farmGreen" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3fb34f"/><stop offset="1" stop-color="#1f7a30"/>
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#farmSky)"/>`;

  // Sun, clouds and birds
  s += '<circle cx="90" cy="80" r="70" fill="url(#farmSun)"/><circle cx="90" cy="80" r="32" fill="#ffd23f" stroke="#fff2a8" stroke-width="3"/>';
  s += cloud(290, 70, 60) + cloud(760, 45, 50);
  if (!has("cloud")) s += cloud(530, 95, 42);
  const birds: [number, number][] = [[380, 135], [408, 150], [440, 122]];
  birds.forEach(([x, y], k) => {
    if (k === 2 && has("bird")) return;
    s += `<path d="M${x - 9},${y - 4} q5,-5 9,2 q4,-7 9,-2" stroke="#2b3a4a" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  });

  // Far hills with the windmill
  s += `<path d="M0,300 Q200,230 420,280 Q600,220 800,270 L800,420 L0,420 Z" fill="url(#farmHillFar)"/>
    <path d="M636,262 L648,150 L672,150 L684,262 Z" fill="url(#farmStone)"/>
    <path d="M652,262 v-16 a8,8 0 0,1 16,0 v16 Z" fill="#7a4a24"/>
    <rect x="654" y="196" width="12" height="14" fill="#5aa9e6" stroke="#7a4a24" stroke-width="2"/>
    <path d="M642,154 L660,126 L678,154 Z" fill="#b8322a"/>`;
  [MISSING_BLADE, 120, 210, 300].forEach(a => {
    if (a === MISSING_BLADE && has("windmillBlade")) return;
    s += `<g transform="rotate(${a},${MILL.cx},${MILL.cy})">
      <line x1="${MILL.cx}" y1="${MILL.cy}" x2="${MILL.cx}" y2="${MILL.cy - MILL.len}" stroke="#6b4a2a" stroke-width="3"/>
      <rect x="${MILL.cx + 2}" y="${MILL.cy - MILL.len + 2}" width="14" height="${MILL.len - 14}" fill="#f6efe0" stroke="#6b4a2a" stroke-width="1.5"/>
      <path d="M${MILL.cx + 9},${MILL.cy - MILL.len + 2} V${MILL.cy - 12} M${MILL.cx + 2},${MILL.cy - 50} H${MILL.cx + 16} M${MILL.cx + 2},${MILL.cy - 30} H${MILL.cx + 16}" stroke="#6b4a2a" stroke-width="1"/>
    </g>`;
  });
  s += `<circle cx="${MILL.cx}" cy="${MILL.cy}" r="6" fill="#6b4a2a"/>`;

  // Near grass with tufts
  s += '<path d="M0,370 Q250,330 500,360 T800,350 L800,600 L0,600 Z" fill="url(#farmGrass)"/>';
  s += '<g stroke="#2f7524" stroke-width="2" stroke-linecap="round">';
  for (let k = 0; k < 40; k++) {
    const x = random() * 800, y = 400 + random() * 195;
    s += `<path d="M${x.toFixed(0)},${y.toFixed(0)} l-3,-7 M${x.toFixed(0)},${y.toFixed(0)} l3,-8"/>`;
  }
  s += "</g>";

  // Red barn
  s += `<path d="M60,392 L60,250 L90,205 L155,178 L220,205 L250,250 L250,392 Z" fill="url(#farmBarn)"/>
    <g stroke="#7a1712" stroke-width="1" opacity="0.5">
      ${[80, 100, 120, 140, 170, 190, 210, 230].map(x => `<line x1="${x}" y1="230" x2="${x}" y2="290"/>`).join("")}
    </g>
    <path d="M54,254 L88,201 L155,172 L222,201 L256,254" stroke="#3b3b44" stroke-width="10" fill="none" stroke-linejoin="round"/>
    <rect x="135" y="210" width="40" height="36" fill="#7a1712" stroke="#fff" stroke-width="4"/>
    <path d="M135,210 L175,246 M175,210 L135,246" stroke="#fff" stroke-width="3"/>
    <rect x="105" y="290" width="100" height="102" fill="#a8241d" stroke="#fff" stroke-width="5"/>
    <line x1="155" y1="290" x2="155" y2="392" stroke="#fff" stroke-width="4"/>
    <path d="M105,290 L155,392 M155,290 L105,392" stroke="#fff" stroke-width="4"/>`;
  if (!has("barnDoorX")) s += '<path d="M155,290 L205,392 M205,290 L155,392" stroke="#fff" stroke-width="4"/>';
  if (!has("weathervane")) {
    s += `<line x1="155" y1="172" x2="155" y2="142" stroke="#3b3b44" stroke-width="2"/>
      <path d="M143,152 H167 M162,148 L168,152 L162,156" stroke="#3b3b44" stroke-width="2" fill="none"/>
      <path d="M148,143 q2,-10 10,-8 l4,-4 l1,6 q4,4 -2,8 Z" fill="#3b3b44"/>`;
  }

  // Sunflower field with the scarecrow
  SUNFLOWERS.forEach(({ x, y }, k) => {
    if (k === LOST_SUNFLOWER && has("sunflower")) return;
    if (k !== 4 && k !== 5) s += sunflower(x, y);
  });
  s += `<line x1="444" y1="252" x2="444" y2="390" stroke="#7a4a24" stroke-width="5"/>
    <line x1="404" y1="284" x2="484" y2="284" stroke="#7a4a24" stroke-width="4"/>
    <path d="M426,270 L462,270 L470,330 L418,330 Z" fill="#3e6fb3"/>
    <path d="M426,270 L404,282 L408,292 L428,284 Z M462,270 L484,282 L480,292 L460,284 Z" fill="#c43d2e"/>
    <path d="M402,286 l-6,4 l6,2 M486,286 l6,4 l-6,2" stroke="#e6c35c" stroke-width="2" fill="none"/>
    <path d="M436,330 L432,350 M452,330 L456,350" stroke="#e6c35c" stroke-width="2"/>
    <circle cx="444" cy="254" r="15" fill="#d9b98a"/>
    <path d="M437,250 l4,4 m0,-4 l-4,4 M447,250 l4,4 m0,-4 l-4,4" stroke="#5a3b24" stroke-width="1.5"/>
    <path d="M437,262 q7,5 14,0" stroke="#5a3b24" stroke-width="1.5" fill="none"/>`;
  const hat = has("scarecrowHat") ? "#5b6fb8" : "#e6c35c";
  s += `<ellipse cx="444" cy="242" rx="26" ry="6" fill="${hat}"/>
    <path d="M430,242 Q432,220 444,220 Q456,220 458,242 Z" fill="${hat}"/>
    <rect x="431" y="235" width="26" height="4" fill="#c43d2e"/>`;

  // Fence
  s += '<g fill="#f3ead8" stroke="#a8977a" stroke-width="1">';
  for (let x = 280; x <= 800; x += 40) s += `<path d="M${x - 5},432 V378 L${x},372 L${x + 5},378 V432 Z"/>`;
  s += '<rect x="275" y="386" width="530" height="7"/><rect x="275" y="410" width="530" height="7"/></g>';

  // Hay bales
  const bale = (x: number, y: number, r: number): string => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#farmHay)" stroke="#a8791e" stroke-width="2"/>
    <circle cx="${x}" cy="${y}" r="${r * 0.6}" fill="none" stroke="#a8791e" stroke-width="1.5"/><circle cx="${x}" cy="${y}" r="${r * 0.25}" fill="none" stroke="#a8791e" stroke-width="1.5"/>`;
  s += bale(310, 452, 26) + bale(364, 456, 26);
  if (!has("hayBale")) s += bale(338, 412, 24);

  // Cow
  s += `<ellipse cx="540" cy="520" rx="58" ry="7" fill="#2f6b24" opacity="0.4"/>
    <path d="M505,490 V518 M520,494 V520 M560,494 V520 M575,490 V518" stroke="#f6f2ea" stroke-width="8" stroke-linecap="round"/>
    <path d="M505,512 V518 M520,514 V520 M560,514 V520 M575,512 V518" stroke="#3b3b44" stroke-width="8"/>
    <ellipse cx="540" cy="470" rx="55" ry="29" fill="#f6f2ea" stroke="#cfc8bb"/>
    <path d="M486,462 q-12,8 -8,26" stroke="#cfc8bb" stroke-width="3" fill="none"/>
    <path d="M512,452 q12,-6 18,6 q-2,14 -16,10 q-10,-6 -2,-16 Z M518,478 q14,-4 16,8 q-8,10 -18,2 Z" fill="#2b2b33"/>
    <ellipse cx="548" cy="497" rx="10" ry="6" fill="#f2a7b4"/>`;
  if (!has("cowSpot")) s += '<path d="M552,448 q14,-4 18,8 q2,12 -14,12 q-12,-4 -4,-20 Z" fill="#2b2b33"/>';
  s += `<path d="M590,444 L612,438 L622,470 L600,476 Z" fill="#f6f2ea" stroke="#cfc8bb"/>
    <ellipse cx="612" cy="474" rx="13" ry="9" fill="#f2b8c0"/><circle cx="607" cy="474" r="1.6" fill="#7a3a44"/><circle cx="616" cy="473" r="1.6" fill="#7a3a44"/>
    <circle cx="603" cy="452" r="2.2" fill="#111"/>
    <path d="M592,442 q-8,-10 -2,-14 M612,438 q6,-12 0,-16" stroke="#e8dcc4" stroke-width="4" fill="none" stroke-linecap="round"/>
    <ellipse cx="588" cy="448" rx="9" ry="4" fill="#f6f2ea" stroke="#cfc8bb" transform="rotate(-20,588,448)"/>
    <path d="M594,478 L598,490" stroke="#8a5a2a" stroke-width="2"/><circle cx="598" cy="493" r="5" fill="#e2b54a"/>`;

  // Pig with a mud puddle
  if (!has("pigPuddle")) s += '<ellipse cx="690" cy="566" rx="54" ry="13" fill="#7a5232"/><ellipse cx="680" cy="563" rx="22" ry="4" fill="#9a6e48"/>';
  s += `<path d="M680,540 V560 M694,542 V562 M714,540 V560 M726,538 V556" stroke="#e98fa4" stroke-width="7" stroke-linecap="round"/>
    <ellipse cx="702" cy="528" rx="38" ry="24" fill="#f6b2c2" stroke="#d98398"/>
    <path d="M664,522 q-10,-4 -8,-12 q4,-6 8,0 q2,6 -6,6" stroke="#d98398" stroke-width="2" fill="none"/>
    <circle cx="740" cy="518" r="16" fill="#f6b2c2" stroke="#d98398"/>
    <path d="M730,504 L734,494 L740,504 Z M744,504 L750,494 L752,506 Z" fill="#e98fa4"/>
    <ellipse cx="753" cy="522" rx="7" ry="6" fill="#e98fa4"/><circle cx="751" cy="521" r="1.3" fill="#7a3a44"/><circle cx="755" cy="521" r="1.3" fill="#7a3a44"/>
    <circle cx="741" cy="512" r="1.8" fill="#111"/>`;

  // Chickens
  s += chicken(262, 520, false) + chicken(290, 566, true);
  if (!has("chicken")) s += chicken(345, 540, false);

  // Tractor
  s += `<ellipse cx="125" cy="576" rx="90" ry="8" fill="#2f6b24" opacity="0.4"/>
    <path d="M80,530 L80,490 L118,490 L124,530 Z" fill="url(#farmGreen)"/>
    <rect x="86" y="470" width="34" height="24" fill="#bfe6ff" stroke="#1f7a30" stroke-width="5"/>
    <path d="M78,470 H126" stroke="#1f7a30" stroke-width="6" stroke-linecap="round"/>
    <path d="M118,512 L196,512 L200,548 L118,548 Z" fill="url(#farmGreen)"/>
    <path d="M128,520 H190 M128,530 H190" stroke="#156024" stroke-width="2"/>
    <rect x="176" y="490" width="6" height="24" fill="#3b3b44"/>
    <circle cx="82" cy="546" r="32" fill="#2b2b33"/><circle cx="82" cy="546" r="18" fill="#ffc21a"/><circle cx="82" cy="546" r="6" fill="#2b2b33"/>
    <circle cx="178" cy="556" r="20" fill="#2b2b33"/>
    <circle cx="178" cy="556" r="11" fill="${has("tractorWheel") ? "#e0302a" : "#ffc21a"}"/><circle cx="178" cy="556" r="4" fill="#2b2b33"/>`;
  return s;
}

function farmDifferences(): Difference[] {
  const [bx, by] = [MILL.cx + 46 * Math.sin(MISSING_BLADE * Math.PI / 180) + 8, MILL.cy - 46 * Math.cos(MISSING_BLADE * Math.PI / 180) + 4];
  const flower = SUNFLOWERS[LOST_SUNFLOWER]!;
  return [
    { id: "cloud", x: 534, y: 90, r: 34 },
    { id: "bird", x: 440, y: 120, r: 16 },
    { id: "windmillBlade", x: Math.round(bx), y: Math.round(by), r: 34 },
    { id: "weathervane", x: 156, y: 150, r: 18 },
    { id: "barnDoorX", x: 180, y: 341, r: 30 },
    { id: "scarecrowHat", x: 444, y: 234, r: 24 },
    { id: "sunflower", x: flower.x, y: flower.y, r: 22 },
    { id: "hayBale", x: 338, y: 412, r: 26 },
    { id: "cowSpot", x: 561, y: 457, r: 16 },
    { id: "pigPuddle", x: 688, y: 566, r: 30 },
    { id: "chicken", x: 347, y: 538, r: 22 },
    { id: "tractorWheel", x: 178, y: 556, r: 20 },
  ];
}

export const farm: Scene = { name: "The Farm", draw: drawFarm, differences: farmDifferences() };
