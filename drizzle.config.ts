import { loadEnvFile } from "node:process";
import type { Config } from "drizzle-kit";

// drizzle-kit runs outside Next, so it does not pick up .env.local on its own.
try {
  loadEnvFile(".env.local");
} catch {
  // production supplies real environment variables
}

export default {
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  schemaFilter: ["pinkbox"],
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
