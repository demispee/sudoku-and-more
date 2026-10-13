<!-- Mastermind (.openspec/specs/007-mastermind). The code and the answer pegs are in Rust,
     the state and actions in useMastermind, and the 3D board in mastermind/scene.ts. -->
<script setup lang="ts">
import { onMounted, onUnmounted, ref, watchEffect } from "vue";
import BackLink from "../components/BackLink.vue";
import SiteFooter from "../components/SiteFooter.vue";
import SlashMark from "../components/SlashMark.vue";
import { createBoard, PEG_COLOURS, type Board } from "../mastermind/scene";
import { useMastermind } from "../mastermind/useMastermind";

const game = useMastermind();
const { rows, current, selected, code, result, best, full } = game;

const NAMES = ["red", "orange", "yellow", "green", "blue", "purple"];
const host = ref<HTMLElement>();
const noWebgl = ref(false);
let board: Board | null = null;
let stopWatch: (() => void) | null = null;

function onKey(event: KeyboardEvent) {
  if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
  if (event.key >= "1" && event.key <= "6") {
    game.typeColour(Number(event.key) - 1);
  } else if (event.key === "Backspace") {
    event.preventDefault();
    game.back();
  } else if (event.key === "Enter") {
    if (result.value) game.again();
    else game.check();
  }
}

onMounted(() => {
  window.addEventListener("keydown", onKey);
  try {
    board = createBoard(host.value!, { hole: game.tapHole, colour: game.pick });
  } catch {
    noWebgl.value = true;
    return;
  }
  stopWatch = watchEffect(() => {
    board?.update({
      rows: rows.value.map(r => ({ pegs: [...r.pegs], answer: r.answer })),
      current: current.value,
      selected: selected.value,
      code: code.value,
    });
  });
});

onUnmounted(() => {
  window.removeEventListener("keydown", onKey);
  stopWatch?.();
  board?.dispose();
  game.stop();
});

defineExpose({ game });
</script>

<template>
  <SlashMark />
  <main class="page">
    <BackLink />
    <div class="eyebrow">LAB271 \ mastermind</div>
    <h1>Break the code</h1>

    <div class="bar">
      <span class="label">row \&nbsp;<span class="row">{{ Math.min(current + 1, rows.length) }}</span>&nbsp;of {{ rows.length }}</span>
      <span class="label">best \&nbsp;<span class="best">{{ best === null ? "–" : `${best} rows` }}</span></span>
      <button class="btn primary check" :disabled="!full" @click="game.check">check</button>
    </div>

    <div class="board-wrap">
      <div ref="host" class="board"></div>
      <p v-if="noWebgl" class="no-webgl">This browser can't draw the 3D board (it has no WebGL).</p>
      <div v-if="result" class="overlay">
        <strong v-if="result.won">Code broken in {{ result.rows }} {{ result.rows === 1 ? "row" : "rows" }}</strong>
        <strong v-else>The code wasn't broken</strong>
        <span class="meta">{{ result.isRecord ? "your best yet" : `best ${best === null ? "–" : `${best} rows`}` }}</span>
        <button class="btn primary again" @click="game.again">again</button>
      </div>
    </div>

    <div class="colours">
      <button v-for="(colour, c) in PEG_COLOURS" :key="c" class="colour" :class="{ on: selected === c }"
        :aria-label="NAMES[c]" @click="game.pick(c)">
        <span class="dot" :style="{ background: colour }"></span>{{ c + 1 }}
      </button>
    </div>

    <div class="help">
      click a dish, then a hole <span class="bs">\</span> 1–6 <span class="bs">\</span> place &nbsp;
      backspace <span class="bs">\</span> take out &nbsp; enter <span class="bs">\</span> check &nbsp;
      drag <span class="bs">\</span> turn the board
    </div>

    <SiteFooter />
  </main>
</template>

<style scoped>
h1 { margin-bottom: 24px; }
.bar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 16px; }
.check { margin-left: auto; }
.board-wrap { position: relative; }
.board {
  height: clamp(320px, calc(100vh - 380px), 720px);
  border-radius: 18px 18px 18px 4px;
  overflow: hidden;
  background: #07090c;
}
/* On a narrow screen the board fits the width, so a tall frame is only empty table */
@media (max-width: 700px) { .board { height: auto; aspect-ratio: 3 / 2; } }
.board :deep(canvas) { display: block; width: 100%; height: 100%; cursor: grab; }
.no-webgl { position: absolute; inset: 0; display: grid; place-items: center; margin: 0; padding: 24px; text-align: center; }
.overlay {
  position: absolute;
  left: 16px;
  top: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 18px 28px;
  text-align: center;
  border-radius: 18px 18px 18px 4px;
  background: rgba(1, 10, 21, 0.85);
}
.overlay strong { font-size: 22px; }
.colours { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
.colour {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border: 1px solid var(--c-muted);
  border-radius: 999px;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
}
.colour.on { border-color: var(--c-orange); }
.dot { width: 14px; height: 14px; border-radius: 50%; box-shadow: inset -2px -2px 3px rgba(0, 0, 0, 0.35); }
.help { margin-top: 16px; }
</style>
