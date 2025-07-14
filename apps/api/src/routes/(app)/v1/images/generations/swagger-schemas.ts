import { SWAGGER_DEFAULT_RESPONSES_SCHEMA } from "@/swagger/const";

export const imageGenerationRequestSwaggerSchema = {
  body: {
    type: "object",
    properties: {
      model: {
        type: "string",
        description: "The model to use for image generation",
        example: "dall-e-3",
      },
      prompt: {
        type: "string",
        description: "The text prompt to generate an image from",
        example: "A beautiful sunset over a mountain range",
      },
    },
    required: ["model", "prompt"],
  },
  response: {
    200: {
      type: "object",
      properties: {
        created: {
          type: "number",
          description: "The Unix timestamp when the image was generated",
        },
        data: {
          type: "array",
          items: {
            type: "object",
            properties: {
              b64_json: {
                type: "string",
                description: "The base64-encoded JSON of the generated image",
              },
            },
          },
        },
      },
    },
    ...SWAGGER_DEFAULT_RESPONSES_SCHEMA,
  },
  security: [{ bearerAuth: [] }],
  summary: "Generate an image based on a text prompt",
  description:
    "Generates an image using the specified model and prompt. The response includes the generated image in base64-encoded JSON format.",
};
