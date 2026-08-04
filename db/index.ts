import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Lazy singleton: no connection is opened at import time, so a missing
// DATABASE_URL fails the first request that actually needs the database,
// not `next build`.
let queryClient: ReturnType<typeof postgres> | undefined;

export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example values into .env.local and point it " +
        "at a real Postgres instance."
    );
  }

  if (!queryClient) {
    queryClient = postgres(process.env.DATABASE_URL);
  }

  return drizzle(queryClient, { schema });
}
