<!-- Mastermind (.openspec/specs/007-mastermind). The code and the answer pegs are in Rust,
     the state and actions in useMastermind, and the 3D board in mastermind/scene.ts. -->
<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch, watchEffect } from "vue";
import BackLink from "../components/BackLink.vue";
import SiteFooter from "../components/SiteFooter.vue";
import SlashMark from "../components/SlashMark.vue";
import { createBoard, type Board } from "../mastermind/scene";
import { palette } from "../mastermind/palettes";
import { SYMBOLS } from "../mastermind/symbols";
import { useMastermind } from "../mastermind/useMastermind";

const game = useMastermind();
const { level, shape, paletteName, colours, symbols, rows, current, code, result, best, full, lastColour } = game;

const LEVEL_NAMES = ["classic", "hard"];
const host = ref<HTMLElement>();
const noWebgl = ref(false);
let board: Board | null = null;
let stopWatch: (() => void) | null = null;

function onKey(event: KeyboardEvent) {
  if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
  const n = Number(event.key);
  if (Number.isInteger(n) && n >= 1 && n <= shape.value.colours) {
    game.place(n - 1);
  } else if (event.key === "Backspace") {
    event.preventDefault();
    game.back();
  } else if (event.key === "Enter") {
    event.preventDefault(); // or the browser also clicks a button that still has the focus
    if (result.value) game.again();
    else game.check();
  }
}

/** The board is built for the level's holes and colours, so a new level gets a new board */
function mountBoard() {
  stopWatch?.();
  board?.dispose();
  board = null;
  try {
    board = createBoard(host.value!, { hole: game.takeOut, colour: game.place }, shape.value);
  } catch {
    noWebgl.value = true;
    return;
  }
  stopWatch = watchEffect(() => {
    board?.update({
      rows: rows.value.map(r => ({ pegs: [...r.pegs], answer: r.answer })),
      current: current.value,
      code: code.value,
      won: result.value?.won ?? false,
      colours: colours.value,
      studio: palette(paletteName.value).studio,
      hop: lastColour.value,
      symbols: symbols.value,
    });
  });
}

watch(level, mountBoard);

onMounted(() => {
  window.addEventListener("keydown", onKey);
  mountBoard();
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
      <div class="levels">
        <button v-for="(name, l) in LEVEL_NAMES" :key="name" class="btn level" :class="{ on: level === l }"
          @click="game.setLevel(l)">{{ name }}</button>
      </div>
      <button class="btn palette" @click="game.nextPalette">colours \ {{ paletteName }}</button>
      <button class="btn symbols" :class="{ on: symbols }" :aria-pressed="symbols" @click="game.toggleSymbols">symbols</button>
      <button class="btn new-game" @click="game.again">new game</button>
      <button class="btn primary check" :disabled="!full" @click="game.check">check</button>
    </div>

    <div class="board-wrap">
      <div ref="host" class="board" :style="{ background: palette(paletteName).studio.low }"></div>
      <p v-if="noWebgl" class="no-webgl">This browser can't draw the 3D board (it has no WebGL).</p>
      <div v-if="result" class="overlay">
        <strong v-if="result.won">Code broken in {{ result.rows }} {{ result.rows === 1 ? "row" : "rows" }}</strong>
        <strong v-else>The code wasn't broken</strong>
        <span class="meta">{{ result.isRecord ? "your best yet" : `best ${best === null ? "–" : `${best} rows`}` }}</span>
        <button class="btn primary again" @click="game.again">again</button>
      </div>
    </div>

    <p class="legend">
      <span><span class="peg black"></span>right colour, right hole</span>
      <span><span class="peg white"></span>right colour, other hole</span>
    </p>

    <div class="colours">
      <button v-for="(colour, c) in colours" :key="c" class="colour" :aria-label="`colour ${c + 1}`"
        @click="game.place(c)">
        <span class="dot" :style="{ background: colour }">
          <svg v-if="symbols" class="shape" viewBox="0 0 24 24" aria-hidden="true"><path :d="SYMBOLS[c]!.path" fill-rule="evenodd" /></svg>
        </span><span class="n">{{ c + 1 }}</span>
      </button>
      <button class="btn primary check thumb" :disabled="!full" @click="game.check">check</button>
    </div>

    <div class="help">
      click a colour <span class="bs">\</span> place it &nbsp; click a peg <span class="bs">\</span> take it out &nbsp;
      1–{{ shape.colours }} <span class="bs">\</span> place &nbsp; backspace <span class="bs">\</span> take out &nbsp;
      enter <span class="bs">\</span> check &nbsp; drag <span class="bs">\</span> turn the board
    </div>

    <SiteFooter />
  </main>
</template>

<style scoped>
h1 { margin-bottom: 24px; }
.bar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 16px; }
.levels { display: inline-flex; gap: 4px; margin-left: auto; }
.board-wrap { position: relative; }
.board {
  height: clamp(420px, calc(100vh - 300px), 860px);
  border-radius: 18px 18px 18px 4px;
  overflow: hidden;
  transition: background 0.5s;
}
/* On a narrow screen the board fits the width, so a tall frame is only empty table */
@media (max-width: 700px) { .board { height: auto; aspect-ratio: 4 / 5; } }
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
.colour:hover { border-color: var(--c-orange); }
.dot { display: inline-grid; place-items: center; width: 18px; height: 18px; border-radius: 50%; box-shadow: inset -2px -2px 3px rgba(0, 0, 0, 0.35); }
.shape { width: 80%; height: 80%; }
.shape path { fill: #fff; stroke: rgba(10, 10, 15, 0.85); stroke-width: 2.6; paint-order: stroke; stroke-linejoin: round; }
.help { margin-top: 16px; }
/* What the answer pegs mean, with pegs that look like the ones on the board */
.legend { display: flex; flex-wrap: wrap; gap: 6px 18px; margin: 12px 0 0; color: var(--c-muted); font-size: 14px; }
.legend > span { display: inline-flex; align-items: center; gap: 8px; }
.peg { width: 12px; height: 12px; border-radius: 50%; }
.peg.black { background: radial-gradient(circle at 35% 30%, #4a4e5a, #0a0a0f 60%); box-shadow: 0 0 0 1px #9aa3b8; }
.peg.white { background: radial-gradient(circle at 35% 30%, #ffffff, #d9d3ea 70%); }
.thumb { display: none; }
/* On a phone: small buttons above the board, and the colours with check in one row
   under it, within reach of the thumb */
@media (max-width: 700px) {
  .bar { gap: 6px; }
  .bar .btn { height: 34px; padding: 0 12px; font-size: 12px; }
  .bar .check { display: none; }
  .levels { margin-left: 0; }
  .colours { position: sticky; bottom: 0; flex-wrap: nowrap; gap: 4px; margin-top: 10px; padding: 8px 0; background: var(--c-canvas); }
  .colour { flex: 1; justify-content: center; min-width: 0; padding: 8px 0; }
  .colour .n { display: none; }
  .dot { width: 22px; height: 22px; }
  .thumb { display: inline-flex; flex: none; align-items: center; justify-content: center; height: 38px; padding: 0 14px; }
  .help { display: none; } /* the keys don't help on a phone */
  .legend { font-size: 13px; }
  .overlay { top: auto; bottom: 12px; left: 12px; right: 12px; padding: 12px 16px; } /* not over the code */
}
</style>
