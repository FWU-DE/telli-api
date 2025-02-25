import { FastifyReply, FastifyRequest } from "fastify";
import {
  dbCreateApiKey,
  dbGetAllModelsByOrganizationId,
  dbGetOrganizationByProjectId,
} from "@dgpt/db";
import { validateAdminApiKey } from "../utils";
import z from "zod";

const createApiKeyRequestSchema = z.object({
  name: z.string(),
  projectId: z.string(),
  modelIds: z.array(z.string()),
  budget: z.coerce.number(),
});

export type CreateApiKeyRequest = z.infer<typeof createApiKeyRequestSchema>;

export async function handler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const validationResult = validateAdminApiKey(request, reply);
  if (!validationResult.isValid) return;

  const body = createApiKeyRequestSchema.parse(request.body);

  const organization = await dbGetOrganizationByProjectId({
    projectId: body.projectId,
  });

  if (organization === undefined) {
    throw Error("Expected project to have an organization");
  }

  const models = await dbGetAllModelsByOrganizationId({
    organizationId: organization.id,
  });

  const apiKey = await dbCreateApiKey({
    organizationId: organization.id,
    projectId: body.projectId,
    modelIds: body.modelIds.filter((modelId) =>
      models.some((m) => m.id === modelId),
    ),
    name: body.name,
    budget: body.budget,
  });

  return reply.status(200).send(apiKey);
}
