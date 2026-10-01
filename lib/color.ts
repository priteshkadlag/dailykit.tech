/** WCAG relative luminance of a #rrggbb colour. */
export function luminance(hex: string) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return NaN;
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(m[1].slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

/**
 * QR scanners need dark modules on a light background with strong contrast.
 * Returns a warning message, or null if the colours are safe.
 */
export function qrColorWarning(foreground: string, background: string): string | null {
  if (luminance(foreground) > luminance(background)) return "Light code on a dark background — many phone scanners can't read inverted QR codes.";
  if (contrastRatio(foreground, background) < 4) return "Low contrast between the colours — the code may not scan reliably. Use a darker code colour or a lighter background.";
  return null;
}
