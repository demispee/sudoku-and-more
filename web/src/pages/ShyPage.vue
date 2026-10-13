<!-- Shy squares (.openspec/specs/005-shy-squares). How the squares move is in Rust; the state
     and actions are in useShy. -->
<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import BackLink from "../components/BackLink.vue";
import SiteFooter from "../components/SiteFooter.vue";
import SlashMark from "../components/SlashMark.vue";
import { useShy, type ShySquare } from "../shy/useShy";
import { shyShapes } from "../wasm";

const game = useShy();
const { level, squares, caught, time, result } = game;

const [penLeft, penTop, penRight, penBottom, wall, half] = shyShapes() as unknown as number[];
let pointer: { x: number; y: number } | null = null;

/**
 * The pointer in field units (800 × 600), whatever size the field has on screen, without
 * its border. Outside the field (a finger dragged past the edge) it scares nothing.
 */
function onPointer(event: PointerEvent) {
  const el = event.currentTarget as Element;
  const rect = el.getBoundingClientRect();
  const width = el.clientWidth || rect.width;
  const height = el.clientHeight || rect.height;
  const x = ((event.clientX - rect.left - el.clientLeft) / width) * 800;
  const y = ((event.clientY - rect.top - el.clientTop) / height) * 600;
  pointer = x >= 0 && x <= 800 && y >= 0 && y <= 600 ? { x, y } : null;
  game.setCursor(pointer);
}

function onLeave() {
  pointer = null;
  game.setCursor(null);
}

/** The eyes look away from the cursor: shy */
function eyes(s: ShySquare) {
  let dx = 0;
  let dy = 0;
  if (pointer && !s.caught) {
    const d = Math.hypot(s.x - pointer.x, s.y - pointer.y) || 1;
    dx = ((s.x - pointer.x) / d) * 2.5;
    dy = ((s.y - pointer.y) / d) * 2.5;
  }
  return [{ cx: s.x - 4 + dx, cy: s.y - 2 + dy }, { cx: s.x + 4 + dx, cy: s.y - 2 + dy }];
}

function onKey(event: KeyboardEvent) {
  if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
  if (event.key.toLowerCase() === "r") game.restart();
}

onMounted(() => {
  window.addEventListener("keydown", onKey);
  game.start();
});

onUnmounted(() => {
  window.removeEventListener("keydown", onKey);
  game.stop();
});

defineExpose({ game });
</script>

<template>
  <SlashMark />
  <main class="page">
    <BackLink />
    <div class="eyebrow">LAB271 \ shy squares</div>
    <h1>Herd the shy squares</h1>

    <div class="bar">
      <span class="label">level \&nbsp;<span class="level">{{ level }}</span></span>
      <span class="label">caught \&nbsp;<span class="caught">{{ caught }}</span>&nbsp;/&nbsp;<span class="total">{{ squares.length }}</span></span>
      <span class="label">time \&nbsp;<span class="time">{{ time }}</span></span>
      <span class="label">best \&nbsp;<span class="best">{{ game.bestTime(level) }}</span></span>
    </div>

    <div class="field-wrap">
      <svg class="field" viewBox="0 0 800 600" @pointermove="onPointer" @pointerdown="onPointer" @pointerleave="onLeave" @pointercancel="onLeave">
        <rect class="pen-floor" :x="penLeft" :y="penTop" :width="penRight! - penLeft!" :height="penBottom! - penTop!" />
        <rect class="wall" :x="penLeft" :y="penTop! - wall!" :width="penRight! - penLeft! + wall!" :height="wall" />
        <rect class="wall" :x="penLeft" :y="penBottom" :width="penRight! - penLeft! + wall!" :height="wall" />
        <rect class="wall" :x="penRight" :y="penTop" :width="wall" :height="penBottom! - penTop!" />
        <text class="pen-label" :x="(penLeft! + penRight!) / 2" :y="(penTop! + penBottom!) / 2">pen</text>
        <g v-for="(s, i) in squares" :key="i" class="square" :class="{ caught: s.caught }">
          <rect :x="s.x - half!" :y="s.y - half!" :width="half! * 2" :height="half! * 2" rx="4" />
          <circle v-for="(e, k) in eyes(s)" :key="k" class="eye" :cx="e.cx" :cy="e.cy" r="2" />
        </g>
      </svg>
      <div v-if="result" class="overlay">
        <strong>{{ result.isRecord ? "New best" : "Level done" }}: level {{ result.level }} in {{ result.time }}</strong>
        <span class="meta">level {{ result.level + 1 }} starts in 3 seconds</span>
      </div>
    </div>

    <div class="help">move the mouse or your finger to herd them into the pen &nbsp; r <span class="bs">\</span> restart the level</div>

    <SiteFooter />
  </main>
</template>

<style scoped>
h1 { margin-bottom: 24px; }
.bar { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
/* As large as fits: never wider than 960 px, never taller than the screen below the header */
.field-wrap { position: relative; max-width: min(960px, calc((100vh - 320px) * 4 / 3)); min-width: 300px; }
.field {
  display: block;
  width: 100%;
  aspect-ratio: 4 / 3;
  border: 2px solid var(--c-muted);
  border-radius: 18px 18px 18px 4px;
  background: radial-gradient(circle at 30% 40%, #0b2236, #04121f);
  touch-action: none;
  cursor: crosshair;
}
.pen-floor { fill: rgba(30, 232, 237, 0.08); }
.wall { fill: var(--c-tq); }
.pen-label { fill: var(--c-muted); font-size: 16px; text-anchor: middle; letter-spacing: 0.2em; }
.square rect { fill: var(--c-orange); }
.square.caught rect { fill: var(--c-tq); }
.eye { fill: #02121f; }
.overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border-radius: 18px 18px 18px 4px;
  background: rgba(1, 10, 21, 0.8);
}
.overlay strong { font-size: 22px; }
.help { margin-top: 16px; }
</style>
