import { LlmInsertModel, OrganizationInsertModel } from "@dgpt/db";

export const ORGANIZATION_ID = "12345678-1111-1111-b8aa-0e08c746a888";
export const MODEL_ID = "12345678-1234-5678-1234-567812345678";
export const NON_EXISTING_MODEL_ID = "99999999-9999-9999-9999-999999999999";

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
