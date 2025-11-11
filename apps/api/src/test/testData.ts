import { LlmInsertModel, OrganizationInsertModel } from "@dgpt/db";

export const ORGANIZATION_ID = "5dbd7831-fcd2-4db3-aa93-6142893c51c2";
export const MODEL_ID = "1ead3e7f-8464-4b49-9e8b-da2aabcfe4bf";
export const NON_EXISTING_MODEL_ID = "e88f53c4-1d88-452d-9f14-6a7d895da9f3";

export const testOrganziation: OrganizationInsertModel = {
  id: ORGANIZATION_ID,
  name: "Test Organization",
};

export const testModel: LlmInsertModel = {
  id: MODEL_ID,
  organizationId: ORGANIZATION_ID,
  name: "Test LLM",
  displayName: "Test LLM",
  description: "Test LLM Description",
  provider: "openai",
  priceMetadata: {
    type: "text",
    completionTokenPrice: 1,
    promptTokenPrice: 1,
  },
  setting: {
    apiKey: "sk-test",
    baseUrl: "https://api.openai.com/v1",
    provider: "openai",
  },
  isNew: true,
  isDeleted: false,
};
