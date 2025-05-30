import { createApiKeyRecord, db } from "./index";
import {
  organizationTable,
  projectTable,
  apiKeyTable,
  llmModelTable,
  llmModelApiKeyMappingTable,
  type OrganizationInsertModel,
  type ProjectInsertModel,
  type ApiKeyInsertModel,
  type LlmInsertModel,
} from "./schema";
import { eq, and } from "drizzle-orm";

const ORGANIZATION_ID = "cfeb82c6-396a-4c2d-954b-53e77acbbe7e";
const PROJECT_ID = "test-project-0";
const API_KEY_NAME = "Test API Key";
// Static ids are used to ensure that the models are not created again
const DEFAULT_MODELS: LlmInsertModel[] = [
  {
    id: "1c4485dd-2f5e-4288-ab53-afa236ee659b",
    provider: "ionos",
    name: "BAAI/bge-m3",
    displayName: "IONOS BGE M3",
    setting: {
      provider: "ionos",
      apiKey: "API_KEY_PLACEHOLDER",
      baseUrl: "PLACEHOLDER_BASE_URL",
    },
    priceMetadata: {
      type: "embedding",
      promptTokenPrice: 10,
    },
    organizationId: ORGANIZATION_ID,
  },
  {
    id: "5a3e3184-f0c1-4dee-8821-1bbd1f1e5ea6",
    provider: "ionos",
    name: "meta-llama/Meta-Llama-3.1-8B-Instruct",
    displayName: "IONOS Llama 3 8B Instruct",
    description: "IONOS Llama 3 8B Instruct model for testing",
    setting: {
      provider: "ionos",
      apiKey: "API_KEY_PLACEHOLDER",
      baseUrl: "PLACEHOLDER_BASE_URL",
    },
    priceMetadata: {
      type: "text",
      promptTokenPrice: 10,
      completionTokenPrice: 10,
    },
    organizationId: ORGANIZATION_ID,
  },
  {
    id: "9e51dda7-0b5c-4fec-a3fc-19836cad702d",
    provider: "openai",
    name: "gpt-4o-mini",
    displayName: "OpenAI GPT-4o Mini",
    description: "OpenAI GPT-4o Mini model for testing",
    setting: {
      provider: "openai",
      apiKey: "API_KEY_PLACEHOLDER",
      baseUrl: "PLACEHOLDER_BASE_URL",
    },
    priceMetadata: {
      type: "text",
      promptTokenPrice: 10,
      completionTokenPrice: 10,
    },
    organizationId: ORGANIZATION_ID,
  },
];

export async function seedDatabase() {
  console.log("Starting database seeding...");

  try {
    // 1. Create/update test organization
    // Since there's no unique constraint on name, we'll check if one exists first
    await db
      .insert(organizationTable)
      .values({
        id: ORGANIZATION_ID,
        name: "Test Organization",
      } satisfies OrganizationInsertModel)
      .onConflictDoNothing()
      .returning();

    
    // 2. Create/update test project (using primary key for upsert)
    await db
      .insert(projectTable)
      .values({
        id: PROJECT_ID,
        name: "Test Project",
        limitInCent: 10000, // 100.00 € limit
        organizationId: ORGANIZATION_ID,
      } satisfies ProjectInsertModel)
      .onConflictDoNothing()
      .returning();

    // 3. Create/update test API key
    // Since keyId doesn't have a unique constraint, we'll check first

    let apiKey;
    const { keyId, secretHash, fullKey } = await createApiKeyRecord();

    const [existingApiKey] = await db
      .select()
      .from(apiKeyTable)
      .where(eq(apiKeyTable.name, API_KEY_NAME));

    if (existingApiKey !== undefined) {
      // Update existing API key
      [apiKey] = await db
        .update(apiKeyTable)
        .set({
          name: API_KEY_NAME,
          secretHash,
          projectId: PROJECT_ID,
          limitInCent: 5000,
          state: "active",
        })
        .where(eq(apiKeyTable.id, existingApiKey.id))
        .returning();
    } else {
      // Create new API key
      [apiKey] = await db
        .insert(apiKeyTable)
        .values({
          name: API_KEY_NAME,
          keyId,
          secretHash,
          projectId: PROJECT_ID,
          limitInCent: 5000, // $50.00 limit per key
          state: "active",
        } satisfies ApiKeyInsertModel)
        .returning();
    }

    if (apiKey === undefined) {
      throw new Error("Failed to create/update API key");
    }

    // 5. Create/update API key to model mapping
    for (const model of DEFAULT_MODELS) {
      await db
        .insert(llmModelTable)
        .values(model)
        .onConflictDoNothing()
        .returning();

      await db
        .insert(llmModelApiKeyMappingTable)
        .values({
          llmModelId: model.id!,
          apiKeyId: apiKey.id,
        })
        .onConflictDoNothing();
    }

    // 6. Summary
    console.log("Database seeding completed successfully!");
    console.log("\nSummary:");
    console.log(`   • Organization: Test Organization`);
    console.log(`   • Project: Test Project (ID: ${PROJECT_ID})`);
    console.log(
      `   • LLM Models: ${DEFAULT_MODELS.map((m) => m.name).join(", ")}`
    );
    console.log(`   • Model-Key Mapping: configured`);

    console.log("\n Test Credentials:");
    console.log(`   • API Key ID: ${apiKey.keyId}`);

    console.log(`Created API key: ${apiKey?.name} (${apiKey?.keyId})`);
    console.log(
      `\n SAVE THIS API KEY VALUE IT CANNOT BE VIEWED AGAIN: ${fullKey} \n`
    );

    console.log(
      "\n⚠️  Remember to replace API key placeholders with real values:"
    );
    console.log(`   • YOUR_IONOS_API_KEY_PLACEHOLDER`);

    return {
      apiKey,
      models: DEFAULT_MODELS,
    };
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}

// Run seed if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log("Seeding completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Seeding failed:", error);
      process.exit(1);
    });
}
