import OpenAI from "openai";
import {
  ChatCompletionMessageParam,
  CompletionUsage,
} from "openai/resources/index.mjs";

export type CommonLlmProviderStreamParameter = {
  messages: Array<ChatCompletionMessageParam>;
  model: string;
  temperature: number;
  max_tokens: number | undefined | null;
  onUsageCallback(data: CompletionUsage): void;
};

export type CompletionStreamFn = (
  args: CommonLlmProviderStreamParameter,
) => Promise<ReadableStream<any>>;

export type CompletionFn = (args: {
  messages: ChatCompletionMessageParam[];
  model: string;
  temperature: number;
  max_tokens: number | undefined | null;
}) => Promise<OpenAI.Chat.Completions.ChatCompletion>;
