import { getDefinedOrThrow } from "@dgpt/utils";

export const env = {
  apiBaseUrl: process.env.API_BASE_URL ?? "http://127.0.0.1:3002",
  apiName: process.env.API_NAME ?? "Telli API",
  apiKey: getDefinedOrThrow(process.env.API_KEY, "process.env.API_KEY"),
  nodeEnv: process.env.NODE_ENV ?? "development",
  sentryDsn: getDefinedOrThrow(
    process.env.SENTRY_DSN,
    "process.env.SENTRY_DSN",
  ),
};
