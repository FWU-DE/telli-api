import { validateAdminApiKey } from "../../../utils";
import { dbGetAllModels } from "@dgpt/db";
import { FastifyReply, FastifyRequest } from "fastify";

export async function handler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const apiKey = await validateAdminApiKey(request, reply);

  if (!apiKey.isValid) return;

  const models = await dbGetAllModels();

  reply.status(200).send(models);
}
