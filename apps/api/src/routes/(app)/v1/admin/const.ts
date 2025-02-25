import { handler as v1_admin_organizations_getHandler } from "./organizations/get";
import { handler as v1_admin_apiKey_postHandler } from "./api-key/post";
import { handler as v1_admin_organizations_$organizationId_$projectId_getHandler } from "./organizations/$organizationId/$projectId/get";
import { handler as v1_admin_organizations_$organizationId_getHandler } from "./organizations/$organizationId/get";
import { handler as v1_admin_organization_$organizationId_report_getHandler } from "./organizations/$organizationId/report/get";
import { RouteHandlerDefinition } from "@/handlers";

export const adminRouteHandlerDefinitions: Array<RouteHandlerDefinition> = [
  {
    path: "/v1/admin/organizations",
    method: "GET",
    handler: v1_admin_organizations_getHandler,
  },
  {
    path: "/v1/admin/organizations/:organizationId",
    method: "GET",
    handler: v1_admin_organizations_$organizationId_getHandler,
  },
  {
    path: "/v1/admin/organizations/:organizationId/:projectId",
    method: "GET",
    handler: v1_admin_organizations_$organizationId_$projectId_getHandler,
  },
  {
    path: "/v1/admin/api-key",
    method: "POST",
    handler: v1_admin_apiKey_postHandler,
  },
  {
    path: "/v1/admin/organizations/:organizationId/report/:year",
    method: "GET",
    handler: v1_admin_organization_$organizationId_report_getHandler,
  },
];
