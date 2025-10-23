import { FastifyReply, FastifyRequest } from "fastify";
import { dbCreateApiKey, dbGetAllModelsByOrganizationId } from "@dgpt/db";
import { validateAdminApiKey } from "../../../../../utils";
import z from "zod";

const createApiKeyRequestSchema = z.object({
  name: z.string().min(1, "API key name is required"),
  modelIds: z.array(z.string()).min(1, "At least one model ID is required"),
  budget: z.coerce.number().min(0, "Budget must be a non-negative number"),
});

export type CreateApiKeyRequest = z.infer<typeof createApiKeyRequestSchema>;

export async function handler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const validationResult = validateAdminApiKey(request, reply);
  if (!validationResult.isValid) return;

  const params = request.params as {
    organizationId: string;
    projectId: string;
  };
  const { organizationId, projectId } = params;

  const parseResult = createApiKeyRequestSchema.safeParse(request.body);
  if (!parseResult.success) {
    return reply.status(400).send({
      error: "Invalid request body",
      details: parseResult.error.message,
    });
  }

  const { name, modelIds, budget } = parseResult.data;

  try {
    // Get all models for the organization to validate the provided model IDs
    const availableModels =
      await dbGetAllModelsByOrganizationId(organizationId);
    const availableModelIds = availableModels.map((model) => model.id);

    // Filter model IDs to only include those that exist for this organization
    const validModelIds = modelIds.filter((modelId) =>
      availableModelIds.includes(modelId),
    );

    if (validModelIds.length === 0) {
      return reply.status(400).send({
        error: "No valid model IDs provided for this organization",
      });
    }

    // Create the API key
    const apiKey = await dbCreateApiKey({
      organizationId,
      projectId,
      name,
      modelIds: validModelIds,
      budget,
    });

    return reply.status(201).send(apiKey);
  } catch (error) {
    console.error("Error creating API key:", error);
    return reply.status(500).send({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
