import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { dbUpdateLlmModel, llmUpdateModelSchema } from "@dgpt/db";
import { validateAdminApiKey } from "../../../../utils";

export async function handler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const validationResult = validateAdminApiKey(request, reply);
  if (!validationResult.isValid) return;

  const params = request.params as { id: string };
  const id = params.id;
  const parseResult = llmUpdateModelSchema.safeParse(request.body);
  if (!parseResult.success) {
    return reply.status(400).send({ error: parseResult.error.message });
  }

  const updateModel = parseResult.data;

  try {
    const dbResult = await dbUpdateLlmModel(id, updateModel);

    return reply.send(dbResult);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply
        .status(400)
        .send({ error: "Invalid request data", details: error.errors });
    }
    return reply.status(500).send({ error: "Internal server error" });
  }
}
