import { SWAGGER_DEFAULT_RESPONSES_SCHEMA } from "@/swagger/const";

export const embeddingRequestSwaggerSchema = {
  response: {
    200: {
      type: "object",
      properties: {
        object: { type: "string", default: "embedding" },
        embedding: { type: "array", items: { type: "number" } },
        model: { type: "string" },
        usage: {
          type: "object",
          properties: {
            prompt_tokens: { type: "number" },
            total_tokens: { type: "number" },
          },
        },
      },
    },
    ...SWAGGER_DEFAULT_RESPONSES_SCHEMA,
  },
  body: {
    type: "object",
    properties: {
      model: { type: "string" },
      input: { type: "array", items: { type: "string" } },
    },
    required: ["model", "input"],
  },
  security: [{ bearerAuth: [] }],
};
