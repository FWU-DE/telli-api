import { validateAdminApiKey } from "../../../../utils";
import { dbDeleteModelById } from "@dgpt/db";
import { FastifyReply, FastifyRequest } from "fastify";

export async function handler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const apiKey = await validateAdminApiKey(request, reply);
  if (!apiKey.isValid) return;

  const params = request.params as { id: string };
  const id = params.id;

  await dbDeleteModelById(id);

  reply.status(200).send();
}
