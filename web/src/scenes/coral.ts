// Scene 6: Coral Reef
import { seeded, starPath } from "./helpers";
import type { Has, Difference, Scene } from "./types";

const SCHOOL: [number, number][] = [[300, 112], [336, 98], [372, 120], [318, 146], [354, 160], [392, 150], [420, 128]];
const FLIPPED_FISH = 5;

// A fish drawn facing right at the origin, then moved and (for dir -1) mirrored
function fish(cx: number, cy: number, len: number, body: string, dir: number, extra = ""): string {
  const h = len * 0.3, half = len / 2;
  return `<g transform="translate(${cx},${cy}) scale(${dir},1)">
    <path d="M${-half + 4},0 L${-half - len * 0.22},${-h * 0.9} L${-half - len * 0.16},0 L${-half - len * 0.22},${h * 0.9} Z" fill="${body}"/>
    <ellipse cx="0" cy="0" rx="${half}" ry="${h}" fill="${body}"/>
    <ellipse cx="${-len * 0.05}" cy="${-h * 0.35}" rx="${half * 0.6}" ry="${h * 0.3}" fill="#fff" opacity="0.25"/>
    ${extra}
    <circle cx="${half * 0.55}" cy="${-h * 0.2}" r="${Math.max(1.6, len * 0.05)}" fill="#111"/>
    <circle cx="${half * 0.58}" cy="${-h * 0.26}" r="${Math.max(0.6, len * 0.018)}" fill="#fff"/>
  </g>`;
}

function seaweed(x: number, top: number, sway: number, color: string): string {
  const h = 600 - top;
  return `<path d="M${x},600 C${x + sway},${600 - h * 0.3} ${x - sway},${600 - h * 0.6} ${x + sway * 0.5},${top}"
    stroke="${color}" stroke-width="9" stroke-linecap="round" fill="none"/>`;
}

