import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    root: __dirname,
    setupFiles: "./src/test/setup.js",
    include: ["src/__tests__/**/*.test.{js,jsx}"],
    coverage: {
      provider: "v8",
      include: ["src/**"],
      reporter: ["text", "lcov"],
    },
  },
});
