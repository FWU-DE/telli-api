export function calculatePriceByTextModelAndUsage({
  completionTokens,
  promptTokens,
  priceMetadata,
}: {
  priceMetadata: { completionTokenPrice: number; promptTokenPrice: number };
  completionTokens: number;
  promptTokens: number;
}) {
  const completionTokenPrice =
    completionTokens * priceMetadata.completionTokenPrice;
  const promptTokenPrice = promptTokens * priceMetadata.promptTokenPrice;

  return completionTokenPrice + promptTokenPrice;
}