function drawCoral(has: Has): string {
  const random = seeded(66);
  let s = `<defs>
    <linearGradient id="coralSea" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#5fd3e6"/><stop offset="0.45" stop-color="#1b8fb8"/><stop offset="1" stop-color="#0a3d6e"/>
    </linearGradient>
    <linearGradient id="coralSand" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f3dca4"/><stop offset="1" stop-color="#c9a464"/>
    </linearGradient>
    <linearGradient id="coralPink" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffb0a8"/><stop offset="1" stop-color="#e84b6a"/>
    </linearGradient>
    <linearGradient id="coralTube" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#5a2a8a"/><stop offset="0.4" stop-color="#b57be8"/><stop offset="1" stop-color="#4a1f74"/>
    </linearGradient>
    <radialGradient id="coralBrain" cx="40%" cy="30%" r="75%">
      <stop offset="0" stop-color="#f4f08a"/><stop offset="1" stop-color="#8ea832"/>
    </radialGradient>
    <radialGradient id="coralShell" cx="40%" cy="30%" r="80%">
      <stop offset="0" stop-color="#6f9c4a"/><stop offset="1" stop-color="#2f5a2a"/>
    </radialGradient>
    <linearGradient id="coralBeam" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity="0.35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="coralClown" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffa53d"/><stop offset="1" stop-color="#e2550c"/>
    </linearGradient>
    <clipPath id="coralAngelClip"><path d="M-28,0 C-18,-20 0,-22 10,-36 C14,-20 18,-10 22,-4 L34,-14 L34,14 L22,4 C18,10 14,20 10,36 C0,22 -18,20 -28,0 Z"/></clipPath>
  </defs>
  <rect width="800" height="600" fill="url(#coralSea)"/>`;

  // Sunbeams and the rippling surface
  [[120, 60], [300, 40], [470, 70], [650, 50]].forEach(([x, w]) => {
    s += `<path d="M${x! - w! / 2},0 L${x! + w! / 2},0 L${x! + w! * 2.2},520 L${x! + w!},520 Z" fill="url(#coralBeam)"/>`;
  });
  s += '<path d="M0,14 Q50,4 100,14 T200,14 T300,14 T400,14 T500,14 T600,14 T700,14 T800,14 L800,0 L0,0 Z" fill="#bff3fb" opacity="0.6"/>';

  // Distant reef silhouettes
  s += `<path d="M0,500 C60,440 120,470 170,450 C230,425 280,470 340,455 C420,435 470,470 540,450 C610,430 680,465 800,440 L800,540 L0,540 Z" fill="#0f5f86" opacity="0.6"/>`;

  // Sand with grains
  s += '<path d="M0,535 C120,515 240,545 380,528 C520,512 650,540 800,522 L800,600 L0,600 Z" fill="url(#coralSand)"/>';
  s += '<g fill="#a8854a" opacity="0.5">';
  for (let k = 0; k < 90; k++) {
    s += `<circle cx="${(random() * 800).toFixed(0)}" cy="${(545 + random() * 52).toFixed(0)}" r="${(0.8 + random() * 1.4).toFixed(1)}"/>`;
  }
  s += "</g>";

  // Seaweed on both sides
  s += seaweed(22, 380, 18, "#2e8b57") + seaweed(44, 420, -14, "#3fa66a") + seaweed(64, 455, 12, "#2a7a4c");
  s += seaweed(748, 430, -12, "#2a7a4c") + seaweed(785, 410, 10, "#3fa66a");
  s += seaweed(768, has("seaweed") ? 400 : 336, -16, "#2e8b57");

  // Branching coral
  s += `<g stroke="url(#coralPink)" stroke-width="14" stroke-linecap="round" fill="none">
    <path d="M110,565 C108,520 96,488 80,452 C70,430 72,410 66,390"/>
    <path d="M80,452 C60,440 50,422 46,402"/>
    <path d="M108,522 C124,484 140,462 140,428"/>
    <path d="M136,462 C158,452 172,440 176,418"/>
    <path d="M104,500 C90,492 78,486 70,470"/>
    ${has("coralBranch") ? "" : '<path d="M140,428 C142,408 150,394 156,376"/>'}
  </g>
  <g fill="#ffe1dc" opacity="0.8">
    <circle cx="66" cy="392" r="3"/><circle cx="46" cy="404" r="3"/><circle cx="176" cy="420" r="3"/><circle cx="70" cy="472" r="3"/>
    <circle cx="90" cy="440" r="2"/><circle cx="130" cy="480" r="2"/><circle cx="104" cy="530" r="2"/>
  </g>`;

  // Bubbles rising from the coral
  const bubbles = [[160, 340, 7], [150, 300, 5], [164, 262, 8], [146, 226, 6], [160, 150, 7], [148, 110, 5], [162, 74, 9], [150, 40, 6]];
  bubbles.forEach(b => { b[0]! += random() * 6 - 3; });
  if (has("bubble")) bubbles.push([150, 190, 10]);
  bubbles.forEach(([x, y, r]) => {
    s += `<circle cx="${x!.toFixed(1)}" cy="${y}" r="${r}" fill="#dff8ff" fill-opacity="0.25" stroke="#fff" stroke-opacity="0.8" stroke-width="1.5"/>
      <circle cx="${(x! - r! * 0.35).toFixed(1)}" cy="${y! - r! * 0.35}" r="${r! * 0.25}" fill="#fff" opacity="0.8"/>`;
  });

  // Tube sponges
  [[196, 486], [214, has("tubeSponge") ? 500 : 460], [232, 494]].forEach(([x, top]) => {
    s += `<rect x="${x}" y="${top}" width="17" height="${552 - top!}" rx="7" fill="url(#coralTube)"/>
      <ellipse cx="${x! + 8.5}" cy="${top! + 3}" rx="7" ry="3" fill="#2a0e45"/>`;
  });

  // Brain coral
  s += `<ellipse cx="300" cy="540" rx="58" ry="38" fill="url(#coralBrain)"/>
    <g stroke="#7a8f22" stroke-width="2.2" fill="none" opacity="0.8">
      <path d="M252,532 q12,-14 24,0 t24,0 t24,0 t24,0"/>
      <path d="M258,550 q10,-12 20,0 t20,0 t20,0 t20,0 t20,0"/>
      <path d="M266,516 q10,-12 20,0 t20,0 t20,0"/>
      <path d="M270,566 q10,-10 20,0 t20,0 t20,0"/>
    </g>`;

  // Starfish on the sand
  const starColor = has("starfish") ? "#9b5de5" : "#ff7a3d";
  s += `<path d="${starPath(395, 568, 21, 9, 5)}" fill="${starColor}" stroke="#fff" stroke-opacity="0.4" stroke-width="1.5" stroke-linejoin="round" transform="rotate(12,395,568)"/>
    <g fill="#fff" opacity="0.6"><circle cx="395" cy="562" r="1.6"/><circle cx="401" cy="568" r="1.6"/><circle cx="390" cy="571" r="1.6"/></g>`;

  // Sea anemone with a clownfish
  s += '<g stroke-linecap="round" fill="none">';
  for (let k = 0; k < 15; k++) {
    const a = -160 + k * (140 / 14) + random() * 6, len = 42 + random() * 16;
    const ex = 480 + Math.cos(a * Math.PI / 180) * len, ey = 528 + Math.sin(a * Math.PI / 180) * len;
    s += `<path d="M480,528 Q${(480 + (ex - 480) * 0.4).toFixed(1)},${(ey - 10).toFixed(1)} ${ex.toFixed(1)},${ey.toFixed(1)}" stroke="#e86fb8" stroke-width="8"/>
      <circle cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" r="3.5" fill="#ffd6f0"/>`;
  }
  s += `</g><path d="M456,560 Q480,516 504,560 Z" fill="#b83f8a"/>`;
  const band = (x: number) => `<ellipse cx="${x}" cy="0" rx="3.6" ry="10" fill="#fff" stroke="#222" stroke-width="1"/>`;
  s += fish(478, 462, 44, "url(#coralClown)", -1, band(-12) + (has("clownStripe") ? "" : band(0)) + band(13));

  // Clam shell and crab on the sand
  if (!has("shell")) {
    s += `<path d="M556,586 L560,566 Q570,556 580,566 L584,586 Z" fill="#fbe3e8" stroke="#d99aa8" stroke-width="1.2"/>
      <path d="M570,586 L570,562 M563,586 L565,566 M577,586 L575,566" stroke="#d99aa8" stroke-width="1"/>`;
  }

  // Fan coral
  s += '<g stroke="#a04ad1" stroke-linecap="round" fill="none">';
  s += '<path d="M660,500 L556,445 Q566,378 660,382 Q754,378 764,445 Z" fill="#c77dff" fill-opacity="0.22" stroke="none"/><path d="M660,560 L660,500" stroke-width="7"/>';
  for (let k = 0; k < 9; k++) {
    const a = -150 + k * 15;
    const ex = 660 + Math.cos(a * Math.PI / 180) * 120, ey = 500 + Math.sin(a * Math.PI / 180) * 110;
    s += `<path d="M660,500 Q${(660 + (ex - 660) * 0.5).toFixed(0)},${(500 + (ey - 500) * 0.6 - 10).toFixed(0)} ${ex.toFixed(0)},${ey.toFixed(0)}" stroke-width="3"/>`;
  }
  [50, 80, 105].forEach(r => { s += `<path d="M${660 - r * 0.87},${500 - r * 0.45} Q660,${500 - r * 1.25} ${660 + r * 0.87},${500 - r * 0.45}" stroke-width="1.5" opacity="0.8"/>`; });
  s += "</g>";

  if (!has("crab")) {
    s += `<g stroke="#b3261e" stroke-width="2.5" stroke-linecap="round" fill="none">
        <path d="M720,572 l-12,8 M722,576 l-10,12 M750,572 l12,8 M748,576 l10,12"/>
        <path d="M722,562 q-8,-4 -10,-14 M748,562 q8,-4 10,-14"/>
      </g>
      <ellipse cx="735" cy="570" rx="17" ry="11" fill="#e6402f"/>
      <circle cx="712" cy="544" r="6" fill="#e6402f"/><circle cx="758" cy="544" r="6" fill="#e6402f"/>
      <circle cx="730" cy="558" r="2.5" fill="#111"/><circle cx="740" cy="558" r="2.5" fill="#111"/>`;
  }

  // School of small blue fish, a yellow tang and an angelfish
  SCHOOL.forEach(([x, y], k) => {
    s += fish(x, y, 26, "#3a7bd5", k === FLIPPED_FISH && has("schoolFish") ? -1 : 1, '<path d="M-4,-7 L4,-7 L2,7 L-6,7 Z" fill="#ffd23f" opacity="0.8"/>');
  });
  s += fish(240, 292, 50, has("tang") ? "#2ec4b6" : "#ffd23f", 1, '<path d="M-12,-14 Q4,-26 14,-12 Z M-12,14 Q4,26 14,12 Z" fill="#f5b700"/>');

  s += `<g transform="translate(690,292) scale(-1,1)">
      <g clip-path="url(#coralAngelClip)">
        <rect x="-30" y="-40" width="66" height="80" fill="#ffe14d"/>
        <rect x="-14" y="-40" width="6" height="80" fill="#1d3fa8"/>
        <rect x="${has("angelFish") ? -1000 : 0}" y="-40" width="6" height="80" fill="#1d3fa8"/>
        <rect x="14" y="-40" width="6" height="80" fill="#1d3fa8"/>
      </g>
      <circle cx="-17" cy="-4" r="2.6" fill="#111"/>
    </g>`;

  // Sea turtle swimming left
  s += `<g fill="#7cae5a" stroke="#3d6b2c" stroke-width="1.5">
      <path d="M528,212 C510,232 490,248 470,254 C490,232 506,214 520,204 Z"/>
      <path d="M528,184 C515,165 498,150 478,144 C496,166 508,182 520,194 Z"/>
      <path d="M604,178 C616,168 628,162 640,160 C632,172 620,182 608,188 Z"/>
      ${has("turtleFlipper") ? "" : '<path d="M604,220 C616,232 628,240 642,244 C634,230 622,218 610,212 Z"/>'}
      <ellipse cx="492" cy="190" rx="20" ry="14"/>
    </g>
    <circle cx="484" cy="186" r="2.6" fill="#111"/>
    <ellipse cx="565" cy="200" rx="62" ry="38" fill="url(#coralShell)" stroke="#e8d9a0" stroke-width="3"/>
    <g fill="#8fbf5e" stroke="#2b4d22" stroke-width="1.5" opacity="0.9">
      <path d="M552,188 L578,188 L586,200 L578,212 L552,212 L544,200 Z"/>
      <path d="M520,190 L540,182 L544,200 L540,218 L520,210 Z"/>
      <path d="M610,190 L590,182 L586,200 L590,218 L610,210 Z"/>
      <path d="M552,186 L558,168 L572,168 L578,186 Z"/>
      <path d="M552,214 L558,232 L572,232 L578,214 Z"/>
    </g>
    <ellipse cx="548" cy="178" rx="22" ry="6" fill="#fff" opacity="0.2"/>`;
  return s;
}

function coralDifferences(): Difference[] {
  const [fx, fy] = SCHOOL[FLIPPED_FISH]!;
  return [
    { id: "seaweed", x: 770, y: 368, r: 28 },
    { id: "coralBranch", x: 148, y: 400, r: 24 },
    { id: "bubble", x: 150, y: 190, r: 16 },
    { id: "tubeSponge", x: 222, y: 480, r: 20 },
    { id: "starfish", x: 395, y: 568, r: 24 },
    { id: "clownStripe", x: 478, y: 462, r: 16 },
    { id: "shell", x: 570, y: 574, r: 18 },
    { id: "crab", x: 735, y: 562, r: 34 },
    { id: "schoolFish", x: fx, y: fy, r: 18 },
    { id: "tang", x: 240, y: 292, r: 30 },
    { id: "angelFish", x: 690, y: 292, r: 26 },
    { id: "turtleFlipper", x: 626, y: 230, r: 18 },
  ];
}

export const coral: Scene = { name: "Coral Reef", draw: drawCoral, differences: coralDifferences() };
