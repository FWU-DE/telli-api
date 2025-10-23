// OpenTelemetry must be initialized before Sentry
import "./instrumentation.node";

import Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [nodeProfilingIntegration(), Sentry.postgresIntegration()],
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
  profileSessionSampleRate: 1.0,
  profileLifecycle: "trace",
  environment: process.env.SENTRY_ENVIRONMENT ?? "development",
  // Ensure that only traces from your own organization are continued
  strictTraceContinuation: true,
});
