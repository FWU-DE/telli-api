import { eq } from "drizzle-orm";
import { db, llmModelTable, organizationTable, projectTable } from "..";
import { isNotNull } from "@dgpt/utils";

export async function dbGetAllOrganizations() {
  return await db
    .select()
    .from(organizationTable)
    .orderBy(organizationTable.name, organizationTable.createdAt);
}

export async function dbGetOrganizationAndProjectsByOrganizationId({
  organizationId,
}: {
  organizationId: string;
}) {
  const organizationResult = await db
    .select()
    .from(organizationTable)
    .where(eq(organizationTable.id, organizationId));

  const organization = organizationResult[0];
  if (!organization) return undefined;

  const projects = await db
    .select()
    .from(projectTable)
    .where(eq(projectTable.organizationId, organizationId));

  const models = await db
    .select()
    .from(llmModelTable)
    .where(eq(llmModelTable.organizationId, organizationId));

  return {
    organization,
    projects: projects.filter(isNotNull),
    models: models.filter(isNotNull),
  };
}

export async function dbGetOrganizationByProjectId({
  projectId,
}: {
  projectId: string;
}) {
  const [row] = await db
    .select()
    .from(projectTable)
    .innerJoin(
      organizationTable,
      eq(projectTable.organizationId, organizationTable.id),
    )
    .where(eq(projectTable.id, projectId));

  if (row === undefined) return undefined;

  return row.organization;
}
