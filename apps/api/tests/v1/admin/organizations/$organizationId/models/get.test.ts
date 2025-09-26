import assert from "node:assert";
import buildApp from "../../../../../../src/app";

import { afterAll, afterEach, beforeAll, beforeEach, test } from "vitest";
import { FastifyInstance } from "fastify";
import { dbCreateOrganization, dbDeleteOrganizationById } from "@dgpt/db";
import { env } from "@/env";
import { describe } from "node:test";

const ORGANIZATION_ID = "42804694-e1f6-45d7-b8aa-0e08c746a888";
const NON_EXISTING_ORGANIZATION_ID = "11111111-2222-3333-4444-555555555555";
let app: FastifyInstance;

beforeAll(() => {
  app = buildApp();
});

afterAll(async () => {
  await app.close();
});

beforeEach(async () => {
  // Setup database
  await dbCreateOrganization({
    id: ORGANIZATION_ID,
    name: "Test Organization",
  });
});

afterEach(async () => {
  // Clean up database
  await dbDeleteOrganizationById(ORGANIZATION_ID);
});

describe("GET LLMs by organization", () => {
  test("should return 200 and a list of models", async () => {
    const response = await app.inject({
      method: "GET",
      url: `/v1/admin/organizations/${ORGANIZATION_ID}/models`,
      headers: { authorization: "Bearer " + env.apiKey },
    });

    assert.strictEqual(response.statusCode, 200);
  });

  test("should return empty array for a non-existent organization", async () => {
    const response = await app.inject({
      method: "GET",
      url: `/v1/admin/organizations/${NON_EXISTING_ORGANIZATION_ID}/models`,
      headers: { authorization: "Bearer " + env.apiKey },
    });

    assert.strictEqual(response.statusCode, 200);
    assert.deepStrictEqual(response.json(), []);
  });

  test("should return 400 for malformed organizationId", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/v1/admin/organizations/999/models",
      headers: { authorization: "Bearer " + env.apiKey },
    });

    assert.strictEqual(response.statusCode, 400);
  });

  test("should return 401 for invalid or missing api key", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/v1/admin/organizations/999/models",
      headers: {},
    });

    assert.strictEqual(response.statusCode, 401);
  });
});
