import { handleApiError } from "@/errors";
import { validateAdminApiKeyAndThrow } from "@/validation";
import {
  dbCreateProject,
  dbGetProjectById,
  dbUpdateProject,
  projectUpdateSchema,
} from "@dgpt/db";
import { FastifyReply, FastifyRequest } from "fastify";
import { projectParamsSchema } from "./projectParamsSchema";

export async function handler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    validateAdminApiKeyAndThrow(request.headers.authorization);

    const { organizationId, projectId } = projectParamsSchema.parse(
      request.params,
    );
    const valuesToUpdate = projectUpdateSchema.parse(request.body);

    const project = await dbGetProjectById(organizationId, projectId);
    if (!project) {
      reply.status(404).send({ error: "Project not found" });
      return;
    }

    const updatedProject = { ...project, ...valuesToUpdate };

    const result = await dbUpdateProject(updatedProject);

    reply.status(200).send(result);
  } catch (error) {
    const e = handleApiError(error);
    reply.status(e.statusCode).send({ error: e.message });
    return;
  }
}
