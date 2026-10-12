// Scene 5: Cocktails & Disco Ball
import { seeded, sparkle, SHARED_DEFS } from "./helpers";
import type { Has, Difference, Scene } from "./types";

const DISCO = { cx: 400, cy: 100, r: 56, tile: 10 };

function drawCocktails(has: Has): string {
  const random = seeded(55);
  let s = `<defs>${SHARED_DEFS}
    <radialGradient id="kBg" cx="50%" cy="15%" r="85%">
      <stop offset="0" stop-color="#4a1450"/><stop offset="1" stop-color="#0d0410"/>
    </radialGradient>
    <linearGradient id="kMarble" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1f1d26"/><stop offset="1" stop-color="#060509"/>
    </linearGradient>
    <linearGradient id="kChrome" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#6e6e78"/><stop offset="0.35" stop-color="#f4f4f8"/><stop offset="0.7" stop-color="#b8b8c2"/><stop offset="1" stop-color="#55555f"/>
    </linearGradient>
    <linearGradient id="kMartini" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f2fbe6"/><stop offset="1" stop-color="#b9e08e"/>
    </linearGradient>
    <linearGradient id="kPink" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffb3d4"/><stop offset="1" stop-color="#e0367c"/>
    </linearGradient>
    <linearGradient id="kSunset" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffd166"/><stop offset="0.5" stop-color="#ff7a59"/><stop offset="1" stop-color="#c8235f"/>
    </linearGradient>
    <radialGradient id="kShine" cx="35%" cy="30%" r="70%">
      <stop offset="0" stop-color="#fff" stop-opacity="0.55"/><stop offset="0.6" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.35"/>
    </radialGradient>
    <clipPath id="kBallClip"><circle cx="${DISCO.cx}" cy="${DISCO.cy}" r="${DISCO.r}"/></clipPath>
  </defs>
  <rect width="800" height="600" fill="url(#kBg)"/>`;

  // Art deco fans on the wall and light beams from the disco ball
  s += '<g fill="none" stroke="#e2b54a" opacity="0.18">';
  for (let x = 0; x < 800; x += 160) {
    [40, 60, 80].forEach(r => { s += `<path d="M${x + 80 - r},430 A${r},${r} 0 0,1 ${x + 80 + r},430" stroke-width="2"/>`; });
  }
  s += "</g>";
  s += '<g fill="#fff" opacity="0.07">';
  [80, 230, 570, 720].forEach(x => { s += `<path d="M${DISCO.cx},${DISCO.cy} L${x - 35},600 L${x + 35},600 Z"/>`; });
  s += "</g>";

  // Disco ball
  s += `<line x1="${DISCO.cx}" y1="0" x2="${DISCO.cx}" y2="${DISCO.cy - DISCO.r}" stroke="#b8b8c2" stroke-width="2"/>
    <circle cx="${DISCO.cx}" cy="${DISCO.cy}" r="${DISCO.r}" fill="#6f7487"/>
    <g clip-path="url(#kBallClip)">`;
  const shades = ["#d9dbe3", "#9ea3b3", "#f4f5fa", "#6f7487", "#c3c7d4"];
  for (let y = DISCO.cy - DISCO.r; y < DISCO.cy + DISCO.r; y += DISCO.tile) {
    for (let x = DISCO.cx - DISCO.r; x < DISCO.cx + DISCO.r; x += DISCO.tile) {
      let fill = shades[Math.floor(random() * shades.length)];
      if (x === DISCO.cx + 24 && y === DISCO.cy - 6 && has("discoTile")) fill = "#ff5fa2";
      s += `<rect x="${x + 0.5}" y="${y + 0.5}" width="${DISCO.tile - 1}" height="${DISCO.tile - 1}" fill="${fill}"/>`;
    }
  }
  s += `</g><circle cx="${DISCO.cx}" cy="${DISCO.cy}" r="${DISCO.r}" fill="url(#kShine)"/>`;
  s += sparkle(330, 62, 12) + sparkle(472, 142, 10);
  if (!has("sparkle")) s += sparkle(462, 42, 9);

  // Neon sign
  s += `<text x="70" y="185" font-family="Georgia, serif" font-style="italic" font-size="44" fill="#ffd1e8"
      stroke="#ff4fa3" stroke-width="1.5" filter="url(#glow)">Cocktails</text>`;
  if (!has("neonHeart")) {
    s += `<path d="M290,148 C290,140 302,138 302,148 C302,140 314,140 314,148 C314,158 302,164 302,168 C302,164 290,158 290,148 Z"
      fill="none" stroke="#ff4fa3" stroke-width="3" filter="url(#glow)"/>`;
  }

  // Bar counter
  s += `<rect y="430" width="800" height="170" fill="url(#kMarble)"/>
    <rect y="428" width="800" height="5" fill="url(#gold)"/>`;
  s += '<g stroke="#8a8798" fill="none" opacity="0.25">';
  for (let k = 0; k < 6; k++) {
    const x = random() * 800, y = 450 + random() * 140;
    s += `<path d="M${x.toFixed(0)},${y.toFixed(0)} q${(40 + random() * 40).toFixed(0)},${(-8 + random() * 16).toFixed(0)} ${(100 + random() * 60).toFixed(0)},${(-4 + random() * 20).toFixed(0)}"/>`;
  }
  s += "</g>";

  // Gold coasters
  s += '<ellipse cx="190" cy="470" rx="46" ry="8" fill="url(#gold)"/>';
  if (!has("coaster")) s += '<ellipse cx="360" cy="470" rx="46" ry="8" fill="url(#gold)"/>';
  s += '<ellipse cx="650" cy="462" rx="50" ry="8" fill="url(#gold)"/>';

  // Martini with an olive
  s += `<path d="M130,300 L250,300 L190,380 Z" fill="#fff" fill-opacity="0.1" stroke="#fff" stroke-opacity="0.6" stroke-width="2"/>
    <path d="M141,312 L239,312 L190,372 Z" fill="url(#kMartini)" opacity="0.85"/>
    <line x1="190" y1="380" x2="190" y2="462" stroke="#fff" stroke-opacity="0.6" stroke-width="4"/>
    <ellipse cx="190" cy="465" rx="34" ry="6" fill="#fff" fill-opacity="0.2" stroke="#fff" stroke-opacity="0.6" stroke-width="2"/>
    <line x1="228" y1="286" x2="168" y2="348" stroke="#c9a24a" stroke-width="2"/>`;
  if (!has("olive")) {
    s += `<circle cx="183" cy="333" r="9" fill="#5b8c2a"/><circle cx="187" cy="330" r="3.5" fill="#d3263f"/>`;
  }

  // Coupe with a cherry
  s += `<path d="M300,340 Q360,405 420,340 Z" fill="url(#kPink)" opacity="0.92"/>
    <ellipse cx="360" cy="340" rx="60" ry="7" fill="#ffd6e8" stroke="#fff" stroke-opacity="0.7" stroke-width="2"/>
    <line x1="360" y1="372" x2="360" y2="462" stroke="#fff" stroke-opacity="0.6" stroke-width="4"/>
    <ellipse cx="360" cy="465" rx="32" ry="6" fill="#fff" fill-opacity="0.2" stroke="#fff" stroke-opacity="0.6" stroke-width="2"/>`;
  if (!has("cherry")) {
    s += `<path d="M408,326 Q412,308 424,300" stroke="#6b3b1f" stroke-width="2" fill="none"/>
      <circle cx="407" cy="329" r="8" fill="#c8102e"/><circle cx="404" cy="326" r="2.2" fill="#fff" opacity="0.6"/>`;
  }

  // Champagne cork on the counter
  if (!has("cork")) {
    s += `<rect x="266" y="480" width="15" height="14" rx="2" fill="#c89b5a"/>
      <ellipse cx="273.5" cy="480" rx="11" ry="5" fill="#a87a3e"/>`;
  }

  // Cocktail shaker
  s += `<path d="M490,460 L496,330 L544,330 L550,460 Z" fill="url(#kChrome)"/>
    <rect x="494" y="326" width="52" height="8" rx="3" fill="#9ea3b3"/>
    <path d="M500,326 L505,300 L535,300 L540,326 Z" fill="url(#kChrome)"/>
    <line x1="506" y1="340" x2="503" y2="450" stroke="#fff" stroke-width="3" opacity="0.6"/>`;
  s += has("shakerCap")
    ? '<rect x="512" y="284" width="16" height="16" rx="2" fill="url(#kChrome)"/>'
    : '<circle cx="520" cy="292" r="8" fill="url(#kChrome)"/>';

  // Highball with ice, a straw, an umbrella and a lemon slice
  s += `<rect x="617" y="330" width="66" height="128" fill="url(#kSunset)" opacity="0.9"/>
    <g fill="#fff" fill-opacity="0.25" stroke="#fff" stroke-opacity="0.7" stroke-width="1.5">
      <rect x="624" y="336" width="20" height="18" rx="3" transform="rotate(-8,634,345)"/>
      <rect x="652" y="344" width="20" height="18" rx="3" transform="rotate(10,662,353)"/>
      ${has("iceCube") ? "" : '<rect x="634" y="366" width="20" height="18" rx="3" transform="rotate(4,644,375)"/>'}
    </g>
    <line x1="668" y1="455" x2="702" y2="262" stroke="#fff" stroke-width="6" stroke-linecap="round"/>
    <line x1="668" y1="455" x2="702" y2="262" stroke="#e0367c" stroke-width="6" stroke-dasharray="8 8"/>
    <rect x="615" y="300" width="70" height="160" fill="#fff" fill-opacity="0.1" stroke="#fff" stroke-opacity="0.6" stroke-width="2"/>
    <line x1="622" y1="310" x2="622" y2="450" stroke="#fff" stroke-width="3" opacity="0.5"/>
    <line x1="628" y1="306" x2="590" y2="246" stroke="#e8e0d0" stroke-width="2"/>`;
  const umbrella = has("umbrella") ? "#4fc3f7" : "#ff7ab8";
  s += `<g transform="rotate(-30,590,240)">
      <path d="M556,240 A34,34 0 0,1 624,240 Z" fill="${umbrella}"/>
      <path d="M590,240 L573,209 M590,240 L590,206 M590,240 L607,209" stroke="#fff" stroke-opacity="0.6" stroke-width="1.2"/>
    </g>`;
  if (!has("lemon")) {
    s += `<circle cx="688" cy="302" r="16" fill="#ffe066" stroke="#f2c300" stroke-width="3"/>
      <path d="M688,302 L688,288 M688,302 L700,295 M688,302 L700,309 M688,302 L688,316 M688,302 L676,309 M688,302 L676,295"
        stroke="#fff6c2" stroke-width="1.5"/>`;
  }
  return s;
}

function cocktailDifferences(): Difference[] {
  return [
    { id: "discoTile", x: DISCO.cx + 29, y: DISCO.cy - 1, r: 12 },
    { id: "sparkle", x: 462, y: 42, r: 14 },
    { id: "neonHeart", x: 302, y: 153, r: 18 },
    { id: "coaster", x: 360, y: 470, r: 24 },
    { id: "olive", x: 184, y: 332, r: 14 },
    { id: "cherry", x: 410, y: 320, r: 16 },
    { id: "cork", x: 274, y: 486, r: 16 },
    { id: "shakerCap", x: 520, y: 292, r: 14 },
    { id: "iceCube", x: 644, y: 375, r: 16 },
    { id: "umbrella", x: 585, y: 228, r: 24 },
    { id: "lemon", x: 688, y: 302, r: 18 },
  ];
}

export const cocktails: Scene = { name: "Cocktails & Disco Ball", draw: drawCocktails, differences: cocktailDifferences() };
