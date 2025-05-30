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
            content: {
              oneOf: [
                {
                  type: "string",
                  description: "Text content (legacy format)"
                },
                {
                  type: "array",
                  description: "Array of content parts (supports text and images)",
                  items: {
                    oneOf: [
                      {
                        type: "object",
                        properties: {
                          type: { type: "string", enum: ["text"] },
                          text: { type: "string" }
                        },
                        required: ["type", "text"],
                        description: "Text content part"
                      },
                      {
                        type: "object",
                        properties: {
                          type: { type: "string", enum: ["image_url"] },
                          image_url: {
                            type: "object",
                            properties: {
                              url: { 
                                type: "string",
                                description: "URL of the image or base64 encoded image data (data:image/jpeg;base64,...)"
                              },
                              detail: { 
                                type: "string", 
                                enum: ["auto", "low", "high"],
                                description: "Image detail level for processing"
                              }
                            },
                            required: ["url"]
                          }
                        },
                        required: ["type", "image_url"],
                        description: "Image content part"
                      }
                    ]
                  }
                }
              ]
            },
          },
          required: ["role", "content"],
        },
      },
      max_tokens: { type: "number", nullable: true },
      temperature: { type: "number", default: 1 },
      stream: { type: "boolean" },
    },
    required: ["model", "messages"],
    examples: [
      {
        name: "Text-only request",
        summary: "Text-only request",
        description: "Basic chat completion with text content",
        value: {
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: "What is the capital of France?"
            }
          ],
          max_tokens: 150,
          temperature: 0.7,
          stream: false
        }
      },
      {
        name: "Image analysis with URL",
        summary: "Image analysis with URL",
        description: "Chat completion with image input using image URL",
        value: {
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "What do you see in this image?"
                },
                {
                  type: "image_url",
                  image_url: {
                    url: "https://example.com/image.jpg",
                    detail: "high"
                  }
                }
              ]
            }
          ],
          max_tokens: 300,
          temperature: 0.7,
          stream: false
        }
      },
      {
        name: "Image analysis with base64",
        summary: "Image analysis with base64",
        description: "Chat completion with base64 encoded image",
        value: {
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Describe this chart and provide insights about the data trends."
                },
                {
                  type: "image_url",
                  image_url: {
                    url: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/...[truncated for example]",
                    detail: "auto"
                  }
                }
              ]
            }
          ],
          max_tokens: 500,
          temperature: 0.3,
          stream: false
        }
      },
      {
        name: "Multiple images with analysis",
        summary: "Multiple images with analysis",
        description: "Chat completion analyzing multiple images",
        value: {
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Compare these two images and tell me the differences."
                },
                {
                  type: "image_url",
                  image_url: {
                    url: "https://example.com/image1.jpg",
                    detail: "high"
                  }
                },
                {
                  type: "image_url",
                  image_url: {
                    url: "https://example.com/image2.jpg",
                    detail: "high"
                  }
                }
              ]
            }
          ],
          max_tokens: 400,
          temperature: 0.5,
          stream: false
        }
      }
    ]
  },
  security: [{ bearerAuth: [] }],
};
