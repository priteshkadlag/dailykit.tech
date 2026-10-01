import { normalizePhone } from "@/lib/phone";
import { isValidUpiId, upiLink } from "@/lib/upi";

export type QrType = "url" | "text" | "phone" | "email" | "whatsapp" | "wifi" | "upi";

export interface QrFields {
  url: string;
  text: string;
  phone: string;
  email: string;
  emailSubject: string;
  emailBody: string;
  whatsappPhone: string;
  whatsappMessage: string;
  wifiSsid: string;
  wifiPassword: string;
  wifiSecurity: "WPA" | "WEP" | "nopass";
  wifiHidden: boolean;
  upiId: string;
  upiName: string;
  upiAmount: string;
  upiNote: string;
}

export const EMPTY_QR_FIELDS: QrFields = {
  url: "",
  text: "",
  phone: "",
  email: "",
  emailSubject: "",
  emailBody: "",
  whatsappPhone: "",
  whatsappMessage: "",
  wifiSsid: "",
  wifiPassword: "",
  wifiSecurity: "WPA",
  wifiHidden: false,
  upiId: "",
  upiName: "",
  upiAmount: "",
  upiNote: "",
};

export type QrFieldErrors = Partial<Record<keyof QrFields, string>>;
export type PayloadResult = { ok: true; value: string } | { ok: false; errors: QrFieldErrors; empty: boolean };

/** WiFi QR special characters \ ; , : " must be backslash-escaped. */
export function escapeWifi(value: string) {
  return value.replace(/([\\;,:"])/g, "\\$1");
}

/** Accepts "example.com" and adds https://; rejects anything that isn't http(s). */
export function normalizeUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!url.hostname.includes(".") && url.hostname !== "localhost") return null;
    return url.toString();
  } catch {
    return null;
  }
}

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

/** Build the exact text encoded in the QR code for each type, with field-level validation. */
export function buildQrPayload(type: QrType, f: QrFields): PayloadResult {
  const fail = (errors: QrFieldErrors, empty = false): PayloadResult => ({ ok: false, errors, empty });

  switch (type) {
    case "url": {
      if (!f.url.trim()) return fail({}, true);
      const url = normalizeUrl(f.url);
      return url ? { ok: true, value: url } : fail({ url: "Enter a valid website address, e.g. example.com" });
    }
    case "text":
      return f.text.trim() ? { ok: true, value: f.text } : fail({}, true);
    case "phone": {
      if (!f.phone.trim()) return fail({}, true);
      const phone = normalizePhone(f.phone);
      return phone ? { ok: true, value: `tel:+${phone}` } : fail({ phone: "Enter a valid phone number" });
    }
    case "email": {
      if (!f.email.trim()) return fail({}, true);
      if (!isEmail(f.email)) return fail({ email: "Enter a valid email address" });
      const params = new URLSearchParams();
      if (f.emailSubject.trim()) params.set("subject", f.emailSubject.trim());
      if (f.emailBody.trim()) params.set("body", f.emailBody.trim());
      const query = params.toString().replaceAll("+", "%20");
      return { ok: true, value: `mailto:${f.email.trim()}${query ? `?${query}` : ""}` };
    }
    case "whatsapp": {
      if (!f.whatsappPhone.trim()) return fail({}, true);
      const phone = normalizePhone(f.whatsappPhone);
      if (!phone) return fail({ whatsappPhone: "Enter a valid WhatsApp number" });
      const text = f.whatsappMessage.trim();
      return { ok: true, value: `https://wa.me/${phone}${text ? `?text=${encodeURIComponent(text)}` : ""}` };
    }
    case "wifi": {
      if (!f.wifiSsid.trim()) return fail({}, true);
      if (f.wifiSecurity !== "nopass" && !f.wifiPassword) return fail({ wifiPassword: "Enter the WiFi password" });
      if (f.wifiSecurity === "WPA" && f.wifiPassword.length < 8) return fail({ wifiPassword: "WPA passwords are at least 8 characters" });
      const parts = [`T:${f.wifiSecurity}`, `S:${escapeWifi(f.wifiSsid)}`];
      if (f.wifiSecurity !== "nopass") parts.push(`P:${escapeWifi(f.wifiPassword)}`);
      if (f.wifiHidden) parts.push("H:true");
      return { ok: true, value: `WIFI:${parts.join(";")};;` };
    }
    case "upi": {
      if (!f.upiId.trim()) return fail({}, true);
      const errors: QrFieldErrors = {};
      if (!isValidUpiId(f.upiId)) errors.upiId = "UPI ID should look like name@bank";
      let amount: number | undefined;
      if (f.upiAmount.trim()) {
        amount = Number(f.upiAmount.replace(/,/g, ""));
        if (!Number.isFinite(amount) || amount <= 0) errors.upiAmount = "Enter a valid amount";
        else if (amount > 100000) errors.upiAmount = "UPI payments are usually limited to ₹1,00,000";
      }
      if (Object.keys(errors).length) return fail(errors);
      return { ok: true, value: upiLink({ upiId: f.upiId, payeeName: f.upiName, amount, note: f.upiNote }) };
    }
  }
}
