// Tests for the pages, the WebAssembly bridge and the JavaScript in src/ (ADR-0007).
// Component tests run in jsdom, a browser simulated in Node.js.
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [vue()],
  test: {
    include: ["tests/**/*.test.{js,ts}"],
    coverage: {
      provider: "v8",
      include: ["web/src/**/*.{ts,vue}", "src/**/*.js"],
      // The entry files only mount a page; the pages themselves are tested
      exclude: ["web/src/main-*.ts"],
      reporter: ["text", "html"],
      thresholds: { lines: 80, statements: 80, functions: 80, branches: 80 },
    },
  },
});
