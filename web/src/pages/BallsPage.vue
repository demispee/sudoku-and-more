<!-- Bouncing balls (.openspec/specs/003-bouncing-balls). The physics is in Rust
     (game-core/src/balls.rs); this component draws the balls and handles input. -->
<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import BackLink from "../components/BackLink.vue";
import { World, ballColors, randomSeed } from "../wasm";

const START_BALLS = 20;
const BALLS_PER_CLICK = 5;

const canvas = ref<HTMLCanvasElement>();
const count = ref(0);
const gravityOn = ref(true);
const compact = ref(false);

const colors = ballColors(); // highlight, base, highlight, base, …
const world = new World(randomSeed());
let ctx: CanvasRenderingContext2D | null = null;
let frameId = 0;

function resize() {
  const el = canvas.value!;
  el.width = window.innerWidth;
  el.height = window.innerHeight;
}

function drawBall(c: CanvasRenderingContext2D, x: number, y: number, radius: number, color: number) {
  const gradient = c.createRadialGradient(x - radius / 3, y - radius / 3, radius / 6, x, y, radius);
  gradient.addColorStop(0, colors[color * 2]!);
  gradient.addColorStop(1, colors[color * 2 + 1]!);
  c.beginPath();
  c.arc(x, y, radius, 0, Math.PI * 2);
  c.fillStyle = gradient;
  c.shadowColor = colors[color * 2 + 1]!;
  c.shadowBlur = 20;
  c.fill();
}

function frame() {
  const el = canvas.value!;
  world.step(el.width, el.height, gravityOn.value);
  if (ctx) {
    // A see-through background leaves short trails behind the balls
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(2, 12, 23, 0.25)";
    ctx.fillRect(0, 0, el.width, el.height);
    const balls = world.balls(); // x, y, radius and color for every ball
    for (let i = 0; i < balls.length; i += 4) drawBall(ctx, balls[i]!, balls[i + 1]!, balls[i + 2]!, balls[i + 3]!);
  }
  count.value = world.count;
  frameId = requestAnimationFrame(frame);
}

function addBalls(event: MouseEvent) {
  for (let i = 0; i < BALLS_PER_CLICK; i++) world.add(event.clientX, event.clientY);
  count.value = world.count;
}

function onKey(event: KeyboardEvent) {
  const key = event.key.toLowerCase();
  if (key === "g") gravityOn.value = !gravityOn.value;
  else if (key === "c") world.clear();
  else if (key === "h") compact.value = !compact.value;
  count.value = world.count;
}

onMounted(() => {
  ctx = canvas.value!.getContext("2d");
  resize();
  window.addEventListener("resize", resize);
  window.addEventListener("keydown", onKey);
  for (let i = 0; i < START_BALLS; i++) world.addRandom(canvas.value!.width, canvas.value!.height);
  frame();
});

onUnmounted(() => {
  cancelAnimationFrame(frameId);
  window.removeEventListener("resize", resize);
  window.removeEventListener("keydown", onKey);
  world.free();
});
</script>

<template>
  <canvas ref="canvas" @click="addBalls"></canvas>
  <div class="panel">
    <BackLink />
    <template v-if="!compact">
      <div class="eyebrow">LAB271 \ bouncing balls \ <span class="count">{{ count }} balls</span></div>
      <strong>Click to add balls</strong>
      <div class="help">
        g <span class="bs">\</span> gravity <span class="gravity">{{ gravityOn ? "on" : "off" }}</span> &nbsp;
        c <span class="bs">\</span> clear &nbsp;
        h <span class="bs">\</span> hide panel
      </div>
    </template>
  </div>
</template>

<style>
/* The canvas fills the window, so this page never scrolls */
html, body { height: 100%; overflow: hidden; }
</style>

<style scoped>
canvas {
  display: block;
  cursor: crosshair;
}
.panel {
  position: fixed;
  top: 20px;
  left: 20px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  padding: 18px 22px;
  border: 1px solid var(--c-border);
  border-radius: 20px 20px 20px 0;
  background: color-mix(in srgb, var(--c-canvas-2) 88%, transparent);
  user-select: none;
}
strong {
  font-size: 28px;
  font-weight: 900;
  letter-spacing: -0.04em;
  line-height: 1.09;
}
</style>
