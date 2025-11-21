// patch.test.ts
import assert from "node:assert";
import buildApp from "@/app";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  test,
  describe,
} from "vitest";
import { FastifyInstance } from "fastify";
import {
  dbCreateOrganization,
  dbDeleteOrganizationById,
  dbCreateProject,
  dbCreateJustTheApiKey,
  dbDeleteApiKey,
} from "@dgpt/db";
import { env } from "@/env";
import {
  ORGANIZATION_ID,
  PROJECT_ID,
  API_KEY_ID,
  NON_EXISTING_API_KEY_ID,
  testOrganziation,
  testProject,
} from "@test/testData";

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildApp();
  await dbCreateOrganization(testOrganziation);
  await dbCreateProject(testProject);
});

afterAll(async () => {
  await dbDeleteOrganizationById(ORGANIZATION_ID);
  await app.close();
});

beforeEach(async () => {
  await dbCreateJustTheApiKey({
    id: API_KEY_ID,
    name: "Test API Key",
    projectId: PROJECT_ID,
    state: "active",
    limitInCent: 1000,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  });
});

afterEach(async () => {
  await dbDeleteApiKey(API_KEY_ID);
});

describe("PATCH API Key", () => {
  test("should update API key name and return 200", async () => {
    const response = await app.inject({
      method: "PATCH",
      url: `/v1/admin/organizations/${ORGANIZATION_ID}/projects/${PROJECT_ID}/api-keys/${API_KEY_ID}`,
      headers: { authorization: "Bearer " + env.apiKey },
      payload: {
        name: "Updated API Key Name",
      },
    });

    assert.strictEqual(response.statusCode, 200);
    const body = response.json();
    assert.strictEqual(body.name, "Updated API Key Name");
    assert.strictEqual(body.id, API_KEY_ID);
    assert.strictEqual(body.projectId, PROJECT_ID);
  });

  test("should update API key state and return 200", async () => {
    const response = await app.inject({
      method: "PATCH",
      url: `/v1/admin/organizations/${ORGANIZATION_ID}/projects/${PROJECT_ID}/api-keys/${API_KEY_ID}`,
      headers: { authorization: "Bearer " + env.apiKey },
      payload: {
        state: "inactive",
      },
    });

    assert.strictEqual(response.statusCode, 200);
    const body = response.json();
    assert.strictEqual(body.state, "inactive");
    assert.strictEqual(body.id, API_KEY_ID);
  });

  test("should update API key limit and return 200", async () => {
    const response = await app.inject({
      method: "PATCH",
      url: `/v1/admin/organizations/${ORGANIZATION_ID}/projects/${PROJECT_ID}/api-keys/${API_KEY_ID}`,
      headers: { authorization: "Bearer " + env.apiKey },
      payload: {
        limitInCent: 5000,
      },
    });

    assert.strictEqual(response.statusCode, 200);
    const body = response.json();
    assert.strictEqual(body.limitInCent, 5000);
    assert.strictEqual(body.id, API_KEY_ID);
  });

  test("should update API key expiration and return 200", async () => {
    const newExpirationDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // 60 days from now
    const response = await app.inject({
      method: "PATCH",
      url: `/v1/admin/organizations/${ORGANIZATION_ID}/projects/${PROJECT_ID}/api-keys/${API_KEY_ID}`,
      headers: { authorization: "Bearer " + env.apiKey },
      payload: {
        expiresAt: newExpirationDate.toISOString(),
      },
    });

    assert.strictEqual(response.statusCode, 200);
    const body = response.json();
    assert.strictEqual(new Date(body.expiresAt).getTime(), newExpirationDate.getTime());
    assert.strictEqual(body.id, API_KEY_ID);
  });

  test("should update multiple fields at once and return 200", async () => {
    const newExpirationDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days from now
    const response = await app.inject({
      method: "PATCH",
      url: `/v1/admin/organizations/${ORGANIZATION_ID}/projects/${PROJECT_ID}/api-keys/${API_KEY_ID}`,
      headers: { authorization: "Bearer " + env.apiKey },
      payload: {
        name: "Updated Multi-Field API Key",
        state: "inactive",
        limitInCent: 7500,
        expiresAt: newExpirationDate.toISOString(),
      },
    });

    assert.strictEqual(response.statusCode, 200);
    const body = response.json();
    assert.strictEqual(body.name, "Updated Multi-Field API Key");
    assert.strictEqual(body.state, "inactive");
    assert.strictEqual(body.limitInCent, 7500);
    assert.strictEqual(new Date(body.expiresAt).getTime(), newExpirationDate.getTime());
    assert.strictEqual(body.id, API_KEY_ID);
  });

  test("should set expiresAt to null and return 200", async () => {
    const response = await app.inject({
      method: "PATCH",
      url: `/v1/admin/organizations/${ORGANIZATION_ID}/projects/${PROJECT_ID}/api-keys/${API_KEY_ID}`,
      headers: { authorization: "Bearer " + env.apiKey },
      payload: {
        expiresAt: null,
      },
    });

    assert.strictEqual(response.statusCode, 200);
    const body = response.json();
    assert.strictEqual(body.expiresAt, null);
    assert.strictEqual(body.id, API_KEY_ID);
  });

  test("should return 400 for malformed API key ID", async () => {
    const response = await app.inject({
      method: "PATCH",
      url: `/v1/admin/organizations/${ORGANIZATION_ID}/projects/${PROJECT_ID}/api-keys/invalid-id`,
      headers: { authorization: "Bearer " + env.apiKey },
      payload: { name: "Test" },
    });

    assert.strictEqual(response.statusCode, 400);
    assert.ok(response.json().error);
  });

  test("should return 400 for missing body", async () => {
    const response = await app.inject({
      method: "PATCH",
      url: `/v1/admin/organizations/${ORGANIZATION_ID}/projects/${PROJECT_ID}/api-keys/${API_KEY_ID}`,
      headers: { authorization: "Bearer " + env.apiKey },
    });

    assert.strictEqual(response.statusCode, 400);
    assert.ok(response.json().error);
  });

  test("should return 400 for Zod validation error", async () => {
    const response = await app.inject({
      method: "PATCH",
      url: `/v1/admin/organizations/${ORGANIZATION_ID}/projects/${PROJECT_ID}/api-keys/${API_KEY_ID}`,
      headers: { authorization: "Bearer " + env.apiKey },
      payload: {
        name: 123, // wrong type
      },
    });

    assert.strictEqual(response.statusCode, 400);
    assert.ok(response.json().error);
  });

  test("should return 400 for invalid state value", async () => {
    const response = await app.inject({
      method: "PATCH",
      url: `/v1/admin/organizations/${ORGANIZATION_ID}/projects/${PROJECT_ID}/api-keys/${API_KEY_ID}`,
      headers: { authorization: "Bearer " + env.apiKey },
      payload: {
        state: "invalid-state",
      },
    });

    assert.strictEqual(response.statusCode, 400);
    assert.ok(response.json().error);
  });

  test("should return 400 for invalid limitInCent value", async () => {
    const response = await app.inject({
      method: "PATCH",
      url: `/v1/admin/organizations/${ORGANIZATION_ID}/projects/${PROJECT_ID}/api-keys/${API_KEY_ID}`,
      headers: { authorization: "Bearer " + env.apiKey },
      payload: {
        limitInCent: "invalid-number",
      },
    });

    assert.strictEqual(response.statusCode, 400);
    assert.ok(response.json().error);
  });

  test("should return 404 for non-existent API key", async () => {
    const response = await app.inject({
      method: "PATCH",
      url: `/v1/admin/organizations/${ORGANIZATION_ID}/projects/${PROJECT_ID}/api-keys/${NON_EXISTING_API_KEY_ID}`,
      headers: { authorization: "Bearer " + env.apiKey },
      payload: {
        name: "Doesn't matter",
      },
    });

    assert.strictEqual(response.statusCode, 404);
    assert.ok(response.json().error);
  });

  test("should return 400 for malformed organization ID", async () => {
    const response = await app.inject({
      method: "PATCH",
      url: `/v1/admin/organizations/invalid-org-id/projects/${PROJECT_ID}/api-keys/${API_KEY_ID}`,
      headers: { authorization: "Bearer " + env.apiKey },
      payload: { name: "Test" },
    });

    assert.strictEqual(response.statusCode, 400);
    assert.ok(response.json().error);
  });

  test("should return 400 for malformed project ID", async () => {
    const response = await app.inject({
      method: "PATCH",
      url: `/v1/admin/organizations/${ORGANIZATION_ID}/projects/invalid-project-id/api-keys/${API_KEY_ID}`,
      headers: { authorization: "Bearer " + env.apiKey },
      payload: { name: "Test" },
    });

    assert.strictEqual(response.statusCode, 400);
    assert.ok(response.json().error);
  });
});