<!-- The Ministry of Odd Forms (.openspec/specs/004-ministry-of-odd-forms). The rules are in
     Rust; the state and actions are in useMinistry. -->
<script setup lang="ts">
import { computed, onMounted, onUnmounted } from "vue";
import BackLink from "../components/BackLink.vue";
import SiteFooter from "../components/SiteFooter.vue";
import SlashMark from "../components/SlashMark.vue";
import { HURRY, useMinistry } from "../ministry/useMinistry";

const game = useMinistry();
const { form, rules, day, today, stamped, strikes, stampMark, message, tooSlow, memo, fired, best, FORMS_PER_DAY, timeLimit, timeLeft } = game;

const EMOJI: Record<string, string> = {
  penguin: "🐧", goose: "🪿", cat: "🐈", badger: "🦡", octopus: "🐙", llama: "🦙", snail: "🐌", owl: "🦉",
};
const INK: Record<string, string> = { red: "#e5484d", blue: "#347ec1", green: "#30a46c", yellow: "#f5c400" };

/** The rulebook, newest on top, each with its number */
const book = computed(() => rules.value.map((text, i) => ({ number: i + 1, text })).reverse());
/** Where the tea stains land on the desk, one per strike */
const STAINS = [{ left: "6%", top: "68%" }, { left: "74%", top: "66%" }, { left: "40%", top: "76%" }];

