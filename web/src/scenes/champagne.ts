// Scene 1: Champagne & Diamonds
import { seeded, rotatePoint, star, sparkle, diamond, pearl, quadPoint, SHARED_DEFS } from "./helpers";
import type { Point, Has, Difference, Scene } from "./types";

const GARLAND = { xs: [70, 190, 310, 490, 610, 730], lengths: [40, 70, 30, 55, 80, 45] };
function garlandY(x: number): number {
  return quadPoint([0, 30], [400, 110], [800, 30], x / 800)[1];
}
const NECKLACE: [Point, Point, Point] = [[40, 500], [270, 600], [510, 505]];
const LEFT_FLUTE = { cx: 300, angle: 12 };
const RIGHT_FLUTE = { cx: 500, angle: -12 };

function flute(cx: number, random: () => number): string {
  let s = `
    <path d="M${cx - 38},150 Q${cx - 40},300 ${cx - 7},345 L${cx + 7},345 Q${cx + 40},300 ${cx + 38},150 Z"
      fill="#fff" fill-opacity="0.1" stroke="#fff" stroke-opacity="0.6" stroke-width="2"/>
    <path d="M${cx - 37},190 Q${cx - 38},300 ${cx - 7},343 L${cx + 7},343 Q${cx + 38},300 ${cx + 37},190 Z"
      fill="url(#cChamp)" opacity="0.92"/>
    <ellipse cx="${cx}" cy="190" rx="37" ry="5" fill="#fff8d8" opacity="0.95"/>
    <ellipse cx="${cx}" cy="150" rx="38" ry="6" fill="none" stroke="#fff" stroke-opacity="0.65" stroke-width="2"/>
    <rect x="${cx - 3}" y="345" width="6" height="125" fill="#fff" fill-opacity="0.55"/>
    <ellipse cx="${cx}" cy="472" rx="46" ry="9" fill="#fff" fill-opacity="0.22" stroke="#fff" stroke-opacity="0.6" stroke-width="2"/>
    <path d="M${cx - 27},165 Q${cx - 29},260 ${cx - 12},322" stroke="#fff" stroke-opacity="0.5" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  for (let k = 0; k < 16; k++) {
    const y = 200 + random() * 130;
    const half = 34 - (y - 190) * 0.18;
    const x = cx + (random() * 2 - 1) * half * 0.75;
    s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(1.2 + random() * 1.8).toFixed(1)}" fill="none" stroke="#fff" stroke-opacity="0.75"/>`;
  }
  return s;
}

