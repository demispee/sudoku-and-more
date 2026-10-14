<!-- Spot the difference (.openspec/specs/002-spot-the-difference). The rules are in Rust;
     the state and actions are in useSpot; the drawings are in scenes.ts. -->
<script setup lang="ts">
import { computed, onMounted, onUnmounted } from "vue";
import BackLink from "../components/BackLink.vue";
import SiteFooter from "../components/SiteFooter.vue";
import SlashMark from "../components/SlashMark.vue";
import SpotPicture from "../spot/SpotPicture.vue";
import { COUNTS, useSpot } from "../spot/useSpot";

const game = useSpot();
const { count, scene, active, found, misses, hints, time, record, solvedCount, marks, message, result, pictures } = game;

const marksFor = (side: number) => computed(() => marks.value.filter(m => m.side === undefined || m.side === side));
const sideMarks = [marksFor(0), marksFor(1)];

/** "3 misses \ 1 hint" for the result, singular or plural */
const extras = computed(() => {
  const r = result.value!;
  const parts: string[] = [];
  if (r.misses) parts.push(`${r.misses} ${r.misses === 1 ? "miss" : "misses"}`);
  if (r.hints) parts.push(`${r.hints} ${r.hints === 1 ? "hint" : "hints"}`);
  return parts.map(p => ` \\ ${p}`).join("");
});

function onKey(event: KeyboardEvent) {
  // Cmd+S and other browser shortcuts stay the browser's; a held key does it once
  if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
  const key = event.key.toLowerCase();
  if (key === "h") game.hint();
  if (key === "s") game.reveal();
  if (key === "n") game.newRound();
}

function onCount(event: Event) {
  const select = event.target as HTMLSelectElement;
  select.blur();
  game.setCount(Number(select.value));
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
    <div class="eyebrow">LAB271 \ spot the difference</div>
    <h1>Every detail counts</h1>

    <div class="bar">
      <select title="Number of differences" :value="count" @change="onCount">
        <option v-for="c in COUNTS" :key="c.count" :value="c.count">{{ c.count }} differences \ {{ c.name }}</option>
      </select>
      <span class="label scene">{{ scene?.name }}</span>
    </div>

    <div class="bar">
      <span class="label">found \&nbsp;<span class="found">{{ found.size }}</span>&nbsp;/&nbsp;<span class="total">{{ active.length }}</span></span>
      <span class="label">time \&nbsp;<span class="time">{{ time }}</span></span>
      <span class="label">misses \&nbsp;<span class="misses">{{ misses }}</span></span>
      <span class="label">hints \&nbsp;<span class="hints">{{ hints }}</span></span>
      <span class="label">record \&nbsp;<span class="record">{{ record }}</span></span>
      <span class="label">solved \&nbsp;<span class="solved">{{ solvedCount }}</span></span>
    </div>

    <div class="pictures">
      <SpotPicture v-for="side in [0, 1]" :key="side" :art="pictures[side]!" :marks="sideMarks[side]!.value"
        :miss-penalty="game.missPenalty" @click="(x, y) => game.click(side, x, y)" />
      <div v-if="result" class="overlay">
        <strong>{{ result.isRecord ? "New record" : "All found" }} in {{ result.time }}</strong>
        <span class="meta">{{ result.count }} differences{{ extras }}{{ result.previous ? ` \\ record ${result.previous}` : "" }} \ next picture loading</span>
      </div>
    </div>

    <div class="bar">
      <button class="btn primary hint" @click="game.hint">hint</button>
      <button class="btn reveal" @click="game.reveal">show solution</button>
      <button class="btn next" @click="game.newRound()">next</button>
    </div>

    <div class="message">{{ message }}</div>

    <div class="help">
      a wrong click costs 5 seconds <span class="bs">\</span> a hint costs 10 seconds<br>
      h <span class="bs">\</span> hint &nbsp; s <span class="bs">\</span> show solution &nbsp; n <span class="bs">\</span> next picture
    </div>

    <SiteFooter />
  </main>
</template>

<style scoped>
.page {
  --page-width: 1180px;
  user-select: none;
}
.bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
}
.label.scene { background: transparent; border: 1px solid var(--c-border); color: var(--c-muted); }
.pictures {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 20px;
}
.overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-end;
  gap: 8px;
  padding: 32px;
  box-sizing: border-box;
  border-radius: 12px 12px 12px 0;
  background: color-mix(in srgb, var(--c-canvas) 90%, transparent);
}
.overlay strong {
  font-size: clamp(32px, 6vw, 48px);
  font-weight: 900;
  letter-spacing: -0.04em;
  line-height: 1.09;
}
.overlay .meta {
  font-family: var(--mono);
  font-size: 12px;
  letter-spacing: 0.06em;
  color: var(--c-muted);
}
.message {
  max-width: 640px;
  margin-bottom: 20px;
}
</style>
