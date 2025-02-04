import { LlmModel } from "@dgpt/db";
import { getIonosCompletion, getIonosCompletionStream } from "./ionos";
import { CommonLlmProviderStreamParameter } from "../types";
import { getOpenAICompletion, getOpenAICompletionStream } from "./openai";
import OpenAI from "openai";

type CompletionStreamFn = (
  param: CommonLlmProviderStreamParameter,
) => Promise<ReadableStream<any>>;

type CompletionFn = (
  param: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming,
) => Promise<OpenAI.Chat.Completions.ChatCompletion>;

export function getCompletionStreamFnByModel({
  model,
}: {
  model: LlmModel;
}): CompletionStreamFn | undefined {
  if (model.provider === "ionos") {
    return getIonosCompletionStream;
  }
  if (model.provider === "openai") {
    return getOpenAICompletionStream;
  }

  return undefined;
}

export function getCompletionFnByModel({
  model,
}: {
  model: LlmModel;
}): CompletionFn | undefined {
  if (model.provider === "ionos") {
    return getIonosCompletion;
  }
  if (model.provider === "openai") {
    return getOpenAICompletion;
  }

  return undefined;
}
