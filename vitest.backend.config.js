import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["backend/__tests__/**/*.test.js"],
    coverage: {
      provider: "v8",
      include: ["backend/utility/**", "backend/controller/**"],
      reporter: ["text", "lcov"],
    },
  },
});
