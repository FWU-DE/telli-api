import { ApiKeyModel, LlmModel } from "@dgpt/db";

// Mock API Key
export const mockApiKey: ApiKeyModel = {
  id: "test-api-key-id",
  projectId: "test-project-id",
  key: "test-api-key",
  name: "Test API Key",
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Mock LLM Models
export const mockModels: LlmModel[] = [
  {
    id: "model-1",
    name: "gpt-4",
    provider: "openai",
    supportsImages: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "model-2", 
    name: "claude-3",
    provider: "anthropic",
    supportsImages: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "model-3",
    name: "llama-2",
    provider: "ionos",
    supportsImages: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Mock completion request
export const mockCompletionRequest = {
  model: "gpt-4",
  messages: [
    {
      role: "user" as const,
      content: "Hello, how are you?",
    },
  ],
  temperature: 0.7,
  max_tokens: 100,
};

// Mock completion response
export const mockCompletionResponse = {
  id: "chatcmpl-test123",
  object: "chat.completion",
  created: Date.now(),
  model: "gpt-4",
  choices: [
    {
      index: 0,
      message: {
        role: "assistant",
        content: "Hello! I'm doing well, thank you for asking.",
      },
      finish_reason: "stop",
    },
  ],
  usage: {
    prompt_tokens: 12,
    completion_tokens: 15,
    total_tokens: 27,
  },
};

// Mock embedding request
export const mockEmbeddingRequest = {
  model: "text-embedding-ada-002",
  input: ["Hello world", "Test embedding"],
};

// Mock embedding response
export const mockEmbeddingResponse = {
  object: "list",
  data: [
    {
      object: "embedding",
      index: 0,
      embedding: new Array(1536).fill(0.1),
    },
    {
      object: "embedding", 
      index: 1,
      embedding: new Array(1536).fill(0.2),
    },
  ],
  model: "text-embedding-ada-002",
  usage: {
    prompt_tokens: 6,
    total_tokens: 6,
  },
};

// Mock database functions
export const mockDbFunctions = {
  dbValidateApiKey: jest.fn(),
  dbGetModelsByApiKeyId: jest.fn(),
  dbCreateCompletionUsage: jest.fn(),
  checkLimitsByApiKeyIdWithResult: jest.fn(),
};

// Mock LLM provider functions
export const mockProviderFunctions = {
  getCompletionFnByModel: jest.fn(),
  getCompletionStreamFnByModel: jest.fn(),
  getEmbeddingFnByModel: jest.fn(),
};