import { env } from "@/env";
import { generateOpenApiPaths } from "./utils";
import { routeHandlerDefinitions } from "@/handlers";

export const openApiDocument = {
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
  paths: generateOpenApiPaths(routeHandlerDefinitions),
} as const;
