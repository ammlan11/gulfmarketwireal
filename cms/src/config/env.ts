import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().int().positive().default(4000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  SESSION_SECRET: z.string().min(16),
  ADMIN_EMAIL: z.string().email(),
  ADMIN_PASSWORD: z.string().min(8),
  PUBLIC_BASE_URL: z.string().url().default("http://localhost:4000"),

  // Secret key the automated news task sends to POST /api/ingest/news.
  // Leave unset to switch the endpoint off.
  INGEST_API_KEY: z.string().min(32).optional(),

  // Pexels API key (free at pexels.com/api) used to find article photos.
  PEXELS_API_KEY: z.string().min(1).optional()
});

export const env = schema.parse(process.env);
