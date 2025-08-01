import bcrypt from "bcryptjs";
import { cnanoid } from "../utils";
import {
  ApiKeyModel,
  apiKeyTable,
  llmModelApiKeyMappingTable,
  llmModelTable,
} from "../schema";
import { db, dbGetProjectById } from "..";
import { isDateBefore } from "../date";
import { and, eq, inArray } from "drizzle-orm";

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

  const project = await dbGetProjectById({ projectId });

  if (project === undefined) {
    throw Error("Could not find project");
  }

  // const apiKeys = await dbGetAllApiKeysByProjectId({ projectId });
  // TODO: currently there is no check for project limit needed
  // const currentAllocatedBudget = apiKeys
  //   .map((apiKey) => apiKey.limitInCent)
  //   .reduce((acc, curr) => acc + curr, 0);
  // if (currentAllocatedBudget + budget > project.budget) {
  //   throw Error("Budget exceeds the limit for the project");
  // }

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

export async function dbGetAllApiKeysByProjectId({
  projectId,
}: {
  projectId: string;
}) {
  return await db
    .select()
    .from(apiKeyTable)
    .where(eq(apiKeyTable.projectId, projectId));
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