function onKey(event: KeyboardEvent) {
  if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
  const key = event.key.toLowerCase();
  // Enter and space would also click a stamp button that still has the focus
  if (key === "enter" || key === " ") event.preventDefault();
  if (key === "a") game.stamp(true);
  else if (key === "r") game.stamp(false);
  else if (key === "enter") {
    if (fired.value) game.reapply();
    else game.nextDay();
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
    <div class="eyebrow">LAB271 \ the ministry of odd forms</div>
    <h1>Rules are rules</h1>

    <div class="bar">
      <span class="label">day \&nbsp;<span class="day">{{ day }}</span></span>
      <span class="label">today \&nbsp;<span class="today">{{ today }}</span>&nbsp;/&nbsp;{{ FORMS_PER_DAY }}</span>
      <span class="label">stamped \&nbsp;<span class="stamped">{{ stamped }}</span></span>
      <span class="label">tea spilled \&nbsp;<span class="strikes">{{ strikes }}</span>&nbsp;/&nbsp;3</span>
      <span class="label">best \&nbsp;<span class="best">{{ best ? `day ${best.days}, ${best.forms} forms` : "–" }}</span></span>
    </div>

    <div class="office">
      <div class="desk">
        <div v-for="(stain, i) in STAINS.slice(0, strikes)" :key="i" class="stain" :style="stain" />
        <article class="form">
          <header>Application form 27-B/6 \ filed on {{ form.weekday }}</header>
          <dl>
            <dt>Applicant</dt><dd class="name">{{ form.name }}</dd>
            <dt>Species</dt><dd class="species">{{ EMOJI[form.species] }} {{ form.species }}</dd>
            <dt>Hat</dt><dd class="hat">{{ form.hat ? "🎩 yes" : "no" }}</dd>
            <dt>Favourite number</dt><dd class="number">{{ form.number }}</dd>
            <dt>Doodle</dt>
            <dd class="doodle">
              <svg viewBox="0 0 120 30" width="120" height="30" :aria-label="`${form.doodle} doodle`">
                <path d="M4,20 C18,2 26,28 40,14 S62,4 70,18 S96,28 116,8" fill="none" :stroke="INK[form.doodle]"
                  stroke-width="4" stroke-linecap="round" />
              </svg>
              {{ form.doodle }}
            </dd>
          </dl>
          <div v-if="stampMark" class="stamp" :class="stampMark">{{ stampMark }}</div>
          <div class="time" :class="{ hurry: timeLeft <= HURRY }" role="timer"
            :aria-label="`${Math.ceil(timeLeft / 1000)} seconds left`">
            <span :style="{ width: `${(timeLeft / timeLimit) * 100}%` }"></span>
          </div>
        </article>

        <div v-if="memo" class="overlay memo">
          <span class="eyebrow">memo from the minister \ day {{ day }}</span>
          <strong>{{ memo }}</strong>
          <button class="btn primary next-day" @click="game.nextDay">next day</button>
        </div>
        <div v-if="fired" class="overlay fired">
          <strong>You're fired.</strong>
          <span class="meta">You lasted until day {{ day }} and stamped {{ stamped }} forms right.</span>
          <button class="btn primary reapply" @click="game.reapply">reapply</button>
        </div>
      </div>

      <section class="side">
        <div class="actions">
          <button class="btn primary approve" @click="game.stamp(true)">approve</button>
          <button class="btn reject" @click="game.stamp(false)">reject</button>
        </div>
        <div v-if="message" class="message"><span class="eyebrow">{{ tooSlow ? "too slow" : "tea spilled" }}</span>{{ message }}</div>
        <div class="rulebook">
          <span class="eyebrow">rulebook \ newest first</span>
          <ol>
            <li v-for="rule in book" :key="rule.number"><span class="n">{{ rule.number }}</span>{{ rule.text }}</li>
          </ol>
          <p class="fine-print">The newest rule that fits decides. No rule fits? Approve.</p>
        </div>
        <div class="help">a <span class="bs">\</span> approve &nbsp; r <span class="bs">\</span> reject &nbsp; enter <span class="bs">\</span> next day</div>
      </section>
    </div>

    <SiteFooter />
  </main>
</template>

<style scoped>
h1 { margin-bottom: 24px; }
.bar { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
.office { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); gap: 32px; align-items: start; }
@media (max-width: 860px) { .office { grid-template-columns: 1fr; } }

.desk {
  position: relative;
  min-height: 420px;
  padding: 36px 28px;
  border-radius: 18px 18px 18px 4px;
  background: repeating-linear-gradient(90deg, #3a2a1c 0 22px, #3f2e1f 22px 44px);
  overflow: hidden;
}
.stain {
  position: absolute;
  width: 110px;
  height: 110px;
  border-radius: 50%;
  border: 6px solid rgba(150, 95, 40, 0.55);
  background: radial-gradient(circle, rgba(150, 95, 40, 0.25), rgba(150, 95, 40, 0.05) 70%);
}
.form {
  position: relative;
  max-width: 420px;
  margin: 0 auto;
  padding: 22px 26px;
  background: #f4efe3;
  color: #24211c;
  border-radius: 4px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45);
  transform: rotate(-1.2deg);
}
.form header {
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border-bottom: 2px solid #24211c;
  padding-bottom: 8px;
  margin-bottom: 14px;
}
.form dl { display: grid; grid-template-columns: auto 1fr; gap: 10px 18px; margin: 0; }
.form dt { color: #6b645a; font-size: 13px; }
.form dd { margin: 0; font-size: 17px; font-weight: 600; }
.doodle { display: flex; align-items: center; gap: 8px; font-weight: 400 !important; }
.stamp {
  position: absolute;
  top: 42%;
  left: 50%;
  padding: 6px 16px;
  border: 4px solid;
  border-radius: 8px;
  font-size: 30px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  transform: translate(-50%, -50%) rotate(-14deg);
  animation: thump 0.25s ease-out;
}
.stamp.approved { color: #0b8f94; }
.stamp.rejected { color: #d6006f; }
.stamp.expired { color: #6b645a; }
/* The time left for this form: a bar along the bottom of the form */
.time { position: absolute; left: 0; right: 0; bottom: 0; height: 6px; background: rgba(0, 0, 0, 0.08); }
.time span { display: block; height: 100%; background: #0b8f94; transition: width 0.1s linear; }
.time.hurry span { background: #d6006f; }
@keyframes thump { from { transform: translate(-50%, -50%) rotate(-14deg) scale(1.6); opacity: 0; } }

.overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 24px;
  text-align: center;
  background: rgba(1, 10, 21, 0.95);
}
.overlay strong { font-size: 22px; max-width: 360px; }

.side { display: flex; flex-direction: column; gap: 18px; }
.actions { display: flex; gap: 8px; }
.message .eyebrow, .rulebook .eyebrow { display: block; margin-bottom: 8px; }
.rulebook ol { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.rulebook li { display: flex; gap: 10px; line-height: 1.4; }
.rulebook li:first-child { color: var(--c-tq); }
.rulebook .n { min-width: 22px; color: var(--c-muted); }
.fine-print { color: var(--c-muted); font-size: 13px; margin: 12px 0 0; }
</style>
