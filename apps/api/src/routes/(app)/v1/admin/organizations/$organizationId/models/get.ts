import { handleApiError } from "@/errors";
import { validateAdminApiKeyAndThrow } from "../../../utils";
import { dbGetAllModelsByOrganizationId } from "@dgpt/db";
import { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";

const paramsSchema = z.object({
  organizationId: z.string().uuid(),
});

export async function handler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    validateAdminApiKeyAndThrow(request.headers.authorization);
    const { organizationId } = paramsSchema.parse(request.params);
    const models = await dbGetAllModelsByOrganizationId(organizationId);
    reply.status(200).send(models);
  } catch (error) {
    const e = handleApiError(error);
    reply.status(e.statusCode).send({ error: e.message });
    return;
  }
}
