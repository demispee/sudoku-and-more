// Scene: The Fruit Market
import { quadPoint, seeded } from "./helpers";
import type { Has, Difference, Scene, Point } from "./types";

const FLAG_COLORS = ["#e83a3a", "#f4c020", "#2e7bd1", "#3fa04a"];
const LOST_FLAG = 10;
const WINDOWS = [70, 230, 570, 730];

function apple(x: number, y: number, fill = "url(#marketApple)"): string {
  return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="10" fill="${fill}"/><path d="M${x.toFixed(1)},${(y - 9).toFixed(1)} l1,-5" stroke="#5a3418" stroke-width="1.8"/>
    <ellipse cx="${(x - 4).toFixed(1)}" cy="${(y - 4).toFixed(1)}" rx="2.5" ry="1.6" fill="#fff" opacity="0.6"/>`;
}
function orange(x: number, y: number): string {
  return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="10" fill="url(#marketOrange)"/><circle cx="${(x + 1).toFixed(1)}" cy="${(y - 7).toFixed(1)}" r="1.4" fill="#7a5a10"/>`;
}
function pear(x: number, y: number): string {
  return `<path d="M${x.toFixed(1)},${(y - 14).toFixed(1)} q5,0 5,7 q0,3 4,8 q2,8 -9,9 q-11,-1 -9,-9 q4,-5 4,-8 q0,-7 5,-7 Z" fill="url(#marketPear)"/>
    <path d="M${x.toFixed(1)},${(y - 14).toFixed(1)} l2,-5" stroke="#5a3418" stroke-width="1.8"/>`;
}
function strawberry(x: number, y: number): string {
  return `<path d="M${(x - 7).toFixed(1)},${(y - 4).toFixed(1)} q7,-4 14,0 q0,8 -7,13 q-7,-5 -7,-13 Z" fill="#e0242e"/>
    <path d="M${(x - 6).toFixed(1)},${(y - 4).toFixed(1)} l3,-3 l3,2 l3,-2 l3,3 Z" fill="#3f9a3a"/>
    <circle cx="${(x - 2).toFixed(1)}" cy="${(y + 1).toFixed(1)}" r="0.9" fill="#ffe08a"/><circle cx="${(x + 2).toFixed(1)}" cy="${(y + 3).toFixed(1)}" r="0.9" fill="#ffe08a"/>`;
}
function bananas(x: number, y: number, fill: string): string {
  let s = "";
  for (let k = -2; k <= 2; k++) s += `<path d="M${x - 4},${y - 10} Q${x + k * 7 - 6},${y + 2} ${x + k * 6 + 10},${y + 12} Q${x + k * 7 - 2},${y - 2} ${x + 2},${y - 12} Z" fill="${fill}" stroke="#8a6a10" stroke-width="0.8"/>`;
  return s + `<rect x="${x - 4}" y="${y - 16}" width="6" height="6" rx="1" fill="#5a4a18"/>`;
}
function grapes(x: number, y: number, fill: string): string {
  let s = `<path d="M${x},${y - 12} q4,-6 8,-4" stroke="#5a4a18" stroke-width="2" fill="none"/>`;
  [[0, -8], [-6, -8], [6, -8], [-9, -2], [-3, -2], [3, -2], [9, -2], [-6, 4], [0, 4], [6, 4], [-3, 10], [3, 10], [0, 15]].forEach(([dx, dy]) => {
    s += `<circle cx="${x + dx!}" cy="${y + dy!}" r="4.6" fill="${fill}"/><circle cx="${x + dx! - 1.5}" cy="${y + dy! - 1.5}" r="1.2" fill="#fff" opacity="0.5"/>`;
  });
  return s;
}
function watermelon(x: number, y: number): string {
  return `<ellipse cx="${x}" cy="${y}" rx="28" ry="19" fill="#2f7a2a"/>
    <path d="M${x - 24},${y - 8} Q${x},${y - 16} ${x + 24},${y - 8} M${x - 27},${y} Q${x},${y - 6} ${x + 27},${y} M${x - 24},${y + 9} Q${x},${y + 6} ${x + 24},${y + 9}" stroke="#a8d870" stroke-width="3" fill="none"/>
    <ellipse cx="${x - 9}" cy="${y - 8}" rx="9" ry="4" fill="#fff" opacity="0.25"/>`;
}

