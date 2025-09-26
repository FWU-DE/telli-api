import { validateAdminApiKey } from "../../../utils";
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
  const apiKey = await validateAdminApiKey(request, reply);
  if (!apiKey.isValid) return;

  if (!paramsSchema.safeParse(request.params).success) {
    return reply
      .status(400)
      .send({ error: "Parameters do not have the correct format." });
  }

  const { organizationId } = request.params as { organizationId: string };

  try {
    const models = await dbGetAllModelsByOrganizationId(organizationId);
    console.error("models:", models);
    reply.status(200).send(models);
  } catch (error) {
    console.error("Error fetching models:", error);
    reply.status(500).send({ error: "Failed to fetch models" });
    return;
  }

  reply.status(200).send();
}
