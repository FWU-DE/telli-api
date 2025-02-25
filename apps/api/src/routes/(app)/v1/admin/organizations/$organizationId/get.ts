import { FastifyReply, FastifyRequest } from "fastify";
import { dbGetOrganizationAndProjectsByOrganizationId } from "@dgpt/db";
import { validateAdminApiKey } from "../../utils";
import z from "zod";
import { obscureModels } from "../../../models/utils";

export async function handler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const validationResult = validateAdminApiKey(request, reply);
  if (!validationResult.isValid) return;

  const { organizationId } = z
    .object({ organizationId: z.string() })
    .parse(request.params);

  const organization = await dbGetOrganizationAndProjectsByOrganizationId({
    organizationId,
  });
  console.debug({ organization });

  if (organization === undefined) {
    return reply.status(404).send({ error: "Organization not found" });
  }

  return reply.status(200).send({
    ...organization,
    models: obscureModels(organization.models),
    modelIds: organization.models.map((m) => m.id),
  });
}
