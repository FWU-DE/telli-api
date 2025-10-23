import { validateOrganizationId } from "@/validation";
import { validateAdminApiKey } from "../../../../../utils";
import { dbGetAllApiKeysByProjectId } from "@dgpt/db";
import { FastifyReply, FastifyRequest } from "fastify";
import { projectParamsSchema } from "../projectParamsSchema";

export async function handler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const apiKey = await validateAdminApiKey(request, reply);
  if (!apiKey.isValid) return;

  const { organizationId, projectId } = projectParamsSchema.parse(
    request.params,
  );
  validateOrganizationId(organizationId);

  const apiKeys = await dbGetAllApiKeysByProjectId(organizationId, projectId);

  if (!apiKeys) {
    return reply.status(404).send({ error: "Project not found" });
  }

  reply.status(200).send(apiKeys);
}
