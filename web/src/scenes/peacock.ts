// Scene 2: The Peacock
import { seeded, sparkle, diamond, SHARED_DEFS } from "./helpers";
import type { Point, Has, Difference, Scene } from "./types";

const FAN = { cx: 400, cy: 440, rings: [{ R: 330, count: 17 }, { R: 255, count: 12 }, { R: 180, count: 9 }] };

function featherAngle(count: number, k: number): number {
  return -168 + k * (156 / (count - 1));
}

function featherEyePoint(R: number, angle: number): Point {
  const a = angle * Math.PI / 180;
  return [FAN.cx + (R - 14) * Math.cos(a), FAN.cy + (R - 14) * Math.sin(a)];
}

function featherEye(x: number, y: number, angle: number, scale: number, centerColor: string): string {
  const layers: [number, number, string][] = [[24, 19, "#3f8f3a"], [19, 15, "url(#gold)"], [14, 11, "#19a7a3"], [9.5, 7.5, "#1d3fb8"], [5.5, 4.5, centerColor]];
  return layers.map(([rx, ry, fill]) =>
    `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${(rx * scale).toFixed(1)}" ry="${(ry * scale).toFixed(1)}" fill="${fill}" transform="rotate(${angle.toFixed(1)},${x.toFixed(1)},${y.toFixed(1)})"/>`
  ).join("");
}

function feather(R: number, angle: number, { eye = true, centerColor = "#0a0f3a" }: { eye?: boolean; centerColor?: string } = {}): string {
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

function drawPeacock(has: Has): string {
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
      const options: { eye?: boolean; centerColor?: string } = {};
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

function peacockDifferences(): Difference[] {
  const outer = FAN.rings[0]!, middle = FAN.rings[1]!;
  const eyeA = featherEyePoint(outer.R, featherAngle(outer.count, 4));
  const eyeB = featherEyePoint(middle.R, featherAngle(middle.count, 9));
  return [
    { id: "featherEye", x: eyeA[0], y: eyeA[1], r: 20 },
    { id: "featherNoEye", x: eyeB[0], y: eyeB[1], r: 22 },
    { id: "crest", x: 405, y: 196, r: 14 },
    { id: "beak", x: 436, y: 256, r: 14 },
    { id: "neckGem", x: 405, y: 346, r: 14 },
    { id: "pedestalGem", x: 400, y: 563, r: 14 },
    { id: "fallenFeather", x: 145, y: 566, r: 34 },
    { id: "skyStar", x: 110, y: 95, r: 18 },
    { id: "moon", x: 700, y: 85, r: 30 },
    { id: "butterfly", x: 690, y: 500, r: 22 },
  ];
}

export const peacock: Scene = { name: "The Peacock", draw: drawPeacock, differences: peacockDifferences() };
