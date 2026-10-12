// The five spot-the-difference scenes, drawn in code as SVG.
// No DOM access, so this runs in the browser and in Node.js (tests).
//
// Each scene has a name, a draw(has) function that returns the SVG markup (has(id) says
// whether difference `id` is shown), and its list of possible differences.

// ---------- Drawing helpers ----------
// Pictures are SVG strings in an 800x600 coordinate system. Everything
// random uses a seeded generator, so both pictures come out identical
// except for the differences.

export function seeded(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rotatePoint(x, y, cx, cy, degrees) {
  const a = degrees * Math.PI / 180;
  const dx = x - cx, dy = y - cy;
  return [cx + dx * Math.cos(a) - dy * Math.sin(a), cy + dx * Math.sin(a) + dy * Math.cos(a)];
}

function starPath(cx, cy, outer, inner, points) {
  let d = "";
  for (let k = 0; k < points * 2; k++) {
    const r = k % 2 ? inner : outer;
    const a = Math.PI * k / points - Math.PI / 2;
    d += `${k ? "L" : "M"}${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }
  return d + "Z";
}

function star(cx, cy, outer, inner, points, fill, extra = "") {
  return `<path d="${starPath(cx, cy, outer, inner, points)}" fill="${fill}" ${extra}/>`;
}

function sparkle(cx, cy, size, color = "#fffbe8") {
  return star(cx, cy, size, size * 0.22, 4, color, 'filter="url(#glow)"');
}

// Brilliant-cut gem seen from the side; (cx, cy) is the widest point
function diamond(cx, cy, w, fill) {
  const crown = w * 0.28, pavilion = w * 0.6, table = w / 3, mid = w / 6;
  const left = cx - w / 2, right = cx + w / 2;
  return `<g stroke="#fff" stroke-opacity="0.75" stroke-width="1" stroke-linejoin="round">
    <path d="M${left},${cy} L${cx - table},${cy - crown} L${cx + table},${cy - crown} L${right},${cy} L${cx},${cy + pavilion} Z" fill="${fill}"/>
    <path fill="none" d="M${left},${cy} L${right},${cy}
      M${cx - table},${cy - crown} L${cx - mid},${cy} L${cx},${cy - crown} L${cx + mid},${cy} L${cx + table},${cy - crown}
      M${left},${cy} L${cx},${cy + pavilion} M${cx - mid},${cy} L${cx},${cy + pavilion}
      M${cx + mid},${cy} L${cx},${cy + pavilion} M${right},${cy} L${cx},${cy + pavilion}"/>
  </g>`;
}

function pearl(cx, cy, r, fill = "url(#pearl)") {
  return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r}" fill="${fill}"/>`;
}

function quadPoint(p0, p1, p2, t) {
  const u = 1 - t;
  return [u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]];
}

// Gradients shared by all scenes
const SHARED_DEFS = `
  <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#fff1b8"/><stop offset="0.45" stop-color="#e2b54a"/><stop offset="1" stop-color="#8c6418"/>
  </linearGradient>
  <radialGradient id="pearl" cx="35%" cy="30%" r="70%">
    <stop offset="0" stop-color="#ffffff"/><stop offset="0.6" stop-color="#efe6d6"/><stop offset="1" stop-color="#a99d88"/>
  </radialGradient>
  <radialGradient id="goldPearl" cx="35%" cy="30%" r="70%">
    <stop offset="0" stop-color="#fff6cf"/><stop offset="0.6" stop-color="#e2b54a"/><stop offset="1" stop-color="#8c6418"/>
  </radialGradient>
  <linearGradient id="gemWhite" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#ffffff"/><stop offset="0.5" stop-color="#cfe9ff"/><stop offset="1" stop-color="#7fa8dc"/>
  </linearGradient>
  <linearGradient id="gemPink" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#ffe0ee"/><stop offset="0.5" stop-color="#ff79b4"/><stop offset="1" stop-color="#b8145f"/>
  </linearGradient>
  <linearGradient id="gemRuby" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#ff8a9a"/><stop offset="0.5" stop-color="#d10f3a"/><stop offset="1" stop-color="#6e0018"/>
  </linearGradient>
  <linearGradient id="gemEmerald" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#9dffcf"/><stop offset="0.5" stop-color="#14a866"/><stop offset="1" stop-color="#05502e"/>
  </linearGradient>
  <linearGradient id="gemSapphire" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#a9c8ff"/><stop offset="0.5" stop-color="#2156d6"/><stop offset="1" stop-color="#0a2366"/>
  </linearGradient>
  <filter id="glow" x="-80%" y="-80%" width="260%" height="260%">
    <feGaussianBlur stdDeviation="2.5" result="blur"/>
    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>`;

// ---------- Scene 1: Champagne & Diamanten ----------

const GARLAND = { xs: [70, 190, 310, 490, 610, 730], lengths: [40, 70, 30, 55, 80, 45] };
function garlandY(x) {
  return quadPoint([0, 30], [400, 110], [800, 30], x / 800)[1];
}
const NECKLACE = [[40, 500], [270, 600], [510, 505]];
const LEFT_FLUTE = { cx: 300, angle: 12 };
const RIGHT_FLUTE = { cx: 500, angle: -12 };

function flute(cx, random) {
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

function drawChampagne(has) {
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
    const y = garlandY(x), end = y + GARLAND.lengths[k];
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

function champagneDifferences() {
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
    { id: "diamondColor", x: 640, y: 383, r: 20 },
    { id: "sideStone", x: 667, y: 394, r: 12 },
    { id: "pearlMissing", x: missingPearl[0], y: missingPearl[1], r: 12 },
    { id: "pendant", x: mx, y: my + 20, r: 18 },
    { id: "confettiStar", x: 735, y: 250, r: 17 },
  ];
}

// ---------- Scene 2: De Pauw ----------

const FAN = { cx: 400, cy: 440, rings: [{ R: 330, count: 17 }, { R: 255, count: 12 }, { R: 180, count: 9 }] };

function featherAngle(count, k) {
  return -168 + k * (156 / (count - 1));
}

function featherEyePoint(R, angle) {
  const a = angle * Math.PI / 180;
  return [FAN.cx + (R - 14) * Math.cos(a), FAN.cy + (R - 14) * Math.sin(a)];
}

function featherEye(x, y, angle, scale, centerColor) {
  const layers = [[24, 19, "#3f8f3a"], [19, 15, "url(#gold)"], [14, 11, "#19a7a3"], [9.5, 7.5, "#1d3fb8"], [5.5, 4.5, centerColor]];
  return layers.map(([rx, ry, fill]) =>
    `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${(rx * scale).toFixed(1)}" ry="${(ry * scale).toFixed(1)}" fill="${fill}" transform="rotate(${angle.toFixed(1)},${x.toFixed(1)},${y.toFixed(1)})"/>`
  ).join("");
}

function feather(R, angle, { eye = true, centerColor = "#0a0f3a" } = {}) {
  const a = angle * Math.PI / 180;
  const tx = FAN.cx + R * Math.cos(a), ty = FAN.cy + R * Math.sin(a);
  const mx = FAN.cx + R * 0.6 * Math.cos(a), my = FAN.cy + R * 0.6 * Math.sin(a);
  let s = `<ellipse cx="${mx.toFixed(1)}" cy="${my.toFixed(1)}" rx="${(R * 0.42).toFixed(1)}" ry="${(R * 0.08).toFixed(1)}"
      fill="url(#pVane)" transform="rotate(${angle.toFixed(1)},${mx.toFixed(1)},${my.toFixed(1)})"/>
    <line x1="${FAN.cx}" y1="${FAN.cy}" x2="${tx.toFixed(1)}" y2="${ty.toFixed(1)}" stroke="#d9c070" stroke-width="1.4" opacity="0.8"/>`;
  if (eye) {
    const [ex, ey] = featherEyePoint(R, angle);
    s += featherEye(ex, ey, angle, 0.7 + 0.3 * R / 330, centerColor);
  }
  return s;
}

function drawPeacock(has) {
  const random = seeded(21);
  let s = `<defs>${SHARED_DEFS}
    <linearGradient id="pBg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0b3d3a"/><stop offset="1" stop-color="#021416"/>
    </linearGradient>
    <radialGradient id="pGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#f5d77a" stop-opacity="0.35"/><stop offset="1" stop-color="#f5d77a" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="pVane" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#0e3b2a" stop-opacity="0.4"/><stop offset="0.6" stop-color="#2f8a55" stop-opacity="0.9"/><stop offset="1" stop-color="#5fb36a" stop-opacity="0.9"/>
    </linearGradient>
    <linearGradient id="pBody" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#3f86ff"/><stop offset="1" stop-color="#0a2a8a"/>
    </linearGradient>
    <linearGradient id="pWing" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1c6b6b"/><stop offset="1" stop-color="#6b4a22"/>
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#pBg)"/>`;

  // Stars, moon and art deco arches
  for (let k = 0; k < 60; k++) {
    s += `<circle cx="${(random() * 800).toFixed(0)}" cy="${(random() * 300).toFixed(0)}" r="${(0.6 + random() * 1.2).toFixed(1)}" fill="#fff" opacity="${(0.3 + random() * 0.6).toFixed(2)}"/>`;
  }
  if (!has("skyStar")) s += sparkle(110, 95, 15);
  s += `<path d="M700,57 A28,28 0 1,0 700,113 A22,28 0 1,1 700,57 Z" fill="#f6e7b0"
    ${has("moon") ? 'transform="translate(1400,0) scale(-1,1)"' : ""}/>`;
  s += '<g fill="none" stroke="url(#gold)" opacity="0.35">';
  [420, 445, 470].forEach(r => { s += `<path d="M${400 - r},600 A${r},${r} 0 0,1 ${400 + r},600" stroke-width="2"/>`; });
  s += "</g>";
  s += `<circle cx="400" cy="420" r="330" fill="url(#pGlow)"/>`;

  // The fan: outer ring first, so inner feathers lie on top
  FAN.rings.forEach(({ R, count }, ring) => {
    for (let k = 0; k < count; k++) {
      const angle = featherAngle(count, k);
      const options = {};
      if (ring === 0 && k === 4 && has("featherEye")) options.centerColor = "#c2127e";
      if (ring === 1 && k === 9 && has("featherNoEye")) options.eye = false;
      s += feather(R, angle, options);
    }
  });

  // Floor and a fallen feather
  s += `<rect y="578" width="800" height="22" fill="#031012"/><line x1="0" y1="578" x2="800" y2="578" stroke="url(#gold)" stroke-width="2"/>`;
  if (!has("fallenFeather")) {
    s += `<g transform="rotate(-8,150,568)">
      <ellipse cx="140" cy="568" rx="55" ry="7" fill="url(#pVane)"/>
      <line x1="80" y1="568" x2="200" y2="568" stroke="#d9c070" stroke-width="1.2"/>
      ${featherEye(190, 568, 0, 0.55, "#0a0f3a")}
    </g>`;
  }

  // Golden pedestal
  s += `<path d="M330,545 L470,545 L452,578 L348,578 Z" fill="url(#gold)"/>
    <ellipse cx="400" cy="545" rx="70" ry="8" fill="#fff1b8"/>
    <path d="M340,560 L460,560" stroke="#8c6418" stroke-width="1.5"/>`;
  s += has("pedestalGem")
    ? `<rect x="393" y="556" width="14" height="14" fill="url(#gemRuby)" stroke="#fff1b8" transform="rotate(45,400,563)"/>`
    : `<circle cx="400" cy="563" r="8" fill="url(#gemRuby)" stroke="#fff1b8"/>`;

  // Body, wing, neck and head
  s += `<line x1="390" y1="515" x2="384" y2="545" stroke="#c9a24a" stroke-width="4"/>
    <line x1="410" y1="515" x2="416" y2="545" stroke="#c9a24a" stroke-width="4"/>
    <ellipse cx="400" cy="455" rx="44" ry="72" fill="url(#pBody)"/>
    <ellipse cx="414" cy="470" rx="26" ry="52" fill="url(#pWing)" opacity="0.9"/>
    <path d="M398,440 l14,10 l14,-10 M398,462 l14,10 l14,-10 M398,484 l14,10 l14,-10" stroke="#e2b54a" stroke-width="1.5" fill="none" opacity="0.7"/>
    <path d="M382,410 C372,350 386,300 394,265 L416,265 C421,305 426,360 420,410 Z" fill="url(#pBody)"/>
    <circle cx="405" cy="252" r="21" fill="url(#pBody)"/>
    <ellipse cx="413" cy="247" rx="8" ry="4.5" fill="#fff"/>
    <circle cx="414" cy="247" r="2.6" fill="#000"/>
    <path d="M424,249 L447,256 L424,262 Z" fill="${has("beak") ? "#c9cbd6" : "url(#gold)"}"/>`;
  const crest = has("crest") ? [[392, 200], [418, 200]] : [[392, 200], [405, 194], [418, 200]];
  crest.forEach(([x, y]) => {
    s += `<line x1="405" y1="232" x2="${x}" y2="${y}" stroke="#2f6ff0" stroke-width="1.5"/>
      <circle cx="${x}" cy="${y}" r="4.5" fill="#2f6ff0" stroke="#f5d77a" stroke-width="1.5"/>`;
  });
  s += `<path d="M389,330 Q405,346 419,330" stroke="url(#gold)" stroke-width="2.5" fill="none"/>
    ${diamond(405, 344, 14, has("neckGem") ? "url(#gemRuby)" : "url(#gemEmerald)")}`;

  // Butterfly
  const [upper, lower] = has("butterfly") ? ["#ffb347", "#ff7b2b"] : ["#5ad1ff", "#2b7bd6"];
  s += `<g transform="translate(0,170) rotate(-15,690,330)">
    <ellipse cx="681" cy="322" rx="11" ry="8" fill="${upper}"/><ellipse cx="699" cy="322" rx="11" ry="8" fill="${upper}"/>
    <ellipse cx="683" cy="337" rx="7" ry="6" fill="${lower}"/><ellipse cx="697" cy="337" rx="7" ry="6" fill="${lower}"/>
    <line x1="690" y1="316" x2="690" y2="342" stroke="#1a1a1a" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M690,316 l-5,-8 M690,316 l5,-8" stroke="#1a1a1a" stroke-width="1"/>
  </g>`;
  return s;
}

function peacockDifferences() {
  const outer = FAN.rings[0], middle = FAN.rings[1];
  const eyeA = featherEyePoint(outer.R, featherAngle(outer.count, 4));
  const eyeB = featherEyePoint(middle.R, featherAngle(middle.count, 9));
  return [
    { id: "featherEye", x: eyeA[0], y: eyeA[1], r: 20 },
    { id: "featherNoEye", x: eyeB[0], y: eyeB[1], r: 22 },
    { id: "crest", x: 405, y: 196, r: 14 },
    { id: "beak", x: 436, y: 256, r: 14 },
    { id: "neckGem", x: 405, y: 346, r: 14 },
    { id: "pedestalGem", x: 400, y: 563, r: 14 },
    { id: "fallenFeather", x: 145, y: 568, r: 34 },
    { id: "skyStar", x: 110, y: 95, r: 18 },
    { id: "moon", x: 700, y: 85, r: 30 },
    { id: "butterfly", x: 690, y: 500, r: 22 },
  ];
}

// ---------- Scene 3: Parfum & Parels ----------

const PEARL_LOOP = { cx: 250, cy: 555, rx: 95, ry: 22, count: 26 };
function loopPearl(k) {
  const a = 2 * Math.PI * k / PEARL_LOOP.count;
  return [PEARL_LOOP.cx + PEARL_LOOP.rx * Math.cos(a), PEARL_LOOP.cy + PEARL_LOOP.ry * Math.sin(a)];
}

function drawVanity(has) {
  const random = seeded(5);
  let s = `<defs>${SHARED_DEFS}
    <linearGradient id="vBg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f9dfe4"/><stop offset="1" stop-color="#e3a2b4"/>
    </linearGradient>
    <linearGradient id="vGlass" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#c3cfe4"/>
    </linearGradient>
    <linearGradient id="vMarble" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fdfbfa"/><stop offset="1" stop-color="#e6dedb"/>
    </linearGradient>
    <linearGradient id="vPink" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffd6e6" stop-opacity="0.95"/><stop offset="1" stop-color="#f06292" stop-opacity="0.9"/>
    </linearGradient>
    <linearGradient id="vViolet" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#efe0ff" stop-opacity="0.95"/><stop offset="1" stop-color="#9c6ade" stop-opacity="0.9"/>
    </linearGradient>
    <linearGradient id="vAmber" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#b86a12"/><stop offset="0.5" stop-color="#f3b34a"/><stop offset="1" stop-color="#a0560a"/>
    </linearGradient>
    <clipPath id="vMirrorClip"><ellipse cx="400" cy="205" rx="152" ry="116"/></clipPath>
  </defs>
  <rect width="800" height="600" fill="url(#vBg)"/>`;

  // Wallpaper lattice
  s += '<g stroke="#c9963a" stroke-width="1" opacity="0.25">';
  for (let x = -400; x < 800; x += 50) {
    s += `<line x1="${x}" y1="0" x2="${x + 400}" y2="400"/><line x1="${x + 400}" y1="0" x2="${x}" y2="400"/>`;
  }
  s += "</g>";

  // Mirror
  s += `<ellipse cx="400" cy="205" rx="152" ry="116" fill="url(#vGlass)"/>
    <g clip-path="url(#vMirrorClip)" fill="#fff" opacity="0.55">
      <path d="M260,250 L380,90 L410,90 L290,250 Z"/><path d="M320,320 L470,110 L485,110 L335,320 Z"/>
    </g>
    <ellipse cx="400" cy="205" rx="160" ry="124" fill="none" stroke="url(#gold)" stroke-width="16"/>
    <path d="M360,86 Q400,40 440,86 Q420,76 400,80 Q380,76 360,86 Z" fill="url(#gold)"/>
    ${star(400, 52, 10, 4, 5, "url(#gold)")}
    <circle cx="400" cy="70" r="7" fill="${has("mirrorCrown") ? "url(#gemSapphire)" : "url(#gemRuby)"}" stroke="#fff1b8" stroke-width="1.5"/>`;
  if (!has("mirrorSparkle")) s += sparkle(312, 145, 16, "#d4a63a");
  s += sparkle(478, 262, 10, "#d4a63a");

  // Marble table
  s += `<rect y="400" width="800" height="200" fill="url(#vMarble)"/>
    <rect y="398" width="800" height="6" fill="url(#gold)"/>`;
  s += '<g stroke="#b9b0ad" fill="none" opacity="0.45">';
  for (let k = 0; k < 7; k++) {
    const x = random() * 800, y = 420 + random() * 160;
    s += `<path d="M${x.toFixed(0)},${y.toFixed(0)} q${(30 + random() * 40).toFixed(0)},${(-10 + random() * 20).toFixed(0)} ${(80 + random() * 60).toFixed(0)},${(-5 + random() * 30).toFixed(0)} t${(60 + random() * 60).toFixed(0)},${(-10 + random() * 20).toFixed(0)}" stroke-width="${(0.8 + random()).toFixed(1)}"/>`;
  }
  s += "</g>";

  // Pink ostrich feather behind the rose
  s += '<path d="M706,395 C700,300 690,230 640,160" stroke="#f3a9c4" stroke-width="2.5" fill="none"/>';
  s += '<g stroke="#ffc6da" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.85">';
  for (let k = 0; k <= 40; k++) {
    const t = 0.25 + 0.75 * k / 40, u = 1 - t;
    const x = u * u * u * 706 + 3 * u * u * t * 700 + 3 * u * t * t * 690 + t * t * t * 640;
    const y = u * u * u * 395 + 3 * u * u * t * 300 + 3 * u * t * t * 230 + t * t * t * 160;
    const len = 18 + 14 * Math.sin(Math.PI * k / 40);
    s += `<path d="M${x.toFixed(1)},${y.toFixed(1)} q${(-len * 0.7).toFixed(1)},${(len * 0.2).toFixed(1)} ${(-len).toFixed(1)},${(len * 0.65).toFixed(1)}"/>`;
    s += `<path d="M${x.toFixed(1)},${y.toFixed(1)} q${(len * 0.7).toFixed(1)},${(-len * 0.1).toFixed(1)} ${len.toFixed(1)},${(len * 0.55).toFixed(1)}"/>`;
  }
  s += "</g>";

  // Rose in a crystal vase
  s += `<path d="M700,395 C698,340 702,300 700,250" stroke="#2e7d32" stroke-width="4" fill="none"/>
    <path d="M699,330 Q672,318 668,300 Q690,302 699,330 Z" fill="#43a047"/>`;
  if (!has("roseLeaf")) s += '<path d="M701,300 Q728,290 734,270 Q710,272 701,300 Z" fill="#43a047"/>';
  s += `<circle cx="700" cy="240" r="24" fill="#b0102e"/>
    <path d="M680,236 Q700,210 720,236 Q700,226 680,236 Z" fill="#d81b45"/>
    <path d="M686,246 Q700,232 714,246 Q700,256 686,246 Z" fill="#8a0a22"/>
    <path d="M692,238 Q700,228 708,238" stroke="#ff5577" stroke-width="2" fill="none"/>
    <path d="M684,390 L716,390 L722,500 L678,500 Z" fill="#fff" fill-opacity="0.35" stroke="#fff" stroke-width="2"/>
    <line x1="690" y1="400" x2="686" y2="490" stroke="#fff" stroke-width="3" opacity="0.6"/>`;

  // Bottle 1: faceted pink, with a label
  s += `<ellipse cx="175" cy="502" rx="56" ry="7" fill="#000" opacity="0.12"/>
    <path d="M140,420 L210,420 L228,460 L210,500 L140,500 L122,460 Z" fill="url(#vPink)" stroke="#fff" stroke-width="1.5"/>
    <path d="M140,420 L158,460 L140,500 M210,420 L192,460 L210,500 M122,460 L158,460 M192,460 L228,460" stroke="#fff" stroke-opacity="0.6" fill="none"/>
    <rect x="165" y="404" width="20" height="17" fill="url(#gold)"/>
    <circle cx="175" cy="390" r="16" fill="url(#gold)"/>
    <rect x="152" y="448" width="46" height="22" rx="3" fill="#fff8f0" stroke="#d4a63a"/>
    <text x="175" y="464" font-family="Georgia, serif" font-size="13" text-anchor="middle" fill="#5a3b0a">${has("label") ? "N°8" : "N°5"}</text>`;

  // Bottle 2: round, with an atomizer bulb and tassel
  s += `<ellipse cx="320" cy="502" rx="48" ry="7" fill="#000" opacity="0.12"/>
    <circle cx="320" cy="455" r="45" fill="url(#vViolet)" stroke="#fff" stroke-width="1.5"/>
    <path d="M296,430 Q300,418 314,414" stroke="#fff" stroke-width="4" fill="none" opacity="0.7" stroke-linecap="round"/>
    <rect x="311" y="398" width="18" height="14" fill="url(#gold)"/>
    <path d="M329,404 Q360,384 380,392" stroke="url(#gold)" stroke-width="3" fill="none"/>
    <ellipse cx="395" cy="394" rx="16" ry="20" fill="#9c1446"/>
    <path d="M383,384 L407,404 M383,404 L407,384 M395,374 L395,414" stroke="#e2b54a" stroke-width="1" opacity="0.8"/>`;
  const tassel = has("tassel") ? "#ff4f9a" : "#e2b54a";
  s += `<g stroke="${tassel}" stroke-width="2.5" stroke-linecap="round">
    <line x1="395" y1="414" x2="395" y2="424"/>
    <line x1="395" y1="424" x2="388" y2="446"/><line x1="395" y1="424" x2="393" y2="448"/>
    <line x1="395" y1="424" x2="398" y2="448"/><line x1="395" y1="424" x2="403" y2="446"/>
  </g><circle cx="395" cy="424" r="4" fill="${tassel}"/>`;

  // Bottle 3: tall amber with a crystal stopper
  const liquidTop = has("liquidLevel") ? 430 : 395;
  s += `<ellipse cx="470" cy="507" rx="30" ry="5" fill="#000" opacity="0.12"/>
    <rect x="448" y="360" width="44" height="145" rx="6" fill="#fff" fill-opacity="0.3" stroke="#fff" stroke-width="1.5"/>
    <rect x="450" y="${liquidTop}" width="40" height="${503 - liquidTop}" rx="4" fill="url(#vAmber)" opacity="0.9"/>
    <line x1="456" y1="368" x2="456" y2="495" stroke="#fff" stroke-width="3" opacity="0.6"/>
    <rect x="462" y="344" width="16" height="16" fill="url(#gold)"/>`;
  s += has("stopper")
    ? `<circle cx="470" cy="328" r="15" fill="url(#gemWhite)" stroke="#fff"/>`
    : diamond(470, 326, 32, "url(#gemWhite)");

  // Lipstick
  const lipstick = has("lipstick") ? "#7b1fa2" : "#c4002f";
  s += `<ellipse cx="585" cy="506" rx="20" ry="4" fill="#000" opacity="0.12"/>
    <path d="M576,430 L576,410 Q585,398 594,402 L594,430 Z" fill="${lipstick}"/>
    <rect x="573" y="428" width="24" height="22" fill="#d9d9e0"/>
    <rect x="569" y="448" width="32" height="58" rx="3" fill="url(#gold)"/>
    <line x1="575" y1="452" x2="575" y2="502" stroke="#fff1b8" stroke-width="2"/>`;

  // Pearl loop on the table
  for (let k = 0; k < PEARL_LOOP.count; k++) {
    const [x, y] = loopPearl(k);
    s += pearl(x, y, 7, k === 8 && has("pearlGold") ? "url(#goldPearl)" : "url(#pearl)");
  }

  // Earrings in a golden dish
  s += `<ellipse cx="530" cy="566" rx="54" ry="15" fill="url(#gold)"/>
    <ellipse cx="530" cy="563" rx="44" ry="10" fill="#f3d27a"/>
    <path d="M508,546 q-7,-8 0,-14" stroke="#c9963a" stroke-width="2" fill="none"/>
    ${diamond(508, 553, 14, "url(#gemWhite)")}`;
  if (!has("earring")) {
    s += `<path d="M548,548 q7,-8 0,-14" stroke="#c9963a" stroke-width="2" fill="none"/>${diamond(548, 555, 14, "url(#gemWhite)")}`;
  }
  return s;
}

function vanityDifferences() {
  const goldPearl = loopPearl(8);
  return [
    { id: "mirrorCrown", x: 400, y: 70, r: 14 },
    { id: "mirrorSparkle", x: 312, y: 145, r: 18 },
    { id: "label", x: 175, y: 459, r: 22 },
    { id: "tassel", x: 395, y: 432, r: 18 },
    { id: "stopper", x: 470, y: 326, r: 20 },
    { id: "liquidLevel", x: 470, y: 412, r: 24 },
    { id: "lipstick", x: 585, y: 416, r: 18 },
    { id: "roseLeaf", x: 718, y: 286, r: 18 },
    { id: "pearlGold", x: goldPearl[0], y: goldPearl[1], r: 12 },
    { id: "earring", x: 548, y: 552, r: 16 },
  ];
}

// ---------- Scene 4: De Zwaan ----------

const NECK_PEARLS = [[249, 304], [253, 310], [258, 315], [264, 318], [270, 320], [276, 320], [282, 318]];
const REEDS = [{ x: 30, top: 400 }, { x: 47, top: 372 }, { x: 64, top: 388 }, { x: 80, top: 410 }];

function lotus(cx, cy) {
  let s = "";
  [-60, -30, 0, 30, 60].forEach(angle => {
    s += `<ellipse cx="${cx}" cy="${cy - 9}" rx="5" ry="11" fill="#ff9ec7" stroke="#fff" stroke-opacity="0.5"
      transform="rotate(${angle},${cx},${cy})"/>`;
  });
  return s + `<circle cx="${cx}" cy="${cy - 2}" r="3.5" fill="#ffd166"/>`;
}

function lilyPad(cx, cy, rx) {
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${rx * 0.3}" fill="url(#sPad)"/>
    <path d="M${cx},${cy} L${cx + rx * 0.9},${cy - rx * 0.12} L${cx + rx * 0.9},${cy + rx * 0.12} Z" fill="#05060f"/>`;
}

function drawSwan(has) {
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

function swanDifferences() {
  const [px, py] = NECK_PEARLS[3];
  return [
    { id: "shootingStar", x: 148, y: 84, r: 28 },
    { id: "cloud", x: 652, y: 164, r: 24 },
    { id: "pavilionFlag", x: 754, y: 298, r: 14 },
    { id: "cattail", x: REEDS[2].x, y: REEDS[2].top + 21, r: 18 },
    { id: "lilyFlower", x: 600, y: 532, r: 18 },
    { id: "goldFish", x: 500, y: 563, r: 22 },
    { id: "beakKnob", x: 266, y: 221, r: 10 },
    { id: "crownGem", x: 282, y: 197, r: 12 },
    { id: "neckPearls", x: px, y: py, r: 10 },
    { id: "firefly", x: 530, y: 300, r: 14 },
    { id: "floatingFeather", x: 170, y: 575, r: 22 },
  ];
}

// ---------- Scene 5: Cocktails & Discobal ----------

const DISCO = { cx: 400, cy: 100, r: 56, tile: 10 };

function drawCocktails(has) {
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

function cocktailDifferences() {
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

export const SCENES = [
  { name: "Champagne & Diamonds", draw: drawChampagne, differences: champagneDifferences() },
  { name: "The Peacock", draw: drawPeacock, differences: peacockDifferences() },
  { name: "Perfume & Pearls", draw: drawVanity, differences: vanityDifferences() },
  { name: "The Swan", draw: drawSwan, differences: swanDifferences() },
  { name: "Cocktails & Disco Ball", draw: drawCocktails, differences: cocktailDifferences() },
];
