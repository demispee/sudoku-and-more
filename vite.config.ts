// Builds web/ into dist/ (ADR-0007). One entry per page, so the addresses stay the same;
// base "./" makes the site work under /sudoku-and-more/ on GitHub Pages.
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

const page = (name: string) => new URL(`./web/${name}.html`, import.meta.url).pathname;

export default defineConfig({
  root: "web",
  base: "./",
  plugins: [vue()],
  server: { fs: { allow: [".."] } },
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: page("index"),
        sudoku: page("sudoku"),
        spot: page("spot-the-difference"),
        balls: page("balls"),
        ministry: page("ministry"),
        shy: page("shy-squares"),
        mastermind: page("mastermind"),
      },
    },
  },
});
