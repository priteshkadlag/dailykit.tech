import { describe, expect, it } from "vitest";
import { contrastRatio, qrColorWarning } from "@/lib/color";
import { normalizePhone } from "@/lib/phone";
import { generatePassword, passwordEntropy, secureRandomInt, strengthOf, type PasswordOptions } from "@/lib/security/password";
import { countByView, dueReminders, reminderAt, sortTasks, viewOf, type Task } from "@/lib/tasks/model";
import { upiLink } from "@/lib/upi";
import { TEMPLATES, whatsappUrl, type MessageFields } from "@/lib/whatsapp/templates";
import { buildQrPayload, EMPTY_QR_FIELDS, escapeWifi, normalizeUrl } from "./payload";

describe("Phone numbers", () => {
  it("normalises Indian mobiles", () => {
    expect(normalizePhone("98200 12345")).toBe("919820012345");
    expect(normalizePhone("+91-98200-12345")).toBe("919820012345");
    expect(normalizePhone("09820012345")).toBe("919820012345");
    expect(normalizePhone("919820012345")).toBe("919820012345");
    expect(normalizePhone("+1 415 555 0100")).toBe("14155550100");
    expect(normalizePhone("12345")).toBeNull();
    expect(normalizePhone("1234567890")).toBeNull(); // Indian mobiles start with 6–9
  });
});

describe("QR payloads", () => {
  const f = (patch: Partial<typeof EMPTY_QR_FIELDS>) => ({ ...EMPTY_QR_FIELDS, ...patch });

  it("normalises URLs and rejects unsafe schemes", () => {
    expect(normalizeUrl("example.com/offer")).toBe("https://example.com/offer");
    expect(normalizeUrl("javascript:alert(1)")).toBeNull();
    expect(normalizeUrl("not a url")).toBeNull();
  });

  it("builds WiFi payloads with escaping", () => {
    expect(escapeWifi('a;b,c:d"e\\')).toBe('a\\;b\\,c\\:d\\"e\\\\');
    const r = buildQrPayload("wifi", f({ wifiSsid: "Shop;Guest", wifiPassword: "pass:1234" }));
    expect(r).toEqual({ ok: true, value: "WIFI:T:WPA;S:Shop\\;Guest;P:pass\\:1234;;" });
    expect(buildQrPayload("wifi", f({ wifiSsid: "Open", wifiSecurity: "nopass" }))).toEqual({ ok: true, value: "WIFI:T:nopass;S:Open;;" });
    expect(buildQrPayload("wifi", f({ wifiSsid: "X", wifiPassword: "short" })).ok).toBe(false);
  });

  it("builds UPI, WhatsApp, phone and email payloads", () => {
    expect(buildQrPayload("upi", f({ upiId: "sharma@okhdfc", upiName: "Sharma Traders", upiAmount: "1,250", upiNote: "Order 42" }))).toEqual({
      ok: true,
      value: "upi://pay?pa=sharma%40okhdfc&pn=Sharma%20Traders&am=1250.00&cu=INR&tn=Order%2042",
    });
    expect(buildQrPayload("upi", f({ upiId: "bad" })).ok).toBe(false);
    expect(buildQrPayload("whatsapp", f({ whatsappPhone: "9820012345", whatsappMessage: "Hi & hello" }))).toEqual({ ok: true, value: "https://wa.me/919820012345?text=Hi%20%26%20hello" });
    expect(buildQrPayload("phone", f({ phone: "9820012345" }))).toEqual({ ok: true, value: "tel:+919820012345" });
    expect(buildQrPayload("email", f({ email: "a@b.in", emailSubject: "Order query" }))).toEqual({ ok: true, value: "mailto:a@b.in?subject=Order%20query" });
  });

  it("treats empty input as empty, not as an error", () => {
    expect(buildQrPayload("url", EMPTY_QR_FIELDS)).toEqual({ ok: false, errors: {}, empty: true });
  });

  it("uses the same UPI link format as invoices", () => {
    expect(upiLink({ upiId: "a@ybl", amount: 10 })).toBe("upi://pay?pa=a%40ybl&am=10.00&cu=INR");
  });
});

describe("QR colour safety", () => {
  it("flags inverted and low-contrast colours", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21);
    expect(qrColorWarning("#000000", "#ffffff")).toBeNull();
    expect(qrColorWarning("#ffffff", "#000000")).toMatch(/Light code/);
    expect(qrColorWarning("#aaaaaa", "#ffffff")).toMatch(/Low contrast/);
  });
});

