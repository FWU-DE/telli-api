import { FastifyReply, FastifyRequest } from "fastify";
import { validateAdminApiKey } from "../utils";
import { dbGetAllOrganizations } from "@dgpt/db";

export async function handler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const validationResult = validateAdminApiKey(request, reply);

  if (!validationResult.isValid) return;

  const organizations = await dbGetAllOrganizations();

  return reply.status(200).send({ organizations });
}
