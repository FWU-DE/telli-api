import Sentry, { SentryContextManager } from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { NodeSDK } from "@opentelemetry/sdk-node";
import FastifyOtelInstrumentation from "@fastify/otel";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { resourceFromAttributes } from "@opentelemetry/resources";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { SentrySampler, SentrySpanProcessor } from "@sentry/opentelemetry";

const sentryClient = Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: (integrations) => [
    // exclude Fastify, to prevent duplicate registration from ./instrumentation.node
    ...integrations.filter((i) => i.name !== "Fastify"),
    nodeProfilingIntegration(),
    Sentry.httpIntegration({ spans: false }),
  ],
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
  profileSessionSampleRate: 1.0,
  profileLifecycle: "trace",
  environment: process.env.SENTRY_ENVIRONMENT ?? "development",
  // Ensure that only traces from your own organization are continued
  strictTraceContinuation: true,
  // Use custom OpenTelemetry configuration, see https://docs.sentry.io/platforms/javascript/guides/node/opentelemetry/custom-setup/
  skipOpenTelemetrySetup: true,
  registerEsmLoaderHooks: false,
});

// For debugging purposes, you can uncomment the following two lines to enable console logging
// import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
// diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);

const SERVICE_NAME = "telli-api";

const exporter = new OTLPMetricExporter();
const periodicExportingMetricReader = new PeriodicExportingMetricReader({
  exporter,
  exportIntervalMillis: Number.parseInt(
    process.env.OTEL_METRIC_EXPORT_INTERVAL ?? "60000",
  ),
  exportTimeoutMillis: Number.parseInt(
    process.env.OTEL_METRIC_EXPORT_TIMEOUT ?? "30000",
  ),
});

// Documentation for the OpenTelemetry SDK for Node.js can be found here:
// https://www.npmjs.com/package/@opentelemetry/sdk-node
const sdk = new NodeSDK({
  instrumentations: [
    new FastifyOtelInstrumentation({ registerOnInitialization: true }),
    getNodeAutoInstrumentations({
      "@opentelemetry/instrumentation-dns": {
        // Disable dns instrumentation, as it creates single spans without parents
        enabled: false,
      },
      "@opentelemetry/instrumentation-fastify": {
        // This plugin is deprecated, instead the official FastifyOtelInstrumentation is used
        enabled: false,
      },
      "@opentelemetry/instrumentation-http": {
        requestHook: (span, msg) => {
          const path = "path" in msg ? msg.path : msg.url;
          span.updateName(`${msg.method} ${path}`);
        },
      },
    }),
  ],
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: SERVICE_NAME,
    [ATTR_SERVICE_VERSION]: process.env.APP_VERSION,
  }),
  metricReaders: [periodicExportingMetricReader],
  sampler: sentryClient ? new SentrySampler(sentryClient) : undefined,
  serviceName: SERVICE_NAME,
  spanProcessors: [
    new BatchSpanProcessor(new OTLPTraceExporter()),
    new SentrySpanProcessor(),
  ],
  contextManager: new SentryContextManager(),
});

sdk.start();

// gracefully shut down the SDK on process exit
process.on("SIGTERM", () => {
  sdk
    .shutdown()
    .then(() => console.log("Tracing terminated"))
    .catch((error) => console.log("Error terminating tracing", error))
    .finally(() => process.exit(0));
});

Sentry.validateOpenTelemetrySetup();
