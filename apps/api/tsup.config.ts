import { defineConfig } from "tsup";
import { sentryEsbuildPlugin } from "@sentry/esbuild-plugin";

export default defineConfig({
  entry: ["src/index.ts"],
  sourcemap: true,
  splitting: false,
  clean: true,
  // externalize all imports at runtime so OTel can patch them.
  external: [/.*/],
  // bundle all local code
  noExternal: [
    /@dgpt\//,
    /^@\//,
    /^\./,
    // injected by Sentry plugin; must be bundled or Node will try to require it at runtime
    /_sentry-.*-injection-stub$/,
  ],
  esbuildPlugins: [
    sentryEsbuildPlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      telemetry: false,
      debug: true,
      release: {
        create: process.env.NODE_ENV === "production",
        setCommits: {
          auto: true,
          ignoreEmpty: true,
          ignoreMissing: true,
        },
      },
      sourcemaps: {
        assets: "./dist/*",
      },
    }),
  ],
});
