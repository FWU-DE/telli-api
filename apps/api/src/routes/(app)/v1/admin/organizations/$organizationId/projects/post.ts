import { FastifyReply, FastifyRequest } from "fastify";
import { validateAdminApiKey } from "../../../utils";
import { dbCreateProject, projectInsertSchema } from "@dgpt/db";

export async function handler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const validationResult = validateAdminApiKey(request, reply);
  if (!validationResult.isValid) return;

  const parseResult = projectInsertSchema.safeParse(request.body);
  if (!parseResult.success) {
    return reply.status(400).send({ error: parseResult.error.message });
  }
  const projectToCreate = parseResult.data;

  const createdProject = await dbCreateProject(projectToCreate);

  if (createdProject == undefined) {
    return reply.status(400).send({ error: "Could not create project." });
  }

  return reply.status(200).send(createdProject);
}
