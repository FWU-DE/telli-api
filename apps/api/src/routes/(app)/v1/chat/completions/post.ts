import {
  getCompletionFnByModel,
  getCompletionStreamFnByModel,
} from "@/llm-model/providers";
import { validateApiKeyWithResult } from "@/routes/utils";
import {
  ApiKeyModel,
  checkLimitsByApiKeyIdWithResult,
  dbCreateCompletionUsage,
  dbGetModelsByApiKeyId,
  LlmModel,
} from "@dgpt/db";
import { FastifyReply, FastifyRequest } from "fastify";
import { CompletionUsage } from "openai/resources/completions.mjs";
import { z } from "zod";

const completionRequestSchema = z.object({
  model: z.string(),
  messages: z.array(
    z.object({
      role: z.enum(["system", "user", "assistant"]),
      content: z.string(),
    }),
  ),
  max_tokens: z.number().optional().nullable(),
  temperature: z.coerce.number().optional().default(1),
  stream: z.boolean().optional(),
});

export type CompletionRequest = z.infer<typeof completionRequestSchema>;

async function onUsageCallback({
  apiKey,
  usage,
  model,
}: {
  usage: CompletionUsage;
  apiKey: ApiKeyModel;
  model: LlmModel;
}) {
  await dbCreateCompletionUsage({
    projectId: apiKey.projectId,
    apiKeyId: apiKey.id,
    modelId: model.id,
    completionTokens: usage.completion_tokens,
    promptTokens: usage.prompt_tokens,
    totalTokens: usage.total_tokens,
  });
}

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

  const requestParseResult = completionRequestSchema.safeParse(request.body);

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

  const model = availableModels.find((model) => model.name === body.model);

  if (model === undefined) {
    reply
      .send({ error: `No model with name ${body.model} found.` })
      .status(404);
    return;
  }

  if (body.stream) {
    const completionStreamFn = getCompletionStreamFnByModel({ model });

    if (completionStreamFn === undefined) {
      reply
        .send({
          error: `Could not find a callback function for the provider ${model.provider}.`,
        })
        .send(400);
      return;
    }

    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Transfer-Encoding": "chunked",
    });
    const stream = await completionStreamFn({
      messages: body.messages,
      model: model.name,
      temperature: body.temperature,
      max_tokens: body.max_tokens,
      async onUsageCallback(usage) {
        await onUsageCallback({ usage, apiKey, model });
      },
    });

    const reader = stream.getReader();

    async function processStream() {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        const chunkString = new TextDecoder().decode(value);
        reply.raw.write(`${chunkString}\n`);
      }
    }

    processStream()
      .catch((error) => {
        console.error("Error processing stream:", error);
      })
      .finally(() => {
        reply.raw.write("[DONE]");
        reply.raw.end();
        return;
      });
  } else {
    const completionFn = getCompletionFnByModel({ model });

    if (completionFn === undefined) {
      reply
        .send({
          error: `Could not find a callback function for the provider ${model.provider}.`,
        })
        .send(400);
      return;
    }

    const response = await completionFn({
      messages: body.messages,
      model: model.name,
      temperature: body.temperature,
      max_tokens: body.max_tokens,
    });

    reply.send(response).status(200);

    if (response.usage !== undefined) {
      await onUsageCallback({ usage: response.usage, apiKey, model });
    }

    return;
  }
}
