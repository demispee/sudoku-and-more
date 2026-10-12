// Scene: The Music Room
import { seeded, sparkle, SHARED_DEFS } from "./helpers";
import type { Has, Difference, Scene } from "./types";

// Floating notes: [x, y, beamed pair?]
const NOTES: [number, number, boolean][] = [[205, 205, false], [455, 205, false], [520, 150, true], [592, 190, false], [700, 170, true], [235, 150, true]];
const LOST_NOTE = 2;

function note(x: number, y: number, beamed: boolean, fill: string): string {
  const head = (hx: number, hy: number): string => `<ellipse cx="${hx}" cy="${hy}" rx="7" ry="5" fill="${fill}" transform="rotate(-25,${hx},${hy})"/>`;
  if (beamed) {
    return `<g filter="url(#glow)">${head(x, y + 10)}${head(x + 22, y + 6)}
      <path d="M${x + 6},${y + 9} V${y - 16} M${x + 28},${y + 5} V${y - 20}" stroke="${fill}" stroke-width="2.5"/>
      <path d="M${x + 5},${y - 18} L${x + 29},${y - 22} L${x + 29},${y - 16} L${x + 5},${y - 12} Z" fill="${fill}"/></g>`;
  }
  return `<g filter="url(#glow)">${head(x, y + 8)}<path d="M${x + 6},${y + 7} V${y - 18}" stroke="${fill}" stroke-width="2.5"/>
    <path d="M${x + 6},${y - 18} q4,8 12,10 q-4,4 -2,12 q-2,-8 -10,-10" fill="${fill}"/></g>`;
}

