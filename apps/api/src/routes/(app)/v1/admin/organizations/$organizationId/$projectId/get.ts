import { FastifyReply, FastifyRequest } from "fastify";
import { dbGetAllApiKeysByProjectId, dbGetProjectById } from "@dgpt/db";
import z from "zod";
import { validateAdminApiKey } from "../../../utils";

export async function handler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const validationResult = validateAdminApiKey(request, reply);
  if (!validationResult.isValid) return;

  const { projectId } = z
    .object({ projectId: z.string() })
    .parse(request.params);

  const project = await dbGetProjectById({
    projectId,
  });
  const apiKeys = await dbGetAllApiKeysByProjectId({ projectId });

  if (project === undefined) {
    return reply.status(404).send({ error: "Project not found" });
  }

  return reply.status(200).send({ project, apiKeys });
}
