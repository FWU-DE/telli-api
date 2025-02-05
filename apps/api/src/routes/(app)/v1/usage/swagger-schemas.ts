import { SWAGGER_DEFAULT_RESPONSES_SCHEMA } from "@/swagger/const";

export const usageRequestSwaggerSchema = {
  response: {
    200: {
      type: "object",
      properties: {
        remainingLimitInCent: { type: "number" },
        limitInCent: { type: "number" },
      },
      // required: ["remainingLimitInCent", "limitInCent"],
    },
    ...SWAGGER_DEFAULT_RESPONSES_SCHEMA,
  },
  headers: {
    type: "object",
    properties: {
      Authorization: {
        type: "string",
        description: "Bearer token for authorization",
      },
    },
    required: ["Authorization"],
  },
};
