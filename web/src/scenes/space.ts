// Scene 7: Outer Space
import { seeded, sparkle, rotatePoint, SHARED_DEFS } from "./helpers";
import type { Has, Difference, Scene } from "./types";

const ROCKET = { x: 230, y: 370, angle: 35 };
const ASTRONAUT = { x: 470, y: 440, angle: -15 };
const PLANET = { cx: 570, cy: 190, r: 82 };

function drawSpace(has: Has): string {
  const random = seeded(77);
  let s = `<defs>${SHARED_DEFS}
    <radialGradient id="spaceBg" cx="50%" cy="45%" r="80%">
      <stop offset="0" stop-color="#1b1446"/><stop offset="1" stop-color="#05040f"/>
    </radialGradient>
    <radialGradient id="spaceNebulaPink"><stop offset="0" stop-color="#ff4fa3" stop-opacity="0.45"/><stop offset="1" stop-color="#ff4fa3" stop-opacity="0"/></radialGradient>
    <radialGradient id="spaceNebulaTeal"><stop offset="0" stop-color="#2ee6d6" stop-opacity="0.3"/><stop offset="1" stop-color="#2ee6d6" stop-opacity="0"/></radialGradient>
    <radialGradient id="spaceNebulaViolet"><stop offset="0" stop-color="#8a5cff" stop-opacity="0.45"/><stop offset="1" stop-color="#8a5cff" stop-opacity="0"/></radialGradient>
    <radialGradient id="spaceMoon" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#f4f1ea"/><stop offset="1" stop-color="#8e8a96"/></radialGradient>
    <radialGradient id="spacePlanet" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#ffd59a"/><stop offset="0.6" stop-color="#e08a4a"/><stop offset="1" stop-color="#7a3420"/></radialGradient>
    <radialGradient id="spaceEarth" cx="60%" cy="20%" r="80%"><stop offset="0" stop-color="#6fc3ff"/><stop offset="1" stop-color="#123f8a"/></radialGradient>
    <linearGradient id="spaceRing" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#c9b3ff" stop-opacity="0.2"/><stop offset="0.5" stop-color="#fff0d0"/><stop offset="1" stop-color="#c9b3ff" stop-opacity="0.2"/>
    </linearGradient>
    <linearGradient id="spaceComet" gradientUnits="userSpaceOnUse" x1="380" y1="70" x2="240" y2="18">
      <stop offset="0" stop-color="#e6fbff"/><stop offset="1" stop-color="#7fdcff" stop-opacity="0.25"/>
    </linearGradient>
    <linearGradient id="spaceHull" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#9aa0b4"/><stop offset="0.4" stop-color="#ffffff"/><stop offset="1" stop-color="#8a90a4"/>
    </linearGradient>
    <linearGradient id="spaceFlame" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff6b0"/><stop offset="0.5" stop-color="#ffab2e"/><stop offset="1" stop-color="#ff3d2e" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="spaceBlueFlame" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#e8fbff"/><stop offset="0.5" stop-color="#4fb8ff"/><stop offset="1" stop-color="#3d4bff" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="spacePanel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4c7dff"/><stop offset="1" stop-color="#14286e"/></linearGradient>
    <clipPath id="spaceEarthClip"><circle cx="60" cy="650" r="160"/></clipPath>
    <clipPath id="spacePlanetClip"><circle cx="${PLANET.cx}" cy="${PLANET.cy}" r="${PLANET.r}"/></clipPath>
  </defs>
  <rect width="800" height="600" fill="url(#spaceBg)"/>
  <ellipse cx="660" cy="330" rx="260" ry="170" fill="url(#spaceNebulaPink)"/>
  <ellipse cx="190" cy="210" rx="240" ry="160" fill="url(#spaceNebulaTeal)"/>
  <ellipse cx="420" cy="500" rx="300" ry="150" fill="url(#spaceNebulaViolet)"/>`;

  // Stars
  for (let k = 0; k < 150; k++) {
    s += `<circle cx="${(random() * 800).toFixed(0)}" cy="${(random() * 600).toFixed(0)}" r="${(0.4 + random() * 1.3).toFixed(1)}" fill="#fff" opacity="${(0.3 + random() * 0.7).toFixed(2)}"/>`;
  }
  s += sparkle(60, 300, 9) + sparkle(470, 40, 7) + sparkle(760, 560, 8) + sparkle(330, 520, 6);
  if (!has("sparkle")) s += sparkle(380, 262, 12);

  // Spiral galaxy far away
  if (!has("galaxy")) {
    s += `<g transform="rotate(-25,720,330)">
      <ellipse cx="720" cy="330" rx="26" ry="11" fill="url(#spaceNebulaPink)"/>
      <g fill="none" stroke="#ffd6f5" stroke-linecap="round" opacity="0.8">
        <path d="M720,330 C732,324 744,330 742,337 C740,344 726,344 712,340" stroke-width="2"/>
        <path d="M720,330 C708,336 696,330 698,323 C700,316 714,316 728,320" stroke-width="2"/>
      </g>
      <ellipse cx="720" cy="330" rx="5" ry="3" fill="#fff" filter="url(#glow)"/>
    </g>`;
  }

  // Comet
  const tailX = has("comet") ? 318 : 240, tailY = has("comet") ? 46 : 18;
  s += `<path d="M380,64 L${tailX},${tailY} L${tailX + 4},${tailY + 14} L382,76 Z" fill="url(#spaceComet)"/>
    <path d="M378,72 L${tailX + 14},${tailY + 30}" stroke="#bdf0ff" stroke-width="2" opacity="0.6"/>
    <circle cx="382" cy="70" r="7" fill="#fff" filter="url(#glow)"/>`;

  // The moon
  s += `<circle cx="130" cy="130" r="52" fill="url(#spaceMoon)"/>
    <g fill="#8e8a96" opacity="0.55">
      <circle cx="110" cy="112" r="11"/><circle cx="142" cy="102" r="6"/><circle cx="114" cy="152" r="7"/>
      ${has("moonCrater") ? "" : '<circle cx="152" cy="146" r="12"/>'}
    </g>`;

  // Ringed planet with a storm spot and a little moon
  s += `<path d="M${PLANET.cx - 150},${PLANET.cy} A150,34 0 0,1 ${PLANET.cx + 150},${PLANET.cy}" fill="none" stroke="url(#spaceRing)" stroke-width="10" transform="rotate(-15,${PLANET.cx},${PLANET.cy})"/>
    <circle cx="${PLANET.cx}" cy="${PLANET.cy}" r="${PLANET.r}" fill="url(#spacePlanet)"/>
    <g clip-path="url(#spacePlanetClip)" fill="none" stroke-width="9" opacity="0.45">
      <path d="M480,150 Q570,130 660,150" stroke="#ffe0b0"/>
      <path d="M480,190 Q570,176 660,196" stroke="#a84d2a"/>
      <path d="M480,236 Q570,224 660,240" stroke="#ffe0b0"/>
    </g>
    <ellipse cx="606" cy="214" rx="15" ry="9" fill="${has("planetSpot") ? "#f7e3c0" : "#b8321e"}" opacity="0.9"/>
    <path d="M${PLANET.cx - 150},${PLANET.cy} A150,34 0 0,0 ${PLANET.cx + 150},${PLANET.cy}" fill="none" stroke="url(#spaceRing)" stroke-width="10" transform="rotate(-15,${PLANET.cx},${PLANET.cy})"/>`;
  if (!has("moonlet")) s += '<circle cx="735" cy="78" r="10" fill="url(#spaceMoon)"/>';

  // A planet's curve in the corner
  s += `<circle cx="60" cy="650" r="160" fill="url(#spaceEarth)"/>
    <g clip-path="url(#spaceEarthClip)" fill="#3fae6a" opacity="0.9">
      <path d="M-20,520 C20,500 60,520 70,545 C80,570 40,590 10,580 C-10,570 -30,540 -20,520 Z"/>
      <path d="M120,540 C150,530 190,550 200,590 L200,600 L130,600 C110,580 100,555 120,540 Z"/>
    </g>
    <circle cx="60" cy="650" r="166" fill="none" stroke="#8fd8ff" stroke-width="6" opacity="0.35"/>`;

  // Rocket, drawn pointing up and then tilted
  s += `<g transform="translate(${ROCKET.x},${ROCKET.y}) rotate(${ROCKET.angle})">
      <path d="M-14,58 Q0,${has("rocketFlame") ? 92 : 120} 14,58 Z" fill="url(#${has("rocketFlame") ? "spaceBlueFlame" : "spaceFlame"})"/>
      <path d="M-22,30 L-40,62 L-20,56 Z M22,30 L40,62 L20,56 Z" fill="#d6304a"/>
      <path d="M0,-80 C26,-50 26,20 20,58 L-20,58 C-26,20 -26,-50 0,-80 Z" fill="url(#spaceHull)"/>
      <path d="M0,-80 C10,-68 15,-58 18,-48 L-18,-48 C-15,-58 -10,-68 0,-80 Z" fill="#d6304a"/>
      <rect x="-3" y="20" width="6" height="40" rx="3" fill="#d6304a"/>
      <circle cx="0" cy="-18" r="12" fill="#5a6070"/>
      <circle cx="0" cy="-18" r="8.5" fill="${has("rocketWindow") ? "#ff9f43" : "#5fd3ff"}"/>
      <circle cx="-3" cy="-21" r="2.6" fill="#fff" opacity="0.8"/>
    </g>`;

  // Tether from rocket to astronaut
  s += `<path d="M258,388 C330,470 380,470 446,448" stroke="#cfd6e6" stroke-width="2" fill="none" stroke-dasharray="5 4"/>`;

  // Astronaut floating
  s += `<g transform="translate(${ASTRONAUT.x},${ASTRONAUT.y}) rotate(${ASTRONAUT.angle})">
      <rect x="-30" y="-20" width="60" height="48" rx="8" fill="#b8bfcc"/>
      ${has("antenna") ? "" : '<line x1="-22" y1="-20" x2="-34" y2="-50" stroke="#9aa0b4" stroke-width="3"/><circle cx="-34" cy="-52" r="4" fill="#ff4f5e"/>'}
      <g stroke="#f4f6fb" stroke-width="14" stroke-linecap="round" fill="none">
        <path d="M-20,-2 L-44,18"/><path d="M20,-4 L44,-26"/>
        <path d="M-10,34 L-16,70"/><path d="M10,34 L22,68"/>
      </g>
      <circle cx="-46" cy="20" r="7" fill="#d6304a"/><circle cx="46" cy="-28" r="7" fill="#d6304a"/>
      <ellipse cx="-17" cy="74" rx="10" ry="6" fill="#5a6070"/><ellipse cx="24" cy="72" rx="10" ry="6" fill="#5a6070"/>
      <rect x="-22" y="-14" width="44" height="52" rx="12" fill="#f4f6fb"/>
      <rect x="-10" y="0" width="20" height="14" rx="3" fill="#5a6070"/>
      <circle cx="-4" cy="7" r="2.5" fill="#ff4f5e"/><circle cx="4" cy="7" r="2.5" fill="#5fd3ff"/>
      <circle cx="0" cy="-40" r="27" fill="#f4f6fb" stroke="#cfd6e6" stroke-width="2"/>
      <ellipse cx="2" cy="-40" rx="19" ry="15" fill="${has("visor") ? "#3a7bd5" : "url(#gold)"}"/>
      <ellipse cx="-5" cy="-46" rx="6" ry="4" fill="#fff" opacity="0.6"/>
    </g>`;

  // Satellite
  s += `<g stroke="#8fa3d8" stroke-width="1.2">
      <rect x="566" y="470" width="74" height="22" fill="url(#spacePanel)"/>
      <path d="M584,470 V492 M603,470 V492 M622,470 V492 M566,481 H640"/>
      ${has("satellitePanel") ? "" : '<rect x="720" y="470" width="70" height="22" fill="url(#spacePanel)"/><path d="M737,470 V492 M755,470 V492 M773,470 V492 M720,481 H790"/>'}
    </g>
    <line x1="640" y1="481" x2="720" y2="481" stroke="#b8bfcc" stroke-width="3"/>
    <rect x="652" y="460" width="56" height="42" rx="4" fill="url(#gold)" stroke="#8c6418"/>
    <path d="M652,474 H708 M652,488 H708" stroke="#8c6418" opacity="0.6"/>`;
  if (!has("dish")) {
    s += `<line x1="680" y1="460" x2="680" y2="446" stroke="#b8bfcc" stroke-width="3"/>
      <path d="M664,440 Q680,454 696,440 Z" fill="#e8ecf4" stroke="#9aa0b4"/>
      <line x1="680" y1="446" x2="680" y2="430" stroke="#9aa0b4" stroke-width="1.5"/><circle cx="680" cy="429" r="2.5" fill="#ff4f5e"/>`;
  }
  return s;
}

