import { eq, inArray } from "drizzle-orm";
import { db, LlmModel, llmModelApiKeyMappingTable, llmModelTable } from "..";

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
      eq(llmModelApiKeyMappingTable.llmModelId, llmModelTable.id),
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