function drawChampagne(has: Has): string {
  const random = seeded(7);
  let s = `<defs>${SHARED_DEFS}
    <radialGradient id="cBg" cx="50%" cy="35%" r="75%">
      <stop offset="0" stop-color="#6b1238"/><stop offset="1" stop-color="#14030b"/>
    </radialGradient>
    <linearGradient id="cChamp" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff4c2"/><stop offset="1" stop-color="#e9b949"/>
    </linearGradient>
    <linearGradient id="cSilver" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#7d7d88"/><stop offset="0.35" stop-color="#f4f4f8"/><stop offset="0.7" stop-color="#b8b8c2"/><stop offset="1" stop-color="#5e5e68"/>
    </linearGradient>
    <linearGradient id="cBottle" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#06180c"/><stop offset="0.4" stop-color="#2f6b43"/><stop offset="1" stop-color="#041008"/>
    </linearGradient>
    <linearGradient id="cVelvet" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#8a1230"/><stop offset="1" stop-color="#3a0512"/>
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#cBg)"/>`;

  // Art deco sunburst
  s += '<g fill="#f5d77a" opacity="0.08">';
  for (let k = 0; k < 18; k++) {
    const a1 = Math.PI + k * Math.PI / 18, a2 = a1 + Math.PI / 36;
    s += `<path d="M400,520 L${400 + 900 * Math.cos(a1)},${520 + 900 * Math.sin(a1)} L${400 + 900 * Math.cos(a2)},${520 + 900 * Math.sin(a2)} Z"/>`;
  }
  s += "</g>";

  // Confetti
  const confettiColors = ["#f5d77a", "#ffffff", "#ff8fc0", "#e2b54a"];
  for (let k = 0; k < 55; k++) {
    const x = random() * 800, y = 60 + random() * 520, angle = random() * 180;
    const color = confettiColors[Math.floor(random() * confettiColors.length)];
    s += `<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="7" height="3" fill="${color}" opacity="0.7" transform="rotate(${angle.toFixed(0)},${x.toFixed(0)},${y.toFixed(0)})"/>`;
  }
  s += star(735, 250, 15, 6, 5, has("confettiStar") ? "#ff8fc0" : "url(#gold)");

  // Garland with hanging stars
  s += '<path d="M0,30 Q400,110 800,30" stroke="url(#gold)" stroke-width="2.5" fill="none"/>';
  GARLAND.xs.forEach((x, k) => {
    if (k === 4 && has("garlandStar")) return;
    const y = garlandY(x), end = y + GARLAND.lengths[k]!;
    s += `<line x1="${x}" y1="${y}" x2="${x}" y2="${end}" stroke="#e2b54a" stroke-width="1"/>`;
    s += star(x, end + 10, 13, 5.5, 5, "url(#gold)", 'filter="url(#glow)"');
  });

  // Champagne bottle in an ice bucket
  s += `<g transform="rotate(-14,170,360)">
    <path d="M140,430 L140,265 Q140,228 162,212 L162,150 L178,150 L178,212 Q200,228 200,265 L200,430 Z" fill="url(#cBottle)"/>
    <path d="M158,206 L182,206 L180,128 L160,128 Z" fill="url(#gold)"/>
    <ellipse cx="170" cy="128" rx="10" ry="4" fill="#fff1b8"/>
    <rect x="146" y="300" width="48" height="58" rx="4" fill="#f6ecd2" stroke="#d4a63a" stroke-width="2"/>
    ${star(170, 314, 6, 2.5, 5, "#d4a63a")}
    <text x="170" y="340" font-family="Georgia, serif" font-size="14" text-anchor="middle" fill="#5a3b0a">${has("labelYear") ? "1927" : "1921"}</text>
    <rect x="145" y="240" width="5" height="160" fill="#fff" opacity="0.15"/>
  </g>`;
  s += `<path d="M95,360 L245,360 L228,520 L112,520 Z" fill="url(#cSilver)"/>
    <rect x="92" y="352" width="156" height="12" rx="6" fill="url(#cSilver)" stroke="#6e6e78" stroke-width="1"/>
    <line x1="108" y1="490" x2="232" y2="490" stroke="#6e6e78" stroke-width="2"/>
    <rect x="108" y="341" width="20" height="17" rx="4" fill="#dff4ff" opacity="0.85" transform="rotate(-12,118,350)"/>
    <rect x="205" y="339" width="22" height="18" rx="4" fill="#dff4ff" opacity="0.85" transform="rotate(10,216,348)"/>
    <rect x="186" y="345" width="16" height="13" rx="3" fill="#eefaff" opacity="0.85"/>
    <circle cx="92" cy="388" r="12" fill="none" stroke="url(#cSilver)" stroke-width="4"/>`;
  if (!has("bucketHandle")) {
    s += '<circle cx="248" cy="388" r="12" fill="none" stroke="url(#cSilver)" stroke-width="4"/>';
  }

  // Two flutes clinking
  s += `<g transform="rotate(${LEFT_FLUTE.angle},${LEFT_FLUTE.cx},470)">${flute(LEFT_FLUTE.cx, random)}</g>`;
  const rc = RIGHT_FLUTE.cx;
  s += `<g transform="rotate(${RIGHT_FLUTE.angle},${rc},470)">${flute(rc, random)}`;
  if (!has("bubbles")) {
    [[rc + 14, 318, 1.5], [rc + 13, 300, 2], [rc + 15, 281, 2.6], [rc + 13, 260, 3.2], [rc + 15, 238, 3.8]]
      .forEach(([x, y, r]) => { s += `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" fill-opacity="0.35" stroke="#fff"/>`; });
  }
  const bow = has("ribbon") ? "#118a5c" : "#c8164f";
  s += `<path d="M${rc},380 L${rc - 22},368 L${rc - 20},394 Z M${rc},380 L${rc + 22},368 L${rc + 20},394 Z" fill="${bow}"/>
    <path d="M${rc - 2},382 L${rc - 10},408 M${rc + 2},382 L${rc + 10},408" stroke="${bow}" stroke-width="4" stroke-linecap="round"/>
    <circle cx="${rc}" cy="380" r="5" fill="${bow}" stroke="#fff" stroke-opacity="0.4"/>
  </g>`;

  // Strawberry on the rim
  if (!has("strawberry")) {
    s += `<path d="M314,150 Q325,142 336,150 Q336,170 325,180 Q314,170 314,150 Z" fill="#e0162b"/>
      <path d="M325,148 l-9,-6 l7,-1 l2,-6 l2,6 l7,1 Z" fill="#2e8b3a"/>
      <g fill="#ffd27a"><circle cx="320" cy="156" r="1"/><circle cx="329" cy="157" r="1"/><circle cx="324" cy="164" r="1"/><circle cx="330" cy="166" r="1"/><circle cx="321" cy="170" r="1"/></g>`;
  }

  // Sparkles and splash where the glasses touch
  s += sparkle(400, 118, 17) + sparkle(372, 92, 9);
  if (!has("sparkle")) s += sparkle(432, 92, 10);
  s += '<g fill="#fff4c2">';
  [[390, 132, 3], [410, 128, 2.5], [396, 106, 2], [414, 108, 2], [383, 118, 1.8], [420, 120, 1.6]]
    .forEach(([x, y, r]) => { s += `<circle cx="${x}" cy="${y}" r="${r}"/>`; });
  s += "</g>";

  // Velvet ring box with a diamond ring
  s += `<path d="M566,440 L714,440 L700,372 L580,372 Z" fill="#5a0a1e" stroke="url(#gold)" stroke-width="2"/>
    <path d="M582,382 L698,382 L708,432 L572,432 Z" fill="#3a0512"/>
    <ellipse cx="640" cy="420" rx="31" ry="35" fill="none" stroke="url(#gold)" stroke-width="8"/>
    ${diamond(640, 380, 36, has("diamondColor") ? "url(#gemPink)" : "url(#gemWhite)")}
    ${diamond(613, 393, 10, "url(#gemWhite)")}
    ${has("sideStone") ? "" : diamond(667, 393, 10, "url(#gemWhite)")}
    ${sparkle(662, 360, 9)}
    <rect x="560" y="440" width="160" height="80" rx="6" fill="url(#cVelvet)" stroke="url(#gold)" stroke-width="2"/>
    <rect x="575" y="446" width="130" height="10" rx="5" fill="#2a0410"/>`;

  // Pearl necklace with a pendant
  const [p0, p1, p2] = NECKLACE;
  for (let k = 0; k <= 30; k++) {
    if (k === 15 || (k === 6 && has("pearlMissing"))) continue;
    const [x, y] = quadPoint(p0, p1, p2, k / 30);
    s += pearl(x, y, 7.5);
  }
  const [mx, my] = quadPoint(p0, p1, p2, 0.5);
  s += `<circle cx="${mx}" cy="${my}" r="5" fill="none" stroke="url(#gold)" stroke-width="2.5"/>
    <path d="M${mx},${my + 5} Q${mx + 13},${my + 22} ${mx},${my + 34} Q${mx - 13},${my + 22} ${mx},${my + 5} Z"
      fill="${has("pendant") ? "url(#gemSapphire)" : "url(#gemEmerald)"}" stroke="url(#gold)" stroke-width="2"/>`;
  return s;
}

