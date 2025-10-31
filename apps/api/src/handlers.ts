import {
  FastifyInstance,
  RouteHandlerMethod,
  RouteShorthandOptions,
} from "fastify";
import { handler as v1_chat_completions_postHandler } from "./routes/(app)/v1/chat/completions/post";
import { handler as v1_models_getHandler } from "./routes/(app)/v1/models/get";
import { handler as v1_usage_getHandler } from "./routes/(app)/v1/usage/get";
import { handler as v1_embeddings_postHandler } from "./routes/(app)/v1/embeddings/post";
import { handler as v1_images_generations_postHandler } from "./routes/(app)/v1/images/generations/post";
import { completionRequestSchemaSwagger } from "./routes/(app)/v1/chat/completions/swagger-schemas";
import { modelRequestSwaggerSchema } from "./routes/(app)/v1/models/swagger-schemas";
import { usageRequestSwaggerSchema } from "./routes/(app)/v1/usage/swagger-schemas";
import { adminRouteHandlerDefinitions } from "./routes/(app)/v1/admin/const";
import { embeddingRequestSwaggerSchema } from "./routes/(app)/v1/embeddings/swagger-schemas";
import { imageGenerationRequestSwaggerSchema } from "./routes/(app)/v1/images/generations/swagger-schemas";

export type RouteHandlerDefinition = Pick<
  RouteShorthandOptions,
  "schema" | "bodyLimit"
> & {
  path: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
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

export const routeHandlerDefinitions: Array<RouteHandlerDefinition> = [
  ...adminRouteHandlerDefinitions,
  {
    path: "/health",
    method: "GET",
    schema: healthSchema,
    async handler() {
      return { message: "Ok" };
    },
  },
  {
    path: "/error",
    method: "GET",
    schema: { hide: true },
    async handler() {
      throw Error("Test Error");
    },
  },
  {
    path: "/v1/chat/completions",
    method: "POST",
    schema: completionRequestSchemaSwagger,
    bodyLimit: 10_000_000,
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
  {
    path: "/v1/embeddings",
    method: "POST",
    schema: embeddingRequestSwaggerSchema,
    handler: v1_embeddings_postHandler,
  },
  {
    path: "/v1/images/generations",
    method: "POST",
    schema: imageGenerationRequestSwaggerSchema,
    handler: v1_images_generations_postHandler,
  },
];

export function constructHandlers(fastify: FastifyInstance) {
  for (const def of routeHandlerDefinitions) {
    const opts: RouteShorthandOptions = {
      schema: def.schema,
      bodyLimit: def.bodyLimit,
    };
    if (def.method === "GET") {
      fastify.get(def.path, opts, def.handler);
    } else if (def.method === "PUT") {
      fastify.put(def.path, opts, def.handler);
    } else if (def.method === "POST") {
      fastify.post(def.path, opts, def.handler);
    } else if (def.method === "PATCH") {
      fastify.patch(def.path, opts, def.handler);
    } else if (def.method === "DELETE") {
      fastify.delete(def.path, opts, def.handler);
    }
  }
}
