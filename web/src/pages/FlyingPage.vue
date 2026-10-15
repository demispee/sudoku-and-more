<!-- Flying Schubert (.openspec/specs/008-flying-schubert). How Schubert and the obstacles
     move is in Rust; the state and actions are in useFlying. Schubert is a Schuberg Philis
     trademark and not covered by the license (see README). -->
<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import BackLink from "../components/BackLink.vue";
import SiteFooter from "../components/SiteFooter.vue";
import SlashMark from "../components/SlashMark.vue";
import { LANDSCAPES, type Landscape } from "../flying/landscapes";
import { useFlying, type Obstacle } from "../flying/useFlying";
import schubert from "../shy/schubert.png";
import { flyingShapes } from "../wasm";

const FADE = 1000; // ms for a new landscape to fade in

const game = useFlying();
const { y, vy, obstacles, score, distance, started, over, isRecord, best, chosen, landscape } = game;

const [ground, x, , obstacleWidth, gap] = flyingShapes() as unknown as number[];

/** Up to 25° up when rising and down when falling */
const tilt = computed(() => Math.max(-25, Math.min(25, vy.value * 3)));
/** The background moves at a quarter of the obstacles' speed, so it feels far away */
const farOffset = computed(() => (distance.value / 4) % 800);

/** The landscape that is fading out while the next one fades in */
const previous = ref<number | null>(null);
let fadeTimer: ReturnType<typeof setTimeout> | undefined;
watch(landscape, (_, old) => {
  previous.value = old;
  clearTimeout(fadeTimer);
  fadeTimer = setTimeout(() => (previous.value = null), FADE);
});
const layers = computed(() => [
  ...(previous.value === null ? [] : [{ index: previous.value, fadeIn: false }]),
  { index: landscape.value, fadeIn: previous.value !== null },
]);

/** Both parts of an obstacle, drawn from x = 0; the page moves it into place */
function drawObstacle(l: Landscape, o: Obstacle) {
  const bottom = o.gapTop + gap!;
  return l.obstacle(0, 0, obstacleWidth!, o.gapTop, "bottom") + l.obstacle(0, bottom, obstacleWidth!, ground! - bottom, "top");
}

/** The same obstacle keeps the same key while it moves, so its drawing isn't redone */
const key = (o: Obstacle) => Math.round(o.x + distance.value);

function onKey(event: KeyboardEvent) {
  if (event.key !== " " || event.ctrlKey || event.metaKey || event.altKey) return;
  event.preventDefault(); // no scrolling, and no pressing a focused button
  if (!event.repeat) game.flap();
}

function chooseLandscape(event: MouseEvent) {
  game.nextLandscape();
  (event.currentTarget as HTMLElement).blur(); // the space bar is for flapping
}

onMounted(() => {
  window.addEventListener("keydown", onKey);
  game.start();
});

onUnmounted(() => {
  window.removeEventListener("keydown", onKey);
  clearTimeout(fadeTimer);
  game.stop();
});

defineExpose({ game });
</script>

<template>
  <SlashMark />
  <main class="page">
    <BackLink />
    <div class="eyebrow">LAB271 \ flying Schubert</div>
    <h1>Fly, Schubert, fly</h1>

    <div class="bar">
      <span class="label">score \&nbsp;<span class="score">{{ score }}</span></span>
      <span class="label">best \&nbsp;<span class="best">{{ best }}</span></span>
      <button class="btn landscape" @click="chooseLandscape">landscape \ {{ LANDSCAPES[chosen]!.label }}</button>
    </div>

    <!-- No double-tap zoom on the field: Safari ignores touch-action on SVG -->
    <div class="field-wrap" @touchstart.prevent>
      <svg class="field" viewBox="0 0 800 600" @pointerdown.prevent="game.flap()">
        <defs>
          <linearGradient v-for="l in LANDSCAPES" :id="`sky-${l.name}`" :key="l.name" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" :stop-color="l.sky[0]" />
            <stop offset="1" :stop-color="l.sky[1]" />
          </linearGradient>
        </defs>
        <g v-for="layer in layers" :key="layer.index" class="layer" :class="[LANDSCAPES[layer.index]!.name, { 'fade-in': layer.fadeIn }]">
          <rect width="800" height="600" :fill="`url(#sky-${LANDSCAPES[layer.index]!.name})`" />
          <g :transform="`translate(${-farOffset} 0)`">
            <g v-html="LANDSCAPES[layer.index]!.far" />
            <g transform="translate(800 0)" v-html="LANDSCAPES[layer.index]!.far" />
          </g>
          <g v-for="o in obstacles" :key="key(o)" class="obstacle" :transform="`translate(${o.x} 0)`" v-html="drawObstacle(LANDSCAPES[layer.index]!, o)" />
          <g v-html="LANDSCAPES[layer.index]!.ground" />
        </g>
        <image class="schubert" :href="schubert" :x="x! - 24" :y="y - 24" width="48" height="48" :transform="`rotate(${tilt} ${x} ${y})`" />
      </svg>
      <div v-if="!started" class="overlay start">
        <strong>click or press space to fly</strong>
        <span class="meta">every 20 points a new landscape</span>
      </div>
      <div v-else-if="over" class="overlay end">
        <strong>{{ isRecord ? "New best" : "Game over" }}: {{ score }} {{ score === 1 ? "point" : "points" }}</strong>
        <span class="meta">click or press space to fly again</span>
      </div>
    </div>

    <div class="help">click, tap or space \ flap &nbsp; obstacles get faster every 10 points</div>

    <SiteFooter />
  </main>
</template>

<style scoped>
/* A quick double tap anywhere on the page flaps instead of zooming; two fingers still zoom */
.page { touch-action: manipulation; }
h1 { margin-bottom: 24px; }
.bar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 20px; }
/* As large as fits: never wider than 960 px, never taller than the screen below the header */
.field-wrap { position: relative; max-width: min(960px, calc((100vh - 320px) * 4 / 3)); min-width: 300px; touch-action: none; }
.field {
  display: block;
  width: 100%;
  aspect-ratio: 4 / 3;
  border: 2px solid var(--c-muted);
  border-radius: 18px 18px 18px 4px;
  touch-action: none;
  cursor: pointer;
  user-select: none;
}
.fade-in { animation: fade-in 1s ease-in-out; }
@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
.overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border-radius: 18px 18px 18px 4px;
  background: rgba(1, 10, 21, 0.45);
  pointer-events: none;
}
.overlay strong { font-size: 22px; }
.help { margin-top: 16px; }
</style>
