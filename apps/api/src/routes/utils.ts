import { ApiKeyModel, dbValidateApiKey } from "@dgpt/db";
import { errorifyAsyncFn } from "@dgpt/utils";
import { FastifyReply, FastifyRequest } from "fastify";
import { ChatCompletionChunk } from "openai/resources/chat/completions.js";

const BEARER_PREFIX = "Bearer ";

export function getMaybeBearerToken(
  authorizationHeader: string | undefined,
): string | undefined {
  if (authorizationHeader === undefined) return undefined;
  if (!authorizationHeader.startsWith(BEARER_PREFIX)) {
    return undefined;
  }

  return authorizationHeader.slice(
    BEARER_PREFIX.length,
    authorizationHeader.length,
  );
}

export const validateApiKeyWithResult = errorifyAsyncFn(validateApiKey);

export async function validateApiKey(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<ApiKeyModel | undefined> {
  const authorizationHeader = getMaybeBearerToken(
    request.headers.authorization,
  );

  if (!authorizationHeader) {
    reply.status(401).send({ error: "No Bearer token found." });
    return undefined;
  }

  const apiKeyValidationResponse = await dbValidateApiKey(authorizationHeader);

  if (!apiKeyValidationResponse.valid) {
    reply.status(403).send({ error: apiKeyValidationResponse.reason });
    return undefined;
  }

  return apiKeyValidationResponse.apiKey;
}

export function getContentFilterFailedChunk({
  id,
  created,
  model,
}: {
  id: string;
  created: number;
  model: string;
}): ChatCompletionChunk {
  return {
    choices: [
      {
        index: 0,
        delta: {
          content:
            "Die Anfrage wurde wegen unangemessener Inhalte automatisch blockiert.",
        },
        finish_reason: "content_filter",
      },
    ],
    id,
    created,
    model,
    object: "chat.completion.chunk",
  };
}

export function getErrorChunk({
  id,
  created,
  model,
  errorMessage,
  errorCode,
}: {
  id: string;
  created: number;
  model: string;
  errorMessage: string;
  errorCode?: string;
}): ChatCompletionChunk {
  return {
    choices: [
      {
        index: 0,
        delta: {
          content: `Error in Chat Stream: ${errorMessage}`,
        },
        finish_reason: "stop",
      },
    ],
    id,
    created,
    model,
    object: "chat.completion.chunk",
    error: {
      message: errorMessage,
      code: errorCode || "unknown_error",
      type: "error",
    },
  } as ChatCompletionChunk;
}
