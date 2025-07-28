import {
  getStartOfCurrentMonth,
  getEndOfCurrentMonth,
  errorifyAsyncFn,
} from "@dgpt/utils";
import { ApiKeyModel, db, dbGetApiKeyById } from "..";
import { and, between, eq, sum } from "drizzle-orm";
import {
  completionUsageTrackingTable,
  imageGenerationUsageTrackingTable,
} from "../schema";

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

  // Get total costs from completion usage
  const completionCosts = await db
    .select({ totalCosts: sum(completionUsageTrackingTable.costsInCent) })
    .from(completionUsageTrackingTable)
    .where(
      and(
        eq(completionUsageTrackingTable.apiKeyId, apiKeyId),
        between(completionUsageTrackingTable.createdAt, startDate, endDate),
      ),
    );

  // Get total costs from image generation usage
  const imageCosts = await db
    .select({ totalCosts: sum(imageGenerationUsageTrackingTable.costsInCent) })
    .from(imageGenerationUsageTrackingTable)
    .where(
      and(
        eq(imageGenerationUsageTrackingTable.apiKeyId, apiKeyId),
        between(
          imageGenerationUsageTrackingTable.createdAt,
          startDate,
          endDate,
        ),
      ),
    );

  const completionTotal = completionCosts[0]?.totalCosts || 0;
  const imageTotal = imageCosts[0]?.totalCosts || 0;
  const actualPrice = Number(completionTotal) + Number(imageTotal);

  return { apiKey, actualPrice };
}
