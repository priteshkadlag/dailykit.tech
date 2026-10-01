import QRCode from "qrcode";

/** Crisp vector QR rendered synchronously — no canvas, so it prints and exports sharply. */
export function QrSvg({ value, size = 96, color = "#111111", label = "UPI payment QR code" }: { value: string; size?: number; color?: string; label?: string }) {
  const qr = QRCode.create(value, { errorCorrectionLevel: "M" });
  const count = qr.modules.size;
  const quiet = 2;
  let path = "";
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (qr.modules.get(r, c)) path += `M${c + quiet} ${r + quiet}h1v1h-1z`;
    }
  }
  const dim = count + quiet * 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${dim} ${dim}`} shapeRendering="crispEdges" role="img" aria-label={label}>
      <rect width={dim} height={dim} fill="#ffffff" />
      <path d={path} fill={color} />
    </svg>
  );
}
