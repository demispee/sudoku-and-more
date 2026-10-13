<!-- The sudoku (.openspec/specs/001-sudoku). The rules are in Rust; the state and the
     actions are in useSudoku. -->
<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import BackLink from "../components/BackLink.vue";
import SiteFooter from "../components/SiteFooter.vue";
import SlashMark from "../components/SlashMark.vue";
import NumberPad from "../sudoku/NumberPad.vue";
import SudokuBoard from "../sudoku/SudokuBoard.vue";
import { LEVELS, useSudoku } from "../sudoku/useSudoku";

const game = useSudoku();
const { chosenLevel, level, time, hints, solvedCount, notesMode, autoSolving, message, done } = game;

function onKey(event: KeyboardEvent) {
  const key = event.key;
  if (key >= "1" && key <= "9") game.enter(Number(key));
  else if (key === "Backspace" || key === "Delete" || key === "0") game.erase();
  else if (key.toLowerCase() === "n") game.toggleNotes();
  else if (key.toLowerCase() === "s") game.step();
  else if (key.startsWith("Arrow")) {
    event.preventDefault();
    game.move(key);
  }
}

function onLevel(event: Event) {
  const select = event.target as HTMLSelectElement;
  select.blur();
  game.setLevel(Number(select.value));
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
    <div class="eyebrow">LAB271 \ sudoku</div>
    <h1>Logic beats guessing</h1>

    <div class="game">
      <section class="board-col">
        <SudokuBoard :game="game" @select="game.select" />
        <NumberPad :done="done" @enter="game.enter" />
      </section>

      <section class="side">
        <div>
          <label class="field-label" for="difficulty">difficulty</label>
          <select id="difficulty" :value="chosenLevel" @change="onLevel">
            <option v-for="(name, i) in LEVELS" :key="i" :value="i + 1">{{ i + 1 }} \ {{ name }}</option>
          </select>
        </div>

        <div class="stats">
          <span class="label">level \&nbsp;<span class="level">{{ level }}</span></span>
          <span class="label">time \&nbsp;<span class="time">{{ time }}</span></span>
          <span class="label">hints \&nbsp;<span class="hints">{{ hints }}</span></span>
          <span class="label">solved \&nbsp;<span class="solved">{{ solvedCount }}</span></span>
        </div>

        <div class="actions">
          <button class="btn primary step" @click="game.step">step</button>
          <button class="btn notes" :class="{ on: notesMode }" @click="game.toggleNotes">notes</button>
          <button class="btn erase" @click="game.erase">erase</button>
          <button class="btn solve" :class="{ on: autoSolving }" @click="game.toggleAutoSolve">{{ autoSolving ? "stop" : "solve" }}</button>
          <button class="btn skip" @click="game.newGame">skip</button>
        </div>

        <div v-if="message" class="message"><span class="eyebrow">{{ message.label }}</span>{{ message.text }}</div>

        <div class="help">
          1 to 9 <span class="bs">\</span> fill in &nbsp; backspace <span class="bs">\</span> erase &nbsp; arrows <span class="bs">\</span> move<br>
          n <span class="bs">\</span> notes &nbsp; s <span class="bs">\</span> step
        </div>
      </section>
    </div>

    <SiteFooter />
  </main>
</template>

<style scoped>
.page { user-select: none; }
.game {
  display: flex;
  flex-wrap: wrap;
  gap: 40px;
  align-items: flex-start;
}
.board-col {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: min(100%, 480px);
}
.side {
  display: flex;
  flex-direction: column;
  gap: 24px;
  flex: 1;
  min-width: 260px;
  max-width: 420px;
}
.field-label {
  display: block;
  margin-bottom: 8px;
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 0.08em;
  color: var(--c-muted);
}
select { width: 100%; }
.stats, .actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.message .eyebrow { display: block; margin-bottom: 6px; }
</style>
