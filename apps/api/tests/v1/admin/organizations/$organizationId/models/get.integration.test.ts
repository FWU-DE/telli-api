import { test, before, after, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import buildApp from "../../../../../src/app"; // Adjust the path to your Fastify app
import { db } from "@dgpt/db"; // Adjust to your database module

let app;

before(async () => {
  app = buildApp();
  await app.ready();
});

after(async () => {
  await app.close();
});

beforeEach(async () => {
  // Set up the database with test data
  await db.query(
    "INSERT INTO organizations (id, name) VALUES ('123', 'Test Organization')",
  );
  await db.query(`
    INSERT INTO models (id, name, organization_id) 
    VALUES 
      ('1', 'Model A', '123'),
      ('2', 'Model B', '123')
  `);
});

afterEach(async () => {
  // Clean up the database
  await db.query("DELETE FROM models WHERE organization_id = '123'");
  await db.query("DELETE FROM organizations WHERE id = '123'");
});

test("GET /v1/admin/organizations/:organizationId/models - should return 200 and a list of models", async () => {
  const response = await app.inject({
    method: "GET",
    url: "/v1/admin/organizations/123/models",
    headers: { "x-api-key": "valid-admin-key" }, // Ensure this key is valid in your app
  });

  assert.strictEqual(response.statusCode, 200);
  assert.deepStrictEqual(response.json(), [
    { id: "1", name: "Model A", organization_id: "123" },
    { id: "2", name: "Model B", organization_id: "123" },
  ]);
});

test("GET /v1/admin/organizations/:organizationId/models - should return 404 for a non-existent organization", async () => {
  const response = await app.inject({
    method: "GET",
    url: "/v1/admin/organizations/999/models",
    headers: { "x-api-key": "valid-admin-key" },
  });

  assert.strictEqual(response.statusCode, 404);
});
