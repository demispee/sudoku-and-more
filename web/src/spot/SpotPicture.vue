<!-- One of the two pictures, with the marks drawn over it. A click is reported in picture
     units (800 × 600), whatever size the picture has on screen. -->
<script setup lang="ts">
import type { Mark } from "./useSpot";

const props = defineProps<{ art: string; marks: Mark[]; missPenalty: number }>();
const emit = defineEmits<{ click: [x: number, y: number] }>();

function onClick(event: MouseEvent) {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  emit("click", ((event.clientX - rect.left) / rect.width) * 800, ((event.clientY - rect.top) / rect.height) * 600);
}

const cross = (m: Mark) => `M${m.x - 12},${m.y - 12} L${m.x + 12},${m.y + 12} M${m.x + 12},${m.y - 12} L${m.x - 12},${m.y + 12}`;
</script>

<template>
  <div class="picture" @click="onClick">
    <svg class="art" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg" v-html="art"></svg>
    <svg class="marks" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
      <template v-for="m in marks" :key="m.id">
        <circle v-if="m.kind === 'found'" class="found" :cx="m.x" :cy="m.y" :r="m.r + 8" />
        <circle v-else-if="m.kind === 'hint'" class="hintmark" :cx="m.x" :cy="m.y" :r="m.r * 2.6" />
        <circle v-else-if="m.kind === 'revealed'" class="revealed" :cx="m.x" :cy="m.y" :r="m.r + 8" />
        <g v-else>
          <path class="miss" :d="cross(m)" />
          <text class="penalty" :x="m.x + 16" :y="m.y - 14">+{{ props.missPenalty / 1000 }}s</text>
        </g>
      </template>
    </svg>
  </div>
</template>

<style scoped>
.picture {
  position: relative;
  width: calc(50% - 8px);
  box-sizing: border-box;
  aspect-ratio: 4 / 3;
  border: 2px solid var(--c-muted);
  border-radius: 12px 12px 12px 0;
  overflow: hidden;
  background: var(--c-canvas-2);
  cursor: crosshair;
}
@media (max-width: 760px) {
  .picture { width: 100%; }
}
svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.marks { pointer-events: none; }
.found {
  fill: none;
  stroke: var(--c-tq);
  stroke-width: 5;
  filter: drop-shadow(0 0 4px #000);
  animation: pop 0.35s cubic-bezier(.2, 0, .2, 1);
  transform-box: fill-box;
  transform-origin: center;
}
@keyframes pop {
  from { transform: scale(1.6); opacity: 0; }
}
.miss {
  stroke: var(--c-magenta);
  stroke-width: 6;
  stroke-linecap: round;
  animation: fade 0.8s ease-out forwards;
}
@keyframes fade {
  to { opacity: 0; }
}
.penalty {
  fill: var(--c-magenta);
  font: bold 22px var(--mono);
  animation: fade 0.9s ease-out forwards;
}
.hintmark {
  fill: none;
  stroke: var(--c-orange);
  stroke-width: 4;
  stroke-dasharray: 10 8;
  animation: pulse 0.8s ease-in-out infinite alternate;
}
@keyframes pulse {
  to { stroke-opacity: 0.25; }
}
.revealed {
  fill: none;
  stroke: var(--c-magenta);
  stroke-width: 5;
  stroke-dasharray: 12 8;
  filter: drop-shadow(0 0 4px #000);
}
</style>
