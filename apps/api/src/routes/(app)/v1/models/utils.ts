import { LlmModel } from "@dgpt/db";

type ObscuredLlmModel = Omit<
  LlmModel,
  "setting" | "priceMetadata" | "organizationId"
>;

export function obscureModels(models: LlmModel[]): ObscuredLlmModel[] {
  return models.map((model) => {
    const { setting, priceMetadata, organizationId, ...rest } = model;
    return rest;
  });
}
