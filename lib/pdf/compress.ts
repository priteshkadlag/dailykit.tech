import { PDFArray, PDFDict, PDFName, PDFNumber, PDFRawStream, PDFRef, type PDFObject } from "@cantoo/pdf-lib";
import { unzlibSync } from "fflate";
import { loadPdf } from "./edit";

/**
 * Compress a PDF by re-encoding its photos (the usual reason a PDF is large) as smaller JPEGs,
 * without touching text or vector graphics. Decoding and encoding are done by a codec passed in —
 * the browser's canvas in the app — so this file stays testable in Node.
 */

export type ImageSource =
  | { kind: "jpeg"; bytes: Uint8Array; width: number; height: number }
  /** 8-bit samples, 1 (grey) or 3 (RGB) channels, rows packed with no padding. */
  | { kind: "raw"; pixels: Uint8Array; width: number; height: number; channels: 1 | 3 };

export interface ImageCodec {
  /** Re-encode as a JPEG no larger than `maxSide` pixels on its longest side. */
  toJpeg(source: ImageSource, opts: { maxSide: number; quality: number }): Promise<{ bytes: Uint8Array; width: number; height: number }>;
}

export interface CompressOptions {
  maxSide: number;
  /** JPEG quality, 0–1. */
  quality: number;
  codec: ImageCodec;
  onProgress?: (done: number, total: number) => void;
}

export interface CompressResult {
  bytes: Uint8Array;
  images: number;
  recompressed: number;
}

/** Images smaller than this aren't worth re-encoding. */
const MIN_BYTES = 12 * 1024;

const name = (s: string) => PDFName.of(s);

function filters(dict: PDFDict): PDFObject[] {
  const f = dict.lookup(name("Filter"));
  if (!f) return [];
  return f instanceof PDFArray ? f.asArray() : [f];
}

function num(dict: PDFDict, key: string) {
  const v = dict.lookup(name(key));
  return v instanceof PDFNumber ? v.asNumber() : undefined;
}

/** Channels for the colour spaces we can safely re-encode, or null. */
function channelsOf(dict: PDFDict): 1 | 3 | null {
  const cs = dict.lookup(name("ColorSpace"));
  if (cs === name("DeviceRGB")) return 3;
  if (cs === name("DeviceGray")) return 1;
  if (cs instanceof PDFArray && cs.lookup(0) === name("ICCBased")) {
    const profile = cs.lookup(1);
    const n = profile instanceof PDFRawStream ? num(profile.dict, "N") : undefined;
    if (n === 3 || n === 1) return n;
  }
  return null;
}

/** Undo PNG row predictors (Predictor ≥ 10) for 8-bit samples. */
export function unpredictPng(data: Uint8Array, width: number, channels: number): Uint8Array {
  const rowBytes = width * channels;
  const rows = Math.floor(data.length / (rowBytes + 1));
  const out = new Uint8Array(rows * rowBytes);
  for (let r = 0; r < rows; r++) {
    const type = data[r * (rowBytes + 1)];
    const src = r * (rowBytes + 1) + 1;
    const dst = r * rowBytes;
    for (let i = 0; i < rowBytes; i++) {
      const raw = data[src + i];
      const left = i >= channels ? out[dst + i - channels] : 0;
      const up = r > 0 ? out[dst - rowBytes + i] : 0;
      const upLeft = r > 0 && i >= channels ? out[dst - rowBytes + i - channels] : 0;
      let value: number;
      if (type === 1) value = raw + left;
      else if (type === 2) value = raw + up;
      else if (type === 3) value = raw + ((left + up) >> 1);
      else if (type === 4) {
        const p = left + up - upLeft;
        const pa = Math.abs(p - left);
        const pb = Math.abs(p - up);
        const pc = Math.abs(p - upLeft);
        value = raw + (pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft);
      } else value = raw;
      out[dst + i] = value & 255;
    }
  }
  return out;
}

/** Work out whether (and how) an image stream can be re-encoded. */
function readImage(stream: PDFRawStream): ImageSource | null {
  const dict = stream.dict;
  if (dict.lookup(name("Subtype")) !== name("Image")) return null;
  if (dict.lookup(name("ImageMask"))?.toString() === "true" || dict.has(name("Decode")) || dict.has(name("Mask"))) return null;
  if (num(dict, "BitsPerComponent") !== 8) return null;
  const width = num(dict, "Width");
  const height = num(dict, "Height");
  const channels = channelsOf(dict);
  if (!width || !height || !channels) return null;
  const smask = dict.lookup(name("SMask"));
  // A matted soft mask must keep the image's exact size, so leave those alone.
  if (smask instanceof PDFRawStream && smask.dict.has(name("Matte"))) return null;
  if (stream.contents.length < MIN_BYTES) return null;

  const f = filters(dict);
  if (f.length === 1 && f[0] === name("DCTDecode")) {
    return { kind: "jpeg", bytes: stream.contents, width, height };
  }
  if (f.length === 1 && f[0] === name("FlateDecode")) {
    const parms = dict.lookup(name("DecodeParms"));
    const predictor = parms instanceof PDFDict ? (num(parms, "Predictor") ?? 1) : 1;
    if (predictor !== 1 && predictor < 10) return null; // TIFF predictor: rare, skip
    let data: Uint8Array;
    try {
      data = unzlibSync(stream.contents);
    } catch {
      return null;
    }
    const pixels = predictor >= 10 ? unpredictPng(data, width, channels) : data;
    if (pixels.length < width * height * channels) return null;
    return { kind: "raw", pixels: pixels.subarray(0, width * height * channels), width, height, channels };
  }
  return null;
}

/** Re-encode every suitable image; each is replaced only if the new version is clearly smaller. */
export async function compressPdfImages(bytes: Uint8Array, { maxSide, quality, codec, onProgress }: CompressOptions): Promise<CompressResult> {
  const doc = await loadPdf(bytes);
  const candidates: [PDFRef, PDFRawStream][] = [];
  let images = 0;
  for (const [ref, obj] of doc.context.enumerateIndirectObjects()) {
    if (obj instanceof PDFRawStream && obj.dict.lookup(name("Subtype")) === name("Image")) {
      images++;
      candidates.push([ref, obj]);
    }
  }

  let recompressed = 0;
  for (let i = 0; i < candidates.length; i++) {
    const [ref, stream] = candidates[i];
    onProgress?.(i, candidates.length);
    const source = readImage(stream);
    if (!source) continue;
    let encoded;
    try {
      encoded = await codec.toJpeg(source, { maxSide, quality });
    } catch {
      continue; // an image the browser can't decode (e.g. CMYK JPEG) is kept as it is
    }
    if (encoded.bytes.length > stream.contents.length * 0.9) continue;

    const dict = stream.dict;
    const replacement = doc.context.stream(encoded.bytes, {
      Type: "XObject",
      Subtype: "Image",
      Width: encoded.width,
      Height: encoded.height,
      // Canvas JPEGs are always RGB, so grey sources become RGB; RGB ones keep their colour profile.
      ColorSpace: channelsOf(dict) === 1 ? name("DeviceRGB") : dict.get(name("ColorSpace")),
      BitsPerComponent: 8,
      Filter: "DCTDecode",
    });
    for (const key of ["SMask", "Interpolate", "Intent", "Metadata", "OC"]) {
      const value = dict.get(name(key));
      if (value) replacement.dict.set(name(key), value);
    }
    doc.context.assign(ref, replacement);
    recompressed++;
  }
  onProgress?.(candidates.length, candidates.length);
  return { bytes: await doc.save({ useObjectStreams: true }), images, recompressed };
}
