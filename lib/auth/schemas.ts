import { z } from "zod";

/** Shared by the forms (instant feedback) and the server (the check that counts). */
export const emailSchema = z
  .string()
  .trim()
  .min(1, "Enter your email")
  .max(254, "Email is too long")
  .pipe(z.email("Enter a valid email address"))
  .transform((e) => e.toLowerCase());

export const PASSWORD_MIN = 8;

export const newPasswordSchema = z
  .string()
  .min(PASSWORD_MIN, `Use at least ${PASSWORD_MIN} characters`)
  // bcrypt only uses the first 72 bytes; cap well below so nothing is silently ignored.
  .max(64, "Use 64 characters or fewer")
  .refine((p) => /[a-zA-Z]/.test(p) && /\d/.test(p), "Use at least one letter and one number");

export const nameSchema = z.string().trim().min(1, "Enter your name").max(80, "Name is too long");

export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: newPasswordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password").max(200),
});

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z
  .object({
    token: z.string().min(20).max(200),
    password: newPasswordSchema,
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords don't match" });

export const changePasswordSchema = z
  .object({
    current: z.string().max(200),
    password: newPasswordSchema,
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords don't match" });

/** Only same-site relative paths are allowed as a post-login destination (prevents open redirects). */
export function safeCallbackUrl(value: unknown, fallback = "/dashboard") {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}

export type FieldErrors = Partial<Record<string, string>>;

export function fieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}
