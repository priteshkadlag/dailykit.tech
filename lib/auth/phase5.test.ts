import { describe, expect, it } from "vitest";
import { changePasswordSchema, fieldErrors, loginSchema, registerSchema, resetPasswordSchema, safeCallbackUrl } from "./schemas";
import { toCsv } from "@/lib/files/csv";
import { savedCalculationSchema, isSyncKind, SYNC_KINDS } from "@/lib/sync/kinds";
import { PLAN_LIMITS, PRICES } from "@/lib/billing/plans";
import { eventPayloadSchema } from "@/lib/analytics/events";

describe("safeCallbackUrl", () => {
  it("keeps same-site paths", () => {
    expect(safeCallbackUrl("/invoice-generator?doc=1")).toBe("/invoice-generator?doc=1");
  });
  it.each(["https://evil.example", "//evil.example", "/\\evil.example", "javascript:alert(1)", "", undefined, 42])("rejects %s", (value) => {
    expect(safeCallbackUrl(value)).toBe("/dashboard");
  });
});

describe("auth schemas", () => {
  it("normalises email case and whitespace", () => {
    const r = registerSchema.parse({ name: " Asha ", email: "  Asha@Example.COM ", password: "secret123" });
    expect(r).toEqual({ name: "Asha", email: "asha@example.com", password: "secret123" });
  });
  it("requires 8+ characters with a letter and a number", () => {
    expect(registerSchema.safeParse({ name: "A", email: "a@b.in", password: "short1" }).success).toBe(false);
    expect(registerSchema.safeParse({ name: "A", email: "a@b.in", password: "allletters" }).success).toBe(false);
    expect(registerSchema.safeParse({ name: "A", email: "a@b.in", password: "12345678" }).success).toBe(false);
    expect(registerSchema.safeParse({ name: "A", email: "a@b.in", password: "abcd1234" }).success).toBe(true);
  });
  it("caps password length below bcrypt's 72-byte limit", () => {
    expect(registerSchema.safeParse({ name: "A", email: "a@b.in", password: "a1".repeat(40) }).success).toBe(false);
  });
  it("rejects malformed emails", () => {
    expect(loginSchema.safeParse({ email: "not-an-email", password: "x" }).success).toBe(false);
  });
  it("reports mismatched confirmation on the confirm field", () => {
    const r = resetPasswordSchema.safeParse({ token: "t".repeat(43), password: "abcd1234", confirm: "abcd12345" });
    expect(r.success).toBe(false);
    if (!r.success) expect(fieldErrors(r.error)).toEqual({ confirm: "Passwords don't match" });
    expect(changePasswordSchema.safeParse({ current: "", password: "abcd1234", confirm: "abcd1234" }).success).toBe(true);
  });
});

describe("toCsv", () => {
  it("quotes commas, quotes and newlines", () => {
    expect(toCsv(["a", "b"], [["x, y", 'say "hi"'], ["line\nbreak", 5]])).toBe('a,b\r\n"x, y","say ""hi"""\r\n"line\nbreak",5');
  });
  it("neutralises spreadsheet formulas in text but not numbers", () => {
    expect(toCsv(["v"], [["=HYPERLINK(1)"], ["@SUM(A1)"], ["-2+3"], [-5]])).toBe("v\r\n'=HYPERLINK(1)\r\n'@SUM(A1)\r\n'-2+3\r\n-5");
  });
  it("writes empty cells for null", () => {
    expect(toCsv(["a", "b"], [[null, undefined]])).toBe("a,b\r\n,");
  });
});

describe("sync schemas", () => {
  const calc = { id: "1", toolSlug: "gst-calculator", summary: "GST 18% on ₹100 = ₹18", createdAt: new Date().toISOString() };
  it("accepts same-site links back to the tool", () => {
    expect(savedCalculationSchema.safeParse({ ...calc, url: "/gst-calculator?amount=100" }).success).toBe(true);
  });
  it.each(["https://evil.example", "//evil.example", "/\\evil", "javascript:alert(1)"])("rejects link %s", (url) => {
    expect(savedCalculationSchema.safeParse({ ...calc, url }).success).toBe(false);
  });
  it("knows its kinds", () => {
    expect(SYNC_KINDS).toEqual(["documents", "expenses", "tasks", "business", "calculations", "favorites"]);
    expect(isSyncKind("documents")).toBe(true);
    expect(isSyncKind("__proto__")).toBe(false);
    expect(isSyncKind("users")).toBe(false);
  });
});

describe("plans", () => {
  it("prices match the published plans", () => {
    expect(PRICES.monthly.amount).toBe(99);
    expect(PRICES.yearly.amount).toBe(999);
  });
  it("limits Free and not Pro", () => {
    expect(PLAN_LIMITS.FREE.invoicesPerMonth).toBeGreaterThan(0);
    expect(PLAN_LIMITS.PRO.invoicesPerMonth).toBeNull();
  });
});

describe("analytics events", () => {
  const visitorId = "0b7c4f1e-2a3d-4c5b-8e9f-1a2b3c4d5e6f";
  it("accepts only known event names", () => {
    expect(eventPayloadSchema.safeParse({ name: "tool_opened", tool: "gst-calculator", visitorId }).success).toBe(true);
    expect(eventPayloadSchema.safeParse({ name: "password_typed", visitorId }).success).toBe(false);
  });
  it("drops anything beyond name, tool and visitor", () => {
    const r = eventPayloadSchema.parse({ name: "calculation_completed", tool: "emi-calculator", visitorId, amount: 500000, email: "a@b.in" });
    expect(r).toEqual({ name: "calculation_completed", tool: "emi-calculator", visitorId });
  });
});
