import { LlmModel } from "@dgpt/db";

type ObscuredLlmModel = Omit<LlmModel, "setting" | "organizationId">;

export function obscureModels(models: LlmModel[]): ObscuredLlmModel[] {
  return models.map((model) => {
    const { setting, organizationId, ...rest } = model;
    return rest;
  });
}
