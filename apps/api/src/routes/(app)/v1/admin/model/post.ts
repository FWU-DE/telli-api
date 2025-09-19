import { FastifyReply, FastifyRequest } from "fastify";
import { validateAdminApiKey } from "../utils";
import { obscureModels } from "../../models/utils";
import z from "zod";
import { llmModelSettingsSchema } from "@dgpt/llm-model";
import { llmModelPriceMetadataSchema } from "@dgpt/db";
import { dbCreateModelWithApiKeyLinks } from "@dgpt/db";

const createModelRequestSchema = z.object({
  provider: z.string(),
  name: z.string(),
  displayName: z.string(),
  description: z.string().optional(),
  settings: llmModelSettingsSchema,
  priceMetadata: llmModelPriceMetadataSchema,
  organizationId: z.string(),
  apiKeyNames: z.array(z.string()).optional(), // If omitted, link to all API keys in org
  additionalParameters: z.array(z.record(z.any())).optional(),
  isNew: z.boolean().optional(),
  isDeleted: z.boolean().optional(),
});

export type CreateModelRequest = z.infer<typeof createModelRequestSchema>;

export async function handler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const validationResult = validateAdminApiKey(request, reply);
  if (!validationResult.isValid) return;

  const body = createModelRequestSchema.safeParse(request.body);
  if (!body.success) {
    return reply.status(400).send({ error: body.error.message });
  }
  const result = body.data;

  // Move all DB logic to the function
  const dbResult = await dbCreateModelWithApiKeyLinks({
    provider: result.provider,
    name: result.name,
    displayName: result.displayName,
    description: result.description,
    settings: result.settings,
    priceMetadata: result.priceMetadata,
    organizationId: result.organizationId,
    apiKeyNames: result.apiKeyNames,
  });

  if (dbResult?.error !== undefined) {
    return reply.status(400).send({ error: dbResult.error });
  }

  return reply.status(200).send({
    model: obscureModels([dbResult.model])[0],
    linkedApiKeys: dbResult.linkedApiKeys,
  });
}
