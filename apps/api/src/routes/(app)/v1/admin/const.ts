import { handler as v1_admin_organizations_getHandler } from "./organizations/get";
import { handler as v1_admin_apiKey_postHandler } from "./api-key/post";
import { handler as v1_admin_organizations_$organizationId_$projectId_getHandler } from "./organizations/$organizationId/$projectId/get";
import { handler as v1_admin_organizations_$organizationId_getHandler } from "./organizations/$organizationId/get";
import { handler as v1_admin_model_originalPostHandler } from "./models/post";
import { handler as v1_admin_model_getAllHandler } from "./organizations/$organizationId/models/get";
import { handler as v1_admin_model_postHandler } from "./organizations/$organizationId/models/post";
import { handler as v1_admin_model_getByIdHandler } from "./organizations/$organizationId/models/$id/get";
import { handler as v1_admin_model_patchByIdHandler } from "./organizations/$organizationId/models/$id/patch";
import { handler as v1_admin_model_deleteByIdHandler } from "./organizations/$organizationId/models/$id/delete";
import { handler as v1_admin_organizations_$organizationId_projects_$projectId_apiKeys_postHandler } from "./organizations/$organizationId/projects/$projectId/api-keys/post";

import { RouteHandlerDefinition } from "@/handlers";

export const adminRouteHandlerDefinitions: Array<RouteHandlerDefinition> = [
  {
    path: "/v1/admin/organizations",
    method: "GET",
    schema: { hide: true },
    handler: v1_admin_organizations_getHandler,
  },
  {
    path: "/v1/admin/organizations/:organizationId",
    method: "GET",
    schema: { hide: true },
    handler: v1_admin_organizations_$organizationId_getHandler,
  },
  {
    path: "/v1/admin/organizations/:organizationId/:projectId",
    method: "GET",
    schema: { hide: true },
    handler: v1_admin_organizations_$organizationId_$projectId_getHandler,
  },
  {
    path: "/v1/admin/api-key",
    method: "POST",
    schema: { hide: true },
    handler: v1_admin_apiKey_postHandler,
  },
  {
    path: "/v1/admin/models",
    method: "POST",
    schema: { hide: true },
    handler: v1_admin_model_originalPostHandler,
  },
  {
    path: "/v1/admin/organizations/:organizationId/models",
    method: "POST",
    schema: { hide: true },
    handler: v1_admin_model_postHandler,
  },
  {
    path: "/v1/admin/organizations/:organizationId/models",
    method: "GET",
    schema: { hide: true },
    handler: v1_admin_model_getAllHandler,
  },
  {
    path: "/v1/admin/organizations/:organizationId/models/:id",
    method: "GET",
    schema: { hide: true },
    handler: v1_admin_model_getByIdHandler,
  },
  {
    path: "/v1/admin/organizations/:organizationId/models/:id",
    method: "PATCH",
    schema: { hide: true },
    handler: v1_admin_model_patchByIdHandler,
  },
  {
    path: "/v1/admin/organizations/:organizationId/models/:id",
    method: "DELETE",
    schema: { hide: true },
    handler: v1_admin_model_deleteByIdHandler,
  },
  {
    path: "/v1/admin/organizations/:organizationId/projects/:projectId/api-keys",
    method: "POST",
    schema: { hide: true },
    handler:
      v1_admin_organizations_$organizationId_projects_$projectId_apiKeys_postHandler,
  },
];
