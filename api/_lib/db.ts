import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from "../../shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

let cachedDb: ReturnType<typeof drizzle<typeof schema>> | null = null;
let cachedClient: ReturnType<typeof postgres> | null = null;

export function getDb() {
  if (!cachedDb || !cachedClient) {
    cachedClient = postgres(process.env.DATABASE_URL!, {
      max: 1,
      idle_timeout: 20,
      max_lifetime: 60 * 30,
    });
    cachedDb = drizzle(cachedClient, { schema });
  }
  return cachedDb;
}

export { schema };
