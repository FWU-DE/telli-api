import { defineConfig } from "tsup";
import { sentryEsbuildPlugin } from "@sentry/esbuild-plugin";

export default defineConfig({
  entry: ["src/index.ts"],
  sourcemap: true,
  splitting: false,
  clean: true,
  format: "cjs",
  noExternal: [/@dgpt\//],
  esbuildPlugins: [
    sentryEsbuildPlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      telemetry: false,
      debug: true,
      sourcemaps: {
        assets: "./dist/*",
      },
    }),
  ],
});
