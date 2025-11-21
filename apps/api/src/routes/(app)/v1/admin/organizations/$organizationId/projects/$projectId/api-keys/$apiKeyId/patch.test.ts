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
});