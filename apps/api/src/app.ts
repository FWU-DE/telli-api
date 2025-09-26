import fastify from "fastify";
import { constructHandlers } from "./handlers";
import fastifyMultipart from "@fastify/multipart";

function buildApp(opts = {}) {
  const app = fastify(opts);

  app.register(fastifyMultipart, {
    throwFileSizeLimit: true,
    limits: {
      fileSize: 20_000_000,
    },
  });

  // eslint-disable-next-line no-empty-pattern
  app.setSerializerCompiler(({}) => {
    // eslint-disable-next-line no-unused-vars
    return (data) => JSON.stringify(data);
  });

  // This disables fastify's implicit logic validating and coercing the request body, because this is very error prone on complex schemas
  // the validation is instead always done by the Zod schema
  // eslint-disable-next-line no-empty-pattern
  app.setValidatorCompiler(() => {
    return () => true;
  });

  constructHandlers(app);

  return app;
}

export default buildApp;
