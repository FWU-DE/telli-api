import { eq } from "drizzle-orm";
import { ApiKeyModel, apiKeyTable, db, ProjectModel, projectTable } from "..";

export async function dbGetAllProjects() {
  return await db.select().from(projectTable).orderBy(projectTable.createdAt);
}

export async function dbGetProjectsWithApiKeys({
  organizationId,
}: {
  organizationId: string;
}) {
  const rows = await db
    .select()
    .from(projectTable)
    .innerJoin(apiKeyTable, eq(apiKeyTable.projectId, projectTable.id))
    .orderBy(projectTable.createdAt)
    .where(eq(projectTable.organizationId, organizationId));

  return organizeProjectsWithApiKeys(rows);
}

export async function dbGetProjectById({ projectId }: { projectId: string }) {
  return (
    await db.select().from(projectTable).where(eq(projectTable.id, projectId))
  )[0];
}

function organizeProjectsWithApiKeys(
  rows: {
    project: ProjectModel;
    api_key: ApiKeyModel;
  }[],
) {
  const projectMap = new Map<
    string,
    {
      project: ProjectModel;
      apiKeys: ApiKeyModel[];
    }
  >();

  for (const row of rows) {
    const projectId = row.project.id;

    if (!projectMap.has(projectId)) {
      projectMap.set(projectId, {
        project: row.project,
        apiKeys: [],
      });
    }

    projectMap.get(projectId)?.apiKeys.push(row.api_key);
  }

  return Array.from(projectMap.values());
}
