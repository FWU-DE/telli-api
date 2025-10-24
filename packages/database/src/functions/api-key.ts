import bcrypt from "bcryptjs";
import { cnanoid } from "../utils";
import {
  ApiKeyInsertModel,
  ApiKeyModel,
  apiKeyTable,
  llmModelApiKeyMappingTable,
  llmModelTable,
  projectTable,
} from "../schema";
import { db, dbGetProjectById } from "..";
import { isDateBefore } from "../date";
import { and, eq, inArray } from "drizzle-orm";

export async function dbCreateJustTheApiKey(
  apiKey: Omit<ApiKeyInsertModel, "secretHash" | "keyId">,
) {
  const apiKeyRecord = await createApiKeyRecord();
  const apiKeyToInsert = {
    ...apiKey,
    secretHash: apiKeyRecord.secretHash,
    keyId: apiKeyRecord.keyId,
  };
  const insertedApiKey = (
    await db.insert(apiKeyTable).values(apiKeyToInsert).returning()
  )[0];

  if (insertedApiKey === undefined) {
    throw Error("Could not create api key");
  }
  return { ...insertedApiKey, plainKey: apiKeyRecord.fullKey };
}

export async function dbCreateApiKey({
  projectId,
  name,
  modelIds,
  organizationId,
  budget,
}: {
  projectId: string;
  organizationId: string;
  name: string;
  modelIds: string[];
  budget: number;
}) {
  if (modelIds.length < 1) {
    throw Error("Cannot create api key without assigned models.");
  }

  const project = await dbGetProjectById(organizationId, projectId);

  if (project === undefined) {
    throw Error("Could not find project");
  }

  const apiKeyRecord = await createApiKeyRecord();

  return await db.transaction(async (tx) => {
    const insertedApiKey = (
      await tx
        .insert(apiKeyTable)
        .values({
          ...apiKeyRecord,
          projectId,
          name,
          limitInCent: budget,
        })
        .returning()
    )[0];

    if (insertedApiKey === undefined) {
      throw Error("Could not create api key");
    }

    // only use the models available in the organization
    const availableModelsPerOrganization = await tx
      .select()
      .from(llmModelTable)
      .where(
        and(
          eq(llmModelTable.organizationId, organizationId),
          inArray(llmModelTable.id, modelIds),
        ),
      );

    const insertedMappings = await tx
      .insert(llmModelApiKeyMappingTable)
      .values(
        availableModelsPerOrganization.map((model) => ({
          llmModelId: model.id,
          apiKeyId: insertedApiKey.id,
        })),
      )
      .returning();

    if (insertedMappings.length < 1) {
      throw Error("Could not create any api key to model mappings");
    }

    return { ...insertedApiKey, plainKey: apiKeyRecord.fullKey };
  });
}

export async function dbGetAllApiKeysByProjectId(
  organizationId: string,
  projectId: string,
) {
  return await db
    .select()
    .from(apiKeyTable)
    .innerJoin(projectTable, eq(apiKeyTable.projectId, projectTable.id))
    .where(
      and(
        eq(apiKeyTable.projectId, projectId),
        eq(projectTable.organizationId, organizationId),
      ),
    );
}

export async function dbGetApiKeysAndUsageByProjectId({
  projectId,
}: {
  projectId: string;
}) {
  return await db
    .select()
    .from(apiKeyTable)
    .where(eq(apiKeyTable.projectId, projectId));
}

type ApiKeyParts = {
  keyId: string;
  secretKey: string;
  fullKey: string;
};

export function generateApiKey(): ApiKeyParts {
  const keyId = cnanoid(16);
  const secretKey = cnanoid(32);

  return {
    keyId,
    secretKey,
    fullKey: `sk_${keyId}_${secretKey}`,
  };
}

export async function hashSecretKey(secretKey: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(secretKey, saltRounds);
}

export async function dbValidateApiKey(
  fullApiKey: string,
): Promise<
  { valid: true; apiKey: ApiKeyModel } | { valid: false; reason: string }
> {
  const [sk, keyId, secretKey] = fullApiKey.split("_");

  if (sk !== "sk" || keyId === undefined || secretKey === undefined) {
    return { valid: false, reason: "Malformed api key" };
  }

  const apiKey = (
    await db.select().from(apiKeyTable).where(eq(apiKeyTable.keyId, keyId))
  )[0];

  if (apiKey === undefined) {
    return { valid: false, reason: "Could not find the api key" };
  }

  if (
    apiKey.expiresAt !== null &&
    !isDateBefore(new Date(), apiKey.expiresAt)
  ) {
    return { valid: false, reason: "Api key is expired" };
  }

  if (apiKey.state === "inactive") {
    return { valid: false, reason: "Api key is inactive" };
  }

  if (apiKey.state === "deleted") {
    return { valid: false, reason: "Api key was deleted" };
  }

  const isSameHash = await bcrypt.compare(secretKey, apiKey.secretHash);

  if (!isSameHash) {
    return { valid: false, reason: "Api key is invalid" };
  }

  return { valid: true, apiKey };
}

