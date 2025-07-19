import { db } from "..";
import {
  ImageGenerationUsageInsertModel,
  imageGenerationUsageTrackingTable,
} from "../schema";

export async function dbCreateImageGenerationUsage(
  imageGenerationUsage: ImageGenerationUsageInsertModel,
) {
  const insertedImageGenerationUsage = (
    await db
      .insert(imageGenerationUsageTrackingTable)
      .values(imageGenerationUsage)
      .returning()
  )[0];

  return insertedImageGenerationUsage;
}
