import {
  getStartOfCurrentMonth,
  getEndOfCurrentMonth,
  errorifyAsyncFn,
  getNumberOrDefault,
} from "@dgpt/utils";
import { ApiKeyModel, db, dbGetApiKeyById, dbGetModelsByIds } from "..";
import { sql } from "drizzle-orm";
import {
  calculatePriceByTextModelAndUsage,
  PRICE_AND_CENT_MULTIPLIER,
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

  const modelUsages = await dbGetModelUsageByApiKeyId({
    apiKeyId,
    startDate,
    endDate,
  });

  const models = await dbGetModelsByIds({
    modelIds: modelUsages.map((m) => m.modelId),
  });

  let price = 0;
  for (const modelUsage of modelUsages) {
    const maybeModel = models.find((m) => m.id === modelUsage.modelId);

    if (maybeModel === undefined) {
      console.warn(`Could not find model with id ${modelUsage.modelId}`);
      continue;
    }

    if (maybeModel.priceMetadata.type === "text") {
      const modelPrice = calculatePriceByTextModelAndUsage({
        priceMetadata: maybeModel.priceMetadata,
        promptTokens: modelUsage.promptTokens,
        completionTokens: modelUsage.completionTokens,
      });
      price += modelPrice;
    }
  }

  const actualPrice = price / PRICE_AND_CENT_MULTIPLIER;
  return { actualPrice, apiKey };
}

type Interval =
  | "hour"
  | "minute"
  | "day"
  | "week"
  | "month"
  | "quarter"
  | "year";

export async function dbGetModelUsageByApiKeyId({
  apiKeyId,
  startDate,
  endDate,
}: {
  apiKeyId: string;
  startDate: Date;
  endDate: Date;
}) {
  const interval: Interval = "month";

  const rows: {
    period: string;
    model_id: string;
    prompt_tokens: string;
    completion_tokens: string;
    nof_requests: string;
  }[] = await db.execute(sql`
SELECT
    DATE_TRUNC(${interval}, tracking.created_at) AS period,
    tracking.model_id,
    SUM(tracking.prompt_tokens) AS prompt_tokens,
    SUM(tracking.completion_tokens) AS completion_tokens,
    COUNT(tracking.completion_tokens) AS nof_requests
FROM completion_usage_tracking as tracking
WHERE tracking.created_at BETWEEN ${startDate.toISOString()} AND ${endDate.toISOString()} AND tracking.api_key_id = ${apiKeyId}
GROUP BY period, tracking.model_id
ORDER BY period, tracking.model_id
`);

  const mappedRows = rows.map((row) => ({
    period: new Date(row.period),
    modelId: row.model_id,
    promptTokens: getNumberOrDefault(row.prompt_tokens, 0),
    completionTokens: getNumberOrDefault(row.completion_tokens, 0),
    numberOfRequest: getNumberOrDefault(row.nof_requests, 0),
  }));

  return mappedRows;
}
