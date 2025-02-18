import { get_encoding } from "tiktoken";
import { CompletionUsage } from "openai/resources/index.mjs";
import { ChatCompletionMessageParam } from "openai/src/resources/index.js";

const textEncoder = new TextEncoder();

export async function streamToController(
  controller: ReadableStreamDefaultController,
  dataFetcher:
    | AsyncGenerator<Uint8Array | string, void, unknown>
    | AsyncIterable<Uint8Array | string>,
) {
  try {
    for await (const chunk of dataFetcher) {
      if (typeof chunk === "string") {
        controller.enqueue(textEncoder.encode(chunk));
      } else {
        controller.enqueue(chunk);
      }
      controller.enqueue(textEncoder.encode("\n"));
    }
    controller.close();
  } catch (err) {
    console.error("Error during streaming:", err);
    controller.error(err);
  }
}

/**
 * Concatenates the prompt messages and the model’s final answer,
 * then calculates token usage using the tiktoken library.
 * This is a HEURISTIC calculation and only exists due to IONOS
 * not sending a completion usage when requestion chat completion with streams enabled
 *
 * @param messages - An array of ChatMessage objects used as the prompt.
 * @param modelMessage - The final ChatMessage returned by the model.
 * @param model - (Optional) The model name for which to get the encoder.
 *                Defaults to "text-davinci-003".
 * @returns An object containing token counts.
 */
export function calculateCompletionUsage({
  messages,
  modelMessage,
}: {
  messages: ChatCompletionMessageParam[];
  modelMessage: ChatCompletionMessageParam;
}): CompletionUsage {
  const enc = get_encoding("cl100k_base");
  try {
    const promptText = messages.map((msg) => msg.content).join(" ");
    const promptTokens = enc.encode(promptText).length;

    const completionText = modelMessage.content?.toString();
    const completionTokens =
      completionText !== undefined ? enc.encode(completionText).length : 0;

    return {
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: promptTokens + completionTokens,
    };
  } finally {
    // Always free the encoder after using it.
    enc.free();
  }
}
