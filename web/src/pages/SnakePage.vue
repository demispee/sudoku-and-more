<!-- Reverse snake (.openspec/specs/006-reverse-snake). The snake is in Rust; the state and
     actions are in useSnake. -->
<script setup lang="ts">
import { computed, onMounted, onUnmounted } from "vue";
import BackLink from "../components/BackLink.vue";
import SiteFooter from "../components/SiteFooter.vue";
import SlashMark from "../components/SlashMark.vue";
import { formatTime } from "../format";
import { DOWN, LEFT, RIGHT, UP, useSnake } from "../snake/useSnake";
import { snakeGridSize } from "../wasm";

const game = useSnake();
const { snake, apple, time, paused, result, best } = game;

const SIZE = snakeGridSize();
const CELL = 20; // px per cell in the drawing

const KEYS: Record<string, number> = {
  ArrowUp: UP, ArrowRight: RIGHT, ArrowDown: DOWN, ArrowLeft: LEFT, w: UP, d: RIGHT, s: DOWN, a: LEFT,
};

/** The head's eyes look at the apple */
const eyes = computed(() => {
  const head = snake.value[0];
  if (!head) return [];
  const dx = Math.sign(apple.value.x - head.x) * 3;
  const dy = Math.sign(apple.value.y - head.y) * 3;
  const cx = head.x * CELL + CELL / 2;
  const cy = head.y * CELL + CELL / 2;
  return [{ cx: cx - 4 + dx, cy: cy - 3 + dy }, { cx: cx + 4 + dx, cy: cy - 3 + dy }];
});

function onKey(event: KeyboardEvent) {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  const direction = KEYS[event.key.length === 1 ? event.key.toLowerCase() : event.key];
  if (direction !== undefined) {
    event.preventDefault(); // arrows don't scroll the page
    game.steer(direction);
  } else if (event.key === " " && !event.repeat) {
    event.preventDefault();
    game.togglePause();
  } else if (event.key === "Enter" && result.value) {
    game.again();
  }
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
    <div class="eyebrow">LAB271 \ reverse snake</div>
    <h1>You are the apple</h1>

    <div class="bar">
      <span class="label">survived \&nbsp;<span class="time">{{ time }}</span></span>
      <span class="label">snake \&nbsp;<span class="length">{{ snake.length }}</span>&nbsp;long</span>
      <span class="label">best \&nbsp;<span class="best">{{ best === null ? "–" : formatTime(best) }}</span></span>
      <span v-if="paused" class="label paused">paused</span>
    </div>

    <div class="board-wrap">
      <svg class="board" :viewBox="`0 0 ${SIZE * CELL} ${SIZE * CELL}`">
        <rect v-for="(c, i) in snake" :key="i" class="body" :class="{ head: i === 0 }"
          :x="c.x * CELL + 1" :y="c.y * CELL + 1" :width="CELL - 2" :height="CELL - 2" rx="5" />
        <circle v-for="(e, k) in eyes" :key="`eye${k}`" class="eye" :cx="e.cx" :cy="e.cy" r="2.2" />
        <g class="apple">
          <circle :cx="apple.x * CELL + CELL / 2" :cy="apple.y * CELL + CELL / 2 + 1" r="8" />
          <path class="leaf" :d="`M${apple.x * CELL + 10},${apple.y * CELL + 4} q4,-4 7,-2 q-3,4 -7,2`" />
        </g>
      </svg>
      <div v-if="result" class="overlay">
        <strong v-if="result.status === 'eaten'">Eaten after {{ result.time }}</strong>
        <strong v-else>The snake got itself stuck! The apple wins after {{ result.time }}</strong>
        <span class="meta">{{ result.isRecord ? "your longest yet" : `best ${best === null ? "–" : formatTime(best)}` }}</span>
        <button class="btn primary again" @click="game.again">again</button>
      </div>
    </div>

    <div class="pad">
      <button class="btn up" aria-label="up" @click="game.steer(UP)">↑</button>
      <button class="btn left" aria-label="left" @click="game.steer(LEFT)">←</button>
      <button class="btn down" aria-label="down" @click="game.steer(DOWN)">↓</button>
      <button class="btn right" aria-label="right" @click="game.steer(RIGHT)">→</button>
    </div>

    <div class="help">arrows or wasd <span class="bs">\</span> run &nbsp; space <span class="bs">\</span> pause &nbsp; enter <span class="bs">\</span> again</div>

    <SiteFooter />
  </main>
</template>

<style scoped>
h1 { margin-bottom: 24px; }
.bar { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
.paused { color: var(--c-orange); }
.board-wrap { position: relative; width: min(100%, 560px, calc(100vh - 360px)); min-width: 280px; }
.board {
  display: block;
  width: 100%;
  aspect-ratio: 1;
  border: 2px solid var(--c-muted);
  border-radius: 18px 18px 18px 4px;
  background:
    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px) 0 0 / 5% 5%,
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px) 0 0 / 5% 5%,
    #04121f;
}
.body { fill: var(--c-magenta); opacity: 0.85; }
.body.head { opacity: 1; }
.eye { fill: #fff; }
.apple circle { fill: #e5484d; }
.leaf { fill: #30a46c; }
.overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px;
  text-align: center;
  border-radius: 18px 18px 18px 4px;
  background: rgba(1, 10, 21, 0.88);
}
.overlay strong { font-size: 22px; }
.pad {
  display: grid;
  grid-template-columns: repeat(3, 56px);
  grid-template-areas: ". up ." "left down right";
  gap: 8px;
  margin-top: 18px;
}
.pad .up { grid-area: up; }
.pad .left { grid-area: left; }
.pad .down { grid-area: down; }
.pad .right { grid-area: right; }
.pad .btn { padding: 10px 0; justify-content: center; }
.help { margin-top: 16px; }
</style>
