/**
 * Script to calculate and update costs for existing usage records
 * This script should be run after adding the costs_in_cent column to both tables
 */

import { db } from "../index";
import {
  completionUsageTrackingTable,
  imageGenerationUsageTrackingTable,
  llmModelTable,
} from "../schema";
import { eq, isNull, or } from "drizzle-orm";
import {
  calculatePriceInCentByTextModelAndUsage,
  calculatePriceInCentByImageModelAndUsage,
  calculatePriceInCentByEmbeddingModelAndUsage,
} from "@dgpt/llm-model";

async function updateCompletionUsageCosts() {
  console.log("Starting completion usage cost updates...");

  // Get all completion usage records without costs calculated (costs_in_cent = 0 or null)
  const completionUsages = await db
    .select()
    .from(completionUsageTrackingTable)
    .where(
      or(
        eq(completionUsageTrackingTable.costsInCent, 0),
        isNull(completionUsageTrackingTable.costsInCent),
      ),
    );

  console.log(
    `Found ${completionUsages.length} completion usage records to update`,
  );

  // Get all unique model IDs
  const modelIds = [...new Set(completionUsages.map((usage) => usage.modelId))];

  // Create a map for quick model lookup
  const modelMap = new Map();
  for (const modelId of modelIds) {
    const modelResult = await db
      .select()
      .from(llmModelTable)
      .where(eq(llmModelTable.id, modelId))
      .limit(1);

    if (modelResult.length > 0) {
      modelMap.set(modelId, modelResult[0]);
    }
  }

  let updatedCount = 0;

  for (const usage of completionUsages) {
    const model = modelMap.get(usage.modelId);

    if (!model) {
      console.warn(`Model not found for usage ${usage.id}: ${usage.modelId}`);
      continue;
    }

    let costsInCent = 0;

    if (model.priceMetadata.type === "text") {
      costsInCent = calculatePriceInCentByTextModelAndUsage({
        priceMetadata: model.priceMetadata,
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
      });
    } else if (model.priceMetadata.type === "embedding") {
      costsInCent = calculatePriceInCentByEmbeddingModelAndUsage({
        priceMetadata: model.priceMetadata,
        promptTokens: usage.promptTokens,
      });
    } else {
      console.warn(
        `Unexpected model type for completion usage ${usage.id}: ${model.priceMetadata.type}`,
      );
      continue;
    }

    // Update the record with calculated costs
    await db
      .update(completionUsageTrackingTable)
      .set({ costsInCent })
      .where(eq(completionUsageTrackingTable.id, usage.id));

    updatedCount++;

    if (updatedCount % 100 === 0) {
      console.log(`Updated ${updatedCount} completion usage records...`);
    }
  }

  console.log(`Completed updating ${updatedCount} completion usage records`);
}

async function updateImageGenerationUsageCosts() {
  console.log("Starting image generation usage cost updates...");

  // Get all image generation usage records without costs calculated
  const imageUsages = await db
    .select()
    .from(imageGenerationUsageTrackingTable)
    .where(
      or(
        eq(imageGenerationUsageTrackingTable.costsInCent, 0),
        isNull(imageGenerationUsageTrackingTable.costsInCent),
      ),
    );

  console.log(
    `Found ${imageUsages.length} image generation usage records to update`,
  );

  // Get all unique model IDs
  const modelIds = [...new Set(imageUsages.map((usage) => usage.modelId))];

  // Create a map for quick model lookup
  const modelMap = new Map();
  for (const modelId of modelIds) {
    const modelResult = await db
      .select()
      .from(llmModelTable)
      .where(eq(llmModelTable.id, modelId))
      .limit(1);

    if (modelResult.length > 0) {
      modelMap.set(modelId, modelResult[0]);
    }
  }

  let updatedCount = 0;

  for (const usage of imageUsages) {
    const model = modelMap.get(usage.modelId);

    if (!model) {
      console.warn(`Model not found for usage ${usage.id}: ${usage.modelId}`);
      continue;
    }

    let costsInCent = 0;

    if (model.priceMetadata.type === "image") {
      costsInCent = calculatePriceInCentByImageModelAndUsage({
        priceMetadata: model.priceMetadata,
        numberOfImages: usage.numberOfImages,
      });
    } else {
      console.warn(
        `Unexpected model type for image usage ${usage.id}: ${model.priceMetadata.type}`,
      );
      continue;
    }

    // Update the record with calculated costs
    await db
      .update(imageGenerationUsageTrackingTable)
      .set({ costsInCent })
      .where(eq(imageGenerationUsageTrackingTable.id, usage.id));

    updatedCount++;

    if (updatedCount % 100 === 0) {
      console.log(`Updated ${updatedCount} image generation usage records...`);
    }
  }

  console.log(
    `Completed updating ${updatedCount} image generation usage records`,
  );
}

async function main() {
  try {
    console.log("Starting cost calculation for existing usage records...");

    await updateCompletionUsageCosts();
    await updateImageGenerationUsageCosts();

    console.log("Cost calculation completed successfully!");
  } catch (error) {
    console.error("Error during cost calculation:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

main();
