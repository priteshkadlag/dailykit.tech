import QRCode from "qrcode";

export type ErrorCorrection = "L" | "M" | "Q" | "H";

export const ECC_LABEL: Record<ErrorCorrection, string> = {
  L: "Low (7%) — smallest code",
  M: "Medium (15%) — recommended",
  Q: "Quartile (25%)",
  H: "High (30%) — best for print & logos",
};

export interface QrStyle {
  /** Output width/height in pixels. */
  size: number;
  ecc: ErrorCorrection;
  foreground: string;
  background: string;
  /** PNG data URL placed in the centre; forces ECC "H". */
  logo?: string | null;
}

/** Quiet zone in modules, per the QR spec. Scanners need this blank border. */
const QUIET_ZONE = 4;
/** Logo width as a share of the code. With ECC H this stays well within what can be recovered. */
const LOGO_SCALE = 0.22;

const HEX = /^#[0-9a-f]{6}$/i;
const safeColor = (value: string, fallback: string) => (HEX.test(value) ? value : fallback);
const safeLogo = (value?: string | null) => (value && /^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(value) ? value : null);

export class QrTooLongError extends Error {}

function matrix(text: string, style: QrStyle) {
  try {
    const qr = QRCode.create(text, { errorCorrectionLevel: style.logo ? "H" : style.ecc });
    return qr.modules;
  } catch {
    throw new QrTooLongError("That's too much content for one QR code. Shorten the text or lower the error correction.");
  }
}

/** Standalone SVG (vector — ideal for print). Colours and logo are validated before being embedded. */
export function qrToSvg(text: string, style: QrStyle): string {
  const modules = matrix(text, style);
  const count = modules.size;
  const dim = count + QUIET_ZONE * 2;
  const fg = safeColor(style.foreground, "#000000");
  const bg = safeColor(style.background, "#ffffff");
  let path = "";
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (modules.get(r, c)) path += `M${c + QUIET_ZONE} ${r + QUIET_ZONE}h1v1h-1z`;
    }
  }
  let logo = "";
  const logoUrl = safeLogo(style.logo);
  if (logoUrl) {
    const w = dim * LOGO_SCALE;
    const pad = w * 0.12;
    const x = (dim - w) / 2;
    logo = `<rect x="${x - pad}" y="${x - pad}" width="${w + pad * 2}" height="${w + pad * 2}" rx="${pad}" fill="${bg}"/><image href="${logoUrl}" x="${x}" y="${x}" width="${w}" height="${w}" preserveAspectRatio="xMidYMid meet"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${style.size}" height="${style.size}" viewBox="0 0 ${dim} ${dim}" shape-rendering="crispEdges"><rect width="${dim}" height="${dim}" fill="${bg}"/><path d="${path}" fill="${fg}"/>${logo}</svg>`;
}

/** Safe to use as <img src>: an SVG loaded as an image can't run scripts. */
export function svgDataUrl(svg: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Couldn't load the logo."));
    img.src = src;
  });
}

/** PNG at exactly `size` pixels. Modules are snapped to whole pixels so edges stay sharp for scanners. */
export async function qrToPng(text: string, style: QrStyle): Promise<Blob> {
  const modules = matrix(text, style);
  const count = modules.size;
  const dim = count + QUIET_ZONE * 2;
  const cell = Math.max(1, Math.floor(style.size / dim));
  const offset = Math.floor((style.size - cell * dim) / 2) + QUIET_ZONE * cell;

  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = style.size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser can't draw images here.");
  const bg = safeColor(style.background, "#ffffff");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, style.size, style.size);
  ctx.fillStyle = safeColor(style.foreground, "#000000");
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (modules.get(r, c)) ctx.fillRect(offset + c * cell, offset + r * cell, cell, cell);
    }
  }

  const logoUrl = safeLogo(style.logo);
  if (logoUrl) {
    const img = await loadImage(logoUrl);
    const w = style.size * LOGO_SCALE;
    const pad = w * 0.12;
    const x = (style.size - w) / 2;
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.roundRect(x - pad, x - pad, w + pad * 2, w + pad * 2, pad);
    ctx.fill();
    const scale = Math.min(w / img.width, w / img.height);
    ctx.drawImage(img, x + (w - img.width * scale) / 2, x + (w - img.height * scale) / 2, img.width * scale, img.height * scale);
  }

  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't create the PNG."))), "image/png"));
}
