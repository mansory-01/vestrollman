import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import "@/server/utils/env";

function resolveDatabaseUrl(): string | undefined {
  if (process.env.NODE_ENV === "test") {
    return (
      process.env.TEST_DATABASE_URL ||
      process.env.DATABASE_URL ||
      "postgres://postgres:postgres@127.0.0.1:5432/vestroll_test"
    );
  }

  return process.env.DATABASE_URL;
}

function createDb() {
  const databaseUrl = resolveDatabaseUrl();

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not defined in environment variables");
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false,
  });

  return drizzle(pool, { schema });
}

type Database = ReturnType<typeof createDb>;

let dbInstance: Database | null = null;

function getDb(): Database {
  if (!dbInstance) {
    dbInstance = createDb();
  }

  return dbInstance;
}

export const db = new Proxy({} as Database, {
  get(_target, property, receiver) {
    return Reflect.get(getDb(), property, receiver);
  },
});
export * from "./schema";
