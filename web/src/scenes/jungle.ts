// Scene: The Jungle
import { seeded } from "./helpers";
import type { Has, Difference, Scene } from "./types";

const LEAF_GREENS = ["#1f5a2a", "#2d7a35", "#164522", "#3c8f3f", "#24692f"];

// Pointed leaf with a midrib, from its stalk at (x, y) towards `angle` degrees
function leaf(x: number, y: number, len: number, angle: number, fill: string, w = 0.3): string {
  return `<g transform="translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${angle.toFixed(1)})">
    <path d="M0,0 Q${len * 0.45},${-len * w} ${len},0 Q${len * 0.45},${len * w} 0,0 Z" fill="${fill}"/>
    <path d="M0,0 Q${len * 0.5},${-len * 0.03} ${len * 0.96},0" stroke="#0b2a14" stroke-opacity="0.45" stroke-width="1.5" fill="none"/>
    <path d="M${len * 0.1},${-len * 0.02} Q${len * 0.4},${-len * w * 0.85} ${len * 0.8},${-len * 0.06}" stroke="#fff" stroke-opacity="0.18" stroke-width="2" fill="none"/>
  </g>`;
}

function hibiscus(x: number, y: number, r: number, color: string): string {
  let s = "";
  for (let a = 0; a < 360; a += 72) {
    s += `<ellipse cx="${x}" cy="${y - r * 0.55}" rx="${r * 0.5}" ry="${r * 0.6}" fill="${color}" stroke="#000" stroke-opacity="0.15" transform="rotate(${a},${x},${y})"/>`;
  }
  return s + `<circle cx="${x}" cy="${y}" r="${r * 0.28}" fill="#7a0f2a" opacity="0.7"/>
    <path d="M${x},${y} L${x + r * 0.7},${y - r * 0.8}" stroke="#ffe066" stroke-width="2"/><circle cx="${x + r * 0.7}" cy="${y - r * 0.8}" r="2.5" fill="#ffe066"/>`;
}

function butterfly(x: number, y: number, size: number, color: string, angle: number): string {
  const w = size;
  return `<g transform="translate(${x},${y}) rotate(${angle})">
    <path d="M0,0 C${-w * 0.9},${-w * 1.2} ${-w * 1.4},${-w * 0.2} ${-w * 0.2},${w * 0.1} Z M0,0 C${w * 0.9},${-w * 1.2} ${w * 1.4},${-w * 0.2} ${w * 0.2},${w * 0.1} Z" fill="${color}" stroke="#1a1a1a" stroke-width="1.2"/>
    <path d="M0,2 C${-w * 0.7},${w * 0.3} ${-w * 0.7},${w * 0.9} ${-w * 0.1},${w * 0.5} Z M0,2 C${w * 0.7},${w * 0.3} ${w * 0.7},${w * 0.9} ${w * 0.1},${w * 0.5} Z" fill="${color}" stroke="#1a1a1a" stroke-width="1.2"/>
    <circle cx="${-w * 0.55}" cy="${-w * 0.45}" r="${w * 0.12}" fill="#fff" opacity="0.8"/><circle cx="${w * 0.55}" cy="${-w * 0.45}" r="${w * 0.12}" fill="#fff" opacity="0.8"/>
    <ellipse cx="0" cy="${w * 0.1}" rx="1.6" ry="${w * 0.45}" fill="#1a1a1a"/>
    <path d="M0,${-w * 0.3} l-4,-7 M0,${-w * 0.3} l4,-7" stroke="#1a1a1a" stroke-width="1"/>
  </g>`;
}

