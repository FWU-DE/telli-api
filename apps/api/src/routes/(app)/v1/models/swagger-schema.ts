import { SWAGGER_DEFAULT_RESPONSES_SCHEMA } from "@/swagger/const";
import { FastifySchema } from "fastify/types/schema";

export const modelRequestSwaggerSchema: FastifySchema = {
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
  security: [{ bearerAuth: [] }],
};