function spaceDifferences(): Difference[] {
  const r = (x: number, y: number, o: { x: number; y: number; angle: number }) => rotatePoint(o.x + x, o.y + y, o.x, o.y, o.angle);
  const [wx, wy] = r(0, -18, ROCKET), [fx, fy] = r(0, 84, ROCKET);
  const [vx, vy] = r(2, -40, ASTRONAUT), [ax, ay] = r(-32, -48, ASTRONAUT);
  return [
    { id: "moonCrater", x: 152, y: 146, r: 16 },
    { id: "comet", x: 278, y: 36, r: 28 },
    { id: "sparkle", x: 380, y: 262, r: 16 },
    { id: "moonlet", x: 735, y: 78, r: 16 },
    { id: "planetSpot", x: 606, y: 214, r: 18 },
    { id: "galaxy", x: 720, y: 330, r: 24 },
    { id: "rocketWindow", x: Math.round(wx), y: Math.round(wy), r: 14 },
    { id: "rocketFlame", x: Math.round(fx), y: Math.round(fy), r: 26 },
    { id: "visor", x: Math.round(vx), y: Math.round(vy), r: 19 },
    { id: "antenna", x: Math.round(ax), y: Math.round(ay), r: 14 },
    { id: "satellitePanel", x: 755, y: 481, r: 36 },
    { id: "dish", x: 680, y: 442, r: 16 },
  ];
}

export const space: Scene = { name: "Outer Space", draw: drawSpace, differences: spaceDifferences() };
