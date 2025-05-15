import OpenAI from "openai";
import { streamToController } from "../utils";
import {
  CommonLlmProviderStreamParameter,
  CompletionFn,
  CompletionStreamFn,
  EmbeddingFn,
} from "../types";
import { LlmModel } from "@dgpt/db";
import { calculateCompletionUsage } from "../utils";
import { CompletionUsage } from "openai/resources/completions.mjs";

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
    messages,
    ...props
  }: Omit<CommonLlmProviderStreamParameter, "model">): Promise<
    ReadableStream<any>
  > {
    const stream = await client.chat.completions.create({
      model: llmModel.id,
      messages,
      stream: true,
      stream_options: { include_usage: true },
      ...props,
    });

    async function* fetchChunks() {
      let content = "";
      let firstChunk: OpenAI.Chat.Completions.ChatCompletionChunk | null = null;
      for await (const chunk of stream) {
        if (firstChunk === null) {
          firstChunk = chunk;
        }
        const maybeContent = chunk.choices[0]?.delta.content;
        if (maybeContent) {
          content += maybeContent;
        }
        yield JSON.stringify(chunk);
      }
      // calculate the token usage manually as ionos does not return it
      const usage = calculateCompletionUsage({
        messages,
        modelMessage: { role: "assistant", content },
      });
      onUsageCallback(usage);
      // we need to manually construct an openai compatible chunk which includes the usage
      if (firstChunk !== null) {
        yield JSON.stringify({
          id: firstChunk.id,
          model: firstChunk.model,
          created: firstChunk.created,
          choices: [],
          object: firstChunk.object,
          usage,
        });
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

export function constructIonosEmbeddingFn(llmModel: LlmModel) {
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

  return async function getIonosEmbedding({
    input,
    model,
  }: Parameters<EmbeddingFn>[0]): Promise<{
    embedding: OpenAI.Embeddings.Embedding;
    usage: CompletionUsage;
  }> {
    const result = await client.embeddings.create({ input, model });
    return {
      embedding: {
        embedding: result.data[0]?.embedding ?? [],
        object: "embedding",
        index: result.data[0]?.index ?? 0,
      },
      usage: {
        prompt_tokens: result.usage.prompt_tokens,
        completion_tokens: 0,
        total_tokens: result.usage.total_tokens,
      },
    };
  };
}
