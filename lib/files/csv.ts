/**
 * RFC 4180 CSV. Text cells starting with = + - @ are prefixed with ' so spreadsheets don't run
 * them as formulas (CSV injection); numbers are written as-is.
 */
export function toCsv(header: string[], rows: (string | number | null | undefined)[][]) {
  const cell = (value: string | number | null | undefined) => {
    if (value === null || value === undefined) return "";
    if (typeof value === "number") return String(value);
    const s = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");
}
