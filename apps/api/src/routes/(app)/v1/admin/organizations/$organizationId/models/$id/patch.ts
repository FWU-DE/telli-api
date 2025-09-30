import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { dbUpdateLlmModel, llmUpdateModelSchema } from "@dgpt/db";
import {
  validateAdminApiKeyAndThrow,
  validateRequestBody,
} from "@/routes/(app)/v1/admin/utils";
import { handleApiError, NotFoundError } from "@/errors";

const paramsSchema = z.object({
  organizationId: z.string().uuid(),
  id: z.string().uuid(),
});

const updateBodySchema = llmUpdateModelSchema.omit({ organizationId: true });

export async function handler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    validateAdminApiKeyAndThrow(request.headers.authorization);
    const { id, organizationId } = paramsSchema.parse(request.params);
    const parseResult = updateBodySchema.parse(request.body);
    validateRequestBody(parseResult);
    const dbResult = await dbUpdateLlmModel(id, parseResult);
    if (!dbResult) throw new NotFoundError("Model not found");
    return reply.status(200).send(dbResult);
  } catch (error) {
    const e = handleApiError(error);
    reply.status(e.statusCode).send({ error: e.message });
    return;
  }
}
