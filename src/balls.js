// Bouncing-balls physics: creating, moving and colliding balls.
// No DOM access, so this runs in the browser and in Node.js (tests).

export const GRAVITY = 0.25;
export const BOUNCINESS = 0.9;
// Lab271 colors, each as [highlight, base]
export const COLORS = [
  ["#B5FAFB", "#1EE8ED"],
  ["#FFD3AE", "#FF8D33"],
  ["#FF8CC8", "#FF0089"],
  ["#A9CBEA", "#347EC1"],
];

export function random(min, max) {
  return Math.random() * (max - min) + min;
}

export function createBall(x, y) {
  return {
    x,
    y,
    vx: random(-6, 6),
    vy: random(-8, 2),
    radius: random(12, 34),
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  };
}

// Moves a ball one frame inside a width × height area
export function moveBall(ball, width, height, gravityOn) {
  if (gravityOn) ball.vy += GRAVITY;
  ball.x += ball.vx;
  ball.y += ball.vy;

  // Bounce off the edges of the window
  if (ball.x - ball.radius < 0 || ball.x + ball.radius > width) {
    ball.vx *= -BOUNCINESS;
    ball.x = Math.min(Math.max(ball.x, ball.radius), width - ball.radius);
  }
  if (ball.y - ball.radius < 0 || ball.y + ball.radius > height) {
    ball.vy *= -BOUNCINESS;
    ball.y = Math.min(Math.max(ball.y, ball.radius), height - ball.radius);
  }
}

// Let two balls bounce off each other, with bigger balls being heavier
export function collide(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const distance = Math.hypot(dx, dy);
  const minDistance = a.radius + b.radius;
  if (distance === 0 || distance >= minDistance) return;

  const nx = dx / distance;
  const ny = dy / distance;
  const massA = a.radius ** 2;
  const massB = b.radius ** 2;

  // Push the balls apart so they don't overlap
  const overlap = minDistance - distance;
  a.x -= nx * overlap * (massB / (massA + massB));
  a.y -= ny * overlap * (massB / (massA + massB));
  b.x += nx * overlap * (massA / (massA + massB));
  b.y += ny * overlap * (massA / (massA + massB));

  // Exchange speed along the line between their centers
  const speed = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
  if (speed <= 0) return;
  const impulse = (2 * speed) / (massA + massB);
  a.vx -= impulse * massB * nx;
  a.vy -= impulse * massB * ny;
  b.vx += impulse * massA * nx;
  b.vy += impulse * massA * ny;
}
