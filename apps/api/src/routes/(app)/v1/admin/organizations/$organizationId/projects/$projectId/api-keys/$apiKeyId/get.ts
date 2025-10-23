import { FastifyReply, FastifyRequest } from "fastify";
import { dbGetApiKey } from "@dgpt/db";
import { validateAdminApiKey } from "@/routes/(app)/v1/admin/utils";
import { apiKeyParamsSchema } from "./apiKeyParamsSchema";

export async function handler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const validationResult = validateAdminApiKey(request, reply);
  if (!validationResult.isValid) return;

  const { organizationId, projectId, apiKeyId } = apiKeyParamsSchema.parse(
    request.params,
  );

  const rawApiKey = await dbGetApiKey(organizationId, projectId, apiKeyId);

  if (rawApiKey === undefined) {
    return reply.status(404).send({ error: "API key not found" });
  }

  // remove secretHash and keyId from each api key before returning
  // eslint-disable-next-line no-unused-vars
  const { keyId, secretHash, ...apiKey } = rawApiKey;

  return reply.status(200).send(apiKey);
}