function drawMusic(has: Has): string {
  const random = seeded(808);
  let s = `<defs>${SHARED_DEFS}
    <linearGradient id="musicWall" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#4a1a2c"/><stop offset="1" stop-color="#7a2e3e"/>
    </linearGradient>
    <linearGradient id="musicPanel" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#6a3c22"/><stop offset="1" stop-color="#3c2012"/>
    </linearGradient>
    <linearGradient id="musicFloor" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#7a4c28"/><stop offset="1" stop-color="#b07a46"/>
    </linearGradient>
    <linearGradient id="musicDusk" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1c2558"/><stop offset="0.6" stop-color="#6b4a8a"/><stop offset="1" stop-color="#f09a64"/>
    </linearGradient>
    <linearGradient id="musicVelvet" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#2a5a4a"/><stop offset="0.5" stop-color="#3f8a6e"/><stop offset="1" stop-color="#1c4436"/>
    </linearGradient>
    <linearGradient id="musicPiano" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#4a4a56"/><stop offset="0.3" stop-color="#16161c"/><stop offset="1" stop-color="#050508"/>
    </linearGradient>
    <linearGradient id="musicLid" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#3c3c48"/><stop offset="1" stop-color="#0c0c12"/>
    </linearGradient>
    <linearGradient id="musicWood" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#8a5228"/><stop offset="1" stop-color="#4e2a12"/>
    </linearGradient>
    <linearGradient id="musicCopper" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffc0a0"/><stop offset="0.45" stop-color="#c0603a"/><stop offset="1" stop-color="#6a2410"/>
    </linearGradient>
    <radialGradient id="musicVarnish" cx="40%" cy="35%" r="70%">
      <stop offset="0" stop-color="#f0a040"/><stop offset="1" stop-color="#7a2e0c"/>
    </radialGradient>
    <radialGradient id="musicHoney" cx="40%" cy="40%" r="70%">
      <stop offset="0" stop-color="#ffd890"/><stop offset="1" stop-color="#b8661e"/>
    </radialGradient>
    <radialGradient id="musicBurst" cx="40%" cy="40%" r="70%">
      <stop offset="0" stop-color="#f08060"/><stop offset="1" stop-color="#5a1010"/>
    </radialGradient>
    <linearGradient id="musicDrum" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#8a1020"/><stop offset="0.4" stop-color="#e83a48"/><stop offset="1" stop-color="#6a0a18"/>
    </linearGradient>
    <radialGradient id="musicLampGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#ffe2a0" stop-opacity="0.55"/><stop offset="1" stop-color="#ffe2a0" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="800" height="600" fill="url(#musicWall)"/>`;

  // Striped damask wallpaper, wainscot and floor
  for (let x = 10; x < 800; x += 40) s += `<rect x="${x}" y="0" width="14" height="340" fill="#fff" opacity="0.04"/>`;
  for (let k = 0; k < 40; k++) {
    const x = 30 + Math.floor(random() * 19) * 40 + 7, y = 20 + random() * 300;
    s += `<path d="M${x},${(y - 5).toFixed(0)} l4,5 l-4,5 l-4,-5 Z" fill="#e2b54a" opacity="0.18"/>`;
  }
  s += `<rect y="336" width="800" height="114" fill="url(#musicPanel)"/><rect y="332" width="800" height="8" fill="#a0683a"/>
    <g fill="none" stroke="#2a140a" stroke-width="2" opacity="0.6">${[0, 1, 2, 3, 4, 5, 6, 7].map(k => `<rect x="${k * 100 + 12}" y="352" width="76" height="80" rx="3"/>`).join("")}</g>
    <rect y="440" width="800" height="12" fill="#2a140a"/>
    <rect y="450" width="800" height="150" fill="url(#musicFloor)"/>
    <g stroke="#4e2c14" stroke-width="1.5" opacity="0.6">`;
  [470, 494, 524, 560].forEach((y, k) => {
    s += `<line x1="0" y1="${y}" x2="800" y2="${y}"/>`;
    for (let n = 0; n < 4; n++) {
      const x = (random() * 800).toFixed(0);
      s += `<line x1="${x}" y1="${[450, 470, 494, 524][k]}" x2="${x}" y2="${y}"/>`;
    }
  });
  s += "</g>";

  // Window with a dusky sky between velvet curtains
  s += `<rect x="252" y="42" width="156" height="216" fill="#e8dcc4"/><rect x="260" y="50" width="140" height="200" fill="url(#musicDusk)"/>
    <path d="M260,250 L260,214 Q300,196 340,212 Q372,200 400,208 L400,250 Z" fill="#2a2040"/>
    <path d="M365,76 A16,16 0 1,0 383,100 A13,13 0 1,1 365,76 Z" fill="#fff3c4" filter="url(#glow)"/>
    ${sparkle(330, 128, 5)}<circle cx="282" cy="160" r="1.5" fill="#fff"/><circle cx="350" cy="62" r="1.2" fill="#fff"/>`;
  if (!has("windowStar")) s += sparkle(300, 85, 9);
  s += `<path d="M330,50 V250 M260,150 H400" stroke="#e8dcc4" stroke-width="6"/><rect x="246" y="254" width="168" height="10" fill="#d6c6a8"/>`;
  s += `<path d="M216,40 H286 Q262,130 252,180 Q262,250 274,332 H216 Z" fill="url(#musicVelvet)"/>
    <path d="M444,40 H374 Q398,130 408,180 Q398,250 386,332 H444 Z" fill="url(#musicVelvet)"/>
    <path d="M232,44 Q236,150 232,330 M258,44 Q240,120 244,180 M428,44 Q424,150 428,330 M402,44 Q420,120 416,180" stroke="#173a2e" stroke-width="2" fill="none"/>
    <rect x="206" y="28" width="248" height="8" rx="4" fill="url(#gold)"/>
    <path d="M210,36 H450 V54 Q430,68 410,54 Q390,68 370,54 Q350,68 330,54 Q310,68 290,54 Q270,68 250,54 Q230,68 210,54 Z" fill="#2f6a56"/>
    <path d="M240,178 Q252,186 262,176 M398,176 Q408,186 420,178" stroke="url(#gold)" stroke-width="4" fill="none"/>
    <path d="M262,180 l-4,18 h8 Z M398,180 l-4,18 h8 Z" fill="#e2b54a"/>`;

  // Framed pictures: a landscape, a composer's portrait and a seascape
  s += `<rect x="66" y="66" width="108" height="98" fill="url(#gold)"/><rect x="74" y="74" width="92" height="82" fill="#9fd0f0"/>
    <path d="M74,128 Q100,108 126,124 Q148,110 166,120 V156 H74 Z" fill="#5f9a48"/><path d="M74,142 Q120,132 166,146 V156 H74 Z" fill="#3f7a34"/>`;
  if (!has("pictureSun")) s += '<circle cx="145" cy="96" r="9" fill="#ffd23f"/>';
  s += `<ellipse cx="635" cy="95" rx="36" ry="45" fill="url(#gold)"/>
    <ellipse cx="635" cy="95" rx="28" ry="37" fill="${has("portrait") ? "#2b3f7a" : "#2f6a5a"}"/>
    <path d="M610,130 Q612,108 628,104 Q620,94 624,82 Q630,70 642,74 Q652,80 648,94 Q646,100 640,104 Q658,108 660,130 Z" fill="#14100c"/>
    <path d="M626,78 q-6,4 -4,12 M644,76 q6,4 4,12" stroke="#f4eee0" stroke-width="5" stroke-linecap="round" fill="none"/>
    <rect x="688" y="66" width="96" height="78" fill="url(#gold)"/><rect x="695" y="73" width="82" height="64" fill="#f0c890"/>
    <path d="M695,112 Q736,104 777,112 V137 H695 Z" fill="#3a78a8"/><path d="M730,110 L730,84 L748,108 Z" fill="#fff"/><path d="M722,110 H752 L746,116 H728 Z" fill="#6a3a1a"/>`;

  // Floor lamp
  s += `<circle cx="36" cy="225" r="80" fill="url(#musicLampGlow)"/>
    <path d="M36,236 V446" stroke="#c89a40" stroke-width="5"/><path d="M35,236 V446" stroke="#fff1b8" stroke-width="1.5"/><ellipse cx="36" cy="448" rx="22" ry="6" fill="#8c6418"/>
    <path d="M20,192 H52 L64,238 H8 Z" fill="${has("lampShade") ? "#5aa88a" : "#f6dca0"}" stroke="#c89a40" stroke-width="2"/>
    <path d="M8,238 H64" stroke="#c89a40" stroke-width="4"/>`;

  // Cabinet with the gramophone and metronome
  s += `<rect x="72" y="356" width="136" height="9" rx="2" fill="#5e3216"/><rect x="78" y="364" width="124" height="82" fill="url(#musicWood)"/>
    <rect x="86" y="372" width="50" height="66" fill="none" stroke="#3a1c0a" stroke-width="2"/><rect x="144" y="372" width="50" height="66" fill="none" stroke="#3a1c0a" stroke-width="2"/>
    <circle cx="130" cy="405" r="3" fill="#e2b54a"/><circle cx="150" cy="405" r="3" fill="#e2b54a"/>
    <path d="M84,446 v6 M196,446 v6" stroke="#3a1c0a" stroke-width="5"/>
    <rect x="96" y="330" width="66" height="26" fill="url(#musicWood)" stroke="#e2b54a" stroke-width="1.5"/>
    <ellipse cx="129" cy="330" rx="29" ry="6" fill="#141414"/><ellipse cx="129" cy="330" rx="7" ry="2" fill="#d6303a"/>
    <path d="M141,306 Q152,284 150.3,232 L205.7,264 Q160,290 149,310 Z" fill="url(#${has("gramophoneHorn") ? "musicCopper" : "gold"})"/>
    <ellipse cx="178" cy="248" rx="32" ry="11" fill="url(#${has("gramophoneHorn") ? "musicCopper" : "gold"})" transform="rotate(30,178,248)"/>
    <ellipse cx="178" cy="248" rx="25" ry="7" fill="#3a2008" transform="rotate(30,178,248)"/>
    <path d="M146,308 Q150,322 136,328" stroke="#8c6418" stroke-width="4" fill="none"/>
    <path d="M172,356 L198,356 L190,314 L180,314 Z" fill="url(#musicWood)" stroke="#3a1c0a"/>`;
  const tilt = has("metronome") ? 24 : -24;
  s += `<g transform="rotate(${tilt},185,350)"><line x1="185" y1="350" x2="185" y2="306" stroke="#f0d070" stroke-width="2.5"/><rect x="180" y="318" width="10" height="8" rx="1" fill="#f0d070" stroke="#5a3a10"/></g>`;

  // Violin on its stand with the bow leaning beside it
  s += `<path d="M245,452 L224,472 M245,452 L266,472 M245,452 V474" stroke="#2a2a2e" stroke-width="3"/>
    <path d="M226,446 Q245,458 264,446" stroke="#2a2a2e" stroke-width="4" fill="none"/>
    <path d="M245,370 C262,370 265,382 262,394 C258,402 256,408 262,414 C270,424 268,448 245,450 C222,448 220,424 228,414 C234,408 232,402 228,394 C225,382 228,370 245,370 Z" fill="url(#musicVarnish)" stroke="#4a1a06" stroke-width="1.5"/>
    <path d="M236,408 q-3,6 0,10 q3,4 0,10 M254,408 q3,6 0,10 q-3,4 0,10" stroke="#2a0c02" stroke-width="1.6" fill="none"/>
    <rect x="241" y="328" width="8" height="78" rx="2" fill="#1a1210"/><rect x="242" y="316" width="6" height="16" fill="#5a2a0c"/>
    <circle cx="245" cy="314" r="5" fill="#6a3010" stroke="#2a0c02"/>
    <path d="M240,422 H250 M241,428 L249,428 L247,446 L243,446 Z" stroke="#e8d4a8" stroke-width="2" fill="#141010"/>
    <path d="M243,330 V430 M244.4,330 V430 M245.8,330 V430 M247.2,330 V430" stroke="#ddd" stroke-width="0.5"/>`;
  if (!has("violinBow")) s += '<path d="M268,462 L290,380" stroke="#4a2410" stroke-width="2.5"/><path d="M271,456 L291,384" stroke="#f4eee0" stroke-width="1"/><rect x="265" y="452" width="7" height="12" fill="#141010" transform="rotate(15,268,458)"/>';

  // Music stand with two pages
  s += `<path d="M345,334 V466 M345,466 L325,474 M345,466 L365,474" stroke="#2a2a2e" stroke-width="4"/>
    <rect x="304" y="282" width="82" height="54" fill="#2a2a2e"/><rect x="302" y="332" width="86" height="6" fill="#141418"/>
    <rect x="309" y="286" width="35" height="44" fill="#fbf4e2"/>`;
  if (!has("sheetPage")) s += '<rect x="346" y="286" width="35" height="44" fill="#fbf4e2"/>';
  for (let k = 0; k < 4; k++) {
    s += `<path d="M312,${292 + k * 10} h29${has("sheetPage") ? "" : ` M349,${292 + k * 10} h29`}" stroke="#7a6a5a" stroke-width="0.8"/>`;
    const nx = 315 + random() * 22, mx = 352 + random() * 22;
    s += `<circle cx="${nx.toFixed(1)}" cy="${292 + k * 10}" r="1.6" fill="#222"/>${has("sheetPage") ? "" : `<circle cx="${mx.toFixed(1)}" cy="${292 + k * 10 - 2}" r="1.6" fill="#222"/>`}`;
  }

  // Grand piano with the lid propped open
  s += `<ellipse cx="590" cy="472" rx="160" ry="10" fill="#2a140a" opacity="0.45"/>
    <path d="M598,380 V462" stroke="#0a0a0e" stroke-width="12"/>
    <path d="M462,330 L732,330 Q742,262 680,222 Q590,178 462,330 Z" fill="url(#musicLid)" stroke="#e2b54a" stroke-width="1.5"/>
    <path d="M640,330 L662,232" stroke="#1a1a20" stroke-width="5"/>
    <path d="M474,300 L530,300 L524,330 L470,330 Z" fill="#141418"/><path d="M482,304 L522,304 L518,326 L478,326 Z" fill="#fbf4e2"/>
    <path d="M486,310 h32 M485,316 h32 M484,322 h32" stroke="#7a6a5a" stroke-width="0.8"/>
    <rect x="448" y="328" width="286" height="54" rx="4" fill="url(#musicPiano)"/>
    <path d="M454,334 H728" stroke="#fff" stroke-width="1.5" opacity="0.3"/>
    <text x="590" y="362" text-anchor="middle" font-family="Georgia, serif" font-size="11" fill="#e2b54a" letter-spacing="2">GRANDIOSO</text>
    <rect x="416" y="338" width="36" height="26" fill="#16161c"/><rect x="418" y="340" width="34" height="7" fill="#fbf8ee"/>
    ${[422, 430, 438, 446].map(x => `<rect x="${x}" y="340" width="4" height="4" fill="#111"/>`).join("")}
    <path d="M470,382 L476,462 M712,382 L706,462" stroke="#3a3a44" stroke-width="15"/>
    <path d="M470,382 L476,462 M712,382 L706,462" stroke="#0a0a0e" stroke-width="12"/>
    <circle cx="476" cy="464" r="5" fill="#e2b54a"/><circle cx="706" cy="464" r="5" fill="#e2b54a"/>
    <path d="M512,382 V448 M528,382 V448" stroke="#0a0a0e" stroke-width="4"/><rect x="506" y="446" width="28" height="6" fill="#141418"/>
    <path d="M508,452 h6 M517,452 h6 M526,452 h6" stroke="#e2b54a" stroke-width="3"/>`;

  // Floating music notes
  NOTES.forEach(([x, y, beamed], k) => {
    if (k === LOST_NOTE && has("floatingNote")) return;
    s += note(x, y, beamed, k % 2 ? "#ffe6a0" : "#fff3d0");
  });

  // Rug with its medallion
  s += `<ellipse cx="440" cy="542" rx="300" ry="48" fill="#6a1a26"/>
    <ellipse cx="440" cy="542" rx="284" ry="40" fill="none" stroke="#e2b54a" stroke-width="3" stroke-dasharray="10 6"/>
    <ellipse cx="440" cy="542" rx="250" ry="32" fill="#a83242"/>
    <ellipse cx="440" cy="542" rx="200" ry="22" fill="none" stroke="#f0d8a0" stroke-width="2" opacity="0.6"/>
    <path d="M440,524 L476,542 L440,560 L404,542 Z" fill="${has("rugMedallion") ? "#3f8a6e" : "#e2b54a"}" stroke="#4a1018" stroke-width="2"/>
    <path d="M440,532 L456,542 L440,552 L424,542 Z" fill="#4a1018"/>
    <path d="M310,542 l12,-8 l12,8 l-12,8 Z M546,542 l12,-8 l12,8 l-12,8 Z" fill="#f0d8a0" opacity="0.8"/>`;

  // Snare drum with crossed sticks
  s += `<ellipse cx="200" cy="562" rx="48" ry="8" fill="#3a0a10" opacity="0.4"/>
    <rect x="158" y="518" width="84" height="38" fill="url(#musicDrum)"/>
    <path d="M166,520 V556 M184,522 V560 M216,522 V560 M234,520 V556" stroke="#f0d070" stroke-width="2"/>
    <path d="M158,520 L178,556 L200,520 L222,556 L242,520" stroke="#fff" stroke-width="1" fill="none" opacity="0.6"/>
    <ellipse cx="200" cy="556" rx="42" ry="10" fill="none" stroke="url(#gold)" stroke-width="4"/>
    <ellipse cx="200" cy="518" rx="42" ry="11" fill="#f6f0e0" stroke="url(#gold)" stroke-width="4"/>
    <path d="M178,510 L232,524" stroke="#d9a860" stroke-width="4" stroke-linecap="round"/>`;
  if (!has("drumstick")) s += '<path d="M180,526 L232,506" stroke="#c48c48" stroke-width="4" stroke-linecap="round"/>';

  // Guitar leaning against the wall
  s += `<ellipse cx="752" cy="544" rx="40" ry="6" fill="#2a140a" opacity="0.45"/>
    <g transform="rotate(-6,760,540)">
      <rect x="755" y="300" width="10" height="150" fill="#3a2010"/><path d="M752,282 H768 L766,304 H754 Z" fill="#2a1408"/>
      ${[286, 293, 300].map(y => `<circle cx="750" cy="${y}" r="2" fill="#e2e2e2"/><circle cx="770" cy="${y}" r="2" fill="#e2e2e2"/>`).join("")}
      <ellipse cx="760" cy="452" rx="24" ry="25" fill="url(#${has("guitar") ? "musicBurst" : "musicHoney"})" stroke="#4a2008" stroke-width="1.5"/>
      <ellipse cx="760" cy="505" rx="32" ry="34" fill="url(#${has("guitar") ? "musicBurst" : "musicHoney"})" stroke="#4a2008" stroke-width="1.5"/>
      <rect x="755" y="420" width="10" height="34" fill="#3a2010"/>
      <circle cx="760" cy="464" r="10" fill="#1a0c04" stroke="#e2b54a" stroke-width="2"/>
      <rect x="748" y="510" width="24" height="6" rx="2" fill="#3a1a08"/>
      <path d="M757,300 V512 M759,300 V512 M761,300 V512 M763,300 V512" stroke="#eee" stroke-width="0.5"/>
    </g>`;
  return s;
}

function musicDifferences(): Difference[] {
  const [nx, ny] = NOTES[LOST_NOTE]!;
  return [
    { id: "lampShade", x: 36, y: 214, r: 26 },
    { id: "pictureSun", x: 145, y: 96, r: 15 },
    { id: "gramophoneHorn", x: 175, y: 264, r: 30 },
    { id: "metronome", x: 185, y: 328, r: 24 },
    { id: "windowStar", x: 300, y: 85, r: 14 },
    { id: "violinBow", x: 280, y: 421, r: 40 },
    { id: "sheetPage", x: 364, y: 308, r: 24 },
    { id: "floatingNote", x: nx + 13, y: ny - 3, r: 24 },
    { id: "portrait", x: 635, y: 95, r: 36 },
    { id: "guitar", x: 754, y: 486, r: 40 },
    { id: "drumstick", x: 206, y: 516, r: 28 },
    { id: "rugMedallion", x: 440, y: 542, r: 30 },
  ];
}

export const music: Scene = { name: "The Music Room", draw: drawMusic, differences: musicDifferences() };
