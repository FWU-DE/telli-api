import { FastifyReply, FastifyRequest } from "fastify";
import { validateAdminApiKey } from "../../../utils";
import { obscureModels } from "../../../../models/utils";
import { dbCreateLlmModel, llmInsertModelSchema } from "@dgpt/db";

export async function handler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const validationResult = validateAdminApiKey(request, reply);
  if (!validationResult.isValid) return;

  const parseResult = llmInsertModelSchema.safeParse(request.body);
  if (!parseResult.success) {
    return reply.status(400).send({ error: parseResult.error.message });
  }
  const modelToCreate = parseResult.data;

  const createdModel = await dbCreateLlmModel(modelToCreate);

  if (createdModel == undefined) {
    return reply.status(400).send({ error: "Could not create model." });
  }

  return reply.status(200).send(obscureModels([createdModel])[0]);
}
