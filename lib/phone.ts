/**
 * Normalise a phone number to international digits for wa.me / tel: links.
 * Indian 10-digit mobiles (optionally with a leading 0 or +91) become 91XXXXXXXXXX.
 * Returns null when the number can't be a valid phone number.
 */
export function normalizePhone(input: string, defaultCountryCode = "91"): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  let digits = trimmed.replace(/\D/g, "");
  if (trimmed.startsWith("+")) return digits.length >= 8 && digits.length <= 15 ? digits : null;
  digits = digits.replace(/^00/, "");
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length === 10) return /^[6-9]/.test(digits) || defaultCountryCode !== "91" ? defaultCountryCode + digits : null;
  if (digits.length === 12 && digits.startsWith("91")) return /^91[6-9]/.test(digits) ? digits : null;
  return digits.length >= 8 && digits.length <= 15 ? digits : null;
}

/** +91 98200 12345 style display. */
export function formatPhone(digits: string) {
  if (digits.length === 12 && digits.startsWith("91")) return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  return `+${digits}`;
}
