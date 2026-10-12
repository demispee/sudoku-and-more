import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.js"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.js"],
      reporter: ["text", "html"],
      thresholds: { lines: 80, statements: 80, functions: 80, branches: 80 },
    },
  },
});
