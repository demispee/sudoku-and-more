// Drawing helpers shared by the spot-the-difference scenes
import type { Point } from "./types";

// ---------- Drawing helpers ----------
// Pictures are SVG strings in an 800x600 coordinate system. Everything
// random uses a seeded generator, so both pictures come out identical
// except for the differences.

export function seeded(seed: number): () => number {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rotatePoint(x: number, y: number, cx: number, cy: number, degrees: number): Point {
  const a = degrees * Math.PI / 180;
  const dx = x - cx, dy = y - cy;
  return [cx + dx * Math.cos(a) - dy * Math.sin(a), cy + dx * Math.sin(a) + dy * Math.cos(a)];
}

export function starPath(cx: number, cy: number, outer: number, inner: number, points: number): string {
  let d = "";
  for (let k = 0; k < points * 2; k++) {
    const r = k % 2 ? inner : outer;
    const a = Math.PI * k / points - Math.PI / 2;
    d += `${k ? "L" : "M"}${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }
  return d + "Z";
}

export function star(cx: number, cy: number, outer: number, inner: number, points: number, fill: string, extra = ""): string {
  return `<path d="${starPath(cx, cy, outer, inner, points)}" fill="${fill}" ${extra}/>`;
}

export function sparkle(cx: number, cy: number, size: number, color = "#fffbe8"): string {
  return star(cx, cy, size, size * 0.22, 4, color, 'filter="url(#glow)"');
}

// Brilliant-cut gem seen from the side; (cx, cy) is the widest point
export function diamond(cx: number, cy: number, w: number, fill: string): string {
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

export function pearl(cx: number, cy: number, r: number, fill = "url(#pearl)"): string {
  return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r}" fill="${fill}"/>`;
}

export function quadPoint(p0: Point, p1: Point, p2: Point, t: number): Point {
  const u = 1 - t;
  return [u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]];
}

// Gradients shared by all scenes
export const SHARED_DEFS = `
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
