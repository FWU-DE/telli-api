import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const globalQueryClient = global as unknown as {
  queryClient?: postgres.Sql;
};

const connectionString = process.env.DATABASE_URL;

if (connectionString === undefined) {
  throw new Error("Database URL undefined");
}

//checking if a queryClient has already been defined on globalQueryClient
//if not: it creates a postgres queryClient
const queryClient =
  globalQueryClient.queryClient ?? postgres(connectionString!, { max: 12 });

//if the application is running in the development environment
/*yes: storing the created queryClient in the globalQuery Client
-> so that the application reuses the same database connection instead of creating a new one for each invoice,
 -> improved performance and avoiding unnecessary connections.
  -> for annoying error: "sorry, to many clients already"
*/
if (process.env.NODE_ENV === "development")
  globalQueryClient.queryClient = queryClient;
export const db = drizzle(queryClient);

export * from "./schema";
export * from "./functions";
export * from "./types";
