<!-- The start page (.openspec/specs/000-site, Requirement 2) -->
<script setup lang="ts">
import SiteFooter from "../components/SiteFooter.vue";
import SlashMark from "../components/SlashMark.vue";

export interface Game {
  href: string;
  name: string;
  text: string;
}

const games: Game[] = [
  { href: "sudoku.html", name: "Sudoku", text: "Difficulty 1 to 10, notes, and a solver that explains every number" },
  { href: "spot-the-difference.html", name: "Spot the difference", text: "From coral reefs to city skylines, each scene with hidden differences" },
  { href: "balls.html", name: "Bouncing balls", text: "Click to add balls and toggle gravity" },
  { href: "ministry.html", name: "The Ministry of Odd Forms", text: "Stamp absurd forms by a rulebook that gets stranger every day" },
  { href: "shy-squares.html", name: "Shy squares", text: "Squares that are afraid of your cursor. Herd them into the pen" },
  { href: "mastermind.html", name: "Mastermind", text: "Break the secret code on a real wooden board" },
];
</script>

<template>
  <SlashMark />
  <main class="page">
    <div class="eyebrow">LAB271 \ sudoku and more</div>
    <h1>Pick a game</h1>
    <p class="intro">Small games that run in your browser. Nothing to install.</p>

    <div class="games">
      <a v-for="(game, i) in games" :key="game.href" class="game" :href="game.href">
        <div class="eyebrow">{{ String(i + 1).padStart(2, "0") }}</div>
        <strong>{{ game.name }}</strong>
        <span>{{ game.text }}</span>
        <div class="go">play \ →</div>
      </a>
    </div>

    <SiteFooter />
  </main>
</template>

<style scoped>
h1 { margin-bottom: 16px; }
.intro {
  margin: 0 0 40px;
  color: var(--c-muted);
}
.games {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
}
.game {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 24px;
  border: 1px solid var(--c-border);
  border-radius: 20px 20px 20px 0;
  background: var(--c-canvas-2);
  color: var(--c-text);
  text-decoration: none;
  transition: background-color var(--motion), border-color var(--motion);
}
.game:hover { background: var(--c-panel); border-color: var(--c-tq); }
.game .eyebrow { color: var(--c-muted); }
.game strong {
  font-size: 28px;
  font-weight: 900;
  letter-spacing: -0.04em;
  line-height: 1.09;
}
.game span { color: var(--c-muted); font-size: 15px; }
.game .go {
  margin-top: auto;
  padding-top: 12px;
  color: var(--c-tq);
  font-family: var(--mono);
  font-size: 12px;
  letter-spacing: 0.06em;
}
</style>