// A crate on the counter; fruit is drawn between the back rim and the front slats
function crate(x0: number, fruit: string, tag: string): string {
  return `<rect x="${x0}" y="292" width="90" height="12" fill="#a8743e"/>${fruit}
    <rect x="${x0}" y="304" width="90" height="42" fill="url(#marketWood)"/><path d="M${x0},318 h90 M${x0},332 h90" stroke="#7a4a20" stroke-width="1.5"/>
    <rect x="${x0 + 27}" y="314" width="36" height="22" rx="3" fill="#2a2a2a" stroke="#c8a060" stroke-width="2"/>
    <text x="${x0 + 45}" y="330" font-size="14" font-weight="bold" font-family="Georgia, serif" text-anchor="middle" fill="#fff">${tag}</text>`;
}

function pile(x0: number, random: () => number, draw: (x: number, y: number) => string, skip = -1): string {
  const spots: Point[] = [];
  [[5, 298], [4, 283], [3, 268]].forEach(([n, y]) => {
    for (let k = 0; k < n!; k++) spots.push([x0 + 45 + (k - (n! - 1) / 2) * 17 + (random() - 0.5) * 3, y! + (random() - 0.5) * 3]);
  });
  return spots.map((p, k) => (k === skip ? "" : draw(p[0], p[1]))).join("");
}

function awning(x0: number, x1: number, stripes: string): string {
  let v = `M${x0 - 10},202`;
  for (let x = x0 - 10; x < x1 + 10; x += 30) v += ` a15,18 0 0,0 30,0`;
  return `<path d="M${x0},154 H${x1} L${x1 + 10},202 H${x0 - 10} Z" fill="url(#${stripes})"/>
    <path d="${v} Z" fill="url(#${stripes})"/><path d="M${x0 - 10},202 H${x1 + 20}" stroke="#000" stroke-opacity="0.2" stroke-width="2"/>
    <rect x="${x0 - 4}" y="148" width="${x1 - x0 + 8}" height="8" rx="3" fill="#6a4a2a"/>`;
}

