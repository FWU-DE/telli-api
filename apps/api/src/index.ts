// this import has to be at the top of the file for fastify to be instrumented properly
import "./instrumentation";
import { initSwagger } from "./swagger";
import cors from "@fastify/cors";

import Sentry from "@sentry/node";
import buildApp from "./app";
import { env } from "./env";

async function main() {
  const fastify = buildApp({
    logger: true,
    ajv: { customOptions: { strict: false } },
  });

  Sentry.setupFastifyErrorHandler(fastify);

  await fastify.register(cors, {
    // TODO: uncomment if you want to enable cors
    // origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  await initSwagger(fastify);

  await fastify.ready();
  fastify.swagger();

  fastify.listen(
    {
      port: env.nodeEnv === "development" ? 3002 : 3000,
      host: "0.0.0.0",
    },
    (err, address) => {
      if (err) throw err;
      console.info(`Server is now listening on ${address}`);
    },
  );
}

main()
  .then(() => {})
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
