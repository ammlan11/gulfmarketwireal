import "dotenv/config";
import { z } from "zod";

// A setting left blank in .env (KEY="") counts as not set.
const optional = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => (value === "" ? undefined : value), schema.optional());

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().int().positive().default(4000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  SESSION_SECRET: z.string().min(16),
  ADMIN_EMAIL: z.string().trim().email(),
  ADMIN_PASSWORD: z.string().min(8),
  PUBLIC_BASE_URL: z.string().url().default("http://localhost:4000"),

  // Secret key the automated news task sends to POST /api/ingest/news.
  // Leave blank or unset to switch the endpoint off.
  INGEST_API_KEY: optional(z.string().min(32)),

  // Pexels API key (free at pexels.com/api) used to find article photos.
  PEXELS_API_KEY: optional(z.string().min(1)),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  // Say plainly which setting is wrong instead of crashing with a stack trace.
  console.error("\nThe CMS cannot start: fix these settings in cms/.env, then restart.\n");

  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
  }

  console.error("");
  process.exit(1);
}

export const env = parsed.data;
