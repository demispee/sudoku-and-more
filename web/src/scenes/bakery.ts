// Scene 8: The Bakery
import { seeded, SHARED_DEFS } from "./helpers";
import type { Has, Difference, Scene } from "./types";

const CUPCAKES = [545, 610, 675, 740];

function loaf(cx: number, cy: number): string {
  return `<ellipse cx="${cx}" cy="${cy + 16}" rx="30" ry="5" fill="#000" opacity="0.15"/>
    <path d="M${cx - 30},${cy + 16} C${cx - 32},${cy - 22} ${cx + 32},${cy - 22} ${cx + 30},${cy + 16} Z" fill="url(#bakeryCrust)"/>
    <path d="M${cx - 14},${cy - 6} q6,6 0,14 M${cx},${cy - 10} q6,8 0,18 M${cx + 14},${cy - 6} q6,6 0,14" stroke="#f6d59a" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
}

function croissant(cx: number, cy: number): string {
  const parts: [number, number, number, number, number][] = [[-24, 7, 7, 5, -40], [24, 7, 7, 5, 40], [-14, 1, 10, 9, -20], [14, 1, 10, 9, 20], [0, -2, 12, 12, 0]];
  return `<g fill="url(#bakeryCrust)" stroke="#8a4b16" stroke-width="1.2">${parts.map(([x, y, rx, ry, a]) =>
    `<ellipse cx="${cx + x}" cy="${cy + y}" rx="${rx}" ry="${ry}" transform="rotate(${a},${cx + x},${cy + y})"/>`).join("")}</g>
    <ellipse cx="${cx - 3}" cy="${cy - 7}" rx="5" ry="2.5" fill="#fff" opacity="0.35"/>`;
}

function cupcake(cx: number, frosting: string, sprinkles: string): string {
  return `<path d="M${cx - 22},368 L${cx - 16},408 L${cx + 16},408 L${cx + 22},368 Z" fill="#f2a7c3"/>
    <path d="M${cx - 12},370 L${cx - 9},408 M${cx},370 L${cx},408 M${cx + 12},370 L${cx + 9},408" stroke="#d46f98" stroke-width="2"/>
    <ellipse cx="${cx}" cy="366" rx="25" ry="9" fill="${frosting}"/>
    <ellipse cx="${cx}" cy="356" rx="19" ry="8" fill="${frosting}"/>
    <ellipse cx="${cx}" cy="347" rx="12" ry="6" fill="${frosting}"/>
    <ellipse cx="${cx - 6}" cy="353" rx="6" ry="2.5" fill="#fff" opacity="0.5"/>${sprinkles}`;
}

function drawBakery(has: Has): string {
  const random = seeded(88);
  let s = `<defs>${SHARED_DEFS}
    <linearGradient id="bakeryWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbe6c4"/><stop offset="1" stop-color="#e8bf8a"/></linearGradient>
    <linearGradient id="bakeryWood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a5672f"/><stop offset="1" stop-color="#5e3315"/></linearGradient>
    <linearGradient id="bakeryShelf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c58548"/><stop offset="1" stop-color="#7a4520"/></linearGradient>
    <radialGradient id="bakeryCrust" cx="40%" cy="30%" r="75%"><stop offset="0" stop-color="#f7c46c"/><stop offset="0.6" stop-color="#d48a35"/><stop offset="1" stop-color="#8a4b16"/></radialGradient>
    <linearGradient id="bakerySky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7ec8f2"/><stop offset="1" stop-color="#d9f0ff"/></linearGradient>
    <radialGradient id="bakeryGlow" cx="50%" cy="0%" r="90%"><stop offset="0" stop-color="#fff2b8" stop-opacity="0.7"/><stop offset="1" stop-color="#fff2b8" stop-opacity="0"/></radialGradient>
    <linearGradient id="bakeryCream" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f3dcc8"/><stop offset="0.4" stop-color="#fffaf2"/><stop offset="1" stop-color="#e6cbb4"/></linearGradient>
    <linearGradient id="bakeryPink" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f08fb0"/><stop offset="0.4" stop-color="#ffc7da"/><stop offset="1" stop-color="#d9739a"/></linearGradient>
    <linearGradient id="bakeryBeam" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff6d8" stop-opacity="0.45"/><stop offset="1" stop-color="#fff6d8" stop-opacity="0"/></linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#bakeryWall)"/>`;

  // Striped wallpaper with little dots
  s += '<g fill="#f3d2a2" opacity="0.6">';
  for (let x = 0; x < 800; x += 40) s += `<rect x="${x}" y="0" width="18" height="420"/>`;
  s += '</g><g fill="#e0a96a" opacity="0.5">';
  for (let k = 0; k < 40; k++) s += `<circle cx="${(random() * 800).toFixed(0)}" cy="${(random() * 410).toFixed(0)}" r="1.6"/>`;
  s += "</g>";

  // Window with the street outside
  s += `<rect x="32" y="42" width="196" height="216" rx="6" fill="url(#bakeryWood)"/>
    <rect x="44" y="54" width="172" height="192" fill="url(#bakerySky)"/>
    <circle cx="190" cy="86" r="18" fill="#ffe27a" opacity="0.9"/>`;
  if (!has("cloud")) {
    s += '<g fill="#fff" opacity="0.95"><ellipse cx="104" cy="100" rx="26" ry="9"/><ellipse cx="96" cy="92" rx="13" ry="10"/><ellipse cx="112" cy="90" rx="11" ry="9"/></g>';
  }
  s += `<path d="M44,246 L44,190 L74,170 L104,190 L104,246 Z M110,246 L110,176 L150,176 L150,246 Z M156,246 L156,196 L186,180 L216,196 L216,246 Z" fill="#c98a8a" opacity="0.7"/>
    <g fill="#fff6c8" opacity="0.8"><rect x="66" y="204" width="10" height="12"/><rect x="122" y="190" width="10" height="12"/><rect x="178" y="210" width="10" height="12"/></g>
    <path d="M130,54 V246 M44,150 H216" stroke="#7a4520" stroke-width="7"/>
    <rect x="24" y="256" width="212" height="12" rx="3" fill="url(#bakeryShelf)"/>
    <path d="M44,54 L216,54 L340,420 L120,420 Z" fill="url(#bakeryBeam)"/>`;

  // Pendant lamp with warm light
  s += `<path d="M340,0 V58" stroke="#3a2a1a" stroke-width="2"/>
    <ellipse cx="340" cy="230" rx="190" ry="200" fill="url(#bakeryGlow)"/>
    <path d="M314,98 Q314,62 340,58 Q366,62 366,98 Z" fill="${has("lampShade") ? "#2f7d6d" : "#b8322a"}"/>
    <ellipse cx="340" cy="98" rx="26" ry="5" fill="#fff4c0"/>`;

  // Shelves with bread, jars and croissants
  [170, 300].forEach(y => {
    s += `<rect x="462" y="${y}" width="330" height="12" rx="2" fill="url(#bakeryShelf)"/>
      <path d="M482,${y + 12} l0,16 l14,-16 Z M758,${y + 12} l0,16 l-14,-16 Z" fill="#7a4520"/>`;
  });
  s += loaf(505, 154);
  if (!has("shelfLoaf")) s += loaf(570, 154);
  [628, 664].forEach((x, k) => {
    s += `<rect x="${x - 15}" y="124" width="30" height="46" rx="6" fill="#dff1f5" fill-opacity="0.55" stroke="#fff" stroke-opacity="0.8" stroke-width="1.5"/>
      <g fill="${k ? "#8a4b16" : "#d48a35"}"><circle cx="${x - 5}" cy="160" r="6"/><circle cx="${x + 6}" cy="158" r="6"/><circle cx="${x}" cy="148" r="6"/></g>
      <rect x="${x - 17}" y="116" width="34" height="9" rx="2" fill="${k && has("jarLid") ? "#2f7d6d" : "#b8322a"}"/>`;
  });
  s += croissant(718, 158) + croissant(762, 158);
  if (!has("croissant")) s += croissant(740, 138);

  // Basket of baguettes and a long loaf on the lower shelf
  const baguettes = [[506, -12], [522, -4], [538, 6], [552, 14]];
  baguettes.forEach(([x, a], k) => {
    if (k === 2 && has("baguette")) return;
    s += `<g transform="rotate(${a},${x},290)"><rect x="${x! - 7}" y="208" width="14" height="86" rx="7" fill="url(#bakeryCrust)"/>
      <path d="M${x! - 4},222 l8,-5 M${x! - 4},240 l8,-5 M${x! - 4},258 l8,-5" stroke="#f6d59a" stroke-width="2"/></g>`;
  });
  s += `<path d="M490,262 L570,262 L562,300 L498,300 Z" fill="#c9965a" stroke="#8a5a2a" stroke-width="1.5"/>
    <path d="M494,274 H566 M496,287 H564" stroke="#8a5a2a" stroke-width="1.5" opacity="0.7"/>
    <ellipse cx="640" cy="282" rx="24" ry="17" fill="url(#bakeryCrust)"/>
    <ellipse cx="720" cy="284" rx="50" ry="16" fill="url(#bakeryCrust)"/>
    <path d="M690,280 l10,-8 M710,282 l10,-8 M730,282 l10,-8 M750,280 l8,-6" stroke="#f6d59a" stroke-width="2.5" stroke-linecap="round"/>`;

  // Counter with lettering and wheat ornaments
  s += `<rect y="410" width="800" height="190" fill="url(#bakeryWood)"/>
    <rect y="404" width="800" height="12" fill="#e9d2b0"/>
    <rect x="200" y="462" width="400" height="96" rx="8" fill="#4a2810" stroke="url(#gold)" stroke-width="3"/>
    <text x="400" y="526" text-anchor="middle" font-family="Georgia, serif" font-size="40" letter-spacing="6" fill="url(#gold)">BAKERY</text>
    <rect x="30" y="462" width="140" height="96" rx="8" fill="none" stroke="#3e200c" stroke-width="3"/>
    <rect x="630" y="462" width="140" height="96" rx="8" fill="none" stroke="#3e200c" stroke-width="3"/>`;
  const wheat = (x: number) => {
    let w = `<path d="M${x},540 V488" stroke="#e2b54a" stroke-width="2"/>`;
    for (let y = 492; y < 528; y += 9) w += `<ellipse cx="${x - 5}" cy="${y}" rx="5" ry="2.5" fill="#e2b54a" transform="rotate(-35,${x - 5},${y})"/><ellipse cx="${x + 5}" cy="${y}" rx="5" ry="2.5" fill="#e2b54a" transform="rotate(35,${x + 5},${y})"/>`;
    return w;
  };
  s += wheat(240);
  if (!has("wheat")) s += wheat(560);

  // Chalkboard price sign
  s += `<path d="M80,408 L100,330 M170,408 L150,330" stroke="#7a4520" stroke-width="5"/>
    <rect x="62" y="300" width="126" height="86" rx="4" fill="#2b3a33" stroke="#a5672f" stroke-width="6"/>
    <text x="125" y="330" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="17" fill="#f6f1e6">Fresh bread</text>
    <text x="125" y="366" text-anchor="middle" font-family="Georgia, serif" font-size="26" fill="#ffe27a">€${has("price") ? 5 : 3}</text>`;

  // Layered cake on a cake stand
  s += `<ellipse cx="340" cy="404" rx="54" ry="6" fill="#000" opacity="0.18"/>
    <path d="M326,404 L332,388 L348,388 L354,404 Z" fill="url(#bakeryCream)"/>
    <ellipse cx="340" cy="386" rx="86" ry="9" fill="url(#bakeryCream)" stroke="#d7bfa8"/>
    <rect x="272" y="330" width="136" height="54" rx="6" fill="url(#bakeryPink)"/>
    <rect x="272" y="350" width="136" height="7" fill="#fff6e8"/>
    <rect x="290" y="290" width="100" height="42" rx="6" fill="url(#bakeryCream)"/>
    <rect x="290" y="307" width="100" height="6" fill="#f08fb0"/>
    <rect x="308" y="258" width="64" height="34" rx="6" fill="url(#bakeryPink)"/>
    <path d="M272,334 q8,10 16,0 t16,0 t16,0 t16,0 t16,0 t16,0 t16,0 t16,0 t8,0" stroke="#fffaf2" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M308,262 q8,8 16,0 t16,0 t16,0 t16,0" stroke="#fffaf2" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  if (!has("cakeStrawberry")) {
    s += `<path d="M286,358 Q296,352 306,358 Q304,374 296,378 Q288,374 286,358 Z" fill="#e0263c"/>
      <path d="M288,357 L296,350 L304,357" stroke="#3f9a3f" stroke-width="3" fill="none"/>
      <g fill="#ffe27a"><circle cx="292" cy="364" r="1"/><circle cx="299" cy="363" r="1"/><circle cx="296" cy="370" r="1"/></g>`;
  }
  if (!has("cakeCherry")) {
    s += `<path d="M340,248 Q344,236 352,232" stroke="#4a6a1f" stroke-width="2" fill="none"/>
      <circle cx="340" cy="250" r="8" fill="#c8102e"/><circle cx="337" cy="247" r="2.4" fill="#fff" opacity="0.7"/>`;
  }

  // Cupcakes on the counter
  const palette = ["#ff5fa2", "#4fc3f7", "#ffe066", "#8be08b", "#ffffff"];
  CUPCAKES.forEach((x, k) => {
    let sprinkles = "";
    for (let j = 0; j < 7; j++) {
      const sx = x - 16 + random() * 32, sy = 346 + random() * 22, color = palette[Math.floor(random() * palette.length)]!;
      sprinkles += `<rect x="${sx.toFixed(1)}" y="${sy.toFixed(1)}" width="5" height="2" rx="1" fill="${color}" transform="rotate(${(random() * 180).toFixed(0)},${sx.toFixed(1)},${sy.toFixed(1)})"/>`;
    }
    const frosting = k === 1 ? (has("frosting") ? "#a6e3c8" : "#fff0f5") : ["#ffd1e2", "#fff0f5", "#c9a0dc", "#ffe8c2"][k]!;
    s += cupcake(x, frosting, sprinkles);
  });
  if (!has("candle")) {
    const x = CUPCAKES[3]!;
    s += `<rect x="${x - 3}" y="318" width="6" height="24" fill="#4fc3f7" stroke="#fff" stroke-width="1"/>
      <path d="M${x},304 Q${x + 6},312 ${x},318 Q${x - 6},312 ${x},304 Z" fill="#ffb02e" filter="url(#glow)"/>`;
  }
  return s;
}

function bakeryDifferences(): Difference[] {
  return [
    { id: "cloud", x: 104, y: 96, r: 30 },
    { id: "lampShade", x: 340, y: 80, r: 26 },
    { id: "shelfLoaf", x: 570, y: 150, r: 30 },
    { id: "jarLid", x: 664, y: 120, r: 16 },
    { id: "croissant", x: 740, y: 138, r: 26 },
    { id: "baguette", x: 540, y: 232, r: 22 },
    { id: "price", x: 125, y: 357, r: 18 },
    { id: "cakeCherry", x: 342, y: 244, r: 14 },
    { id: "cakeStrawberry", x: 296, y: 364, r: 18 },
    { id: "frosting", x: CUPCAKES[1]!, y: 360, r: 26 },
    { id: "candle", x: CUPCAKES[3]!, y: 320, r: 18 },
    { id: "wheat", x: 560, y: 512, r: 30 },
  ];
}

export const bakery: Scene = { name: "The Bakery", draw: drawBakery, differences: bakeryDifferences() };
