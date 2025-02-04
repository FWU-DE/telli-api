// import { env } from "@dgpt/env";
import { env } from "@/env";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";
import { FastifyInstance } from "fastify/types/instance";

export async function initSwagger(fastify: FastifyInstance) {
  await fastify.register(swagger, {
    openapi: {
      openapi: "3.0.0",
      info: {
        title: "DeutschlandGPT API Documentation",
        description: "DeutschlandGPT API Swagger Documentation.",
        version: "0.1.0",
      },
      servers: [
        {
          url: env.apiBaseUrl,
          description: "DGPT API Server",
        },
      ],
      components: {
        securitySchemes: {
          BearerAuth: {
            type: "http",
            scheme: "bearer",
          },
        },
      },
      externalDocs: {
        url: env.apiBaseUrl,
        description: "Find more info here",
      },
    },
  });

  await fastify.register(swaggerUI, {
    routePrefix: "/docs",
    uiConfig: {
      // docExpansion: "none",
      deepLinking: false,
    },
    staticCSP: true,
    transformSpecification: (swaggerObject) => swaggerObject,
  });
}
