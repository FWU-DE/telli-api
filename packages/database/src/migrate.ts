import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { migrate } from "drizzle-orm/postgres-js/migrator";

const databaseURI = process.env.DATABASE_URL;

if (databaseURI === undefined) {
  console.log(
    "You need to provide a database connection via the DATABASE_URL env variable",
  );
  process.exit(1);
}

const client = postgres(databaseURI, { max: 1 });
const db = drizzle(client);

async function runMigrations() {
  await migrate(db, { migrationsFolder: "./migrations" });
  await client.end();
}

runMigrations()
  .then(() => {
    console.info("Migration successful.");
    process.exit(0);
  })
  .catch((error) => {
    console.error({ error });
    process.exit(1);
  });
