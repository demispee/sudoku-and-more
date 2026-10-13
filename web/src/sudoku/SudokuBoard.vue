<!-- The 9 × 9 board with notes, highlights, and the overlay while loading or when solved -->
<script setup lang="ts">
import { computed } from "vue";
import { isPeer } from "../wasm";
import { col, row, type Sudoku } from "./useSudoku";

const props = defineProps<{ game: Sudoku }>();
const emit = defineEmits<{ select: [cell: number] }>();

const CELLS = [...Array(81).keys()];
const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const game = computed(() => props.game);

function classes(i: number) {
  const g = game.value;
  const v = g.values.value[i]!;
  const selected = g.selected.value;
  const selectedValue = selected === null ? 0 : g.values.value[selected];
  return {
    br: col(i) % 3 === 2 && col(i) !== 8,
    bb: row(i) % 3 === 2 && row(i) !== 8,
    given: g.puzzle.value[i] !== 0,
    hinted: g.hinted.value.has(i),
    wrong: v !== 0 && v !== g.solution.value[i],
    peer: selected !== null && isPeer(i, selected),
    same: !!selectedValue && v === selectedValue,
    selected: i === selected,
    pattern: g.pattern.value.has(i),
    target: g.targets.value.has(i),
    flash: g.flash.value.cell === i,
  };
}

const has = (mask: number, n: number) => (mask & (1 << n)) !== 0;

// A new key restarts the flash animation when a step fills in the same cell again
const cellKey = (i: number) => (game.value.flash.value.cell === i ? `${i}-${game.value.flash.value.count}` : `${i}`);
</script>

<template>
  <div class="board">
    <div v-for="i in CELLS" :key="cellKey(i)" class="cell" :class="classes(i)" @click="emit('select', i)">
      <template v-if="game.values.value[i]">{{ game.values.value[i] }}</template>
      <div v-else-if="game.notes.value[i] || game.removed.value[i]" class="notes">
        <span v-for="n in DIGITS" :key="n"
          :class="{ gone: !has(game.notes.value[i]!, n) && has(game.removed.value[i]!, n) }">{{
            has(game.notes.value[i]!, n) || has(game.removed.value[i]!, n) ? n : "" }}</span>
      </div>
    </div>

    <div v-if="game.overlay.value" class="overlay">
      <template v-if="game.overlay.value.kind === 'loading'">
        <span class="loader"><i></i><i></i><i></i></span>
        <span class="meta">building a level {{ game.overlay.value.level }} puzzle</span>
      </template>
      <template v-else>
        <strong>Solved in {{ game.overlay.value.time }}</strong>
        <span class="meta">level {{ game.overlay.value.level }} \ {{
          game.overlay.value.hints === 0 ? "no hints"
          : `${game.overlay.value.hints} ${game.overlay.value.hints === 1 ? "hint" : "hints"}` }} \ next puzzle loading</span>
      </template>
    </div>
  </div>
</template>

<style scoped>
.board {
  position: relative;
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  width: 100%;
  aspect-ratio: 1;
  border: 2px solid var(--c-muted);
  border-radius: 12px 12px 12px 0;
  overflow: hidden;
  background: var(--c-canvas-2);
}
.cell {
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 1px solid var(--c-border);
  border-bottom: 1px solid var(--c-border);
  font-size: min(6vw, 28px);
  color: var(--c-tq);
  cursor: pointer;
  transition: background-color var(--motion);
}
.cell.br { border-right: 2px solid var(--c-muted); }
.cell.bb { border-bottom: 2px solid var(--c-muted); }
.cell.given { color: var(--c-text); font-weight: 700; }
.cell.hinted { color: var(--c-muted); }
.cell.wrong { color: var(--c-magenta); }
.cell.peer { background: var(--c-canvas); }
.cell.same { background: var(--c-border); }
.cell.pattern { background: var(--c-panel); }
.cell.selected { background: var(--c-panel); box-shadow: inset 0 0 0 2px var(--c-tq); }
.cell.target { box-shadow: inset 0 0 0 2px var(--c-tq); }
.cell.flash { animation: flash 0.8s cubic-bezier(.2, 0, .2, 1); }
@keyframes flash {
  from { background: var(--c-panel); }
}
.notes {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  width: 100%;
  height: 100%;
  font-family: var(--mono);
  font-size: min(2.3vw, 11px);
  color: var(--c-muted);
}
.notes span {
  display: flex;
  align-items: center;
  justify-content: center;
}
.notes .gone {
  color: var(--c-tq);
  text-decoration: line-through;
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

.loader { display: inline-flex; gap: 4px; }
.loader i {
  width: 8px;
  height: 8px;
  background: var(--c-tq);
  animation: blink 1s cubic-bezier(.2, 0, .2, 1) infinite;
}
.loader i:nth-child(2) { animation-delay: 160ms; }
.loader i:nth-child(3) { animation-delay: 320ms; }
@keyframes blink {
  0%, 100% { opacity: 0.15; }
  50% { opacity: 1; }
}
</style>
