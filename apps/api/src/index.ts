import Fastify from "fastify";
import { constructHandlers } from "./handlers";
import { initSwagger } from "./swagger";
import cors from "@fastify/cors";
import fastifyMultipart from "@fastify/multipart";

async function main() {
  const fastify = Fastify({
    logger: true,
  });

  await fastify.register(cors, {
    origin: "*",
    // origin: [env.NEXT_PUBLIC_baseUrl],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  fastify.register(fastifyMultipart, {
    throwFileSizeLimit: true,
    limits: {
      fileSize: 20_000_000,
    },
  });

  await initSwagger(fastify);
  constructHandlers(fastify);

  await fastify.ready();
  fastify.swagger();

  fastify.listen(
    {
      port:
        process.env.NODE_ENV ?? "development" === "development" ? 3002 : 3000,
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
