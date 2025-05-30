import { getEmbeddingFnByModel } from "@/llm-model/providers";
import { validateApiKeyWithResult } from "@/routes/utils";
import {
  checkLimitsByApiKeyIdWithResult,
  dbGetModelsByApiKeyId,
  dbCreateCompletionUsage,
} from "@dgpt/db";
import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

const embeddingRequestSchema = z.object({
  model: z.string(),
  input: z.array(z.string()),
});

export type EmbeddingRequest = z.infer<typeof embeddingRequestSchema>;

export async function handler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const [apiKeyError, apiKey] = await validateApiKeyWithResult(request, reply);

  if (apiKeyError !== null) {
    reply.send({ error: apiKeyError.message });
    return;
  }

  if (apiKey === undefined) return;

  const requestParseResult = embeddingRequestSchema.safeParse(request.body);
  if (!requestParseResult.success) {
    reply
      .send({
        error: "Bad request",
        details: requestParseResult.error.message,
      })
      .status(404);
    return;
  }

  const [limitCalculationError, limitCalculationResult] =
    await checkLimitsByApiKeyIdWithResult({
      apiKeyId: apiKey.id,
    });

  if (limitCalculationError !== null) {
    reply
      .send({
        error: `Something went wrong while calculating the current limits.`,
        details: limitCalculationError.message,
      })
      .status(500);
    return;
  }

  if (limitCalculationResult.hasReachedLimit) {
    reply.send({ error: "You have reached the price limit" }).status(429);
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
    reply
      .send({
        error: `No model with name ${body.model} found.${maybeProviderHeader !== undefined ? ` Requested Provider: ${maybeProviderHeader}` : ""}`,
      })
      .status(404);
    return;
  }

  const embeddingFn = getEmbeddingFnByModel({ model });

  if (embeddingFn === undefined) {
    reply
      .send({
        error: `Could not find a callback function for the provider ${model.provider}.`,
      })
      .status(400);
    return;
  }
  const result = await embeddingFn({
    input: body.input,
    model: model.name,
  });

  await dbCreateCompletionUsage({
    projectId: apiKey.projectId,
    apiKeyId: apiKey.id,
    modelId: model.id,
    completionTokens: 0,
    promptTokens: result.usage.prompt_tokens,
    totalTokens: result.usage.total_tokens,
  });
  reply.send(result).status(200);
}
