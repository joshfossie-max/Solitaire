import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    reporters: ["default"],
    coverage: {
      provider: "v8",
      all: true,
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["**/*.spec.ts", "**/test/**"],
      reportsDirectory: "coverage",
      reporter: ["text-summary","lcov","html"],
      thresholds: {
        lines: 90,
        statements: 90,
        functions: 85,
        branches: 85,
      },
    },
  },
});
