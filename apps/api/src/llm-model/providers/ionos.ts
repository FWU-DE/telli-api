import OpenAI from "openai";
import { streamToController } from "../utils";
import {
  CommonLlmProviderStreamParameter,
  CompletionFn,
  CompletionStreamFn,
} from "../types";
import { LlmModel } from "@dgpt/db";

export function constructIonosCompletionStreamFn(
  llmModel: LlmModel,
): CompletionStreamFn {
  if (llmModel.setting.provider !== "ionos" || !llmModel.setting) {
    throw new Error("Invalid model configuration for IONOS");
  }

  const client = new OpenAI({
    apiKey: llmModel.setting.apiKey,
    defaultHeaders: {
      Authorization: `Bearer ${llmModel.setting.apiKey}`,
    },
    baseURL: llmModel.setting.baseUrl,
  });

  return async function getIonosCompletionStream({
    onUsageCallback,
    ...props
  }: Omit<CommonLlmProviderStreamParameter, "model">): Promise<
    ReadableStream<any>
  > {
    const stream = await client.chat.completions.create({
      model: llmModel.id,
      stream: true,
      stream_options: { include_usage: true },
      ...props,
    });

    async function* fetchChunks() {
      for await (const chunk of stream) {
        if (chunk.usage) {
          onUsageCallback(chunk.usage);
        }
        yield JSON.stringify(chunk);
      }
    }

    return new ReadableStream({
      async start(controller) {
        await streamToController(controller, fetchChunks());
      },
    });
  };
}

export function constructIonosCompletionFn(llmModel: LlmModel): CompletionFn {
  if (llmModel.setting.provider !== "ionos" || !llmModel.setting) {
    throw new Error("Invalid model configuration for IONOS");
  }

  const client = new OpenAI({
    apiKey: llmModel.setting.apiKey,
    defaultHeaders: {
      Authorization: `Bearer ${llmModel.setting.apiKey}`,
    },
    baseURL: llmModel.setting.baseUrl,
  });

  return async function getIonosCompletion({
    ...props
  }: Parameters<CompletionFn>[0]): Promise<OpenAI.Chat.Completions.ChatCompletion> {
    const result = await client.chat.completions.create({
      ...props,
    });
    return result;
  };
}
