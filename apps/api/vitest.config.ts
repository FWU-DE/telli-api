import { defineConfig } from "vitest/config";

// Configuration options: https://vitest.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});
