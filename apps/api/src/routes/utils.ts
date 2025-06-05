import { ApiKeyModel, dbValidateApiKey } from "@dgpt/db";
import { errorifyAsyncFn } from "@dgpt/utils";
import { FastifyReply, FastifyRequest } from "fastify";

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
    reply.status(403).send({ error: (apiKeyValidationResponse as any).reason });
    return undefined;
  }

  return apiKeyValidationResponse.apiKey;
}
