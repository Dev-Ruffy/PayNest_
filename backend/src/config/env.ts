import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(4000),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  JWT_ACCESS_SECRET: z.string().min(10, "JWT_ACCESS_SECRET is required"),
  JWT_REFRESH_SECRET: z.string().min(10, "JWT_REFRESH_SECRET is required"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("30d"),

  COOKIE_DOMAIN: z.string().default("localhost"),
  COOKIE_SECURE: z
    .string()
    .default("false")
    .transform((v) => v === "true"),

  CORS_ORIGINS: z.string().default("http://localhost:3000"),

  // Email is sent via Brevo's HTTPS API rather than SMTP — outbound SMTP
  // (ports 25/465/587) is permanently blocked on Render's free tier and
  // several other free hosting tiers, but a plain HTTPS API call isn't.
  BREVO_API_KEY: z.string().optional(), // if unset, emails are logged instead of sent (local dev)
  MAIL_FROM_NAME: z.string().default("PayNest"),
  MAIL_FROM_EMAIL: z.string().email().default("no-reply@paynest.app"),

  PIN_ENCRYPTION_KEY: z
    .string()
    .min(32, "PIN_ENCRYPTION_KEY must be at least 32 characters (used as an AES-256 key)"),

  DEVELOPER_EMAIL: z.string().email().default("developer@paynest.app"),
  DEVELOPER_PASSCODE: z.string().default("827589"),
  DEVELOPER_NOTIFY_EMAIL: z.string().email().default("rufaimuizz@gmail.com"),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().default(200),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error("❌ Invalid environment variables:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = {
  ...parsed.data,
  CORS_ORIGIN_LIST: parsed.data.CORS_ORIGINS.split(",").map((o) => o.trim()),
  isProd: parsed.data.NODE_ENV === "production",
};
