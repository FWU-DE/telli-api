import { eq, inArray, and } from "drizzle-orm";
import {
  db,
  dbGetAllApiKeysByProjectId,
  dbGetOrganizationAndProjectsByOrganizationId,
  LlmModel,
  llmModelApiKeyMappingTable,
  llmModelTable,
} from "..";

export async function dbGetAllModels() {
  return db.select().from(llmModelTable).orderBy(llmModelTable.createdAt);
}

export async function dbGetModelById({ id }: { id: string }) {
  return (
    await db.select().from(llmModelTable).where(eq(llmModelTable.id, id))
  )[0];
}

export async function dbGetAllModelsByOrganizationId({
  organizationId,
}: {
  organizationId: string;
}) {
  return await db
    .select()
    .from(llmModelTable)
    .where(eq(llmModelTable.organizationId, organizationId))
    .orderBy(llmModelTable.name, llmModelTable.createdAt);
}

export async function dbGetModelsByApiKeyId({
  apiKeyId,
}: {
  apiKeyId: string;
}) {
  const rows = await db
    .select()
    .from(llmModelTable)
    .innerJoin(
      llmModelApiKeyMappingTable,
      eq(llmModelApiKeyMappingTable.llmModelId, llmModelTable.id)
    )
    .where(eq(llmModelApiKeyMappingTable.apiKeyId, apiKeyId));

  return rows.map((r) => r.llm_model);
}

export async function dbUpdateLlmModel(llmModel: LlmModel) {
  const insertedLlmModel = (
    await db
      .update(llmModelTable)
      .set({ ...llmModel })
      .where(eq(llmModelTable.id, llmModel.id))
      .returning()
  )[0];

  return insertedLlmModel;
}

export async function dbDeleteModelById({ modelId }: { modelId: string }) {
  return (
    await db
      .delete(llmModelTable)
      .where(eq(llmModelTable.id, modelId))
      .returning()
  )[0];
}

export async function dbGetModelsByIds({ modelIds }: { modelIds: string[] }) {
  if (modelIds.length < 1) return [];

  return await db
    .select()
    .from(llmModelTable)
    .where(inArray(llmModelTable.id, modelIds));
}

// Helper to get all API keys in an organization
export async function getAllApiKeys(organizationId: string): Promise<{ id: string; name: string }[]> {
  const orgWithProjects = await dbGetOrganizationAndProjectsByOrganizationId({ organizationId });
  if (!orgWithProjects) return [];
  const allApiKeys: { id: string; name: string }[] = [];
  for (const project of orgWithProjects.projects) {
    const keys = await dbGetAllApiKeysByProjectId({ projectId: project.id });
    allApiKeys.push(...keys.map((k: any) => ({ id: k.id, name: k.name })));
  }
  return allApiKeys;
}


export async function dbCreateModelWithApiKeyLinks({
  provider,
  name,
  displayName,
  description = "",
  settings,
  priceMetadata,
  organizationId,
  apiKeyNames,
}: {
  provider: string;
  name: string;
  displayName: string;
  description?: string;
  settings: any;
  priceMetadata: any;
  organizationId: string;
  apiKeyNames?: string[];
}): Promise<{
  error?: string;
  model?: any;
  linkedApiKeys?: { id: string; name: string }[];
}> {
  // Check for existing model with same name and provider in the organization
  const existingModel = await db
    .select()
    .from(llmModelTable)
    .where(
      and(
        eq(llmModelTable.name, name),
        eq(llmModelTable.provider, provider),
        eq(llmModelTable.organizationId, organizationId)
      )
    );
  if (existingModel.length > 0) {
    return {
      error:
        "A model with this name and provider already exists for this organization.",
    };
  }

  // Create the model
  const [model] = await db
    .insert(llmModelTable)
    .values({
      provider,
      name,
      displayName,
      description: description ?? "",
      setting: settings,
      priceMetadata,
      organizationId,
    })
    .returning();

  if (!model) {
    return { error: "Failed to create model" };
  }

  const allApiKeys = await getAllApiKeys(organizationId);
  if (!allApiKeys.length) {
    return { error: "Organization not found" };
  }
  // Find API keys by name
  const apiKeysToLink = apiKeyNames?.map((name) => {
    return allApiKeys.find((k) => k.name === name);
  }).filter((k) => k !== undefined);

  if (apiKeysToLink === undefined) {
    return { error: "One or more API key names not found in organization" };
  }
  // Link model to API keys
  if (apiKeysToLink.length > 0) {
    await db.insert(llmModelApiKeyMappingTable).values(
      apiKeysToLink.map((apiKey) => ({
        llmModelId: model.id,
        apiKeyId: apiKey.id,
      }))
    );
  }

  return {
    model,
    linkedApiKeys: apiKeysToLink,
  };
}
