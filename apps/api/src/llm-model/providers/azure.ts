import OpenAI from "openai";
import { streamToController } from "../utils";
import {
  CommonLlmProviderStreamParameter,
  CompletionFn,
  CompletionStreamFn,
  ImageGenerationFn,
} from "../types";
import { LlmModel } from "@dgpt/db";

export function constructAzureCompletionStreamFn(
  model: LlmModel,
): CompletionStreamFn {
  if (model.setting.provider !== "azure") {
    throw new Error("Invalid model configuration for Azure");
  }

  const { basePath, deployment, searchParams } = parseAzureOpenAIUrl({
    baseUrl: model.setting.baseUrl,
  });

  const client = new OpenAI({
    apiKey: model.setting.apiKey,
    defaultHeaders: {
      "api-key": model.setting.apiKey,
    },
    baseURL: basePath,
    defaultQuery: Object.fromEntries(searchParams.entries()),
  });

  return async function getAzureCompletionStream({
    // eslint-disable-next-line no-unused-vars
    model: modelName, // Ignored for Azure
    onUsageCallback,
    ...props
  }: CommonLlmProviderStreamParameter) {
    const stream = await client.chat.completions.create(
      {
        model: deployment, // Use the deployment ID as the model
        stream: true,
        stream_options: {
          include_usage: true,
        },
        ...props,
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
  if (model.setting.provider !== "azure") {
    throw new Error("Invalid model configuration for Azure");
  }

  const { basePath, deployment, searchParams } = parseAzureOpenAIUrl({
    baseUrl: model.setting.baseUrl,
  });

  const client = new OpenAI({
    apiKey: model.setting.apiKey,
    defaultHeaders: {
      "api-key": model.setting.apiKey,
    },
    baseURL: basePath,
    defaultQuery: Object.fromEntries(searchParams.entries()),
  });

  return async function getAzureCompletion({
    // eslint-disable-next-line no-unused-vars
    model: modelName, // Ignored for Azure
    ...props
  }: Parameters<CompletionFn>[0]) {
    const result = await client.chat.completions.create(
      {
        model: deployment, // Use the deployment ID as the model
        ...props,
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
  if (model.setting.provider !== "azure") {
    throw new Error("Invalid model configuration for Azure");
  }

  const { basePath, deployment, searchParams } = parseAzureOpenAIUrl({
    baseUrl: model.setting.baseUrl,
  });

  const client = new OpenAI({
    apiKey: model.setting.apiKey,
    defaultHeaders: {
      "api-key": model.setting.apiKey,
    },
    baseURL: basePath,
    defaultQuery: Object.fromEntries(searchParams.entries()),
  });

  return async function getAzureImageGeneration({
    prompt,
    // eslint-disable-next-line no-unused-vars
    model: modelName, // Ignored for Azure
  }: Parameters<ImageGenerationFn>[0]) {
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
