import { FastifyReply, FastifyRequest } from "fastify";
import { dbUpdateApiKey, apiKeyUpdateSchema } from "@dgpt/db";
import { apiKeyParamsSchema } from "./apiKeyParamsSchema";
import { handleApiError, NotFoundError } from "@/errors";
import { validateAdminApiKeyAndThrow, validateRequestBody, validateOrganizationId } from "@/validation";

const bodySchema = apiKeyUpdateSchema.pick({
  name: true,
  state: true,
  limitInCent: true,
  expiresAt: true,
}).partial();

export async function handler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    validateAdminApiKeyAndThrow(request.headers.authorization);

    const { organizationId, projectId, apiKeyId } = apiKeyParamsSchema.parse(
      request.params,
    );

    const updates = bodySchema.parse(request.body);
    await validateOrganizationId(organizationId);


    const updatedApiKey = await dbUpdateApiKey(
      organizationId,
      projectId,
      apiKeyId,
      updates,
    );


    return reply.status(200).send(updatedApiKey);
  } catch (error) {
    const result = handleApiError(error);
    return reply.status(result.statusCode).send({ error: result.message });
  }
}
