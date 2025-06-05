import { createTestApp } from "./test-utils";

// Mock Sentry to avoid instrumentation issues in tests
jest.mock("@sentry/node", () => ({
  setupFastifyErrorHandler: jest.fn(),
}));

// Mock all database functions
jest.mock("@dgpt/db", () => ({
  dbValidateApiKey: jest.fn(),
  dbGetModelsByApiKeyId: jest.fn(),
  dbCreateCompletionUsage: jest.fn(),
  checkLimitsByApiKeyIdWithResult: jest.fn(),
}));

// Mock LLM providers
jest.mock("../llm-model/providers", () => ({
  getCompletionFnByModel: jest.fn(),
  getCompletionStreamFnByModel: jest.fn(),
  getEmbeddingFnByModel: jest.fn(),
}));

describe("API Integration Tests", () => {
  let app: any;

  beforeAll(async () => {
    app = createTestApp();
    await app.ready();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe("Health Check", () => {
    it("GET /health should return OK", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/health",
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual({ message: "Ok" });
    });
  });

  describe("Error Endpoint", () => {
    it("GET /error should throw test error", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/error",
      });

      expect(response.statusCode).toBe(500);
    });
  });

  describe("Unknown Routes", () => {
    it("should handle unknown routes", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/unknown-route",
      });

      expect(response.statusCode).toBe(404);
    });
  });
});