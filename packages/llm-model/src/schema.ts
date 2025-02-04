import z from "zod";
import { DEFAULT_IONOS_BASE_URL, DEFAULT_OPENAI_BASE_URL } from "./const";

export const defaultLlmProviderProps = z.object({
  name: z.string(),
});

export const llmModelProviderSchema = z.enum([
  "ionos",
  "openai",
  "azure",
  "bedrock",
]);

export const llmModelSettingsIonos = z.object({
  provider: z.literal(llmModelProviderSchema.enum.ionos),
  apiKey: z.string(),
  baseUrl: z.string().default(DEFAULT_IONOS_BASE_URL),
});

export const llmModelSettingsOpenAiSchema = z.object({
  provider: z.literal(llmModelProviderSchema.enum.openai),
  apiKey: z.string(),
  baseUrl: z.string().default(DEFAULT_OPENAI_BASE_URL),
});

export const llmModelSettingsAzureSchema = z.object({
  provider: z.literal(llmModelProviderSchema.enum.azure),
  apiKey: z.string(),
  baseUrl: z.string(),
});

export const llmModelSettingsBedrockSchema = z.object({
  provider: z.literal(llmModelProviderSchema.enum.bedrock),
  awsAccessKeyId: z.string(),
  awsSecretAccessKey: z.string(),
  awsRegion: z.string(),
});

export const llmModelSettingsSchema = llmModelSettingsIonos
  .or(llmModelSettingsOpenAiSchema)
  .or(llmModelSettingsAzureSchema)
  .or(llmModelSettingsBedrockSchema);

export type LlmModelProviderSettings = z.infer<typeof llmModelSettingsSchema>;