function drawMarket(has: Has): string {
  const random = seeded(5150);
  let s = `<defs>
    <pattern id="marketBrick" width="40" height="20" patternUnits="userSpaceOnUse">
      <rect width="40" height="20" fill="#d8a878"/><path d="M0,0 H40 M0,10 H40 M20,0 V10 M0,10 V20 M40,10 V20" stroke="#b88858" stroke-width="1.5"/>
    </pattern>
    <pattern id="marketStripeRed" width="30" height="30" patternUnits="userSpaceOnUse"><rect width="30" height="30" fill="#fff8ee"/><rect width="15" height="30" fill="#d8283a"/></pattern>
    <pattern id="marketStripeGreen" width="30" height="30" patternUnits="userSpaceOnUse"><rect width="30" height="30" fill="#fff8ee"/><rect width="15" height="30" fill="#2f8a4a"/></pattern>
    <pattern id="marketCobble" width="40" height="24" patternUnits="userSpaceOnUse">
      <rect width="40" height="24" fill="#8a8478"/><rect x="2" y="2" width="16" height="9" rx="4" fill="#a8a294"/><rect x="22" y="2" width="16" height="9" rx="4" fill="#9a9488"/>
      <rect x="-8" y="14" width="16" height="9" rx="4" fill="#9a9488"/><rect x="12" y="14" width="16" height="9" rx="4" fill="#a8a294"/><rect x="32" y="14" width="16" height="9" rx="4" fill="#9a9488"/>
    </pattern>
    <pattern id="marketCheckRed" width="20" height="20" patternUnits="userSpaceOnUse"><rect width="10" height="20" fill="#d8283a" opacity="0.25"/><rect width="20" height="10" fill="#d8283a" opacity="0.25"/></pattern>
    <pattern id="marketCheckGreen" width="20" height="20" patternUnits="userSpaceOnUse"><rect width="10" height="20" fill="#2f8a4a" opacity="0.25"/><rect width="20" height="10" fill="#2f8a4a" opacity="0.25"/></pattern>
    <linearGradient id="marketWood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d8a060"/><stop offset="1" stop-color="#9a6430"/></linearGradient>
    <radialGradient id="marketApple" cx="35%" cy="35%" r="70%"><stop offset="0" stop-color="#ff7a6a"/><stop offset="1" stop-color="#b0101e"/></radialGradient>
    <radialGradient id="marketGreenApple" cx="35%" cy="35%" r="70%"><stop offset="0" stop-color="#e0ff9a"/><stop offset="1" stop-color="#5aa02a"/></radialGradient>
    <radialGradient id="marketOrange" cx="35%" cy="35%" r="70%"><stop offset="0" stop-color="#ffd08a"/><stop offset="1" stop-color="#e8701a"/></radialGradient>
    <radialGradient id="marketPear" cx="35%" cy="35%" r="75%"><stop offset="0" stop-color="#f4f4a0"/><stop offset="1" stop-color="#a8b830"/></radialGradient>
    <linearGradient id="marketGlass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#bfe0f0"/><stop offset="1" stop-color="#5a8aa8"/></linearGradient>
  </defs>
  <rect width="800" height="300" fill="url(#marketBrick)"/>
  <rect y="0" width="800" height="14" fill="#8a5a3a"/>`;

  // Upstairs windows with flower boxes, and the shop sign
  WINDOWS.forEach((x) => {
    s += `<rect x="${x - 38}" y="70" width="76" height="68" fill="#f4ead8"/><rect x="${x - 32}" y="76" width="64" height="58" fill="url(#marketGlass)"/>
      <path d="M${x},76 V134 M${x - 32},104 H${x + 32}" stroke="#f4ead8" stroke-width="4"/><path d="M${x - 26},128 L${x - 6},82" stroke="#fff" stroke-width="3" opacity="0.4"/>`;
    if (x === 570 && has("windowBox")) return;
    s += `<rect x="${x - 30}" y="136" width="60" height="12" rx="2" fill="#7a4a2a"/>`;
    for (let k = 0; k < 6; k++) s += `<circle cx="${x - 25 + k * 10}" cy="${133 + (k % 2) * 2}" r="4.5" fill="${k % 2 ? "#f4c020" : "#e8508a"}"/>`;
  });
  s += `<rect x="300" y="76" width="200" height="56" rx="6" fill="#2f5a3a" stroke="#e2b54a" stroke-width="3"/>
    <text x="420" y="112" font-size="19" font-weight="bold" font-family="Georgia, serif" text-anchor="middle" fill="#ffe8a0">FRESH FRUIT</text>`;
  if (!has("signApple")) s += apple(324, 106) + `<ellipse cx="330" cy="95" rx="5" ry="2.5" fill="#3f9a3a"/>`;

  // Bunting
  const line: [Point, Point, Point] = [[0, 24], [400, 76], [800, 24]];
  s += `<path d="M0,24 Q400,76 800,24" stroke="#5a4a3a" stroke-width="2" fill="none"/>`;
  for (let k = 0; k < 17; k++) {
    const [x, y] = quadPoint(...line, (k + 0.5) / 17);
    const color = k === LOST_FLAG && has("flag") ? "#9a4ac8" : FLAG_COLORS[k % 4]!;
    s += `<path d="M${(x - 13).toFixed(1)},${(y - 1).toFixed(1)} L${(x + 13).toFixed(1)},${(y - 1).toFixed(1)} L${x.toFixed(1)},${(y + 26).toFixed(1)} Z" fill="${color}"/>`;
  }

  // Dark shop interior with the vendor
  s += `<rect x="0" y="196" width="800" height="150" fill="#4a3226"/>
    <path d="M10,250 H390 M410,250 H790" stroke="#6a4a36" stroke-width="5"/>`;
  s += `<path d="M672,346 V284 Q700,266 728,284 V346 Z" fill="#f4f4f4"/><path d="M684,346 V288 H716 V346 Z" fill="#3a6aa8"/>
    <circle cx="700" cy="254" r="17" fill="#f0c8a0"/><circle cx="694" cy="252" r="2" fill="#2a1a10"/><circle cx="706" cy="252" r="2" fill="#2a1a10"/>
    <path d="M692,261 q8,6 16,0" stroke="#7a3a20" stroke-width="2" fill="none"/><circle cx="688" cy="259" r="3" fill="#f0907a" opacity="0.6"/><circle cx="712" cy="259" r="3" fill="#f0907a" opacity="0.6"/>
    <path d="M682,246 Q684,226 700,226 Q716,226 718,246 Z" fill="${has("vendorCap") ? "#d8283a" : "#2e5ab0"}"/><path d="M712,244 h14 q-2,4 -14,4 Z" fill="${has("vendorCap") ? "#a81e2e" : "#1e3a80"}"/>`;

  // Awnings and posts
  s += `<rect x="24" y="200" width="8" height="270" fill="#6a4a2a"/><rect x="374" y="200" width="8" height="270" fill="#6a4a2a"/>
    <rect x="420" y="200" width="8" height="270" fill="#6a4a2a"/><rect x="768" y="200" width="8" height="270" fill="#6a4a2a"/>`;
  s += awning(28, 380, "marketStripeRed") + awning(424, 772, "marketStripeGreen");

  // Counters with tablecloths
  s += `<rect x="20" y="344" width="366" height="10" fill="#7a4a2a"/><rect x="416" y="344" width="364" height="10" fill="#7a4a2a"/>
    <path d="M26,354 H380 V462 Q203,474 26,462 Z" fill="#f4e4c8"/><path d="M26,354 H380 V368 H26 Z" fill="#d8283a" opacity="0.7"/>
    <path d="M422,354 H776 V462 Q599,474 422,462 Z" fill="#e8f4e0"/><path d="M422,354 H776 V368 H422 Z" fill="#2f8a4a" opacity="0.7"/>
    <path d="M26,368 H380 V462 Q203,474 26,462 Z" fill="url(#marketCheckRed)"/><path d="M422,368 H776 V462 Q599,474 422,462 Z" fill="url(#marketCheckGreen)"/>
    <path d="M26,462 Q203,474 380,462 M422,462 Q599,474 776,462" stroke="#000" stroke-opacity="0.15" stroke-width="3" fill="none"/>
    <rect x="150" y="384" width="106" height="44" rx="4" fill="#2a2a2a" stroke="#a8743e" stroke-width="4"/>
    <text x="203" y="403" font-size="13" font-family="Georgia, serif" font-style="italic" text-anchor="middle" fill="#fff">Farm fresh</text>
    <text x="203" y="420" font-size="11" font-family="Georgia, serif" text-anchor="middle" fill="#f4c020">every morning</text>`;

  // Left counter: apples, oranges, pears and a scale
  const apples = pile(38, random, (x, y) => apple(x, y));
  const appleTop = has("apple") ? "url(#marketGreenApple)" : "url(#marketApple)";
  s += crate(38, apples + apple(83, 254, appleTop), "€2");
  s += crate(136, pile(136, random, orange), "€3");
  s += crate(234, pile(234, random, pear), "€4");
  const needle = has("scale") ? 40 : -35, na = needle * Math.PI / 180;
  s += `<rect x="334" y="330" width="42" height="14" rx="2" fill="#5a5a6a"/><rect x="338" y="296" width="34" height="36" rx="5" fill="#d8283a"/>
    <circle cx="355" cy="314" r="14" fill="#fff" stroke="#3a3a3a" stroke-width="1.5"/>
    <path d="M346,314 a9,9 0 0,1 18,0" stroke="#3a3a3a" stroke-width="1" fill="none" stroke-dasharray="2 2"/>
    <line x1="355" y1="314" x2="${(355 + 12 * Math.sin(na)).toFixed(1)}" y2="${(314 - 12 * Math.cos(na)).toFixed(1)}" stroke="#d8283a" stroke-width="2.6" stroke-linecap="round"/>
    <rect x="352" y="288" width="6" height="8" fill="#8a8a9a"/><path d="M332,288 H378 Q376,296 355,296 Q334,296 332,288 Z" fill="#c8ccd8"/>
    ${orange(347, 280)}${orange(364, 282)}`;

  // Right counter: bananas, grapes and strawberries
  const banana = (x: number, y: number, k: number): string => bananas(x, y, k === 1 && has("banana") ? "#9ac84a" : "#f4d030");
  s += crate(432, [[454, 292], [478, 276], [502, 292]].map(([x, y], k) => banana(x!, y!, k)).join(""), "€2");
  s += crate(530, [[548, 290], [575, 290], [602, 290], [561, 272], [589, 272]].map(([x, y], k) => grapes(x!, y!, k === 4 && has("grapes") ? "#9ad04a" : "#7a2a8a")).join(""), "€5");
  s += crate(628, pile(628, random, strawberry) + strawberry(664, 255) + strawberry(682, 256), has("priceTag") ? "€9" : "€4");

  // Cobbled ground
  s += `<rect y="470" width="800" height="130" fill="url(#marketCobble)"/><rect y="470" width="800" height="6" fill="#000" opacity="0.15"/>`;

  // Flower buckets
  [[60, "#e83a3a"], [130, "sun"], [200, "#c85ad8"]].forEach(([bx, kind]) => {
    const x = Number(bx);
    for (let k = 0; k < 5; k++) {
      const fx = x - 16 + k * 8 + (random() - 0.5) * 4, fy = 470 + (k % 2) * 14 + random() * 6;
      s += `<path d="M${x},540 Q${(fx + x) / 2},${fy + 30} ${fx.toFixed(1)},${fy.toFixed(1)}" stroke="#3f8a3a" stroke-width="2.5" fill="none"/>`;
      if (kind === "sun") {
        if (k === 2 && has("sunflower")) continue;
        s += `<circle cx="${fx.toFixed(1)}" cy="${fy.toFixed(1)}" r="10" fill="#f4c020"/><circle cx="${fx.toFixed(1)}" cy="${fy.toFixed(1)}" r="4.5" fill="#6a3a18"/>`;
      } else {
        s += `<path d="M${(fx - 6).toFixed(1)},${(fy - 2).toFixed(1)} q0,10 6,10 q6,0 6,-10 l-3,3 l-3,-5 l-3,5 Z" fill="${kind}"/>`;
      }
    }
    s += `<path d="M${x - 24},530 H${x + 24} L${x + 19},590 H${x - 19} Z" fill="#a8b0b8"/><rect x="${x - 26}" y="526" width="52" height="7" rx="3" fill="#c8d0d8"/>
      <rect x="${x - 18}" y="536" width="6" height="50" fill="#fff" opacity="0.3"/>`;
  });

  // Basket of green apples and a basket of oranges
  if (!has("basketHandle")) s += `<path d="M266,540 Q268,476 300,476 Q332,476 334,540" stroke="#a8743e" stroke-width="6" fill="none"/>`;
  [[288, 528], [306, 526], [296, 516], [278, 532], [318, 532]].forEach(([x, y]) => { s += apple(x!, y!, "url(#marketGreenApple)"); });
  s += `<path d="M258,532 H342 L332,584 H268 Z" fill="#c8944a"/><path d="M262,546 H338 M264,560 H336 M267,573 H333" stroke="#8a5a24" stroke-width="2"/>
    <ellipse cx="300" cy="586" rx="40" ry="5" fill="#000" opacity="0.2"/>`;
  [[400, 530], [418, 528], [436, 532], [409, 516], [428, 518]].forEach(([x, y]) => { s += orange(x!, y!); });
  s += `<ellipse cx="418" cy="540" rx="40" ry="12" fill="#a8743e"/><path d="M378,540 Q380,580 418,582 Q456,580 458,540 Z" fill="#c8944a"/>
    <path d="M384,556 Q418,566 452,556 M392,570 Q418,578 444,570" stroke="#8a5a24" stroke-width="2" fill="none"/>`;

  // Wooden cart with watermelons
  s += `<path d="M560,488 L500,474" stroke="#6a4a2a" stroke-width="7" stroke-linecap="round"/>
    <rect x="768" y="510" width="8" height="70" fill="#6a4a2a"/>`;
  s += watermelon(596, 466) + watermelon(652, 470) + watermelon(708, 466) + watermelon(624, 438) + watermelon(682, 440);
  if (!has("watermelon")) {
    s += `<path d="M714,438 a30,30 0 0,1 60,0 Z" fill="#2f7a2a"/><path d="M718,438 a26,26 0 0,1 52,0 Z" fill="#f4f0c8"/><path d="M722,438 a22,22 0 0,1 44,0 Z" fill="#e8384a"/>
      <circle cx="736" cy="428" r="1.6" fill="#222"/><circle cx="748" cy="422" r="1.6" fill="#222"/><circle cx="756" cy="430" r="1.6" fill="#222"/>`;
  }
  s += watermelon(756, 470);
  s += `<rect x="556" y="484" width="226" height="34" rx="3" fill="url(#marketWood)"/><path d="M556,500 H782" stroke="#7a4a20" stroke-width="2"/>
    <circle cx="660" cy="550" r="40" fill="none" stroke="#5a3418" stroke-width="7"/>`;
  for (let k = 0; k < 8; k++) {
    const a = k * Math.PI / 4;
    s += `<line x1="660" y1="550" x2="${(660 + 38 * Math.cos(a)).toFixed(1)}" y2="${(550 + 38 * Math.sin(a)).toFixed(1)}" stroke="#7a4a20" stroke-width="4"/>`;
  }
  s += `<circle cx="660" cy="550" r="7" fill="#3a2a1a"/>`;
  return s;
}

function marketDifferences(): Difference[] {
  return [
    { id: "flag", x: 494, y: 58, r: 18 },
    { id: "windowBox", x: 570, y: 140, r: 32 },
    { id: "signApple", x: 325, y: 104, r: 18 },
    { id: "vendorCap", x: 702, y: 236, r: 20 },
    { id: "apple", x: 83, y: 254, r: 16 },
    { id: "scale", x: 355, y: 314, r: 16 },
    { id: "banana", x: 478, y: 278, r: 20 },
    { id: "grapes", x: 589, y: 274, r: 18 },
    { id: "priceTag", x: 673, y: 325, r: 18 },
    { id: "sunflower", x: 130, y: 482, r: 20 },
    { id: "basketHandle", x: 300, y: 492, r: 30 },
    { id: "watermelon", x: 744, y: 426, r: 30 },
  ];
}

export const market: Scene = { name: "The Fruit Market", draw: drawMarket, differences: marketDifferences() };
