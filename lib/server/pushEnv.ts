import { z } from "zod";

// Secrets for /api/push/dispatch. Server-only; never import from a client module.
const PushEnvSchema = z.object({
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().min(20),
  VAPID_PRIVATE_KEY: z.string().min(20),
  VAPID_SUBJECT: z.string().startsWith("mailto:"),
  CRON_SECRET: z.string().min(32),
});

export type PushEnv = z.infer<typeof PushEnvSchema>;

export function parsePushEnv(raw: Record<string, string | undefined>): PushEnv {
  const result = PushEnvSchema.safeParse(raw);
  if (!result.success) {
    const names = result.error.issues.map((issue) => issue.path.join("."));
    throw new Error(`Thiếu hoặc sai biến môi trường: ${names.join(", ")}`);
  }
  return result.data;
}

export function pushEnv(): PushEnv {
  return parsePushEnv({
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY,
    VAPID_SUBJECT: process.env.VAPID_SUBJECT,
    CRON_SECRET: process.env.CRON_SECRET,
  });
}
