import { LlmInsertModel, OrganizationInsertModel, ProjectInsertModel } from "@dgpt/db";

export const ORGANIZATION_ID = "5dbd7831-fcd2-4db3-aa93-6142893c51c2";
export const PROJECT_ID = "6ecd4f8g-9576-5d5b-bg0d-fc4cbce5d6eh";
export const API_KEY_ID = "7fde5g9h-a687-6e6c-ch1e-gd5dcdf6e7fi";
export const MODEL_ID = "1ead3e7f-8464-4b49-9e8b-da2aabcfe4bf";
export const NON_EXISTING_MODEL_ID = "e88f53c4-1d88-452d-9f14-6a7d895da9f3";
export const NON_EXISTING_API_KEY_ID = "8gef6h0i-b798-7f7d-di2f-he6ede7f8gj";

export const testOrganziation: OrganizationInsertModel = {
  id: ORGANIZATION_ID,
  name: "Test Organization",
};

export const testProject: ProjectInsertModel = {
  id: PROJECT_ID,
  organizationId: ORGANIZATION_ID,
  name: "Test Project",
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
