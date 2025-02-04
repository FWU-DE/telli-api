import { LlmModel } from "@dgpt/db";
import {
  constructIonosCompletionFn,
  constructIonosCompletionStreamFn,
} from "./ionos";
import { CompletionFn, CompletionStreamFn } from "../types";
import {
  constructOpenAiCompletionFn,
  constructOpenAiCompletionStreamFn,
} from "./openai";

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

  return undefined;
}