function champagneDifferences(): Difference[] {
  const bubbles = rotatePoint(RIGHT_FLUTE.cx + 14, 280, RIGHT_FLUTE.cx, 470, RIGHT_FLUTE.angle);
  const ribbon = rotatePoint(RIGHT_FLUTE.cx, 385, RIGHT_FLUTE.cx, 470, RIGHT_FLUTE.angle);
  const label = rotatePoint(170, 334, 170, 360, -14);
  const missingPearl = quadPoint(...NECKLACE, 6 / 30);
  const [mx, my] = quadPoint(...NECKLACE, 0.5);
  return [
    { id: "garlandStar", x: 610, y: garlandY(610) + 90, r: 18 },
    { id: "bucketHandle", x: 248, y: 388, r: 17 },
    { id: "labelYear", x: label[0], y: label[1], r: 22 },
    { id: "strawberry", x: 325, y: 160, r: 20 },
    { id: "bubbles", x: bubbles[0], y: bubbles[1], r: 24 },
    { id: "ribbon", x: ribbon[0], y: ribbon[1], r: 22 },
    { id: "sparkle", x: 432, y: 92, r: 14 },
    { id: "diamondColor", x: 640, y: 383, r: 16 },
    { id: "sideStone", x: 667, y: 394, r: 12 },
    { id: "pearlMissing", x: missingPearl[0], y: missingPearl[1], r: 12 },
    { id: "pendant", x: mx, y: my + 20, r: 18 },
    { id: "confettiStar", x: 735, y: 250, r: 17 },
  ];
}

export const champagne: Scene = { name: "Champagne & Diamonds", draw: drawChampagne, differences: champagneDifferences() };
