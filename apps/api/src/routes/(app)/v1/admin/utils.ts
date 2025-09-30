import { env } from "@/env";
import { InvalidRequestBodyError, UnauthorizedError } from "@/errors";
import { getMaybeBearerToken } from "@/routes/utils";
import { FastifyReply, FastifyRequest } from "fastify";

export function validateAdminApiKey(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const authorizationHeader = getMaybeBearerToken(
    request.headers.authorization,
  );

  if (!authorizationHeader) {
    reply.status(401).send({ error: "No Bearer token found." });
    return { isValid: false };
  }

  if (authorizationHeader !== env.apiKey) {
    reply.status(401).send({ error: "Api key is not valid" });
    return { isValid: false };
  }

  return { isValid: true };
}

export function validateAdminApiKeyAndThrow(
  authorizationHeader: string | undefined,
) {
  const token = getMaybeBearerToken(authorizationHeader);
  if (!token) throw new UnauthorizedError("No Bearer token found.");
  if (token !== env.apiKey) throw new UnauthorizedError("Api key is not valid");
}

export function validateRequestBody(body: unknown) {
  if (
    typeof body !== "object" ||
    body === null ||
    Array.isArray(body) ||
    Object.keys(body).length === 0
  ) {
    throw new InvalidRequestBodyError();
  }
}
