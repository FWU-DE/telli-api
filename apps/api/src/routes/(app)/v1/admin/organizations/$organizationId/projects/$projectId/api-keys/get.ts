import { validateAdminApiKeyAndThrow } from "@/validation";
import { dbGetAllApiKeysByProjectId } from "@dgpt/db";
import { FastifyReply, FastifyRequest } from "fastify";
import { projectParamsSchema } from "../projectParamsSchema";
import { handleApiError } from "@/errors";

export async function handler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    validateAdminApiKeyAndThrow(request.headers.authorization);

    const { organizationId, projectId } = projectParamsSchema.parse(
      request.params,
    );

    const apiKeys = await dbGetAllApiKeysByProjectId(organizationId, projectId);

    if (!apiKeys) {
      return reply.status(404).send({ error: "Project not found" });
    }

    reply.status(200).send(apiKeys);
  } catch (error) {
    const result = handleApiError(error);
    return reply.status(result.statusCode).send({ error: result.message });
  }
}
