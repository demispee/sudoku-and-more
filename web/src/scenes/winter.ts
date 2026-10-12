// Scene: Winter Village
import { seeded, sparkle, SHARED_DEFS } from "./helpers";
import type { Has, Difference, Scene } from "./types";

const POND = { cx: 570, cy: 508, rx: 118, ry: 40 };

// Snowy pine tree with three tiers; (x, base) is the foot of the trunk
function pine(x: number, base: number, h: number): string {
  let s = `<rect x="${x - 4}" y="${base - 14}" width="8" height="16" fill="#4a3020"/>`;
  for (let k = 0; k < 3; k++) {
    const b = base - 10 - (2 - k) * h * 0.25, t = base - h + k * h * 0.2, w = h * (0.22 + 0.1 * k);
    const m = t + (b - t) * 0.42;
    s += `<path d="M${x},${t} L${x + w},${b} Q${x},${b + 6} ${x - w},${b} Z" fill="url(#winterPine)"/>
      <path d="M${x},${t} L${x + w * 0.42},${m} Q${x + w * 0.2},${m - 5} ${x},${m + 2} Q${x - w * 0.2},${m - 5} ${x - w * 0.42},${m} Z" fill="#f4f8ff"/>
      <path d="M${x - w},${b} Q${x},${b + 6} ${x + w},${b}" stroke="#eef4ff" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  }
  return s;
}

function smoke(x: number, y: number): string {
  return `<g fill="#c9d3ea" opacity="0.55">
    <circle cx="${x}" cy="${y}" r="7"/><circle cx="${x + 6}" cy="${y - 14}" r="9"/>
    <circle cx="${x + 14}" cy="${y - 31}" r="11"/><circle cx="${x + 24}" cy="${y - 50}" r="12" opacity="0.7"/>
  </g>`;
}

function glowWindow(x: number, y: number, w: number, h: number, lit: boolean): string {
  return `<rect x="${x - 2}" y="${y - 2}" width="${w + 4}" height="${h + 4}" fill="#5b3a26"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${lit ? "url(#winterLight)" : "#26304d"}" ${lit ? 'filter="url(#winterGlow)"' : ""}/>
    <path d="M${x + w / 2},${y} V${y + h} M${x},${y + h / 2} H${x + w}" stroke="#5b3a26" stroke-width="2"/>
    <rect x="${x - 4}" y="${y + h}" width="${w + 8}" height="5" rx="2" fill="#f4f8ff"/>`;
}

function drawWinter(has: Has): string {
  const random = seeded(71);
  let s = `<defs>${SHARED_DEFS}
    <linearGradient id="winterSky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0d1338"/><stop offset="0.6" stop-color="#2d2f6e"/><stop offset="1" stop-color="#6a5a9c"/>
    </linearGradient>
    <linearGradient id="winterSnow" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#e9efff"/><stop offset="1" stop-color="#b9c6e8"/>
    </linearGradient>
    <linearGradient id="winterIce" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#d6f0ff"/><stop offset="0.5" stop-color="#8fc3e6"/><stop offset="1" stop-color="#5c8fc4"/>
    </linearGradient>
    <linearGradient id="winterPine" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#1f5a3e"/><stop offset="1" stop-color="#0d3324"/>
    </linearGradient>
    <linearGradient id="winterWall" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#b5653c"/><stop offset="1" stop-color="#7c3f22"/>
    </linearGradient>
    <linearGradient id="winterStone" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#c9c3d6"/><stop offset="1" stop-color="#8b84a2"/>
    </linearGradient>
    <radialGradient id="winterLight" cx="50%" cy="50%" r="70%">
      <stop offset="0" stop-color="#fff4c2"/><stop offset="1" stop-color="#f5a623"/>
    </radialGradient>
    <radialGradient id="winterMoon" cx="40%" cy="40%" r="70%">
      <stop offset="0" stop-color="#fffdf0"/><stop offset="1" stop-color="#e8dcae"/>
    </radialGradient>
    <radialGradient id="winterHalo" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#ffd27a" stop-opacity="0.7"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/>
    </radialGradient>
    <filter id="winterGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect width="800" height="600" fill="url(#winterSky)"/>`;

  // Stars and the moon
  for (let k = 0; k < 80; k++) {
    s += `<circle cx="${(random() * 800).toFixed(0)}" cy="${(random() * 290).toFixed(0)}" r="${(0.5 + random() * 1.2).toFixed(1)}" fill="#fff" opacity="${(0.35 + random() * 0.6).toFixed(2)}"/>`;
  }
  s += sparkle(120, 70, 9) + sparkle(300, 40, 7);
  if (!has("brightStar")) s += sparkle(540, 62, 12);
  s += `<circle cx="690" cy="88" r="70" fill="#fffbe6" opacity="0.08"/>
    <circle cx="690" cy="88" r="38" fill="url(#winterMoon)" filter="url(#glow)"/>
    <circle cx="678" cy="78" r="7" fill="#d9cc9a" opacity="0.4"/><circle cx="702" cy="100" r="5" fill="#d9cc9a" opacity="0.4"/>`;

  // Distant hills and the snowy ground
  s += `<path d="M0,330 Q150,280 320,322 Q500,270 650,312 Q740,292 800,305 L800,420 L0,420 Z" fill="#8e9cd0" opacity="0.8"/>
    <path d="M0,382 Q200,352 400,376 T800,372 L800,600 L0,600 Z" fill="url(#winterSnow)"/>`;

  // Church with a spire
  s += `<path d="M366,290 L420,248 L474,290 Z" fill="#f4f8ff"/>
    <rect x="372" y="288" width="96" height="88" fill="url(#winterStone)"/>
    <rect x="404" y="200" width="32" height="176" fill="url(#winterStone)"/>
    <path d="M398,204 L420,128 L442,204 Z" fill="#3d3a63"/>
    <path d="M398,204 L420,128 L414,204 Z" fill="#f4f8ff" opacity="0.8"/>
    <path d="M412,236 a8,8 0 0,1 16,0 v20 h-16 Z" fill="url(#winterLight)" filter="url(#winterGlow)"/>
    <path d="M384,318 a7,7 0 0,1 14,0 v22 h-14 Z M442,318 a7,7 0 0,1 14,0 v22 h-14 Z" fill="url(#winterLight)" filter="url(#winterGlow)"/>
    <path d="M410,376 v-20 a10,10 0 0,1 20,0 v20 Z" fill="#5b3a26"/>`;
  if (!has("spireCross")) {
    s += '<path d="M420,129 V106 M412,114 H428" stroke="#e2b54a" stroke-width="3" stroke-linecap="round"/>';
  }

  // Pine trees behind the houses
  s += pine(30, 384, 96) + pine(250, 380, 104) + pine(760, 382, 124);
  if (!has("smallPine")) s += pine(520, 382, 72);

  // Left cottage
  s += `<rect x="70" y="300" width="140" height="92" fill="url(#winterWall)"/>
    <rect x="168" y="246" width="18" height="40" fill="#6b4a3a"/><rect x="165" y="240" width="24" height="8" rx="3" fill="#f4f8ff"/>
    <path d="M55,305 L140,240 L225,305 Z" fill="#4a2e44"/>
    <path d="M50,308 L140,236 L230,308 Q215,300 200,306 Q180,296 160,302 Q140,292 120,302 Q100,296 80,304 Q65,300 50,308 Z" fill="#f4f8ff"/>
    ${glowWindow(88, 320, 30, 26, true)}${glowWindow(162, 320, 30, 26, true)}
    <rect x="128" y="338" width="24" height="54" rx="2" fill="#5b3a26"/><circle cx="147" cy="367" r="2" fill="#e2b54a"/>`;
  if (!has("chimneySmoke")) s += smoke(178, 230);
  if (!has("doorWreath")) {
    s += `<circle cx="140" cy="352" r="7" fill="none" stroke="#1f6b3a" stroke-width="4"/>
      <path d="M136,359 L140,355 L144,359" stroke="#d1263b" stroke-width="3" fill="none"/>`;
  }

  // Right cottage
  s += `<rect x="572" y="310" width="128" height="80" fill="url(#winterWall)"/>
    <rect x="590" y="262" width="16" height="34" fill="#6b4a3a"/><rect x="587" y="256" width="22" height="8" rx="3" fill="#f4f8ff"/>
    <path d="M555,315 L636,255 L717,315 Z" fill="#2f3f66"/>
    <path d="M550,318 L636,251 L722,318 Q705,310 690,316 Q670,306 650,312 Q630,304 610,312 Q590,306 572,314 Q560,312 550,318 Z" fill="#f4f8ff"/>
    ${glowWindow(588, 330, 28, 24, true)}${glowWindow(652, 330, 28, 24, !has("windowLight"))}
    <rect x="625" y="344" width="22" height="46" rx="2" fill="#3b2a20"/>`;
  s += smoke(598, 246);

  // Frozen pond with a skater
  s += `<ellipse cx="${POND.cx}" cy="${POND.cy + 4}" rx="${POND.rx + 6}" ry="${POND.ry + 5}" fill="#f4f8ff"/>
    <ellipse cx="${POND.cx}" cy="${POND.cy}" rx="${POND.rx}" ry="${POND.ry}" fill="url(#winterIce)"/>
    <path d="M480,505 q40,-14 80,0 t80,-2 M500,522 q30,8 70,2" stroke="#fff" stroke-width="1.5" fill="none" opacity="0.6"/>
    <ellipse cx="582" cy="503" rx="16" ry="3" fill="#2b3a66" opacity="0.25"/>
    <path d="M577,478 L572,500 M587,478 L596,497" stroke="#2b2b4a" stroke-width="5" stroke-linecap="round"/>
    <path d="M564,501 H580 M590,499 L604,495" stroke="#c9d3ea" stroke-width="2" stroke-linecap="round"/>
    <path d="M572,452 L592,452 L596,482 L568,482 Z" fill="#6a3c9c"/>
    <path d="M573,458 L556,470 M591,458 L606,446" stroke="#6a3c9c" stroke-width="5" stroke-linecap="round"/>
    <circle cx="582" cy="442" r="8" fill="#f5d0b0"/>
    <path d="M574,440 a8,8 0 0,1 16,0 Z" fill="#d1263b"/><circle cx="582" cy="431" r="3" fill="#fff"/>`;
  const scarf = has("skaterScarf") ? "#2f9a5a" : "#d1263b";
  s += `<rect x="572" y="449" width="20" height="6" rx="3" fill="${scarf}"/>
    <path d="M590,452 Q600,454 608,462 L604,466 Q597,459 588,457 Z" fill="${scarf}"/>`;

  // Snowman
  s += `<g transform="translate(0,30)">
    <ellipse cx="152" cy="522" rx="38" ry="7" fill="#9aa8d4" opacity="0.5"/>
    <circle cx="150" cy="492" r="32" fill="url(#winterSnow)"/>
    <circle cx="150" cy="447" r="23" fill="url(#winterSnow)"/>
    <circle cx="150" cy="413" r="16" fill="url(#winterSnow)"/>
    <circle cx="150" cy="440" r="2.5" fill="#222"/><circle cx="150" cy="452" r="2.5" fill="#222"/><circle cx="150" cy="484" r="3" fill="#222"/>
    <circle cx="144" cy="409" r="2" fill="#222"/><circle cx="156" cy="409" r="2" fill="#222"/>
    <path d="M150,414 L168,418 L150,419 Z" fill="#f08a24"/>
    <path d="M134,428 Q150,434 166,428 L166,434 Q150,440 134,434 Z" fill="#2e6fd1"/><rect x="156" y="432" width="7" height="18" rx="2" fill="#2e6fd1"/>
    <path d="M128,445 L100,428 M108,433 L102,422" stroke="#5a3b24" stroke-width="3" stroke-linecap="round"/>`;
  if (!has("snowmanArm")) {
    s += '<path d="M172,445 L204,424 M196,429 L204,418" stroke="#5a3b24" stroke-width="3" stroke-linecap="round"/>';
  }
  if (!has("snowmanHat")) {
    s += '<rect x="134" y="396" width="32" height="5" rx="2" fill="#1d1d2a"/><rect x="140" y="378" width="20" height="19" fill="#1d1d2a"/><rect x="140" y="390" width="20" height="4" fill="#d1263b"/>';
  }
  s += "</g>";

  // Lantern on a post
  const lit = !has("lanternLit");
  s += `<line x1="310" y1="480" x2="310" y2="414" stroke="#2a2a3a" stroke-width="5"/>
    <ellipse cx="310" cy="482" rx="14" ry="4" fill="#9aa8d4" opacity="0.6"/>
    ${lit ? '<circle cx="310" cy="402" r="34" fill="url(#winterHalo)"/>' : ""}
    <path d="M300,392 L320,392 L318,414 L302,414 Z" fill="${lit ? "url(#winterLight)" : "#3a405c"}" stroke="#2a2a3a" stroke-width="2"/>
    <path d="M297,392 L310,382 L323,392 Z" fill="#2a2a3a"/><circle cx="310" cy="380" r="3" fill="#2a2a3a"/>`;

  // Sled
  const sled = has("sledColor") ? "#2e6fd1" : "#c8283a";
  s += `<path d="M312,556 H366 Q378,556 376,544" stroke="#4a4a5a" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M318,548 V556 M360,548 V556" stroke="#4a4a5a" stroke-width="3"/>
    <rect x="312" y="538" width="56" height="10" rx="3" fill="${sled}"/>
    <path d="M326,538 V548 M340,538 V548 M354,538 V548" stroke="#000" stroke-opacity="0.25" stroke-width="1.5"/>
    <path d="M368,543 Q384,536 392,526" stroke="#7a4a24" stroke-width="2" fill="none"/>`;

  // Fence with a robin
  s += '<g fill="#7a5034">';
  [690, 720, 750, 780].forEach(x => { s += `<rect x="${x - 4}" y="522" width="8" height="50"/><rect x="${x - 5}" y="519" width="10" height="5" rx="2" fill="#f4f8ff"/>`; });
  s += '<rect x="680" y="532" width="120" height="6"/><rect x="680" y="552" width="120" height="6"/></g>';
  if (!has("robin")) {
    s += `<ellipse cx="750" cy="510" rx="10" ry="8" fill="#6b4a3a"/><circle cx="757" cy="503" r="5.5" fill="#6b4a3a"/>
      <ellipse cx="753" cy="512" rx="5.5" ry="5" fill="#e0582a"/><path d="M762,503 L767,505 L762,506 Z" fill="#e2b54a"/>
      <circle cx="758" cy="502" r="1.2" fill="#111"/><path d="M741,508 L734,503 L736,512 Z" fill="#6b4a3a"/>`;
  }

  // Falling snow
  s += '<g fill="#fff">';
  for (let k = 0; k < 110; k++) {
    s += `<circle cx="${(random() * 800).toFixed(0)}" cy="${(random() * 600).toFixed(0)}" r="${(1 + random() * 2).toFixed(1)}" opacity="${(0.5 + random() * 0.5).toFixed(2)}"/>`;
  }
  s += "</g>";
  return s;
}

function winterDifferences(): Difference[] {
  return [
    { id: "brightStar", x: 540, y: 62, r: 16 },
    { id: "spireCross", x: 420, y: 116, r: 15 },
    { id: "chimneySmoke", x: 192, y: 205, r: 30 },
    { id: "doorWreath", x: 140, y: 353, r: 14 },
    { id: "windowLight", x: 666, y: 342, r: 18 },
    { id: "smallPine", x: 520, y: 348, r: 36 },
    { id: "snowmanHat", x: 150, y: 418, r: 16 },
    { id: "snowmanArm", x: 190, y: 463, r: 20 },
    { id: "lanternLit", x: 310, y: 402, r: 20 },
    { id: "sledColor", x: 345, y: 545, r: 34 },
    { id: "skaterScarf", x: 590, y: 456, r: 18 },
    { id: "robin", x: 750, y: 508, r: 18 },
  ];
}

export const winter: Scene = { name: "Winter Village", draw: drawWinter, differences: winterDifferences() };