describe("Password generator", () => {
  const opts: PasswordOptions = { length: 16, sets: { uppercase: true, lowercase: true, numbers: true, symbols: true }, excludeAmbiguous: false };

  it("respects length and includes every selected set", () => {
    for (let i = 0; i < 200; i++) {
      const pw = generatePassword(opts);
      expect(pw).toHaveLength(16);
      expect(pw).toMatch(/[A-Z]/);
      expect(pw).toMatch(/[a-z]/);
      expect(pw).toMatch(/[0-9]/);
      expect(pw).toMatch(/[^A-Za-z0-9]/);
    }
  });

  it("excludes unselected and ambiguous characters", () => {
    const pw = generatePassword({ length: 64, sets: { uppercase: false, lowercase: true, numbers: true, symbols: false }, excludeAmbiguous: true });
    expect(pw).toMatch(/^[a-z0-9]+$/);
    expect(pw).not.toMatch(/[lo01]/);
    expect(() => generatePassword({ ...opts, sets: { uppercase: false, lowercase: false, numbers: false, symbols: false } })).toThrow();
  });

  it("is uniform (no modulo bias) and rejects out-of-range draws", () => {
    const counts = new Array(10).fill(0);
    for (let i = 0; i < 20000; i++) counts[secureRandomInt(10)]++;
    for (const c of counts) expect(Math.abs(c - 2000)).toBeLessThan(250);
    // Values at or above the rejection limit are redrawn.
    const draws = [2 ** 32 - 1, 7];
    expect(secureRandomInt(10, (a) => ((a[0] = draws.shift()!), a))).toBe(7);
  });

  it("rates strength by entropy", () => {
    expect(strengthOf(passwordEntropy({ ...opts, length: 8, sets: { uppercase: false, lowercase: true, numbers: false, symbols: false } }))).toBe("weak");
    expect(strengthOf(passwordEntropy({ ...opts, length: 10, sets: { uppercase: true, lowercase: true, numbers: true, symbols: false } }))).toBe("medium");
    expect(strengthOf(passwordEntropy(opts))).toBe("strong");
  });
});

describe("WhatsApp templates", () => {
  const fields: MessageFields = { customerName: "Priya", businessName: "Sharma Traders", product: "Cotton saree", amount: "2499", orderNumber: "1042", date: "2026-10-02", time: "16:30", festival: "diwali" };

  it("fills in details and formats money and dates", () => {
    const text = TEMPLATES.find((t) => t.id === "payment-reminder")!.render(fields);
    expect(text).toContain("Hello Priya,");
    expect(text).toContain("a payment of ₹2,499 for invoice #1042 is due on Fri, 2 Oct 2026.");
    expect(text).toMatch(/Thank you,\nSharma Traders$/);
  });

  it("reads naturally when optional details are missing", () => {
    const empty = { ...fields, customerName: "", amount: "", orderNumber: "", date: "", businessName: "" };
    const text = TEMPLATES.find((t) => t.id === "payment-reminder")!.render(empty);
    expect(text.startsWith("Hello,\n\nThis is a friendly reminder that a payment is pending.")).toBe(true);
    for (const t of TEMPLATES) expect(t.render(empty)).not.toMatch(/undefined|null|\n{3,}/);
  });

  it("formats appointment time and encodes the WhatsApp link", () => {
    expect(TEMPLATES.find((t) => t.id === "appointment-reminder")!.render(fields)).toContain("at 4:30 PM");
    expect(whatsappUrl("Hi & bye\nSee you", "919820012345")).toBe("https://wa.me/919820012345?text=Hi%20%26%20bye%0ASee%20you");
    expect(whatsappUrl("Hi", null)).toBe("https://wa.me/?text=Hi");
  });
});

describe("Tasks", () => {
  const now = new Date(2026, 8, 28, 14, 0); // Mon 28 Sep 2026, 2 PM
  const task = (patch: Partial<Task>): Task => ({
    id: Math.random().toString(),
    title: "T",
    description: "",
    dueDate: "",
    dueTime: "",
    priority: "medium",
    category: "work",
    reminder: "none",
    completed: false,
    completedAt: null,
    remindedAt: null,
    createdAt: "2026-09-01T00:00:00Z",
    ...patch,
  });

  it("classifies today, upcoming, overdue and completed", () => {
    expect(viewOf(task({ dueDate: "2026-09-28" }), now)).toBe("today"); // all-day, due end of today
    expect(viewOf(task({ dueDate: "2026-09-28", dueTime: "10:00" }), now)).toBe("overdue");
    expect(viewOf(task({ dueDate: "2026-09-28", dueTime: "18:00" }), now)).toBe("today");
    expect(viewOf(task({ dueDate: "2026-09-27" }), now)).toBe("overdue");
    expect(viewOf(task({ dueDate: "2026-09-30" }), now)).toBe("upcoming");
    expect(viewOf(task({}), now)).toBe("upcoming");
    expect(viewOf(task({ dueDate: "2026-09-01", completed: true }), now)).toBe("completed");
    expect(countByView([task({ dueDate: "2026-09-27" }), task({})], now)).toEqual({ today: 0, upcoming: 1, overdue: 1, completed: 0 });
  });

  it("computes reminder times", () => {
    expect(reminderAt(task({ dueDate: "2026-09-30", dueTime: "15:00", reminder: "1h" }))).toEqual(new Date(2026, 8, 30, 14, 0));
    expect(reminderAt(task({ dueDate: "2026-09-30", reminder: "1d" }))).toEqual(new Date(2026, 8, 29, 9, 0));
    expect(reminderAt(task({ dueDate: "", reminder: "1h" }))).toBeNull();
    expect(dueReminders([task({ dueDate: "2026-09-28", dueTime: "14:05", reminder: "10m" }), task({ dueDate: "2026-09-28", dueTime: "15:00", reminder: "10m" })], now)).toHaveLength(1);
  });

  it("sorts by due date (undated last) and by priority", () => {
    const a = task({ id: "a", dueDate: "2026-10-05", priority: "low" });
    const b = task({ id: "b", dueDate: "2026-09-29", priority: "low" });
    const c = task({ id: "c", priority: "high" });
    expect(sortTasks([a, b, c], "due").map((t) => t.id)).toEqual(["b", "a", "c"]);
    expect(sortTasks([a, b, c], "priority").map((t) => t.id)).toEqual(["c", "b", "a"]);
  });
});
