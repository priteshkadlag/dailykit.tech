import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";

export const alt = siteConfig.title;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "linear-gradient(135deg, #1e4fa3 0%, #2a78d6 100%)",
          color: "white",
        }}
      >
        <div style={{ fontSize: 36, fontWeight: 700, opacity: 0.9 }}>{siteConfig.name}</div>
        <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.1, marginTop: 24, maxWidth: 900 }}>
          All the tools you need for everyday work.
        </div>
        <div style={{ fontSize: 30, marginTop: 32, opacity: 0.85 }}>GST · EMI · Discount · Percentage · Age · Invoices</div>
      </div>
    ),
    size,
  );
}
