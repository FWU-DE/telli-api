// this import has to be at the top of the file for fastify to be instrumented properly
import "./instrumentation";
import Fastify from "fastify";
import { constructHandlers } from "./handlers";
import { initSwagger } from "./swagger";
import cors from "@fastify/cors";
import fastifyMultipart from "@fastify/multipart";

import Sentry from "@sentry/node";
const nodeEnv = process.env.NODE_ENV ?? "development";

async function main() {
  const fastify = Fastify({
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

  fastify.register(fastifyMultipart, {
    throwFileSizeLimit: true,
    limits: {
      fileSize: 20_000_000,
    },
  });

  // eslint-disable-next-line no-empty-pattern
  fastify.setSerializerCompiler(({}) => {
    // eslint-disable-next-line no-unused-vars
    return (data) => JSON.stringify(data);
  });

  // This disables fastify's implicit logic validating and coercing the request body, because this is very error prone on complex schemas
  // the validation is instead always done by the Zod schema
  // eslint-disable-next-line no-empty-pattern
  fastify.setValidatorCompiler(() => {
    return () => true;
  });

  await initSwagger(fastify);
  constructHandlers(fastify);

  await fastify.ready();
  fastify.swagger();

  fastify.listen(
    {
      port: nodeEnv === "development" ? 3002 : 3000,
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
