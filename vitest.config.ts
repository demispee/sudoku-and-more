// Tests for the pages and the WebAssembly bridge (ADR-0007).
// Component tests run in jsdom, a browser simulated in Node.js.
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [vue()],
  test: {
    include: ["tests/**/*.test.{js,ts}"],
    coverage: {
      provider: "v8",
      include: ["web/src/**/*.{ts,vue}"],
      // The entry files only mount a page; the pages themselves are tested. The 3D board
      // needs WebGL, which jsdom doesn't have: it is checked in the browser (ADR-0009)
      exclude: ["web/src/main-*.ts", "web/src/mastermind/scene.ts"],
      reporter: ["text", "html"],
      thresholds: { lines: 80, statements: 80, functions: 80, branches: 80 },
    },
  },
});