export async function createApiKeyRecord(): Promise<{
  keyId: string;
  secretHash: string;
  fullKey: string;
}> {
  const { keyId, secretKey, fullKey } = generateApiKey();
  const hashedSecret = await hashSecretKey(secretKey);

  return {
    keyId,
    secretHash: hashedSecret,
    fullKey,
  };
}

export async function dbGetApiKeyById({ apiKeyId }: { apiKeyId: string }) {
  return (
    await db.select().from(apiKeyTable).where(eq(apiKeyTable.id, apiKeyId))
  )[0];
}

export async function dbGetApiKey(
  organizationId: string,
  projectId: string,
  apiKeyId: string,
) {
  return (
    await db
      .select()
      .from(apiKeyTable)
      .innerJoin(projectTable, eq(apiKeyTable.projectId, projectTable.id))
      .where(
        and(
          eq(apiKeyTable.id, apiKeyId),
          eq(apiKeyTable.projectId, projectId),
          eq(projectTable.organizationId, organizationId),
        ),
      )
  )[0]?.api_key;
}

export async function dbDeleteApiKey(apiKeyId: string) {
  return await db.transaction(async (tx) => {
    // Delete with join is not supported in Drizzle atm.

    // First, delete all llm_model_api_key_mappings associated with this API key
    await tx
      .delete(llmModelApiKeyMappingTable)
      .where(eq(llmModelApiKeyMappingTable.apiKeyId, apiKeyId));

    // Then delete the API key itself
    await tx.delete(apiKeyTable).where(eq(apiKeyTable.id, apiKeyId));

    return;
  });
}

export async function dbGetAllModelMappingsForApiKey(
  organizationId: string,
  projectId: string,
  apiKeyId: string,
) {
  return await db
    .select()
    .from(llmModelApiKeyMappingTable)
    .innerJoin(
      apiKeyTable,
      eq(llmModelApiKeyMappingTable.apiKeyId, apiKeyTable.id),
    )
    .innerJoin(projectTable, eq(apiKeyTable.projectId, projectTable.id))
    .where(
      and(
        eq(apiKeyTable.id, apiKeyId),
        eq(apiKeyTable.projectId, projectId),
        eq(projectTable.organizationId, organizationId),
      ),
    );
}

export async function dbUpdateModelMappingsForApiKey(
  organizationId: string,
  projectId: string,
  apiKeyId: string,
  modelIds: string[],
) {
  return await db.transaction(async (tx) => {
    // First verify the API key exists and belongs to the organization/project
    const apiKey = await tx
      .select()
      .from(apiKeyTable)
      .innerJoin(projectTable, eq(apiKeyTable.projectId, projectTable.id))
      .where(
        and(
          eq(apiKeyTable.id, apiKeyId),
          eq(apiKeyTable.projectId, projectId),
          eq(projectTable.organizationId, organizationId),
        ),
      )
      .limit(1);

    if (apiKey.length === 0) {
      throw new Error("API key not found");
    }

    // Verify all model IDs exist and belong to the organization
    const availableModels = await tx
      .select()
      .from(llmModelTable)
      .where(
        and(
          eq(llmModelTable.organizationId, organizationId),
          inArray(llmModelTable.id, modelIds),
        ),
      );

    if (availableModels.length !== modelIds.length) {
      throw new Error(
        "Some model IDs are invalid or do not belong to the organization",
      );
    }

    // Delete existing mappings for this API key
    await tx
      .delete(llmModelApiKeyMappingTable)
      .where(eq(llmModelApiKeyMappingTable.apiKeyId, apiKeyId));

    // Create new mappings
    if (modelIds.length > 0) {
      await tx.insert(llmModelApiKeyMappingTable).values(
        modelIds.map((modelId) => ({
          llmModelId: modelId,
          apiKeyId: apiKeyId,
        })),
      );
    }

    // Return the updated mappings
    return await tx
      .select({ llmModelApiKeyMappingTable })
      .from(llmModelApiKeyMappingTable)
      .innerJoin(
        llmModelTable,
        eq(llmModelApiKeyMappingTable.llmModelId, llmModelTable.id),
      )
      .where(eq(llmModelApiKeyMappingTable.apiKeyId, apiKeyId));
  });
}
