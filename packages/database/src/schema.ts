import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  doublePrecision,
} from "drizzle-orm/pg-core";
import { Budget, LlmModelPriceMetadata } from "./types";
import { json } from "drizzle-orm/pg-core";
import z from "zod";
import { LlmModelProviderSettings } from "@dgpt/llm-model";
import { boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";

export const organizationTable = pgTable("organization", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
});
export type OrganizationInsertModel = typeof organizationTable.$inferInsert;
export type OrganizationModel = typeof organizationTable.$inferSelect;

export const projectTable = pgTable("project", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  limitInCent: integer("limit_in_cent").notNull().default(0),
  previousBudgets: json().$type<Budget[]>().notNull().default([]),
  organizationId: uuid("organization_id").notNull(),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
});
export type ProjectInsertModel = typeof projectTable.$inferInsert;
export type ProjectModel = typeof projectTable.$inferSelect;

export const llmModelTable = pgTable("llm_model", {
  id: uuid("id").primaryKey().defaultRandom(),
  provider: text("provider").notNull(),
  name: text("name").notNull(),
  displayName: text("display_name").notNull(),
  description: text("description").notNull().default(""),
  setting: json("settings").$type<LlmModelProviderSettings>().notNull(),
  priceMetadata: json("price_metada").$type<LlmModelPriceMetadata>().notNull(),
  organizationId: uuid("organization_id")
    .references(() => organizationTable.id)
    .notNull(),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
  supportedImageFormats: json("supported_image_formats")
    .$type<string[]>()
    .notNull()
    .default([]),
  additionalParameters: json("additional_parameters")
    .$type<Record<string, any>>()
    .notNull()
    .default({}),
  isNew: boolean("is_new").notNull().default(false),
  isDeleted: boolean("is_deleted").notNull().default(false),
});
export const llmInsertModelSchema = createInsertSchema(llmModelTable);
export const llmUpdateModelSchema = createUpdateSchema(llmModelTable).omit({
  id: true,
  organizationId: true,
  createdAt: true,
});
export type LlmInsertModel = typeof llmModelTable.$inferInsert;
export type LlmModel = typeof llmModelTable.$inferSelect;

export const apiKeyStateSchema = z.enum(["active", "inactive", "deleted"]);
export const apiKeyStateEnum = pgEnum(
  "api_key_state",
  apiKeyStateSchema.options,
);
export type ApiKeyState = z.infer<typeof apiKeyStateSchema>;

export const apiKeyTable = pgTable("api_key", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  keyId: text("key_id").notNull(),
  secretHash: text("secret_hash").notNull(),
  projectId: text("project_id")
    .notNull()
    .references(() => projectTable.id),
  state: apiKeyStateEnum("state").notNull().default("active"),
  limitInCent: integer("limit_in_cent").notNull().default(0),
  previousBudgets: json().$type<Budget[]>().notNull().default([]),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
  expiresAt: timestamp("expiresAt", { mode: "date" }),
});
export type ApiKeyInsertModel = typeof apiKeyTable.$inferInsert;
export type ApiKeyModel = typeof apiKeyTable.$inferSelect;

export const llmModelApiKeyMappingTable = pgTable("llm_model_api_key_mapping", {
  id: uuid("id").primaryKey().defaultRandom(),
  llmModelId: uuid("llm_model_id")
    .notNull()
    .references(() => llmModelTable.id),
  apiKeyId: uuid("api_key_id")
    .notNull()
    .references(() => apiKeyTable.id),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type LlmModelApiKeyMappingModel =
  typeof llmModelApiKeyMappingTable.$inferSelect;

export const completionUsageTrackingTable = pgTable(
  "completion_usage_tracking",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    completionTokens: integer("completion_tokens").notNull(),
    promptTokens: integer("prompt_tokens").notNull(),
    totalTokens: integer("total_tokens").notNull(),
    costsInCent: doublePrecision("costs_in_cent").notNull().default(0),
    modelId: uuid("model_id")
      .references(() => llmModelTable.id)
      .notNull(),
    apiKeyId: uuid("api_key_id")
      .notNull()
      .references(() => apiKeyTable.id),
    // this violates the norm of database tables, but is used to have one less join
    projectId: text("project_id")
      .notNull()
      .references(() => projectTable.id),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
);
export type CompletionUsageInsertModel =
  typeof completionUsageTrackingTable.$inferInsert;
export type CompletionUsageModel =
  typeof completionUsageTrackingTable.$inferSelect;

export const imageGenerationUsageTrackingTable = pgTable(
  "image_generation_usage_tracking",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    numberOfImages: integer("number_of_images").notNull(),
    costsInCent: doublePrecision("costs_in_cent").notNull().default(0),
    modelId: uuid("model_id")
      .references(() => llmModelTable.id)
      .notNull(),
    apiKeyId: uuid("api_key_id")
      .notNull()
      .references(() => apiKeyTable.id),
    // this violates the norm of database tables, but is used to have one less join
    projectId: text("project_id")
      .notNull()
      .references(() => projectTable.id),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
);
export type ImageGenerationUsageInsertModel =
  typeof imageGenerationUsageTrackingTable.$inferInsert;
export type ImageGenerationUsageModel =
  typeof imageGenerationUsageTrackingTable.$inferSelect;

export const adminTable = pgTable("admin", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
});
export type AdminInsertModel = typeof completionUsageTrackingTable.$inferInsert;
export type AdminModel = typeof completionUsageTrackingTable.$inferSelect;
