export const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
export const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
export const PPTX_MIME = "application/vnd.openxmlformats-officedocument.presentationml.presentation";

export type SupportedMime =
  | "image/jpeg"
  | "image/png"
  | "image/webp"
  | "image/gif"
  | "image/x-icon"
  | "application/pdf"
  | typeof DOCX_MIME
  | typeof XLSX_MIME
  | typeof PPTX_MIME
  | "application/vnd.ms-excel"
  | "text/csv"
  | "text/html";

export const IMAGE_MIMES: SupportedMime[] = ["image/jpeg", "image/png", "image/webp"];
export const GIF_MIMES: SupportedMime[] = ["image/gif"];
export const ICO_MIMES: SupportedMime[] = ["image/x-icon"];

export const MIME_LABEL: Record<SupportedMime, string> = {
  "image/jpeg": "JPG",
  "image/png": "PNG",
  "image/webp": "WEBP",
  "image/gif": "GIF",
  "image/x-icon": "ICO",
  "application/pdf": "PDF",
  [DOCX_MIME]: "DOCX",
  [XLSX_MIME]: "XLSX",
  [PPTX_MIME]: "PPTX",
  "application/vnd.ms-excel": "XLS",
  "text/csv": "CSV",
  "text/html": "HTML",
};

/** Value for a file input's `accept`: the MIME type plus extensions, since OSes label office files inconsistently. */
export const ACCEPT_ATTR: Record<SupportedMime, string> = {
  "image/jpeg": "image/jpeg",
  "image/png": "image/png",
  "image/webp": "image/webp",
  "image/gif": ".gif,image/gif",
  "image/x-icon": ".ico,image/x-icon,image/vnd.microsoft.icon",
  "application/pdf": "application/pdf",
  [DOCX_MIME]: `.docx,${DOCX_MIME}`,
  [XLSX_MIME]: `.xlsx,.xlsm,${XLSX_MIME}`,
  [PPTX_MIME]: `.pptx,${PPTX_MIME}`,
  "application/vnd.ms-excel": ".xls,application/vnd.ms-excel",
  "text/csv": ".csv,text/csv",
  "text/html": ".html,.htm,text/html",
};

/** "2.4 MB", "420 KB", "830 B" — decimal-free under 10 KB is fine for humans. */
export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb < 10 ? kb.toFixed(1) : Math.round(kb)} KB`;
  const mb = kb / 1024;
  return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`;
}

/**
 * Identify a file by its first bytes ("magic numbers") rather than trusting its name or the
 * browser-reported type, so a renamed file can't slip through as an image or PDF.
 */
export function sniffMime(bytes: Uint8Array, name = ""): SupportedMime | null {
  const at = (i: number, ...values: number[]) => values.every((v, j) => bytes[i + j] === v);
  const ext = name.toLowerCase().split(".").pop() ?? "";
  if (at(0, 0xff, 0xd8, 0xff)) return "image/jpeg";
  if (at(0, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "image/png";
  if (at(0, 0x52, 0x49, 0x46, 0x46) && at(8, 0x57, 0x45, 0x42, 0x50)) return "image/webp";
  if (at(0, 0x47, 0x49, 0x46, 0x38) && (bytes[4] === 0x37 || bytes[4] === 0x39) && bytes[5] === 0x61) return "image/gif";
  if (at(0, 0x00, 0x00, 0x01, 0x00)) return "image/x-icon";
  if (at(0, 0x25, 0x50, 0x44, 0x46, 0x2d)) return "application/pdf";
  // Office Open XML files are ZIP archives; which kind is told by the extension (the parser checks the inside).
  if (at(0, 0x50, 0x4b, 0x03, 0x04)) return ({ docx: DOCX_MIME, xlsx: XLSX_MIME, xlsm: XLSX_MIME, pptx: PPTX_MIME } as Record<string, SupportedMime>)[ext] ?? null;
  // Legacy Office (OLE compound file): only old Excel workbooks can be read.
  if (at(0, 0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1)) return ext === "xls" ? "application/vnd.ms-excel" : null;
  // Text formats have no signature: accept by extension when the start holds no binary bytes.
  const isText = bytes.length > 0 && !bytes.some((b) => b === 0);
  if (isText && ext === "csv") return "text/csv";
  if (isText && (ext === "html" || ext === "htm")) return "text/html";
  return null;
}

export interface FileRules {
  accept: SupportedMime[];
  maxBytes: number;
  maxCount: number;
}

export interface Rejection {
  name: string;
  reason: string;
}

export interface AcceptedFile {
  file: File;
  mime: SupportedMime;
}

/** Checks count, size and real file type. Returns the accepted files plus a reason for each rejection. */
export async function validateFiles(files: File[], rules: FileRules, alreadySelected = 0) {
  const accepted: AcceptedFile[] = [];
  const rejected: Rejection[] = [];
  const allowed = rules.accept.map((m) => MIME_LABEL[m]).join(", ");

  for (const file of files) {
    if (alreadySelected + accepted.length >= rules.maxCount) {
      rejected.push({ name: file.name, reason: `Limit of ${rules.maxCount} file${rules.maxCount === 1 ? "" : "s"} reached` });
      continue;
    }
    if (file.size === 0) {
      rejected.push({ name: file.name, reason: "File is empty" });
      continue;
    }
    if (file.size > rules.maxBytes) {
      rejected.push({ name: file.name, reason: `Larger than ${formatBytes(rules.maxBytes)}` });
      continue;
    }
    const mime = sniffMime(new Uint8Array(await file.slice(0, 16).arrayBuffer()), file.name);
    if (!mime || !rules.accept.includes(mime)) {
      const legacy = /\.(doc|ppt)$/i.exec(file.name);
      rejected.push({
        name: file.name,
        reason: legacy ? `Old .${legacy[1].toLowerCase()} files can't be read here — open it and save as .${legacy[1].toLowerCase()}x first` : `Not a supported file (${allowed} only)`,
      });
      continue;
    }
    accepted.push({ file, mime });
  }
  return { accepted, rejected };
}

/** Swap or add an extension: ("photo.png", "jpg") → "photo.jpg". */
export function withExtension(name: string, ext: string) {
  const base = name.replace(/\.[^./\\]+$/, "") || "file";
  return `${base}.${ext}`;
}

/** Make file names unique inside a ZIP: a.jpg, a (2).jpg, a (3).jpg … */
export function uniqueNames(names: string[]) {
  const seen = new Map<string, number>();
  return names.map((name) => {
    const count = seen.get(name.toLowerCase()) ?? 0;
    seen.set(name.toLowerCase(), count + 1);
    if (count === 0) return name;
    const dot = name.lastIndexOf(".");
    return dot > 0 ? `${name.slice(0, dot)} (${count + 1})${name.slice(dot)}` : `${name} (${count + 1})`;
  });
}
