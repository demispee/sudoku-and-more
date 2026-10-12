<!-- The buttons 1 to 9. A number that is placed correctly 9 times is dimmed. -->
<script setup lang="ts">
defineProps<{ done: boolean[] }>();
const emit = defineEmits<{ enter: [n: number] }>();
const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
</script>

<template>
  <div class="pad">
    <button v-for="n in DIGITS" :key="n" :class="{ done: done[n - 1] }" @click="emit('enter', n)">{{ n }}</button>
  </div>
</template>

<style scoped>
.pad {
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  gap: 6px;
}
button {
  height: 48px;
  padding: 0;
  border: 1px solid var(--c-border);
  border-radius: 10px 10px 10px 0;
  background: var(--c-canvas-2);
  color: var(--c-text);
  font-family: var(--sans);
  font-size: 20px;
  cursor: pointer;
}
button:hover { background: var(--c-panel); }
button.done { opacity: 0.45; }
</style>
