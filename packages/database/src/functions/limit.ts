import {
  getStartOfCurrentMonth,
  getEndOfCurrentMonth,
  errorifyAsyncFn,
  getNumberOrDefault,
} from "@dgpt/utils";
import { ApiKeyModel, db, dbGetApiKeyById, dbGetModelsByIds } from "..";
import { sql } from "drizzle-orm";
import {
  calculatePriceInCentByTextModelAndUsage,
  calculatePriceInCentByImageModelAndUsage,
} from "@dgpt/llm-model";

export const checkLimitsByApiKeyIdWithResult = errorifyAsyncFn(
  checkLimitsByApiKeyId,
);
// given an api key id, checks whether the usage is in the budget for the current month
export async function checkLimitsByApiKeyId({
  apiKeyId,
}: {
  apiKeyId: string;
}): Promise<{ hasReachedLimit: boolean }> {
  const startDate = getStartOfCurrentMonth();
  const endDate = getEndOfCurrentMonth();

  const { actualPrice, apiKey } = await getUsageInCentByApiKeyId({
    apiKeyId,
    startDate,
    endDate,
  });

  if (actualPrice >= apiKey.limitInCent || actualPrice < 0) {
    return { hasReachedLimit: true };
  }

  return { hasReachedLimit: false };
}

export const getCurrentUsageInCentByApiKeyIdWithResult = errorifyAsyncFn(
  getUsageInCentByApiKeyId,
);
export async function getUsageInCentByApiKeyId({
  apiKeyId,
  startDate,
  endDate,
}: {
  apiKeyId: string;
  startDate: Date;
  endDate: Date;
}): Promise<{ apiKey: ApiKeyModel; actualPrice: number }> {
  const apiKey = await dbGetApiKeyById({ apiKeyId });

  if (apiKey === undefined) {
    throw Error("Could not find api key");
  }

  const chatCompletionUsages = await dbGetChatCompletionUsageByApiKeyId({
    apiKeyId,
    startDate,
    endDate,
  });

  const imageGenerationUsages = await dbGetImageGenerationUsageByApiKeyId({
    apiKeyId,
    startDate,
    endDate,
  });

  const allModelIds = [
    ...chatCompletionUsages.map((m) => m.modelId),
    ...imageGenerationUsages.map((m) => m.modelId),
  ];

  const models = await dbGetModelsByIds({
    modelIds: allModelIds,
  });

  let priceInCent = 0;

  // Calculate price for text models
  for (const modelUsage of chatCompletionUsages) {
    const maybeModel = models.find((m) => m.id === modelUsage.modelId);

    if (maybeModel === undefined) {
      console.warn(`Could not find model with id ${modelUsage.modelId}`);
      continue;
    }

    if (maybeModel.priceMetadata.type === "text") {
      const modelPrice = calculatePriceInCentByTextModelAndUsage({
        priceMetadata: maybeModel.priceMetadata,
        promptTokens: modelUsage.promptTokens,
        completionTokens: modelUsage.completionTokens,
      });
      priceInCent += modelPrice;
    }
  }

  // Calculate price for image models
  for (const imageUsage of imageGenerationUsages) {
    const maybeModel = models.find((m) => m.id === imageUsage.modelId);

    if (maybeModel === undefined) {
      console.warn(`Could not find model with id ${imageUsage.modelId}`);
      continue;
    }

    if (maybeModel.priceMetadata.type === "image") {
      const modelPrice = calculatePriceInCentByImageModelAndUsage({
        priceMetadata: maybeModel.priceMetadata,
        numberOfImages: imageUsage.numberOfImages,
      });
      priceInCent += modelPrice;
    }
  }

  return { apiKey, actualPrice: priceInCent };
}

type Interval =
  | "hour"
  | "minute"
  | "day"
  | "week"
  | "month"
  | "quarter"
  | "year";

export async function dbGetChatCompletionUsageByApiKeyId({
  apiKeyId,
  startDate,
  endDate,
}: {
  apiKeyId: string;
  startDate: Date;
  endDate: Date;
}) {
  const interval: Interval = "month";

  //@ts-expect-error weird typing errors due to the pg driver
  const rows: {
    period: string;
    model_id: string;
    prompt_tokens: string;
    completion_tokens: string;
    nof_requests: string;
  }[] = (
    await db.execute(sql`
SELECT
    DATE_TRUNC(${interval}, tracking.created_at) AS period,
    tracking.model_id,
    SUM(tracking.prompt_tokens) AS prompt_tokens,
    SUM(tracking.completion_tokens) AS completion_tokens
FROM completion_usage_tracking as tracking
WHERE tracking.created_at BETWEEN ${startDate.toISOString()} AND ${endDate.toISOString()} AND tracking.api_key_id = ${apiKeyId}
GROUP BY period, tracking.model_id
ORDER BY period, tracking.model_id
`)
  ).rows;

  const mappedRows = rows.map((row) => ({
    period: new Date(row.period),
    modelId: row.model_id,
    promptTokens: getNumberOrDefault(row.prompt_tokens, 0),
    completionTokens: getNumberOrDefault(row.completion_tokens, 0),
  }));

  return mappedRows;
}

/**
 * Retrieves and aggregates image generation usage statistics for a specific API key within a date range.
 *
 * @param apiKeyId - The API key to retrieve usage for
 * @param startDate - The beginning of the date range to analyze (inclusive)
 * @param endDate - The end of the date range to analyze (inclusive)
 *
 * @returns Promise<Array> An array of usage statistics objects, each containing:
 *   - period: Date object representing the month (first day of month)
 *   - modelId: The ID of the model used for image generation
 *   - numberOfImages: Total number of images generated for this model in this period
 */
export async function dbGetImageGenerationUsageByApiKeyId({
  apiKeyId,
  startDate,
  endDate,
}: {
  apiKeyId: string;
  startDate: Date;
  endDate: Date;
}): Promise<
  Array<{
    period: Date;
    modelId: string;
    numberOfImages: number;
  }>
> {
  const interval: Interval = "month";

  //@ts-expect-error weird typing errors due to the pg driver
  const rows: {
    period: string;
    model_id: string;
    number_of_images: string;
    nof_requests: string;
  }[] = (
    await db.execute(sql`
SELECT
    DATE_TRUNC(${interval}, tracking.created_at) AS period,
    tracking.model_id,
    SUM(tracking.number_of_images) AS number_of_images
FROM image_generation_usage_tracking as tracking
WHERE tracking.created_at BETWEEN ${startDate.toISOString()} AND ${endDate.toISOString()} AND tracking.api_key_id = ${apiKeyId}
GROUP BY period, tracking.model_id
ORDER BY period, tracking.model_id
`)
  ).rows;

  const mappedRows = rows.map((row) => ({
    period: new Date(row.period),
    modelId: row.model_id,
    numberOfImages: getNumberOrDefault(row.number_of_images, 0),
  }));

  return mappedRows;
}
