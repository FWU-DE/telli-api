import { validateApiKey } from "@/routes/utils";
import { dbGetModelsByApiKeyId } from "@dgpt/db";
import { FastifyReply, FastifyRequest } from "fastify";
import { obscureModels } from "./utils";

export async function handler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const apiKey = await validateApiKey(request, reply);

  if (apiKey === undefined) return;

  const models = await dbGetModelsByApiKeyId({ apiKeyId: apiKey.id });

  reply.status(200).send(obscureModels(models));
}
