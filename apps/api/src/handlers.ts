import { FastifyInstance, RouteHandlerMethod } from "fastify";
import { handler as v1_chat_completions_postHandler } from "./routes/(app)/v1/chat/completions/post";
import { handler as v1_models_getHandler } from "./routes/(app)/v1/models/get";
import { handler as v1_usage_getHandler } from "./routes/(app)/v1/usage/get";
import { completionRequestSchemaSwagger } from "./routes/(app)/v1/chat/completions/swagger-schemas";
import { modelRequestSwaggerSchema } from "./routes/(app)/v1/models/swagger-schema";
import { usageRequestSwaggerSchema } from "./routes/(app)/v1/usage/swagger-schemas";

type RouteHandlerDefinition = {
  path: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  schema?: object;
  handler: RouteHandlerMethod;
};

export const healthSchema = {
  response: {
    200: {
      type: "object",
      properties: {
        status: { type: "string", default: "OK" },
      },
      required: ["status"],
    },
  },
};

const routeHandlerDefinitions: Array<RouteHandlerDefinition> = [
  {
    path: "/health",
    method: "GET",
    schema: healthSchema,
    async handler() {
      return { message: "Ok" };
    },
  },
  {
    path: "/v1/chat/completions",
    method: "POST",
    schema: completionRequestSchemaSwagger,
    handler: v1_chat_completions_postHandler,
  },
  {
    path: "/v1/models",
    method: "GET",
    schema: modelRequestSwaggerSchema,
    handler: v1_models_getHandler,
  },
  {
    path: "/v1/usage",
    method: "GET",
    schema: usageRequestSwaggerSchema,
    handler: v1_usage_getHandler,
  },
];

export function constructHandlers(fastify: FastifyInstance) {
  for (const def of routeHandlerDefinitions) {
    if (def.method === "GET") {
      fastify.get(def.path, { schema: def.schema }, def.handler);
      continue;
    }
    if (def.method === "PUT") {
      fastify.put(def.path, { schema: def.schema }, def.handler);
      continue;
    }
    if (def.method === "POST") {
      fastify.post(def.path, { schema: def.schema }, def.handler);
      continue;
    }
    if (def.method === "DELETE") {
      fastify.delete(def.path, { schema: def.schema }, def.handler);
      continue;
    }
  }
}
