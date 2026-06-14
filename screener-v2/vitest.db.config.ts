import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    include: ["src/**/*.db.test.ts"],
    globalSetup: ["./src/test/setup-env.ts"],
    fileParallelism: false,
    maxWorkers: 1,
    testTimeout: 30000
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url))
    }
  }
});
