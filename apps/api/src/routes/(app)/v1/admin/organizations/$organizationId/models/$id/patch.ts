import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { dbUpdateLlmModel, llmUpdateModelSchema } from "@dgpt/db";
import { validateAdminApiKeyAndThrow, validateRequestBody } from "@/validation";
import { handleApiError, NotFoundError } from "@/errors";
import { validateOrganizationId } from "@/validation";

const paramsSchema = z.object({
  organizationId: z.string().uuid(),
  id: z.string().uuid(),
});

export async function handler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    validateAdminApiKeyAndThrow(request.headers.authorization);
    const { id, organizationId } = paramsSchema.parse(request.params);
    const parseResult = llmUpdateModelSchema.parse(request.body);
    validateOrganizationId(organizationId);
    validateRequestBody(parseResult);

    const dbResult = await dbUpdateLlmModel(id, organizationId, parseResult);
    if (!dbResult) throw new NotFoundError("Model not found");
    return reply.status(200).send(dbResult);
  } catch (error) {
    const e = handleApiError(error);
    reply.status(e.statusCode).send({ error: e.message });
    return;
  }
}
