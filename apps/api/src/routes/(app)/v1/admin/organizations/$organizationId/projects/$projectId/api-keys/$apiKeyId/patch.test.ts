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
import { ORGANIZATION_ID, API_KEY_ID, testOrganziation } from "@test/testData";

// Use a unique project ID to avoid conflicts
const TEST_PROJECT_ID = "f47ac10b-58cc-4372-a567-0e02b2c3d479";

let app: FastifyInstance;

beforeAll(async () => {
  console.log("=== SETUP: Building app ===");
  app = await buildApp();
  
  console.log("=== SETUP: Creating organization ===", ORGANIZATION_ID);
  console.log("Organization data:", JSON.stringify(testOrganziation));
  try {
    const org = await dbCreateOrganization(testOrganziation);
    console.log("Organization created:", org?.id || "success");
  } catch (e) {
    const error = e as Error;
    console.log("Organization creation failed:", error.message);
    
    // Check if it's a duplicate key error (organization already exists)
    if (error.message.includes('duplicate key') || error.message.includes('already exists')) {
      console.log("Organization already exists, continuing...");
    } else {
      console.log("Unknown organization error, this might cause test failure");
      console.log("Full error:", String(e));
    }
  }
  
  console.log("=== SETUP: Creating project ===", TEST_PROJECT_ID);
  try {
    const project = await dbCreateProject({
      id: TEST_PROJECT_ID,
      organizationId: ORGANIZATION_ID,
      name: "Test Project for API Key Patch",
    });
    console.log("Project created:", project?.id || "success");
  } catch (e) {
    const error = e as Error;
    console.log("Project creation failed:", error.message);
    
    if (error.message.includes('duplicate key') || error.message.includes('already exists')) {
      console.log("Project already exists, continuing...");
    } else if (error.message.includes('foreign key') || error.message.includes('organization')) {
      console.log("ERROR: Project creation failed due to missing organization!");
      console.log("This will cause test failure. Organization must exist first.");
      throw e; // Re-throw since this is critical
    } else {
      console.log("Unknown project error:", String(e));
    }
  }
  
  // Verify organization exists before proceeding
  console.log("=== VERIFICATION: Checking organization exists ===");
  try {
    const orgCheckResponse = await app.inject({
      method: "GET",
      url: `/v1/admin/organizations/${ORGANIZATION_ID}`,
      headers: { authorization: "Bearer " + env.apiKey },
    });
    console.log("Organization check status:", orgCheckResponse.statusCode);
    if (orgCheckResponse.statusCode !== 200) {
      console.log("CRITICAL: Organization does not exist, test will fail");
      console.log("Organization check response:", orgCheckResponse.body);
    }
  } catch (e) {
    console.log("Could not verify organization:", String(e));
  }
});

afterAll(async () => {
  console.log("=== TEARDOWN: Cleaning up ===");
  try {
    await dbDeleteOrganizationById(ORGANIZATION_ID);
    console.log("Organization deleted");
  } catch (e) {
    console.log("Organization deletion failed:", String(e));
  }
  await app.close();
});

beforeEach(async () => {
  console.log("=== TEST SETUP: Creating API key ===", API_KEY_ID);
  try {
    const apiKey = await dbCreateJustTheApiKey({
      id: API_KEY_ID,
      name: "Test API Key",
      projectId: TEST_PROJECT_ID,
      state: "active",
      limitInCent: 1000,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    });
    console.log("API key created:", apiKey?.id || "success");
  } catch (e) {
    console.log("API key creation failed:", String(e));
    throw e; // Re-throw since we need this to succeed
  }
});

afterEach(async () => {
  console.log("=== TEST TEARDOWN: Deleting API key ===", API_KEY_ID);
  try {
    await dbDeleteApiKey(API_KEY_ID);
    console.log("API key deleted");
  } catch (e) {
    console.log("API key deletion failed:", String(e));
  }
});

describe("PATCH API Key", () => {
  test("should update multiple API key fields and return 200", async () => {
    // First, let's verify our test data exists by making a GET request
    console.log("=== DEBUG: Checking if data exists ===");
    console.log("Organization ID:", ORGANIZATION_ID);
    console.log("Project ID:", TEST_PROJECT_ID);  
    console.log("API Key ID:", API_KEY_ID);
    console.log("Auth token:", env.apiKey ? "Present" : "Missing");

    // Try to get the API key first to see if it exists
    const getResponse = await app.inject({
      method: "GET",
      url: `/v1/admin/organizations/${ORGANIZATION_ID}/projects/${TEST_PROJECT_ID}/api-keys/${API_KEY_ID}`,
      headers: { authorization: "Bearer " + env.apiKey },
    });
    
    console.log("GET request status:", getResponse.statusCode);
    console.log("GET request body:", getResponse.body);

    // Now try the PATCH request
    const response = await app.inject({
      method: "PATCH",
      url: `/v1/admin/organizations/${ORGANIZATION_ID}/projects/${TEST_PROJECT_ID}/api-keys/${API_KEY_ID}`,
      headers: { authorization: "Bearer " + env.apiKey },
      payload: {
        name: "Updated API Key Name",
        state: "inactive",
        limitInCent: 2500,
      },
    });

    console.log("=== DEBUG: PATCH Response ===");
    console.log("Response status:", response.statusCode);
    console.log("Response headers:", response.headers);
    console.log("Response body:", response.body);

    if (response.statusCode !== 200) {
      console.log("=== FAILURE DEBUG ===");
      console.log("Expected: 200, Got:", response.statusCode);
      try {
        const errorBody = response.json();
        console.log("Error details:", errorBody);
      } catch (e) {
        console.log("Could not parse error response as JSON");
      }
      
      // Let's also check if the organization exists
      const orgResponse = await app.inject({
        method: "GET", 
        url: `/v1/admin/organizations/${ORGANIZATION_ID}`,
        headers: { authorization: "Bearer " + env.apiKey },
      });
      console.log("Organization check status:", orgResponse.statusCode);
      
      // Check if project exists
      const projectResponse = await app.inject({
        method: "GET",
        url: `/v1/admin/organizations/${ORGANIZATION_ID}/projects/${TEST_PROJECT_ID}`,
        headers: { authorization: "Bearer " + env.apiKey },
      });
      console.log("Project check status:", projectResponse.statusCode);
    }

    assert.strictEqual(response.statusCode, 200);

    const body = response.json();
    assert.strictEqual(body.name, "Updated API Key Name");
    assert.strictEqual(body.state, "inactive");
    assert.strictEqual(body.limitInCent, 2500);
    assert.strictEqual(body.id, API_KEY_ID);
    assert.strictEqual(body.projectId, TEST_PROJECT_ID);

    // Verify sensitive fields are not returned
    assert.strictEqual(body.keyId, undefined);
    assert.strictEqual(body.secretHash, undefined);
  });
});
