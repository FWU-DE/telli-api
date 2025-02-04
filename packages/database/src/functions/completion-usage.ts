import { db } from "..";
import {
  CompletionUsageInsertModel,
  completionUsageTrackingTable,
} from "../schema";

export async function dbCreateCompletionUsage(
  completionUsage: CompletionUsageInsertModel,
) {
  const insertedCompletionUsage = (
    await db
      .insert(completionUsageTrackingTable)
      .values(completionUsage)
      .returning()
  )[0];

  return insertedCompletionUsage;
}
