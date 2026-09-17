import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

function createDb() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not configured.");
  return drizzle(neon(databaseUrl), { schema });
}

let db: ReturnType<typeof createDb> | undefined;
export function hasDatabaseUrl() { return Boolean(process.env.DATABASE_URL); }
export function getDb() { return db ??= createDb(); }
