// Scene: The Toy Room
import { seeded, starPath } from "./helpers";
import type { Has, Difference, Scene } from "./types";

const FLOOR = 400;

// Letter block seen slightly from above: front face, top and right side
function block(x: number, y: number, size: number, fill: string, letter: string): string {
  const d = size * 0.28;
  return `<path d="M${x},${y} l${d},${-d} h${size} l${-d},${d} Z" fill="#fff" opacity="0.55"/>
    <path d="M${x + size},${y} l${d},${-d} v${size} l${-d},${d} Z" fill="${fill}" opacity="0.7"/>
    <rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${fill}" stroke="#fff" stroke-width="3"/>
    <text x="${x + size / 2}" y="${y + size * 0.74}" font-family="Arial Rounded MT Bold, Arial, sans-serif" font-weight="bold" font-size="${size * 0.7}" fill="#fff" text-anchor="middle">${letter}</text>`;
}

function drawToys(has: Has): string {
  const random = seeded(3030);
  let s = `<defs>
    <linearGradient id="toysWall" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#bfe4f4"/><stop offset="1" stop-color="#e2f2f8"/>
    </linearGradient>
    <linearGradient id="toysFloor" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#d8a868"/><stop offset="1" stop-color="#a8743e"/>
    </linearGradient>
    <linearGradient id="toysSky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#5ab4f0"/><stop offset="1" stop-color="#c8ecff"/>
    </linearGradient>
    <linearGradient id="toysWood" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#e8b878"/><stop offset="1" stop-color="#b07a42"/>
    </linearGradient>
    <radialGradient id="toysFur" cx="40%" cy="35%" r="70%">
      <stop offset="0" stop-color="#e8b070"/><stop offset="1" stop-color="#a86a30"/>
    </radialGradient>
    <linearGradient id="toysMetal" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#8a9aa8"/><stop offset="0.45" stop-color="#e8f0f6"/><stop offset="1" stop-color="#7a8a98"/>
    </linearGradient>
    <radialGradient id="toysShine" cx="35%" cy="30%" r="70%">
      <stop offset="0" stop-color="#fff" stop-opacity="0.6"/><stop offset="0.5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.2"/>
    </radialGradient>
  </defs>
  <rect width="800" height="${FLOOR}" fill="url(#toysWall)"/>`;

  // Polka-dot wallpaper, skirting board and wooden floorboards
  s += '<g fill="#fff" opacity="0.5">';
  for (let y = 20; y < FLOOR; y += 40) for (let x = (y / 40) % 2 ? 20 : 0; x < 800; x += 40) s += `<circle cx="${x}" cy="${y}" r="4"/>`;
  s += `</g><rect y="${FLOOR}" width="800" height="200" fill="url(#toysFloor)"/><rect y="${FLOOR - 10}" width="800" height="12" fill="#fff"/>
    <g stroke="#8a5a2e" stroke-width="1.5" opacity="0.5">${[430, 470, 520, 575].map(y => `<line x1="0" y1="${y}" x2="800" y2="${y}"/>`).join("")}</g>`;

  // Window with the sun and a cloud
  s += `<rect x="50" y="50" width="200" height="180" fill="url(#toysSky)"/>
    <circle cx="104" cy="104" r="26" fill="#ffd84a"/>${[0, 1, 2, 3, 4, 5, 6, 7].map(k => { const a = k * Math.PI / 4; return `<line x1="${(104 + 32 * Math.cos(a)).toFixed(1)}" y1="${(104 + 32 * Math.sin(a)).toFixed(1)}" x2="${(104 + 42 * Math.cos(a)).toFixed(1)}" y2="${(104 + 42 * Math.sin(a)).toFixed(1)}" stroke="#ffd84a" stroke-width="4" stroke-linecap="round"/>`; }).join("")}
    <path d="M50,200 Q120,180 180,196 T250,190 V230 H50 Z" fill="#7ac85a"/>`;
  if (!has("windowCloud")) s += '<g fill="#fff"><ellipse cx="196" cy="150" rx="28" ry="11"/><circle cx="186" cy="142" r="11"/><circle cx="202" cy="138" r="13"/></g>';
  s += `<rect x="50" y="50" width="200" height="180" fill="none" stroke="#fff" stroke-width="10"/><path d="M150,50 V230 M50,140 H250" stroke="#fff" stroke-width="7"/>
    <rect x="40" y="228" width="220" height="12" rx="3" fill="#f4f4f4"/>
    <path d="M30,36 Q50,140 30,250 H58 Q48,140 58,36 Z M270,36 Q250,140 270,250 H242 Q252,140 242,36 Z" fill="#ff8aa8"/>
    <rect x="22" y="30" width="256" height="8" rx="4" fill="#c86a3a"/>`;

  // Kite pinned to the wall with its tail of bows
  const kite = has("kiteColor") ? "#3ac85a" : "#ffd040";
  s += `<path d="M400,70 L436,114 L400,104 Z" fill="${kite}"/><path d="M400,70 L364,114 L400,104 Z" fill="#e8403a"/>
    <path d="M364,114 L400,164 L400,104 Z" fill="#3a8ad8"/><path d="M436,114 L400,164 L400,104 Z" fill="#e8403a"/>
    <path d="M400,70 V164 M364,114 L436,114" stroke="#7a4a22" stroke-width="2"/>
    <path d="M400,164 Q380,190 404,214 T398,262" stroke="#7a4a22" stroke-width="1.5" fill="none"/>
    ${[[392, 186, "#3a8ad8"], [404, 214, "#ffd040"], [400, 240, "#e8403a"]].map(([x, y, c]) => `<path d="M${x},${y} l-9,-6 v12 Z M${x},${y} l9,-6 v12 Z" fill="${c}"/>`).join("")}`;

  // Shelf with a ball, a toy car, books and a rubber duck
  s += `<rect x="510" y="150" width="270" height="10" rx="2" fill="url(#toysWood)"/><path d="M530,160 l10,20 M760,160 l-10,20" stroke="#8a5a2e" stroke-width="5"/>`;
  if (!has("shelfBall")) s += '<circle cx="548" cy="130" r="20" fill="#3ab0e8"/><path d="M528,130 Q548,122 568,130 M548,110 Q540,130 548,150" stroke="#fff" stroke-width="3" fill="none"/><circle cx="548" cy="130" r="20" fill="url(#toysShine)"/>';
  if (!has("shelfCar")) s += '<path d="M600,144 v-12 l10,-10 h24 l10,10 h8 v12 Z" fill="#e8403a"/><rect x="612" y="125" width="10" height="7" fill="#c8ecff"/><rect x="625" y="125" width="8" height="7" fill="#c8ecff"/><circle cx="612" cy="145" r="5" fill="#2a2a2a"/><circle cx="640" cy="145" r="5" fill="#2a2a2a"/>';
  s += ["#8a4ac8", "#3ac85a", "#ff8a3a", "#3a8ad8"].map((c, k) => `<rect x="${674 + k * 12}" y="${104 + (k % 2) * 6}" width="11" height="${46 - (k % 2) * 6}" fill="${c}" stroke="#fff" stroke-width="1"/>`).join("")
    + '<g transform="translate(748,136)"><ellipse cx="0" cy="4" rx="16" ry="10" fill="#ffd040"/><circle cx="6" cy="-10" r="9" fill="#ffd040"/><path d="M14,-10 l8,2 l-8,3 Z" fill="#ff8a3a"/><circle cx="8" cy="-12" r="1.8" fill="#111"/></g>';

  // Doll house
  s += `<rect x="590" y="300" width="190" height="140" fill="#fff0d8" stroke="#c8885a" stroke-width="3"/>
    <path d="M574,306 L685,222 L796,306 Z" fill="#e85a6a" stroke="#a83a4a" stroke-width="3" stroke-linejoin="round"/>
    <circle cx="685" cy="272" r="12" fill="#c8ecff" stroke="#fff" stroke-width="3"/>`;
  if (!has("dollChimney")) s += '<rect x="730" y="236" width="20" height="36" fill="#c8885a" stroke="#8a5a2e" stroke-width="2"/><rect x="726" y="232" width="28" height="7" fill="#8a5a2e"/>';
  s += [[606, 330], [728, 330]].map(([x, y]) => `<rect x="${x}" y="${y}" width="40" height="32" fill="#ffe89a" stroke="#fff" stroke-width="4"/><path d="M${x! + 20},${y} v32 M${x},${y! + 16} h40" stroke="#fff" stroke-width="2"/><rect x="${x! - 4}" y="${y! + 32}" width="48" height="7" fill="#7ac85a"/>`).join("");
  const door = has("dollDoor") ? "#3a8ad8" : "#c8303a";
  s += `<path d="M664,440 V398 Q685,380 706,398 V440 Z" fill="${door}" stroke="#fff" stroke-width="3"/><circle cx="698" cy="420" r="2.5" fill="#ffd040"/>`;

  // Rocking horse
  const saddle = has("horseSaddle") ? "#3a8ad8" : "#c8303a";
  s += `<path d="M60,446 Q150,486 250,440" stroke="#b07a42" stroke-width="10" fill="none" stroke-linecap="round"/>
    <path d="M104,372 L86,456 M124,374 L118,464 M178,374 L184,464 M196,370 L214,454" stroke="#e8e0d0" stroke-width="10" stroke-linecap="round"/>
    <ellipse cx="150" cy="360" rx="58" ry="26" fill="#f4ece0" stroke="#c8b8a0" stroke-width="2"/>
    <path d="M186,350 L210,298 L234,302 L214,360 Z" fill="#f4ece0" stroke="#c8b8a0" stroke-width="2"/>
    <path d="M204,296 Q224,282 248,296 Q256,312 242,316 L216,312 Z" fill="#f4ece0" stroke="#c8b8a0" stroke-width="2"/>
    <circle cx="228" cy="296" r="3" fill="#2a2a2a"/><path d="M208,290 l4,-12 l6,10 Z" fill="#f4ece0" stroke="#c8b8a0"/>
    <path d="M208,294 Q196,320 190,344 M212,300 Q200,326 194,350" stroke="#8a5a2e" stroke-width="7" fill="none" stroke-linecap="round"/>
    <path d="M94,352 Q70,370 78,404" stroke="#8a5a2e" stroke-width="8" fill="none" stroke-linecap="round"/>
    <path d="M120,340 Q148,330 176,340 L172,362 Q148,370 124,362 Z" fill="${saddle}"/>
    <path d="M232,304 Q200,330 170,346" stroke="#ffd040" stroke-width="2" fill="none"/>`;

  // Rug with a road and a little car on it
  s += `<ellipse cx="420" cy="508" rx="270" ry="72" fill="#7ac85a" stroke="#5aa83a" stroke-width="6"/>
    <ellipse cx="420" cy="508" rx="210" ry="48" fill="none" stroke="#5a5a62" stroke-width="22"/>
    <ellipse cx="420" cy="508" rx="210" ry="48" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="10 8"/>
    <rect x="560" y="530" width="30" height="14" rx="4" fill="#ffd040"/><circle cx="566" cy="546" r="4" fill="#2a2a2a"/><circle cx="584" cy="546" r="4" fill="#2a2a2a"/>`;
  for (let k = 0; k < 10; k++) s += `<circle cx="${(260 + random() * 320).toFixed(0)}" cy="${(492 + random() * 30).toFixed(0)}" r="3" fill="#5aa83a"/>`;

  // Teddy bear sitting by the wall
  s += `<g fill="url(#toysFur)"><ellipse cx="300" cy="404" rx="36" ry="42"/><circle cx="270" cy="304" r="12"/><circle cx="330" cy="304" r="12"/><circle cx="300" cy="330" r="32"/>
    <ellipse cx="266" cy="398" rx="11" ry="22" transform="rotate(20,266,398)"/><ellipse cx="334" cy="398" rx="11" ry="22" transform="rotate(-20,334,398)"/>
    <ellipse cx="276" cy="442" rx="16" ry="12"/><ellipse cx="324" cy="442" rx="16" ry="12"/></g>
    <ellipse cx="300" cy="412" rx="20" ry="24" fill="#f4d8b0"/><circle cx="270" cy="304" r="6" fill="#f4d8b0"/><circle cx="330" cy="304" r="6" fill="#f4d8b0"/>
    <ellipse cx="300" cy="342" rx="13" ry="10" fill="#f4d8b0"/><ellipse cx="300" cy="337" rx="5" ry="3.5" fill="#3a2010"/>
    <circle cx="288" cy="322" r="3.5" fill="#2a1a10"/><circle cx="312" cy="322" r="3.5" fill="#2a1a10"/><path d="M294,346 Q300,351 306,346" stroke="#3a2010" stroke-width="1.5" fill="none"/>`;
  if (!has("teddyBow")) s += '<path d="M300,366 L282,356 V376 Z M300,366 L318,356 V376 Z" fill="#c8303a"/><circle cx="300" cy="366" r="5" fill="#a8202a"/>';

  // Building blocks with letters
  s += block(352, 478, 40, "#e8403a", "A") + block(398, 478, 40, "#3a8ad8", "C") + block(375, 432, 40, "#3ac85a", has("blockLetter") ? "D" : "B");

  // Toy robot
  if (!has("robotAntenna")) s += '<line x1="530" y1="390" x2="530" y2="368" stroke="#5a6a78" stroke-width="3"/><circle cx="530" cy="364" r="6" fill="#e8403a"/>';
  s += `<rect x="510" y="390" width="40" height="32" rx="6" fill="url(#toysMetal)" stroke="#5a6a78" stroke-width="2"/>
    <circle cx="521" cy="404" r="5" fill="#3ac8f0"/><circle cx="539" cy="404" r="5" fill="#3ac8f0"/><rect x="520" y="413" width="20" height="4" fill="#5a6a78"/>
    <rect x="504" y="426" width="52" height="44" rx="4" fill="url(#toysMetal)" stroke="#5a6a78" stroke-width="2"/>
    <rect x="516" y="436" width="28" height="16" rx="2" fill="#2a3a48"/><circle cx="523" cy="444" r="3" fill="#7af07a"/><circle cx="537" cy="444" r="3" fill="#ffd040"/>
    <path d="M504,434 L492,456 M556,434 L568,456" stroke="#8a9aa8" stroke-width="8" stroke-linecap="round"/>
    <rect x="512" y="470" width="12" height="16" fill="#5a6a78"/><rect x="536" y="470" width="12" height="16" fill="#5a6a78"/>`;

  // Spinning top
  const stripe = has("topStripe") ? "#3ac85a" : "#3a8ad8";
  s += `<ellipse cx="712" cy="546" rx="22" ry="4" fill="#7a4a22" opacity="0.4"/>
    <path d="M684,512 Q712,496 740,512 L712,546 Z" fill="#e8403a"/><path d="M688,516 Q712,504 736,516 L730,523 Q712,514 694,523 Z" fill="${stripe}"/>
    <rect x="708" y="494" width="8" height="14" rx="3" fill="#ffd040"/><path d="M676,500 q-8,8 0,16 M748,500 q8,8 0,16" stroke="#7a4a22" stroke-width="1.5" fill="none" opacity="0.6"/>`;

  // Toy train on its track at the front
  s += `<path d="M0,586 H540" stroke="#8a5a2e" stroke-width="4"/>${Array.from({ length: 27 }, (_, k) => `<rect x="${k * 20 + 4}" y="582" width="10" height="10" fill="#b07a42"/>`).join("")}
    <path d="M0,580 H540" stroke="#b8c0c8" stroke-width="3"/>
    <rect x="40" y="540" width="56" height="34" rx="4" fill="#3a8ad8"/><rect x="80" y="520" width="34" height="54" rx="3" fill="#e8403a"/><rect x="86" y="528" width="22" height="16" fill="#c8ecff"/>
    <rect x="50" y="524" width="12" height="18" fill="#2a2a2a"/><path d="M34,574 l8,-14 v14 Z" fill="#ffd040"/>
    <g fill="#fff" opacity="0.8"><circle cx="58" cy="512" r="7"/><circle cx="50" cy="498" r="9"/><circle cx="62" cy="484" r="10"/></g>`;
  const wagons: [number, string][] = [[128, "#ffd040"], [192, "#3ac85a"]];
  wagons.forEach(([x, c], k) => {
    if (k === 1 && has("wagon")) return;
    s += `<rect x="${x}" y="546" width="54" height="28" rx="3" fill="${c}"/><path d="M${x - 6},566 h6" stroke="#5a5a62" stroke-width="3"/>
      ${k === 0 ? `<g fill="#e8403a"><circle cx="${x + 14}" cy="542" r="8"/><path d="${starPath(x + 38, 540, 9, 4, 5)}" fill="#3a8ad8"/></g>` : `<rect x="${x + 8}" y="534" width="38" height="12" fill="#8a5a2e"/>`}`;
  });
  s += [56, 84, 104, 140, 170, 204, 234].map(x => `<circle cx="${x}" cy="576" r="7" fill="#2a2a2a"/><circle cx="${x}" cy="576" r="2.5" fill="#b8c0c8"/>`).filter((_, k) => !(k >= 5 && has("wagon"))).join("");
  // Beach ball on the floor
  s += `<circle cx="640" cy="566" r="22" fill="#fff"/><path d="M640,544 A22,22 0 0,1 662,566 L640,566 Z" fill="#e8403a"/><path d="M618,566 A22,22 0 0,0 640,588 V566 Z" fill="#3a8ad8"/>
    <path d="M640,544 A22,22 0 0,0 618,566 L640,566 Z" fill="#ffd040"/><circle cx="640" cy="566" r="22" fill="url(#toysShine)"/>`;
  return s;
}

function toysDifferences(): Difference[] {
  return [
    { id: "windowCloud", x: 196, y: 146, r: 30 },
    { id: "kiteColor", x: 420, y: 98, r: 22 },
    { id: "shelfBall", x: 548, y: 130, r: 24 },
    { id: "shelfCar", x: 626, y: 136, r: 24 },
    { id: "dollChimney", x: 740, y: 252, r: 22 },
    { id: "dollDoor", x: 685, y: 414, r: 28 },
    { id: "horseSaddle", x: 148, y: 350, r: 30 },
    { id: "teddyBow", x: 300, y: 366, r: 20 },
    { id: "blockLetter", x: 396, y: 446, r: 24 },
    { id: "robotAntenna", x: 530, y: 374, r: 16 },
    { id: "topStripe", x: 712, y: 516, r: 26 },
    { id: "wagon", x: 219, y: 558, r: 34 },
  ];
}

export const toys: Scene = { name: "The Toy Room", draw: drawToys, differences: toysDifferences() };
