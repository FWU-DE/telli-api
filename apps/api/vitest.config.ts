import { coverageConfigDefaults, defineConfig } from "vitest/config";

// Configuration options: https://vitest.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@": "/src",
      "@test": "/src/test",
    },
  },
  test: {
    //Configuration options: https://vitest.dev/config/#coverage
    coverage: {
      reporter: ["text", "lcov", "json", "html"],
      exclude: [
        "src/instrumentation.ts",
        "**/swagger-schemas.ts",
        "src/swagger/**",
        "src/test/**",
        ...coverageConfigDefaults.exclude,
      ],
    },
  },
});
