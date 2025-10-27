import { FastifyReply, FastifyRequest } from "fastify";
import { dbGetOrganizationAndProjectsByOrganizationId } from "@dgpt/db";
import { validateAdminApiKey } from "../../utils";
import { obscureModels } from "../../../models/utils";
import { organizationParamsSchema } from "./organizationParamsSchema";
import { handleApiError } from "@/errors";

export async function handler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    const validationResult = validateAdminApiKey(request, reply);
    if (!validationResult.isValid) return;

    const { organizationId } = organizationParamsSchema.parse(request.params);

    const organization = await dbGetOrganizationAndProjectsByOrganizationId({
      organizationId,
    });

    if (organization === undefined) {
      return reply.status(404).send({ error: "Organization not found" });
    }

    return reply.status(200).send({
      ...organization,
      models: obscureModels(organization.models),
      modelIds: organization.models.map((m) => m.id),
    });
  } catch (error) {
    const result = handleApiError(error);
    return reply.status(result.statusCode).send({ error: result.message });
  }
}
