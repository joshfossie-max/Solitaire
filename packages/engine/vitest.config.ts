import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "lcov", "html"],
      // ONLY measure real source files:
      include: ["src/**/*.ts"],
      // Don't count the barrel (re-exports) against coverage:
      exclude: ["src/index.ts"],
      thresholds: {
        statements: 85,
        branches: 80,
        functions: 85,
        lines: 85,
      },
    },
  },
});
