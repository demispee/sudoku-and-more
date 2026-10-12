// Spot-the-difference rules: scene order, rounds, hit detection and time penalties.
// No DOM access, so this runs in the browser and in Node.js (tests).

export const CLICK_MARGIN = 12;     // extra room around a difference, in picture units
export const MISS_PENALTY = 5000;   // ms added to your time for a wrong click
export const HINT_PENALTY = 10000;  // ms added to your time for a hint

export function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Returns a function that gives the next scene: all scenes in random order before any
// repeats, and never the same scene twice in a row.
export function sceneOrder(scenes) {
  let order = [];
  let index = -1;
  return () => {
    index++;
    if (index >= order.length) {
      const last = order[order.length - 1];
      order = shuffle(scenes.slice());
      if (order[0] === last) order.push(order.shift());
      index = 0;
    }
    return order[index];
  };
}

// The differences of one round, picked at random from the scene
export function pickDifferences(scene, count) {
  return shuffle(scene.differences.slice()).slice(0, count);
}

// Misses and hints cost time, so clicking around at random doesn't pay off
export function totalTime(ms, misses, hints) {
  return ms + misses * MISS_PENALTY + hints * HINT_PENALTY;
}

function near(d, x, y) {
  return Math.hypot(d.x - x, d.y - y) <= d.r + CLICK_MARGIN;
}

// The closest difference not found yet within reach of (x, y), or undefined
export function findHit(active, found, x, y) {
  const distance = d => Math.hypot(d.x - x, d.y - y);
  return active
    .filter(d => !found.has(d.id) && near(d, x, y))
    .sort((a, b) => distance(a) - distance(b))[0];
}

// Clicking an already found difference is not a mistake
export function hitsFound(active, found, x, y) {
  return active.some(d => found.has(d.id) && near(d, x, y));
}

export function recordKey(scene, count) {
  return `${scene.name}|${count}`;
}
