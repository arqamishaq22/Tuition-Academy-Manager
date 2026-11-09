import dotenv from "dotenv";
import { z } from "zod";

// Load environment variables from .env file
dotenv.config();

/**
 * Zod Schema to validate all required and optional environment variables at startup.
 * If any critical variable is missing or improperly typed, the process will fail early
 * with a clear descriptive message for easy debugging.
 */
const envSchema = z.object({
  PORT: z
    .string()
    .default("5000")
    .transform((val) => parseInt(val, 10)),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  DB_HOST: z.string().default("localhost"),
  DB_PORT: z
    .string()
    .default("3306")
    .transform((val) => parseInt(val, 10)),
  DB_USER: z.string().default("root"),
  DB_PASSWORD: z.string().default(""),
  DB_NAME: z.string().default("academy_manager"),
  JWT_ACCESS_SECRET: z
    .string()
    .min(10, "JWT_ACCESS_SECRET must be at least 10 characters long")
    .default("default_dev_access_secret_for_academy_manager_saas_2026"),
  JWT_REFRESH_SECRET: z
    .string()
    .min(10, "JWT_REFRESH_SECRET must be at least 10 characters long")
    .default("default_dev_refresh_secret_for_academy_manager_saas_2026"),
  JWT_ACCESS_EXPIRES: z.string().default("15m"),
  JWT_REFRESH_EXPIRES: z.string().default("7d"),
  CLIENT_URL: z.string().default("http://localhost:3000"),
  COOKIE_SECURE: z
    .string()
    .default("false")
    .transform((val) => val === "true"),
});

// Parse and validate current process.env
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables detected at startup:");
  parsed.error.errors.forEach((err) => {
    console.error(`  - ${err.path.join(".")}: ${err.message}`);
  });
  process.exit(1);
}

export const env = parsed.data;
export default env;
