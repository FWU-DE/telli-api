import assert from "node:assert";
import buildApp from "@/app";
import { afterAll, beforeAll, describe, test } from "vitest";
import { FastifyInstance, HTTPMethods } from "fastify";

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildApp();
});

afterAll(async () => {
  await app.close();
});

describe.each([
  { method: "GET", url: "/v1/admin/organizations" },
  { method: "GET", url: "/v1/admin/organizations/123" },
  { method: "GET", url: "/v1/admin/organizations/123/models" },
  { method: "POST", url: "/v1/admin/organizations/123/models" },
  { method: "GET", url: "/v1/admin/organizations/123/models/123" },
  { method: "PATCH", url: "/v1/admin/organizations/123/models/123" },
  { method: "DELETE", url: "/v1/admin/organizations/123/models/123" },
  { method: "GET", url: "/v1/admin/organizations/123/projects" },
  { method: "POST", url: "/v1/admin/organizations/123/projects" },
  { method: "GET", url: "/v1/admin/organizations/123/projects/123" },
  { method: "PUT", url: "/v1/admin/organizations/123/projects/123" },
  { method: "GET", url: "/v1/admin/organizations/123/projects/123/api-keys" },
  { method: "POST", url: "/v1/admin/organizations/123/projects/123/api-keys" },
  {
    method: "GET",
    url: "/v1/admin/organizations/123/projects/123/api-keys/123",
  },
  {
    method: "DELETE",
    url: "/v1/admin/organizations/123/projects/123/api-keys/123",
  },
  {
    method: "GET",
    url: "/v1/admin/organizations/123/projects/123/api-keys/123/model-mappings",
  },
  {
    method: "PUT",
    url: "/v1/admin/organizations/123/projects/123/api-keys/123/model-mappings",
  },
])(
  "testing $method $url",
  ({ method, url }: { method: HTTPMethods; url: string }) => {
    test("should return 401 when no authorization header is provided", async () => {
      const response = await (app.inject({
        method: method as any,
        url,
        headers: {},
      }) as Promise<any>);

      assert.strictEqual(response.statusCode, 401);

      const responseBody = response.json();
      assert.strictEqual(responseBody.error, "No Bearer token found.");
    });

    test("should return 401 when Bearer token is empty", async () => {
      const response = await (app.inject({
        method: method as any,
        url,
        headers: { authorization: "Bearer " },
      }) as Promise<any>);

      assert.strictEqual(response.statusCode, 401);

      const responseBody = response.json();
      assert.strictEqual(responseBody.error, "No Bearer token found.");
    });

    test("should return 401 when API key is invalid", async () => {
      const response = await (app.inject({
        method: method as any,
        url,
        headers: { authorization: "Bearer invalid-api-key" },
      }) as Promise<any>);

      assert.strictEqual(response.statusCode, 401);

      const responseBody = response.json();
      assert.strictEqual(responseBody.error, "Api key is not valid");
    });
  },
);
