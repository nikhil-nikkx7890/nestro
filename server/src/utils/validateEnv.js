import { z } from "zod";

/**
 * Validates process.env at boot, before the server accepts any requests.
 * Missing or malformed required variables fail the process immediately
 * with a clear message, instead of surfacing later as a cryptic error
 * deep inside whatever operation first needed the missing value (e.g.
 * a Mongoose connection timeout instead of "MONGO_URI is undefined").
 */
const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(5000),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  MONGO_URI: z.preprocess(
    (val) => val ?? "",
    z.string().min(1, "MONGO_URI is required.")
  ),
  CLIENT_URL: z.preprocess(
    (val) => val ?? "",
    z.string().min(1, "CLIENT_URL is required.")
  ),
  CLOUDINARY_CLOUD_NAME: z.preprocess(
    (val) => val ?? "",
    z.string().min(1, "CLOUDINARY_CLOUD_NAME is required.")
  ),
  CLOUDINARY_API_KEY: z.preprocess(
    (val) => val ?? "",
    z.string().min(1, "CLOUDINARY_API_KEY is required.")
  ),
  CLOUDINARY_API_SECRET: z.preprocess(
    (val) => val ?? "",
    z.string().min(1, "CLOUDINARY_API_SECRET is required.")
  ),
});

export function validateEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("Invalid or missing environment variables:");
    for (const issue of result.error.issues) {
      console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
    }
    process.exit(1);
  }

  return result.data;
}
