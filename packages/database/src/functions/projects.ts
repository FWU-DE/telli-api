import { eq } from "drizzle-orm";
import { db, projectTable } from "..";

export async function dbGetAllProjects() {
  return await db.select().from(projectTable).orderBy(projectTable.createdAt);
}

export async function dbGetProjectById({ projectId }: { projectId: string }) {
  return (
    await db.select().from(projectTable).where(eq(projectTable.id, projectId))
  )[0];
}
