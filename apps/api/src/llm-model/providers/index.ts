import { LlmModel } from "@dgpt/db";
import {
  constructIonosCompletionFn,
  constructIonosCompletionStreamFn,
  constructIonosEmbeddingFn,
  constructIonosImageGenerationFn,
} from "./ionos";
import { CompletionFn, CompletionStreamFn, ImageGenerationFn } from "../types";
import {
  constructOpenAiCompletionFn,
  constructOpenAiCompletionStreamFn,
} from "./openai";
import {
  constructAzureCompletionFn,
  constructAzureCompletionStreamFn,
  constructAzureImageGenerationFn,
} from "./azure";

export function getEmbeddingFnByModel({ model }: { model: LlmModel }) {
  if (model.provider === "ionos") {
    return constructIonosEmbeddingFn(model);
  }
  throw new Error(`Unsupported model provider: ${model.provider}`);
}

export function getCompletionStreamFnByModel({
  model,
}: {
  model: LlmModel;
}): CompletionStreamFn | undefined {
  if (model.provider === "ionos") {
    return constructIonosCompletionStreamFn(model);
  }
  if (model.provider === "openai") {
    return constructOpenAiCompletionStreamFn(model);
  }
  if (model.provider === "azure") {
    return constructAzureCompletionStreamFn(model);
  }

  return undefined;
}

export function getCompletionFnByModel({
  model,
}: {
  model: LlmModel;
}): CompletionFn | undefined {
  if (model.provider === "ionos") {
    return constructIonosCompletionFn(model);
  }
  if (model.provider === "openai") {
    return constructOpenAiCompletionFn(model);
  }

  if (model.provider === "azure") {
    return constructAzureCompletionFn(model);
  }

  return undefined;
}

export function getImageGenerationFnByModel({
  model,
}: {
  model: LlmModel;
}): ImageGenerationFn | undefined {
  if (model.provider === "ionos") {
    return constructIonosImageGenerationFn(model);
  }
  if (model.provider === "azure") {
    return constructAzureImageGenerationFn(model);
  }

  return undefined;
}
