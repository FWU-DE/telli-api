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

  const apiKey = await dbGetApiKey(organizationId, projectId, apiKeyId);

  if (apiKey === undefined) {
    return reply.status(404).send({ error: "API key not found" });
  }

  return reply.status(200).send(apiKey);
}
