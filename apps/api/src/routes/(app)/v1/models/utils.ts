import { LlmModel } from "@dgpt/db";

type ObscuredLlmModel = Omit<LlmModel, "setting" | "organizationId">;

export function obscureModels(models: LlmModel[]): ObscuredLlmModel[] {
  return models.map((model) => {
    // eslint-disable-next-line no-unused-vars
    const { setting, organizationId, ...rest } = model;
    return rest;
  });
}
