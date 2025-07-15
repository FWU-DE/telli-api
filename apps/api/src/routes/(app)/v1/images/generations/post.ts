import { getImageGenerationFnByModel } from "@/llm-model/providers";
import { validateApiKeyWithResult } from "@/routes/utils";
import {
  checkLimitsByApiKeyIdWithResult,
  dbGetModelsByApiKeyId,
} from "@dgpt/db";
import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

const imageGenerationRequestSchema = z.object({
  model: z.string(),
  prompt: z.string(),
});

export type ImageGenerationRequest = z.infer<
  typeof imageGenerationRequestSchema
>;

export async function handler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const [apiKeyError, apiKey] = await validateApiKeyWithResult(request, reply);

  if (apiKeyError !== null) {
    reply.status(401).send({ error: apiKeyError.message });
    return;
  }

  if (apiKey === undefined) return;

  const requestParseResult = imageGenerationRequestSchema.safeParse(
    request.body,
  );
  if (!requestParseResult.success) {
    reply.status(400).send({
      error: "Bad request",
      details: requestParseResult.error.message,
    });
    return;
  }

  const [limitCalculationError, limitCalculationResult] =
    await checkLimitsByApiKeyIdWithResult({
      apiKeyId: apiKey.id,
    });

  if (limitCalculationError !== null) {
    reply.status(500).send({
      error: `Something went wrong while calculating the current limits.`,
      details: limitCalculationError.message,
    });
    return;
  }

  if (limitCalculationResult.hasReachedLimit) {
    reply.status(429).send({ error: "You have reached the price limit" });
    return;
  }

  const body = requestParseResult.data;

  const availableModels = await dbGetModelsByApiKeyId({ apiKeyId: apiKey.id });

  const maybeProviderHeader = request.headers["x-llm-provider"];
  const model =
    maybeProviderHeader === undefined
      ? availableModels.find((model) => model.name === body.model)
      : availableModels.find(
          (model) =>
            model.name === body.model && model.provider === maybeProviderHeader,
        );

  if (model === undefined) {
    reply.status(404).send({
      error: `No model with name ${body.model} found.${maybeProviderHeader !== undefined ? ` Requested Provider: ${maybeProviderHeader}` : ""}`,
    });
    return;
  }

  const imageGenerationFn = getImageGenerationFnByModel({ model });

  if (imageGenerationFn === undefined) {
    reply.status(400).send({
      error: `Could not find an image generation function for the provider ${model.provider}.`,
    });
    return;
  }

  try {
    const response = await imageGenerationFn({
      prompt: body.prompt,
      model: model.name,
    });

    reply.status(200).send(response);
  } catch (error) {
    console.error("Error generating image:", error);
    reply.status(500).send({
      error: "Failed to generate image",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
