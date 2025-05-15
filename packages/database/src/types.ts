import { z } from "zod";

export const llmModelPriceMetadataSchema = z.union([
  z.object({
    type: z.literal("text"),
    completionTokenPrice: z.number(),
    promptTokenPrice: z.number(),
  }),
  z.object({
    type: z.literal("image"),
    pricePerImage: z.number(),
  }),
]);

export type Budget = {
  createdAt: Date;
  budget: number;
};

export type LlmModelPriceMetadata = z.infer<typeof llmModelPriceMetadataSchema>;
