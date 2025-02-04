import { SWAGGER_DEFAULT_RESPONSES_SCHEMA } from "@/swagger/const";

export const modelRequestSwaggerSchema = {
  response: {
    200: {
      type: "array",
      description: "Default response",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          provider: { type: "string" },
          displayName: { type: "string" },
          description: { type: "string" },
        },
        // required: [
        //   "id",
        //   "name",
        //   "createdAt",
        //   "provider",
        //   "displayName",
        //   "description",
        // ],
      },
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
