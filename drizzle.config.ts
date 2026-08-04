import { defineConfig } from "drizzle-kit";

// drizzle-kit runs as a standalone CLI, outside Next.js's own automatic
// .env.local loading, so it has to be loaded explicitly here.
try {
  process.loadEnvFile(".env.local");
} catch {
  // .env.local doesn't exist (e.g. in CI with real env vars already set) — fine.
}

export default defineConfig({
  out: "./drizzle",
  schema: "./db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
});
