export type LlmModelPriceMetadata =
  | {
      type: "text";
      completionTokenPrice: number;
      promptTokenPrice: number;
    }
  | {
      type: "image";
      pricePerImage: number;
    };

export type Budget = {
  createdAt: Date;
  budget: number;
};
