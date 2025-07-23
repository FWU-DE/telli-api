import OpenAI from "openai";
import { streamToController } from "../utils";
import {
  CommonLlmProviderStreamParameter,
  CompletionFn,
  CompletionStreamFn,
  ImageGenerationFn,
} from "../types";
import { LlmModel } from "@dgpt/db";

function createAzureClient(model: LlmModel): {
  client: OpenAI;
  deployment: string;
} {
  if (model.setting.provider !== "azure") {
    throw new Error("Invalid model configuration for Azure");
  }

  const { basePath, deployment, searchParams } = parseAzureOpenAIUrl({
    baseUrl: model.setting.baseUrl,
  });

  const client = new OpenAI({
    apiKey: model.setting.apiKey,
    baseURL: basePath,
    defaultQuery: Object.fromEntries(searchParams.entries()),
  });

  return { client, deployment };
}

export function constructAzureCompletionStreamFn(
  model: LlmModel,
): CompletionStreamFn {
  const { client, deployment } = createAzureClient(model);

  return async function getAzureCompletionStream({
    onUsageCallback,
    ...props
  }: CommonLlmProviderStreamParameter) {
    const stream = await client.chat.completions.create(
      {
        ...props,
        model: deployment, // Use the deployment ID as the model
        stream: true,
        stream_options: {
          include_usage: true,
        },
      },
      {
        path: `/openai/deployments/${deployment}/chat/completions`,
      },
    );

    async function* fetchChunks() {
      for await (const chunk of stream) {
        const maybeUsage = chunk.usage ?? undefined;
        if (maybeUsage !== undefined) {
          onUsageCallback(maybeUsage);
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

export function constructAzureCompletionFn(model: LlmModel): CompletionFn {
  const { client, deployment } = createAzureClient(model);

  return async function getAzureCompletion({
    ...props
  }: Parameters<CompletionFn>[0]) {
    const result = await client.chat.completions.create(
      {
        ...props,
        model: deployment, // Use the deployment ID as the model
      },
      {
        path: `/openai/deployments/${deployment}/chat/completions`,
      },
    );

    return result;
  };
}

export function constructAzureImageGenerationFn(
  model: LlmModel,
): ImageGenerationFn {
  const { client, deployment } = createAzureClient(model);

  return async function getAzureImageGeneration(
    params: Parameters<ImageGenerationFn>[0],
  ) {
    const { prompt } = params;
    const result = await client.images.generate(
      {
        prompt,
        size: "1024x1024",
        n: 1,
        quality: "standard",
        style: "vivid",
        response_format: "b64_json",
      },
      {
        path: `/openai/deployments/${deployment}/images/generations`,
      },
    );

    return result;
  };
}

function parseAzureOpenAIUrl({ baseUrl }: { baseUrl: string }): {
  basePath: string;
  deployment: string;
  searchParams: URLSearchParams;
} {
  // Extract query parameters if they exist
  const [urlWithoutQuery, ...queryString] = baseUrl.split("?");

  if (urlWithoutQuery === undefined) {
    throw new Error(
      "Invalid Azure baseUrl format. Expected format: https://{endpoint}.openai.azure.com/openai/deployments/{deployment-id}",
    );
  }

  const searchParams = new URLSearchParams(queryString.join("?"));

  const urlParts = urlWithoutQuery.split("/");
  const deploymentIndex = urlParts.findIndex((part) => part === "deployments");

  if (deploymentIndex === -1 || deploymentIndex >= urlParts.length - 1) {
    throw new Error(
      "Invalid Azure baseUrl format. Expected format: https://{endpoint}.openai.azure.com/openai/deployments/{deployment-id}",
    );
  }

  const deployment = urlParts[deploymentIndex + 1];
  if (deployment === undefined) {
    throw new Error(
      "Invalid Azure baseUrl format. Expected format: https://{endpoint}.openai.azure.com/openai/deployments/{deployment-id}",
    );
  }
  const basePath = urlParts.slice(0, deploymentIndex - 1).join("/");

  return { basePath, deployment, searchParams };
}