function drawJungle(has: Has): string {
  const random = seeded(808);
  let s = `<defs>
    <linearGradient id="jungleSky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#d8efa2"/><stop offset="0.35" stop-color="#6fae55"/><stop offset="1" stop-color="#1b4a25"/>
    </linearGradient>
    <linearGradient id="jungleBeam" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fffbd0" stop-opacity="0.55"/><stop offset="1" stop-color="#fffbd0" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="jungleRock" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#8d9a88"/><stop offset="1" stop-color="#3b4a40"/>
    </linearGradient>
    <linearGradient id="jungleFall" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#9fd6ee"/><stop offset="0.5" stop-color="#f2fdff"/><stop offset="1" stop-color="#8ccbe6"/>
    </linearGradient>
    <linearGradient id="jungleWater" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#6cc4d8"/><stop offset="1" stop-color="#1f6f80"/>
    </linearGradient>
    <linearGradient id="jungleGround" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2f6b2a"/><stop offset="1" stop-color="#123516"/>
    </linearGradient>
    <linearGradient id="jungleCat" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f5bf55"/><stop offset="1" stop-color="#c47a1c"/>
    </linearGradient>
    <linearGradient id="jungleBark" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#8a5a34"/><stop offset="1" stop-color="#4a2c16"/>
    </linearGradient>
    <linearGradient id="jungleBeak" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffd23f"/><stop offset="1" stop-color="#f07a12"/>
    </linearGradient>
    <linearGradient id="jungleBeakPink" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ff9cc8"/><stop offset="1" stop-color="#c2186b"/>
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#jungleSky)"/>`;

  // Distant misty trunks and the canopy
  [[40, 34], [250, 26], [395, 22], [700, 36]].forEach(([x, w]) => {
    s += `<rect x="${x}" y="0" width="${w}" height="470" fill="#4f7d4f" opacity="0.45"/>`;
  });
  for (let k = 0; k < 40; k++) {
    const x = random() * 800, y = 170 + random() * 220, c = LEAF_GREENS[Math.floor(random() * 5)]!;
    s += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(30 + random() * 30).toFixed(0)}" fill="${c}" opacity="0.35"/>`;
  }
  for (let k = 0; k < 70; k++) {
    const x = random() * 820 - 10, y = random() * 70 - 10, c = LEAF_GREENS[Math.floor(random() * 5)]!;
    s += leaf(x, y, 40 + random() * 40, 30 + random() * 120, c);
  }
  [[120, 60], [330, 44], [600, 70], [740, 40]].forEach(([x, w]) => {
    s += `<path d="M${x! - w! / 2},0 L${x! + w! / 2},0 L${x! - 40 + w!},560 L${x! - 120},560 Z" fill="url(#jungleBeam)"/>`;
  });

  // Rock cliff with the waterfall
  s += `<path d="M425,470 L438,300 Q448,165 500,112 L580,106 Q632,150 642,300 L656,470 Z" fill="url(#jungleRock)"/>
    <path d="M440,250 q20,-14 40,-4 q-10,20 -38,18 Z M600,200 q20,-6 34,12 q-18,10 -34,-12 Z M612,360 q24,-8 36,10 q-20,10 -36,-10 Z" fill="#3f7d3a"/>
    <path d="M460,330 l24,-6 M620,280 l14,8 M450,410 l26,4" stroke="#2a332e" stroke-width="2" opacity="0.6"/>
    <path d="M505,112 L572,110 Q578,280 590,462 L490,462 Q500,280 505,112 Z" fill="url(#jungleFall)"/>
    <ellipse cx="538" cy="112" rx="38" ry="7" fill="#bfe8f5"/>
    ${leaf(500, 112, 50, -160, "#2d7a35")}${leaf(498, 116, 44, 160, "#3c8f3f")}${leaf(580, 108, 50, -20, "#24692f")}${leaf(582, 112, 40, 20, "#3c8f3f")}
    <g stroke="#fff" stroke-width="2" opacity="0.7">`;
  for (let k = 0; k < 14; k++) {
    const x = 506 + random() * 64, y = 130 + random() * 250;
    s += `<line x1="${x.toFixed(0)}" y1="${y.toFixed(0)}" x2="${(x + (x - 538) * 0.12).toFixed(0)}" y2="${(y + 40 + random() * 40).toFixed(0)}"/>`;
  }
  s += "</g>";

  // Ground, pool and mist
  s += `<path d="M0,440 Q200,425 400,450 Q600,438 800,445 L800,600 L0,600 Z" fill="url(#jungleGround)"/>
    <ellipse cx="540" cy="484" rx="162" ry="32" fill="url(#jungleWater)"/>
    <path d="M410,486 q30,-6 60,0 M560,500 q40,-8 80,0 M600,474 q20,-4 40,0" stroke="#fff" stroke-width="1.5" fill="none" opacity="0.5"/>
    <g fill="#fff" opacity="0.55">
      <circle cx="500" cy="462" r="16"/><circle cx="530" cy="458" r="20"/><circle cx="565" cy="462" r="17"/><circle cx="590" cy="468" r="12"/>
    </g>
    ${[[300, 462], [372, 456], [150, 470], [250, 468], [720, 462]].map(([x, y]) => [-150, -120, -90, -60, -30].map(a => leaf(x!, y!, 46, a, "#2f7d32", 0.22)).join("")).join("")}
    <path d="M630,488 q14,-14 30,-4 q-2,10 -30,4 Z" fill="#5a6a5e"/>`;
  if (!has("poolRock")) {
    s += `<path d="M430,498 Q434,476 452,476 Q470,478 472,498 Z" fill="url(#jungleRock)"/>
      <path d="M438,486 q10,-8 22,-4" stroke="#fff" stroke-width="2" opacity="0.35" fill="none"/>`;
  }
  if (has("rainbow")) {
    ["#ff5a5a", "#ffb030", "#ffe95a", "#5ed36a", "#4aa8ff"].forEach((c, k) => {
      s += `<path d="M${592 + k * 3},452 a${28 - k * 3},${28 - k * 3} 0 0,1 ${56 - k * 6},0" stroke="${c}" stroke-width="3" fill="none" opacity="0.75"/>`;
    });
  }

  // Hanging vines with small leaves
  [[70, 300, 20], [215, 240, 30], [330, 210, -10], [415, 170, 14], [660, 200, -24], [770, 280, 18]].forEach(([x, len, sway]) => {
    s += `<path d="M${x},0 Q${x! + sway!},${len! / 2} ${x! - sway! / 3},${len}" stroke="#3d5e22" stroke-width="4" fill="none"/>`;
    for (let t = 0.2; t < 0.95; t += 0.18) {
      const vy = len! * t, vx = x! + sway! * 2 * t * (1 - t) - (sway! / 3) * t * t;
      s += leaf(vx, vy, 14 + random() * 6, random() > 0.5 ? 30 : 150, "#4f9a3a", 0.35);
    }
  });

  // Parrot on a branch, top left
  const tail = has("parrotTail") ? "#2e6fd1" : "#d62828";
  s += `<path d="M0,212 Q120,198 262,182" stroke="url(#jungleBark)" stroke-width="13" fill="none" stroke-linecap="round"/>
    <path d="M200,190 q16,-22 40,-24" stroke="#5a3a20" stroke-width="5" fill="none"/>
    ${leaf(240, 166, 34, -30, "#3c8f3f")}${leaf(90, 205, 30, 120, "#2d7a35")}
    <path d="M140,186 L120,248 L132,250 L150,190 Z" fill="${tail}"/>
    <path d="M146,188 L136,254 L146,252 L154,190 Z" fill="${tail}" stroke="#000" stroke-opacity="0.15"/>
    <ellipse cx="150" cy="166" rx="15" ry="26" fill="#d62828" transform="rotate(15,150,166)"/>
    <path d="M140,156 Q132,180 142,196 Q154,186 156,162 Z" fill="#ffcc1a"/>
    <path d="M140,178 Q136,192 144,200 Q150,192 150,182 Z" fill="#2fa04a"/>
    <circle cx="157" cy="140" r="13" fill="#d62828"/>
    <ellipse cx="162" cy="141" rx="6" ry="5" fill="#fff"/><circle cx="162" cy="140" r="2" fill="#111"/>
    <path d="M167,135 Q181,137 176,152 Q172,147 166,147 Z" fill="#f2ead8"/><path d="M166,147 Q172,147 174,151 Q168,153 165,150 Z" fill="#222"/>
    <path d="M146,192 l-3,8 M154,192 l3,8" stroke="#3a3a3a" stroke-width="3"/>`;

  // Toucan on a branch, top right
  s += `<path d="M800,248 Q700,240 606,262" stroke="url(#jungleBark)" stroke-width="12" fill="none" stroke-linecap="round"/>
    ${leaf(612, 260, 30, 160, "#3c8f3f")}${leaf(760, 246, 28, 70, "#24692f")}
    <path d="M708,230 L720,272 L730,270 L716,228 Z" fill="#111"/>
    <ellipse cx="707" cy="208" rx="17" ry="29" fill="#151515" transform="rotate(-10,707,208)"/>
    <ellipse cx="695" cy="196" rx="10" ry="13" fill="#fff6c8"/><path d="M688,206 q7,6 14,0" stroke="#d62828" stroke-width="3" fill="none"/>
    <circle cx="700" cy="182" r="13" fill="#151515"/>
    <circle cx="694" cy="180" r="5" fill="#4ab0ff"/><circle cx="694" cy="180" r="2" fill="#111"/>
    <path d="M689,172 Q660,166 638,186 Q652,195 689,191 Z" fill="url(#${has("toucanBeak") ? "jungleBeakPink" : "jungleBeak"})"/>
    <path d="M638,186 Q643,180 650,177 L651,190 Q644,190 638,186 Z" fill="#151515"/>
    <path d="M689,174 Q665,170 650,178" stroke="#d62828" stroke-width="2" fill="none"/>
    <path d="M702,234 l-3,10 M712,234 l1,10" stroke="#4a6ad0" stroke-width="3"/>`;

  // Monkey hanging from a vine
  s += `<path d="M348,272 Q352,300 330,302 Q314,300 318,288 Q324,280 330,290" stroke="#6b3e1e" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M334,238 L330,204" stroke="#6b3e1e" stroke-width="8" stroke-linecap="round"/>
    <path d="M346,246 Q360,252 368,250" stroke="#6b3e1e" stroke-width="7" fill="none" stroke-linecap="round"/>
    <path d="M334,270 L328,292 M348,270 L356,292" stroke="#6b3e1e" stroke-width="8" stroke-linecap="round"/>
    <ellipse cx="341" cy="256" rx="16" ry="22" fill="#7a4622"/><ellipse cx="343" cy="260" rx="9" ry="13" fill="#c99a6a"/>
    <circle cx="324" cy="222" r="6" fill="#7a4622"/><circle cx="352" cy="222" r="6" fill="#7a4622"/>
    <circle cx="338" cy="224" r="14" fill="#7a4622"/><ellipse cx="338" cy="229" rx="10" ry="9" fill="#e0b98c"/>
    <circle cx="334" cy="224" r="2" fill="#111"/><circle cx="342" cy="224" r="2" fill="#111"/>
    <path d="M334,233 q4,3 8,0" stroke="#5a2e12" stroke-width="1.5" fill="none"/>`;
  if (!has("monkeyBanana")) {
    s += `<path d="M366,240 Q384,244 380,268 Q376,254 362,250 Z" fill="#ffd93a" stroke="#b08a10" stroke-width="1"/>
      <path d="M366,240 l-3,-4" stroke="#6b5010" stroke-width="2"/>`;
  }

  // Butterflies
  s += butterfly(395, 205, 11, "#ffcc1a", -15);
  s += butterfly(250, 322, 13, has("morphoColor") ? "#ff6fb0" : "#2f8fff", 12);
  if (!has("butterfly")) s += butterfly(402, 368, 12, "#ff8a1e", 20);

  // Jaguar resting on a fallen log
  s += `<path d="M0,406 L280,402 Q294,416 280,432 L0,436 Z" fill="url(#jungleBark)"/>
    <ellipse cx="282" cy="417" rx="9" ry="15" fill="#c49a6a"/><ellipse cx="282" cy="417" rx="4" ry="8" fill="#8a5a34"/>
    <path d="M30,416 h60 M120,424 h70 M200,412 h40" stroke="#3a2210" stroke-width="2" opacity="0.6"/>`;
  if (!has("jaguarTail")) {
    s += `<path d="M84,398 Q60,410 66,440 Q70,462 82,470" stroke="#d8962e" stroke-width="9" fill="none" stroke-linecap="round"/>
      <path d="M76,458 Q78,466 82,470" stroke="#2a1a0a" stroke-width="9" fill="none" stroke-linecap="round"/>
      <path d="M64,420 h6 M64,436 h6 M68,450 h6" stroke="#2a1a0a" stroke-width="3"/>`;
  }
  s += `<ellipse cx="155" cy="390" rx="74" ry="22" fill="url(#jungleCat)"/>
    <ellipse cx="160" cy="400" rx="56" ry="9" fill="#fbe2a8"/>
    <path d="M200,398 Q240,404 262,404" stroke="#e5a63c" stroke-width="11" stroke-linecap="round"/>
    <path d="M100,396 Q90,404 104,406" stroke="#e5a63c" stroke-width="12" stroke-linecap="round"/>
    <circle cx="223" cy="365" r="6" fill="#e5a63c"/><circle cx="248" cy="365" r="6" fill="#e5a63c"/>
    <circle cx="236" cy="380" r="20" fill="url(#jungleCat)"/>
    <ellipse cx="240" cy="390" rx="11" ry="8" fill="#fbe2a8"/><path d="M237,385 l6,0 l-3,4 Z" fill="#5a2e1e"/>
    <path d="M224,376 q4,3 8,0 M242,376 q4,3 8,0" stroke="#2a1a0a" stroke-width="2" fill="none"/>
    <g fill="none" stroke="#3a220e" stroke-width="2.5">`;
  for (let k = 0; k < 26; k++) {
    const x = 92 + (k % 13) * 10 + random() * 4, y = 380 + Math.floor(k / 13) * 12 + random() * 4;
    s += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(2.5 + random() * 1.5).toFixed(1)}"/>`;
  }
  s += "</g>";

  // Bushes with hibiscus flowers on the right
  for (let k = 0; k < 14; k++) {
    s += leaf(800, 300 + k * 10, 70 + random() * 40, 170 + random() * 60, LEAF_GREENS[k % 5]!, 0.28);
  }
  s += hibiscus(722, 352, 18, "#e8213a") + hibiscus(748, 396, 15, "#ff7aa8");
  if (!has("hibiscus")) s += hibiscus(770, 312, 16, "#e8213a");

  // Foreground leaves, mushrooms and the frog
  for (let k = 0; k < 10; k++) {
    s += leaf(0, 600, 100 + random() * 50, -76 + k * 7.5 + random() * 4, LEAF_GREENS[(k + 2) % 5]!, 0.25);
  }
  for (let k = 0; k < 8; k++) {
    s += leaf(800, 600, 110 + random() * 70, 190 + k * 9 + random() * 4, LEAF_GREENS[(k + 1) % 5]!, 0.25);
  }
  s += leaf(280, 586, 82, -24, has("leafColor") ? "#d9a62a" : "#3c8f3f", 0.32);
  s += hibiscus(205, 520, 15, "#ff9a1e");
  if (!has("mushrooms")) {
    s += `<path d="M414,574 v-14 M428,574 v-20" stroke="#f4ead6" stroke-width="5"/>
      <path d="M404,562 a10,8 0 0,1 20,0 Z" fill="#e2502a"/><path d="M416,556 a12,10 0 0,1 24,0 Z" fill="#e2502a"/>
      <circle cx="410" cy="558" r="1.5" fill="#fff"/><circle cx="424" cy="550" r="2" fill="#fff"/><circle cx="432" cy="552" r="1.5" fill="#fff"/>`;
  }
  s += leaf(760, 552, 110, 192, "#3c9a3a", 0.3);
  const frog = has("frogColor") ? "#2e8bff" : "#7ed321";
  s += `<g transform="translate(690,520)">
    <path d="M-14,8 q-8,4 -12,0 M14,8 q8,4 12,0" stroke="#ff8a1e" stroke-width="4" stroke-linecap="round"/>
    <ellipse cx="0" cy="0" rx="17" ry="11" fill="${frog}"/>
    <ellipse cx="0" cy="4" rx="10" ry="6" fill="#fff" opacity="0.35"/>
    <circle cx="-8" cy="-9" r="6" fill="${frog}"/><circle cx="8" cy="-9" r="6" fill="${frog}"/>
    <circle cx="-8" cy="-9" r="4" fill="#e81e2a"/><circle cx="8" cy="-9" r="4" fill="#e81e2a"/>
    <path d="M-8,-12 v6 M8,-12 v6" stroke="#111" stroke-width="1.6"/>
    <path d="M-6,1 q6,4 12,0" stroke="#1d4a10" stroke-width="1.2" fill="none"/>
  </g>`;
  return s;
}

function jungleDifferences(): Difference[] {
  return [
    { id: "parrotTail", x: 137, y: 222, r: 30 },
    { id: "toucanBeak", x: 662, y: 182, r: 26 },
    { id: "monkeyBanana", x: 372, y: 254, r: 18 },
    { id: "butterfly", x: 402, y: 366, r: 18 },
    { id: "morphoColor", x: 250, y: 318, r: 20 },
    { id: "jaguarTail", x: 72, y: 440, r: 30 },
    { id: "hibiscus", x: 770, y: 310, r: 20 },
    { id: "poolRock", x: 451, y: 488, r: 22 },
    { id: "rainbow", x: 620, y: 438, r: 30 },
    { id: "leafColor", x: 318, y: 570, r: 30 },
    { id: "mushrooms", x: 422, y: 562, r: 22 },
    { id: "frogColor", x: 690, y: 515, r: 24 },
  ];
}

export const jungle: Scene = { name: "The Jungle", draw: drawJungle, differences: jungleDifferences() };
