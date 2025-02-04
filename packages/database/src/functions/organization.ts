import { eq } from "drizzle-orm";
import { db, organizationTable, projectTable } from "..";
import { isNotNull } from "../utils";

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
  const rows = await db
    .select()
    .from(organizationTable)
    .leftJoin(
      projectTable,
      eq(projectTable.organizationId, organizationTable.id),
    )
    .where(eq(organizationTable.id, organizationId));

  const firstRow = rows[0];

  if (firstRow === undefined) return undefined;

  return {
    organization: firstRow.organization,
    projects: rows.map((r) => r.project).filter(isNotNull),
  };
}
