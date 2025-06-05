// Mock the database module first before any imports
const mockDbValidateApiKey = jest.fn();
jest.mock("@dgpt/db", () => ({
  dbValidateApiKey: mockDbValidateApiKey,
}));

import { getMaybeBearerToken, validateApiKey } from "../utils";
import { mockApiKey } from "../../__tests__/mocks";
import { createMockReply, createMockRequest } from "../../__tests__/test-utils";

describe("routes/utils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getMaybeBearerToken", () => {
    it("should extract token from valid Bearer header", () => {
      const token = getMaybeBearerToken("Bearer abc123");
      expect(token).toBe("abc123");
    });

    it("should return undefined for undefined header", () => {
      const token = getMaybeBearerToken(undefined);
      expect(token).toBeUndefined();
    });

    it("should return undefined for non-Bearer header", () => {
      const token = getMaybeBearerToken("Basic abc123");
      expect(token).toBeUndefined();
    });

    it("should handle Bearer with no token", () => {
      const token = getMaybeBearerToken("Bearer ");
      expect(token).toBe("");
    });

    it("should handle Bearer with spaces in token", () => {
      const token = getMaybeBearerToken("Bearer abc 123");
      expect(token).toBe("abc 123");
    });
  });

  describe("validateApiKey", () => {
    it("should return api key for valid authorization", async () => {
      mockDbValidateApiKey.mockResolvedValueOnce({
        valid: true,
        apiKey: mockApiKey,
      });

      const request = createMockRequest({}, { authorization: "Bearer valid-key" });
      const reply = createMockReply();

      const result = await validateApiKey(request as any, reply as any);

      expect(result).toEqual(mockApiKey);
      expect(mockDbValidateApiKey).toHaveBeenCalledWith("valid-key");
      expect(reply.status).not.toHaveBeenCalled();
      expect(reply.send).not.toHaveBeenCalled();
    });

    it("should return undefined and send 401 for missing authorization header", async () => {
      const request = createMockRequest({}, {});
      const reply = createMockReply();

      const result = await validateApiKey(request as any, reply as any);

      expect(result).toBeUndefined();
      expect(reply.status).toHaveBeenCalledWith(401);
      expect(reply.send).toHaveBeenCalledWith({ error: "No Bearer token found." });
      expect(mockDbValidateApiKey).not.toHaveBeenCalled();
    });

    it("should return undefined and send 401 for malformed authorization header", async () => {
      const request = createMockRequest({}, { authorization: "Basic invalid" });
      const reply = createMockReply();

      const result = await validateApiKey(request as any, reply as any);

      expect(result).toBeUndefined();
      expect(reply.status).toHaveBeenCalledWith(401);
      expect(reply.send).toHaveBeenCalledWith({ error: "No Bearer token found." });
      expect(mockDbValidateApiKey).not.toHaveBeenCalled();
    });

    it("should return undefined and send 403 for invalid api key", async () => {
      mockDbValidateApiKey.mockResolvedValueOnce({
        valid: false,
        reason: "API key not found",
      });

      const request = createMockRequest({}, { authorization: "Bearer invalid-key" });
      const reply = createMockReply();

      const result = await validateApiKey(request as any, reply as any);

      expect(result).toBeUndefined();
      expect(reply.status).toHaveBeenCalledWith(403);
      expect(reply.send).toHaveBeenCalledWith({ error: "API key not found" });
      expect(mockDbValidateApiKey).toHaveBeenCalledWith("invalid-key");
    });

    it("should return undefined and send 403 for expired api key", async () => {
      mockDbValidateApiKey.mockResolvedValueOnce({
        valid: false,
        reason: "API key expired",
      });

      const request = createMockRequest({}, { authorization: "Bearer expired-key" });
      const reply = createMockReply();

      const result = await validateApiKey(request as any, reply as any);

      expect(result).toBeUndefined();
      expect(reply.status).toHaveBeenCalledWith(403);
      expect(reply.send).toHaveBeenCalledWith({ error: "API key expired" });
      expect(mockDbValidateApiKey).toHaveBeenCalledWith("expired-key");
    });
  });
});