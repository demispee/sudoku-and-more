// Scene 4: The Swan
import { seeded, sparkle, pearl, SHARED_DEFS } from "./helpers";
import type { Point, Has, Difference, Scene } from "./types";

const NECK_PEARLS: Point[] = [[249, 304], [253, 310], [258, 315], [264, 318], [270, 320], [276, 320], [282, 318]];
const REEDS = [{ x: 30, top: 400 }, { x: 47, top: 372 }, { x: 64, top: 388 }, { x: 80, top: 410 }];

function lotus(cx: number, cy: number): string {
  let s = "";
  [-60, -30, 0, 30, 60].forEach(angle => {
    s += `<ellipse cx="${cx}" cy="${cy - 9}" rx="5" ry="11" fill="#ff9ec7" stroke="#fff" stroke-opacity="0.5"
      transform="rotate(${angle},${cx},${cy})"/>`;
  });
  return s + `<circle cx="${cx}" cy="${cy - 2}" r="3.5" fill="#ffd166"/>`;
}

function lilyPad(cx: number, cy: number, rx: number): string {
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${rx * 0.3}" fill="url(#sPad)"/>
    <path d="M${cx},${cy} L${cx + rx * 0.9},${cy - rx * 0.12} L${cx + rx * 0.9},${cy + rx * 0.12} Z" fill="#05060f"/>`;
}

function drawSwan(has: Has): string {
  const random = seeded(33);
  let s = `<defs>${SHARED_DEFS}
    <linearGradient id="sSky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2a1d5c"/><stop offset="1" stop-color="#0c0a26"/>
    </linearGradient>
    <linearGradient id="sWater" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#121640"/><stop offset="1" stop-color="#04050f"/>
    </linearGradient>
    <radialGradient id="sMoon" cx="40%" cy="40%" r="70%">
      <stop offset="0" stop-color="#fffbe6"/><stop offset="1" stop-color="#f1d98c"/>
    </radialGradient>
    <linearGradient id="sWhite" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#d9deec"/>
    </linearGradient>
    <linearGradient id="sPad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#3f9a5c"/><stop offset="1" stop-color="#1d5432"/>
    </linearGradient>
  </defs>
  <rect width="800" height="380" fill="url(#sSky)"/>
  <rect y="380" width="800" height="220" fill="url(#sWater)"/>`;

  // Stars, a shooting star, the moon and a cloud
  for (let k = 0; k < 70; k++) {
    s += `<circle cx="${(random() * 800).toFixed(0)}" cy="${(random() * 350).toFixed(0)}" r="${(0.5 + random() * 1.2).toFixed(1)}" fill="#fff" opacity="${(0.3 + random() * 0.6).toFixed(2)}"/>`;
  }
  if (!has("shootingStar")) {
    s += `<line x1="105" y1="62" x2="185" y2="104" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity="0.8"/>
      ${sparkle(188, 106, 8)}`;
  }
  s += `<circle cx="620" cy="130" r="52" fill="url(#sMoon)" filter="url(#glow)"/>
    <circle cx="603" cy="118" r="9" fill="#e2c776" opacity="0.35"/>
    <circle cx="636" cy="146" r="6" fill="#e2c776" opacity="0.35"/>
    <circle cx="612" cy="152" r="4" fill="#e2c776" opacity="0.35"/>`;
  if (!has("cloud")) {
    s += `<g fill="#3d3170" opacity="0.95">
      <ellipse cx="648" cy="168" rx="34" ry="11"/><ellipse cx="668" cy="160" rx="20" ry="11"/><ellipse cx="636" cy="161" rx="15" ry="9"/>
    </g>`;
  }

  // Art deco pavilion on the far shore
  s += `<g stroke="url(#gold)" stroke-width="1.5" fill="#110d2c">
      <rect x="708" y="345" width="78" height="35"/>
      <path d="M704,345 Q747,295 790,345 Z"/>
    </g>
    <g stroke="#e2b54a" stroke-width="1.2" opacity="0.8">
      <line x1="722" y1="348" x2="722" y2="380"/><line x1="738" y1="348" x2="738" y2="380"/>
      <line x1="756" y1="348" x2="756" y2="380"/><line x1="772" y1="348" x2="772" y2="380"/>
    </g>
    <line x1="747" y1="320" x2="747" y2="292" stroke="#e2b54a" stroke-width="1.5"/>`;
  if (!has("pavilionFlag")) s += '<path d="M747,292 L766,298 L747,304 Z" fill="url(#gold)"/>';
  s += '<line x1="0" y1="380" x2="800" y2="380" stroke="url(#gold)" stroke-width="1" opacity="0.6"/>';

  // Moonlight on the water
  s += '<g stroke="#f5d77a" stroke-linecap="round">';
  for (let y = 395; y < 590; y += 16) {
    const w = 10 + random() * 40 * (1 - (y - 395) / 260);
    s += `<line x1="${(620 - w).toFixed(0)}" y1="${y}" x2="${(620 + w).toFixed(0)}" y2="${y}" stroke-width="2" opacity="${(0.25 + random() * 0.35).toFixed(2)}"/>`;
  }
  s += "</g>";

  // Reeds with cattails
  REEDS.forEach(({ x, top }, k) => {
    s += `<line x1="${x}" y1="600" x2="${x}" y2="${top}" stroke="#3f7a4a" stroke-width="3"/>`;
    if (!(k === 2 && has("cattail"))) s += `<rect x="${x - 5}" y="${top + 4}" width="10" height="34" rx="5" fill="#7a4a24"/>`;
  });

  // Lily pads, lotus flowers and a jumping golden fish
  s += lilyPad(120, 528, 46) + lotus(120, 520);
  s += lilyPad(600, 548, 40);
  if (!has("lilyFlower")) s += lotus(600, 540);
  s += lilyPad(712, 482, 30);
  if (!has("goldFish")) {
    s += `<g transform="rotate(-25,505,560)">
      <ellipse cx="505" cy="560" rx="16" ry="7" fill="url(#gold)"/>
      <path d="M489,560 L477,552 L477,568 Z" fill="url(#gold)"/>
      <circle cx="514" cy="558" r="1.6" fill="#1a1a1a"/>
    </g>
    <path d="M480,580 q8,-6 16,0 M510,580 q8,-6 16,0" stroke="#f5d77a" stroke-width="1.5" fill="none" opacity="0.6"/>`;
  }

  // Ripples around the swan
  s += `<ellipse cx="390" cy="468" rx="175" ry="16" fill="none" stroke="#f5d77a" stroke-width="1.5" opacity="0.45"/>
    <ellipse cx="390" cy="472" rx="215" ry="22" fill="none" stroke="#f5d77a" stroke-width="1" opacity="0.25"/>`;

  // The swan, facing left
  s += `<path d="M250,440 C240,400 300,375 380,385 C440,392 490,400 515,378 C522,410 500,450 440,462 C360,478 270,470 250,440 Z" fill="url(#sWhite)"/>
    <path d="M300,420 C320,360 400,330 472,348 C456,364 446,380 432,400 C400,420 340,430 300,420 Z" fill="#f6f7fc" stroke="#c9cfdd" stroke-width="1.5"/>
    <path d="M330,410 C350,380 395,362 440,362 M345,418 C370,395 405,382 432,384" stroke="#c9cfdd" stroke-width="1.2" fill="none"/>
    <path d="M300,420 C258,402 244,352 262,312 C278,274 300,250 285,228" stroke="url(#sWhite)" stroke-width="20" stroke-linecap="round" fill="none"/>
    <circle cx="280" cy="222" r="17" fill="#ffffff"/>
    <path d="M266,216 L236,229 L266,233 Z" fill="#f08a24"/>
    <circle cx="277" cy="217" r="2.6" fill="#111"/>`;
  if (!has("beakKnob")) s += '<ellipse cx="266" cy="221" rx="5" ry="6" fill="#1a1a1a"/>';
  s += `<path d="M266,207 L268,191 L275,199 L282,186 L289,199 L296,191 L298,207 Z" fill="url(#gold)" stroke="#8c6418" stroke-width="0.8"/>
    <circle cx="282" cy="199" r="3.2" fill="${has("crownGem") ? "url(#gemSapphire)" : "url(#gemRuby)"}"/>`;
  NECK_PEARLS.forEach(([x, y], k) => {
    if (k === 3 && has("neckPearls")) return;
    s += pearl(x, y, 3.6);
  });

  // Fireflies and a floating feather
  s += '<g fill="#ffe68a" filter="url(#glow)">';
  for (let k = 0; k < 12; k++) {
    const x = 120 + random() * 560, y = 190 + random() * 170;
    s += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(1.2 + random() * 1.2).toFixed(1)}" opacity="0.8"/>`;
  }
  if (!has("firefly")) s += '<circle cx="530" cy="300" r="3.2"/>';
  s += "</g>";
  if (!has("floatingFeather")) {
    s += `<g transform="rotate(-15,170,575)">
      <ellipse cx="170" cy="575" rx="22" ry="6" fill="#f6f7fc"/>
      <line x1="146" y1="576" x2="194" y2="574" stroke="#c9cfdd" stroke-width="1.2"/>
    </g>`;
  }
  return s;
}

function swanDifferences(): Difference[] {
  const [px, py] = NECK_PEARLS[3]!;
  return [
    { id: "shootingStar", x: 148, y: 84, r: 28 },
    { id: "cloud", x: 652, y: 164, r: 24 },
    { id: "pavilionFlag", x: 754, y: 298, r: 14 },
    { id: "cattail", x: REEDS[2]!.x, y: REEDS[2]!.top + 21, r: 18 },
    { id: "lilyFlower", x: 600, y: 532, r: 18 },
    { id: "goldFish", x: 500, y: 563, r: 22 },
    { id: "beakKnob", x: 266, y: 221, r: 10 },
    { id: "crownGem", x: 282, y: 197, r: 12 },
    { id: "neckPearls", x: px, y: py, r: 10 },
    { id: "firefly", x: 530, y: 300, r: 14 },
    { id: "floatingFeather", x: 170, y: 575, r: 22 },
  ];
}

export const swan: Scene = { name: "The Swan", draw: drawSwan, differences: swanDifferences() };
