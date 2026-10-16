// Schubert, the Schuberg Philis sheep, without a hat, drawn after the picture in
// web/src/shy/schubert.png (.openspec/specs/008-flying-schubert, Requirement 6). A
// trademark of Schuberg Philis, adapted with their permission (see README). SVG in a
// 48 × 48 box; the hats of the landscapes go on top.

/** The top of the head, where a hat sits, and how far the head leans */
export const HEAD_TOP = { x: 23, y: 11.5, tilt: -10 };

const WOOL = "#f4e4d2";
const WOOL_SHADE = "#e8d2bc";
const FACE = "#4a4a4a";
const DARK = "#1f1f1f";

/** The fleece: an oval with a scalloped edge */
function fleece(): string {
  const [cx, cy, rx, ry] = [24.6, 28.4, 14.2, 13.6];
  let out = `<ellipse cx="${cx + 0.6}" cy="${cy + 0.8}" rx="${rx}" ry="${ry}" fill="${WOOL_SHADE}"/>`;
  for (let k = 0; k < 18; k++) {
    const a = (Math.PI * 2 * k) / 18;
    const x = (cx + rx * Math.cos(a)).toFixed(2);
    const y = (cy + ry * Math.sin(a)).toFixed(2);
    out += `<circle cx="${x}" cy="${y}" r="2.7" fill="${k > 3 && k < 9 ? WOOL_SHADE : WOOL}"/>`;
  }
  return out + `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${WOOL}"/>`;
}

const leg = (x: number) =>
  `<path d="M${x} 40.5 L${x - 0.6} 46" stroke="${DARK}" stroke-width="2" stroke-linecap="round"/>`;

const ear = (cx: number, cy: number, angle: number) =>
  `<g transform="rotate(${angle} ${cx} ${cy})">` +
  `<ellipse cx="${cx}" cy="${cy}" rx="3.2" ry="1.7" fill="#2b2b2b"/>` +
  `<ellipse cx="${cx}" cy="${cy}" rx="1.9" ry="0.8" fill="#707070"/></g>`;

const eye = (cx: number, cy: number, r: number) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#ffffff" stroke="${DARK}" stroke-width="0.6"/>` +
  `<circle cx="${cx + r * 0.3}" cy="${cy + r * 0.3}" r="${r * 0.45}" fill="${DARK}"/>`;

export const SCHUBERT =
  leg(20.4) + leg(25) + leg(31) + leg(35.6) +
  fleece() +
  ear(16.4, 12.2, -28) + ear(28.8, 13.6, 24) +
  // A tuft of wool on top of the head
  `<circle cx="20.6" cy="12" r="2.2" fill="${WOOL}"/><circle cx="23.4" cy="11.2" r="2.5" fill="${WOOL}"/>` +
  `<circle cx="26" cy="12.4" r="2.1" fill="${WOOL}"/>` +
  // The head, leaning to the left, with a darker snout
  `<path d="M17 13 C12 16 12 27 16.5 30.5 C19 32.5 23 31.5 25.5 28 C28.5 24 29 17 26 14 C23.5 11.5 19.5 11.5 17 13 Z" ` +
  `fill="${FACE}" stroke="${DARK}" stroke-width="0.8"/>` +
  `<ellipse cx="20" cy="27.6" rx="4.3" ry="3.1" fill="#3a3a3a"/>` +
  `<path d="M18.6 27.8 q0.8 -0.9 1.6 0 q0.8 -0.9 1.6 0" stroke="${DARK}" stroke-width="0.6" fill="none"/>` +
  eye(19.2, 14.2, 2.7) + eye(24.6, 15.6, 2.5);
