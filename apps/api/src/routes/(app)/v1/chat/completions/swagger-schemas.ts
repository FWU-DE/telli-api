import { SWAGGER_DEFAULT_RESPONSES_SCHEMA } from "@/swagger/const";

export const completionRequestSchemaSwagger = {
  response: {
    200: {
      type: "object",
      description: "Default response",
      properties: {
        id: { type: "string" },
        object: { type: "string", default: "chat.completion" },
        created: { type: "number" },
        model: { type: "string" },
        choices: {
          type: "array",
          items: {
            type: "object",
            properties: {
              index: { type: "number" },
              message: {
                type: "object",
                properties: {
                  role: {
                    type: "string",
                    enum: ["system", "user", "assistant", "developer"],
                  },
                  content: { type: "string" },
                },
                // required: ["role", "content"],
              },
              finish_reason: { type: "string" },
            },
            // required: ["index", "message", "finish_reason"],
          },
        },
        usage: {
          type: "object",
          properties: {
            prompt_tokens: { type: "number" },
            completion_tokens: { type: "number" },
            total_tokens: { type: "number" },
          },
          // required: ["prompt_tokens", "completion_tokens", "total_tokens"],
        },
      },
      // required: ["id", "object", "created", "model", "choices"],
    },
    ...SWAGGER_DEFAULT_RESPONSES_SCHEMA,
  },
  body: {
    type: "object",
    properties: {
      model: { type: "string" },
      messages: {
        type: "array",
        items: {
          type: "object",
          properties: {
            role: {
              type: "string",
              enum: ["system", "user", "assistant", "developer"],
            },
            content: { type: "string" },
          },
          required: ["role", "content"],
        },
      },
      max_tokens: { type: "number", nullable: true },
      temperature: { type: "number", default: 1 },
      stream: { type: "boolean" },
    },
    required: ["model", "messages"],
  },
  security: [{ bearerAuth: [] }],
};
