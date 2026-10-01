import { ImageResponse } from "next/og";

/**
 * The DailyKit mark (the header logo) as a PNG, for the favicon, Apple touch icon and web manifest.
 * `rounded` is false for the Apple icon, which iOS masks into a rounded square itself.
 */
export function brandIcon(size: number, rounded = true) {
  const glyph = Math.round(size * 0.62);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1e40af 0%, #2563eb 55%, #0369a1 100%)",
          borderRadius: rounded ? Math.round(size * 0.22) : 0,
        }}
      >
        <svg width={glyph} height={glyph} viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="4" width="7" height="7" rx="1.5" />
          <rect x="13" y="4" width="7" height="7" rx="1.5" />
          <rect x="4" y="13" width="7" height="7" rx="1.5" />
          <path d="M16.5 13.5v6M13.5 16.5h6" />
        </svg>
      </div>
    ),
    { width: size, height: size },
  );
}
