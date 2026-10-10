import "server-only";

import { z } from "zod";

const emptyToUndefined = (value: unknown): unknown => (value === "" ? undefined : value);

const text = (message: string) => z.preprocess(emptyToUndefined, z.string(message));

const absoluteURL = (message: string) => z.preprocess(emptyToUndefined, z.url(message));

const serverEnvSchema = z.object({
  API_URL: absoluteURL("API_URL must be an absolute URL"),
  DATABASE_URL: absoluteURL("DATABASE_URL must be an absolute URL"),
  BETTER_AUTH_SECRET: text("BETTER_AUTH_SECRET must be a non-empty string"),
  BETTER_AUTH_URL: absoluteURL("BETTER_AUTH_URL must be an absolute URL"),
  GOOGLE_CLIENT_ID: z
    .preprocess(emptyToUndefined, z.string("GOOGLE_CLIENT_ID must be a non-empty string"))
    .optional(),
  GOOGLE_CLIENT_SECRET: z
    .preprocess(emptyToUndefined, z.string("GOOGLE_CLIENT_SECRET must be a non-empty string"))
    .optional(),
  AUTH_ISSUER: text("AUTH_ISSUER must be a non-empty string"),
  AUTH_AUDIENCE: text("AUTH_AUDIENCE must be a non-empty string"),
  REVALIDATE_SECRET: text("REVALIDATE_SECRET must be a non-empty string"),
});

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: absoluteURL("NEXT_PUBLIC_SITE_URL must be an absolute URL"),
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: text(
    "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME must be a non-empty string"
  ),
});

function parseOrThrow<const T extends z.ZodType>(schema: T, label: string): z.infer<T> {
  const result = schema.safeParse(process.env);
  if (!result.success) {
    const lines = result.error.issues.map((issue) => {
      const name = issue.path.join(".") || "(root)";
      return issue.code === "invalid_type" && issue.input === undefined
        ? `  - ${name} is required`
        : `  - ${name}: ${issue.message}`;
    });
    throw new Error(`Invalid environment (${label}):\n${lines.join("\n")}`);
  }
  return result.data;
}

export const env = Object.freeze(parseOrThrow(serverEnvSchema, "server"));
export const publicEnv = Object.freeze(parseOrThrow(publicEnvSchema, "public"));
