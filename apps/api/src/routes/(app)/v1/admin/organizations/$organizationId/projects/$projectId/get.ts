import { FastifyReply, FastifyRequest } from "fastify";
import { dbGetProjectById } from "@dgpt/db";
import { validateAdminApiKey } from "@/routes/(app)/v1/admin/utils";
import { projectParamsSchema } from "./projectParamsSchema";

export async function handler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const validationResult = validateAdminApiKey(request, reply);
  if (!validationResult.isValid) return;

  const { organizationId, projectId } = projectParamsSchema.parse(
    request.params,
  );

  const project = await dbGetProjectById(organizationId, projectId);

  if (project === undefined) {
    return reply.status(404).send({ error: "Project not found" });
  }

  return reply.status(200).send(project);
}
