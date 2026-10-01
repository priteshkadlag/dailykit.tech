import {
  beginText,
  degrees,
  endText,
  EncryptedPDFError,
  PDFCheckBox,
  PDFDict,
  PDFDocument,
  PDFDropdown,
  PDFInvalidObject,
  PDFName,
  PDFOptionList,
  PDFRadioGroup,
  PDFTextField,
  popGraphicsState,
  pushGraphicsState,
  rgb,
  setCharacterSqueeze,
  setFontAndSize,
  setTextMatrix,
  setTextRenderingMode,
  showText,
  StandardFonts,
  TextRenderingMode,
  type PDFHexString,
  type PDFPage,
} from "@cantoo/pdf-lib";
import { formatPageNumber, isStandardFontText, type NumberFormat, type NumberPosition } from "./edit-helpers";

/**
 * PDF operations that work on the file itself (pages, stamps, forms, passwords). Pure pdf-lib: they
 * run in the browser — files never leave the device — and in Node for tests. All page numbers are
 * 1-based; all positions are in PDF points (1/72 inch) measured on the page *as displayed*, i.e.
 * after the page's own rotation, with y growing downwards like on screen.
 */

export class PdfEditError extends Error {}

export { chunkPages, formatPageNumber, isStandardFontText, MM, NUMBER_FORMATS, type NumberFormat, type NumberPosition } from "./edit-helpers";

export async function loadPdf(bytes: Uint8Array | ArrayBuffer, password?: string): Promise<PDFDocument> {
  try {
    return await PDFDocument.load(bytes, { password, updateMetadata: false });
  } catch (error) {
    if (error instanceof EncryptedPDFError) throw new PdfEditError("This PDF is password-protected. Unlock it first with the Unlock PDF tool.");
    if (error instanceof Error && /password incorrect/i.test(error.message)) throw new PdfEditError("That password isn't right. Check it and try again.");
    throw new PdfEditError("This file couldn't be read as a PDF. It may be damaged — try Repair PDF.");
  }
}

const save = (doc: PDFDocument) => doc.save({ useObjectStreams: true });

// ---------------------------------------------------------------- geometry

export type Rotation = 0 | 90 | 180 | 270;

export function normalizeRotation(angle: number): Rotation {
  return ((((Math.round(angle / 90) * 90) % 360) + 360) % 360) as Rotation;
}

/** The visible box (crop box) and the page's rotation. */
function frame(page: PDFPage) {
  const box = page.getCropBox();
  return { box, rotation: normalizeRotation(page.getRotation().angle) };
}

/** Size of the page as a reader shows it (width and height swap for 90°/270°). */
export function displaySize(page: PDFPage) {
  const { box, rotation } = frame(page);
  return rotation % 180 === 0 ? { width: box.width, height: box.height } : { width: box.height, height: box.width };
}

/** Convert a point in display space (x right, y down, points) to the page's own coordinates. */
export function displayToUser(page: PDFPage, x: number, y: number) {
  const { box, rotation } = frame(page);
  const { x: bx, y: by, width: bw, height: bh } = box;
  switch (rotation) {
    case 90:
      return { x: bx + y, y: by + x };
    case 180:
      return { x: bx + bw - x, y: by + y };
    case 270:
      return { x: bx + bw - y, y: by + bh - x };
    default:
      return { x: bx + x, y: by + bh - y };
  }
}

/**
 * Where to draw a box so it appears upright at (x, y, width, height) in display space: pdf-lib draws
 * from the box's bottom-left corner and rotates around it, so counter-rotate by the page's rotation.
 */
export function placeUpright(page: PDFPage, rect: { x: number; y: number; width: number; height: number }, extraRotation = 0) {
  const anchor = displayToUser(page, rect.x, rect.y + rect.height);
  return { ...anchor, width: rect.width, height: rect.height, rotate: degrees(frame(page).rotation + extraRotation) };
}

// ---------------------------------------------------------------- organise

/** Combine files in order. */
export async function mergePdfs(files: Uint8Array[]): Promise<Uint8Array> {
  if (files.length < 2) throw new PdfEditError("Add at least two PDFs to merge.");
  const out = await PDFDocument.create();
  for (const bytes of files) {
    const src = await loadPdf(bytes);
    const pages = await out.copyPages(src, src.getPageIndices());
    pages.forEach((p) => out.addPage(p));
  }
  return save(out);
}

export interface PagePlan {
  /** Source page (1-based), or null for a new blank page. */
  source: number | null;
  /** Extra clockwise rotation to apply. */
  rotate?: number;
}

/**
 * Build a new PDF from pages of the original in any order — the engine behind organise, remove,
 * extract and rotate. Blank pages take the size of the page before them (A4 at the start).
 */
export async function buildFromPages(bytes: Uint8Array, plan: PagePlan[]): Promise<Uint8Array> {
  if (plan.length === 0) throw new PdfEditError("The result would have no pages. Keep at least one page.");
  const src = await loadPdf(bytes);
  const total = src.getPageCount();
  const out = await PDFDocument.create();
  const used = [...new Set(plan.filter((p) => p.source !== null).map((p) => p.source! - 1))];
  if (used.some((i) => i < 0 || i >= total)) throw new PdfEditError("A selected page doesn't exist in this PDF.");
  const copied = new Map((await out.copyPages(src, used)).map((page, n) => [used[n], page]));

  let lastSize: [number, number] = [595.28, 841.89];
  for (const item of plan) {
    if (item.source === null) {
      out.addPage(lastSize);
      continue;
    }
    // The same source page can appear twice (duplicated): copy it again so each is independent.
    const page = out.getPages().includes(copied.get(item.source - 1)!) ? (await out.copyPages(src, [item.source - 1]))[0] : copied.get(item.source - 1)!;
    const added = out.addPage(page);
    if (item.rotate) added.setRotation(degrees(normalizeRotation(added.getRotation().angle + item.rotate)));
    const { width, height } = added.getSize();
    lastSize = [width, height];
  }
  return save(out);
}

/** One output file per group of pages. */
export async function splitPdf(bytes: Uint8Array, groups: number[][]): Promise<Uint8Array[]> {
  const out: Uint8Array[] = [];
  for (const pages of groups) out.push(await buildFromPages(bytes, pages.map((source) => ({ source }))));
  return out;
}

// ---------------------------------------------------------------- page numbers

export interface PageNumberOptions {
  pages: number[];
  position: NumberPosition;
  format: NumberFormat;
  startAt: number;
  fontSize: number;
  marginPt: number;
}

export async function addPageNumbers(bytes: Uint8Array, opts: PageNumberOptions): Promise<Uint8Array> {
  const doc = await loadPdf(bytes);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();
  const total = opts.startAt + opts.pages.length - 1;
  opts.pages.forEach((pageNumber, i) => {
    const page = pages[pageNumber - 1];
    if (!page) return;
    const text = formatPageNumber(opts.format, opts.startAt + i, total);
    const width = font.widthOfTextAtSize(text, opts.fontSize);
    const height = font.heightAtSize(opts.fontSize, { descender: false });
    const { width: W, height: H } = displaySize(page);
    const [vertical, horizontal] = opts.position.split("-") as ["top" | "bottom", "left" | "center" | "right"];
    const x = horizontal === "left" ? opts.marginPt : horizontal === "right" ? W - opts.marginPt - width : (W - width) / 2;
    const y = vertical === "top" ? opts.marginPt : H - opts.marginPt - height;
    const at = placeUpright(page, { x, y, width, height });
    page.drawText(text, { x: at.x, y: at.y, size: opts.fontSize, font, color: rgb(0.13, 0.13, 0.13), rotate: at.rotate });
  });
  return save(doc);
}

// ---------------------------------------------------------------- stamps (watermark, signature, edits)

export interface ImageStamp {
  kind: "image";
  page: number;
  /** PNG or JPEG bytes. */
  image: Uint8Array;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity?: number;
  /** Extra rotation in degrees, counter-clockwise, around the box centre. */
  angle?: number;
}

export interface RectStamp {
  kind: "rect";
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  /** Hex colour, e.g. #ffffff for white-out. */
  color: string;
}

export interface TextStamp {
  kind: "text";
  page: number;
  x: number;
  y: number;
  text: string;
  size: number;
  color: string;
  font?: "helvetica" | "times" | "courier";
  bold?: boolean;
  opacity?: number;
  /** Rotation in degrees, counter-clockwise, around the centre of the text block. */
  angle?: number;
  /** What (x, y) refers to: the block's top-left corner (default) or its centre. */
  anchor?: "top-left" | "center";
}

export type Stamp = ImageStamp | RectStamp | TextStamp;

const hexToRgb = (hex: string) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  const n = m ? parseInt(m[1], 16) : 0;
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};

const isPng = (b: Uint8Array) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;

const FONTS = {
  helvetica: StandardFonts.Helvetica,
  times: StandardFonts.TimesRoman,
  courier: StandardFonts.Courier,
  "helvetica-bold": StandardFonts.HelveticaBold,
  "times-bold": StandardFonts.TimesRomanBold,
  "courier-bold": StandardFonts.CourierBold,
};

/**
 * Where a point given relative to a box's centre (display space, y down) lands once the box is
 * rotated `angle` degrees counter-clockwise around that centre — in the page's own coordinates.
 */
function rotatedPoint(page: PDFPage, centre: { x: number; y: number }, dx: number, dy: number, angle: number) {
  const rad = (angle * Math.PI) / 180;
  const rx = dx * Math.cos(rad) + dy * Math.sin(rad);
  const ry = -dx * Math.sin(rad) + dy * Math.cos(rad);
  return displayToUser(page, centre.x + rx, centre.y + ry);
}

/** Draw images, rectangles and text onto pages. Identical images are embedded once. */
export async function applyStamps(bytes: Uint8Array, stamps: Stamp[]): Promise<Uint8Array> {
  const doc = await loadPdf(bytes);
  const pages = doc.getPages();
  const images = new Map<Uint8Array, Awaited<ReturnType<PDFDocument["embedPng"]>>>();
  const fonts = new Map<string, Awaited<ReturnType<PDFDocument["embedFont"]>>>();

  for (const stamp of stamps) {
    const page = pages[stamp.page - 1];
    if (!page) continue;
    if (stamp.kind === "rect") {
      const at = placeUpright(page, stamp);
      page.drawRectangle({ x: at.x, y: at.y, width: at.width, height: at.height, rotate: at.rotate, color: hexToRgb(stamp.color) });
    } else if (stamp.kind === "text") {
      if (!isStandardFontText(stamp.text)) throw new PdfEditError("This text uses characters the PDF fonts can't show.");
      const key = `${stamp.font ?? "helvetica"}${stamp.bold ? "-bold" : ""}` as keyof typeof FONTS;
      if (!fonts.has(key)) fonts.set(key, await doc.embedFont(FONTS[key]));
      const font = fonts.get(key)!;
      const lines = stamp.text.split("\n");
      const lineHeight = stamp.size * 1.2;
      const style = { size: stamp.size, font, color: hexToRgb(stamp.color), opacity: stamp.opacity };
      const angle = stamp.angle ?? 0;
      const blockWidth = Math.max(...lines.map((l) => font.widthOfTextAtSize(l, stamp.size)));
      const blockHeight = stamp.size + (lines.length - 1) * lineHeight;
      const origin = stamp.anchor === "center" ? { x: stamp.x - blockWidth / 2, y: stamp.y - blockHeight / 2 } : { x: stamp.x, y: stamp.y };
      if (angle) {
        const centre = { x: origin.x + blockWidth / 2, y: origin.y + blockHeight / 2 };
        lines.forEach((line, i) => {
          // Each line's baseline start, relative to the block centre.
          const at = rotatedPoint(page, centre, -blockWidth / 2, -blockHeight / 2 + i * lineHeight + stamp.size, angle);
          page.drawText(line, { ...style, x: at.x, y: at.y, rotate: degrees(frame(page).rotation + angle) });
        });
      } else {
        lines.forEach((line, i) => {
          const at = placeUpright(page, { x: origin.x, y: origin.y + i * lineHeight, width: 0, height: stamp.size });
          page.drawText(line, { ...style, x: at.x, y: at.y, rotate: at.rotate });
        });
      }
    } else {
      let embedded = images.get(stamp.image);
      if (!embedded) {
        embedded = isPng(stamp.image) ? await doc.embedPng(stamp.image) : await doc.embedJpg(stamp.image);
        images.set(stamp.image, embedded);
      }
      const angle = stamp.angle ?? 0;
      if (angle) {
        // Rotate around the centre: find where the bottom-left corner lands after rotating.
        const centre = { x: stamp.x + stamp.width / 2, y: stamp.y + stamp.height / 2 };
        const corner = rotatedPoint(page, centre, -stamp.width / 2, stamp.height / 2, angle);
        page.drawImage(embedded, { x: corner.x, y: corner.y, width: stamp.width, height: stamp.height, rotate: degrees(frame(page).rotation + angle), opacity: stamp.opacity });
      } else {
        const at = placeUpright(page, stamp);
        page.drawImage(embedded, { x: at.x, y: at.y, width: at.width, height: at.height, rotate: at.rotate, opacity: stamp.opacity });
      }
    }
  }
  return save(doc);
}

export interface TextLayerWord {
  text: string;
  /** Box in display points (y down). */
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Add an invisible text layer (e.g. from OCR) over the pages, so scanned pages become searchable and
 * copyable while looking exactly the same. Each word is stretched to its box. Words the standard
 * PDF fonts can't encode are skipped. Returns the new file and how many words were written.
 */
export async function addTextLayer(bytes: Uint8Array, pages: { page: number; words: TextLayerWord[] }[]): Promise<{ bytes: Uint8Array; words: number }> {
  const doc = await loadPdf(bytes);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const all = doc.getPages();
  let written = 0;
  for (const { page: n, words } of pages) {
    const page = all[n - 1];
    if (!page) continue;
    const fontKey = page.node.newFontDictionary(font.name, font.ref);
    for (const word of words) {
      const text = word.text.trim();
      if (!text || !isStandardFontText(text) || word.width <= 0 || word.height <= 0) continue;
      const size = Math.max(1, word.height * 0.9);
      const natural = font.widthOfTextAtSize(text, size);
      if (natural <= 0) continue;
      // Anchor on the baseline (about 80% down the word box), and stretch so the selection matches the word.
      const at = placeUpright(page, { x: word.x, y: word.y, width: word.width, height: word.height * 0.8 });
      page.pushOperators(...scaledInvisibleText(font.encodeText(text), fontKey, size, (word.width / natural) * 100, at.x, at.y, at.rotate.angle));
      written++;
    }
  }
  return { bytes: await save(doc), words: written };
}

/** Text render mode 3 (neither fill nor stroke): present for search and copy, never drawn. */
function scaledInvisibleText(encoded: PDFHexString, fontKey: PDFName, size: number, scale: number, x: number, y: number, angle: number) {
  const rad = (angle * Math.PI) / 180;
  const [cos, sin] = [Math.cos(rad), Math.sin(rad)];
  return [
    pushGraphicsState(),
    beginText(),
    setFontAndSize(fontKey, size),
    setTextRenderingMode(TextRenderingMode.Invisible),
    setCharacterSqueeze(scale),
    setTextMatrix(cos, sin, -sin, cos, x, y),
    showText(encoded),
    endText(),
    popGraphicsState(),
  ];
}

/** Page sizes as displayed, for laying out stamps in the browser. */
export async function pageSizes(bytes: Uint8Array) {
  const doc = await loadPdf(bytes);
  return doc.getPages().map(displaySize);
}

// ---------------------------------------------------------------- crop

export interface Margins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** Trim the given margins (points, as displayed) from the chosen pages. */
export async function cropPages(bytes: Uint8Array, pages: number[], m: Margins): Promise<Uint8Array> {
  const doc = await loadPdf(bytes);
  const all = doc.getPages();
  for (const n of pages) {
    const page = all[n - 1];
    if (!page) continue;
    const { box, rotation } = frame(page);
    // Map display-side margins onto the page's own sides.
    const side = {
      0: { l: m.left, r: m.right, t: m.top, b: m.bottom },
      90: { l: m.top, t: m.right, r: m.bottom, b: m.left },
      180: { l: m.right, r: m.left, t: m.bottom, b: m.top },
      270: { r: m.top, b: m.right, l: m.bottom, t: m.left },
    }[rotation];
    const width = box.width - side.l - side.r;
    const height = box.height - side.t - side.b;
    if (width < 36 || height < 36) throw new PdfEditError(`Those margins leave almost nothing of page ${n}. Use smaller margins.`);
    page.setCropBox(box.x + side.l, box.y + side.b, width, height);
    page.setMediaBox(box.x + side.l, box.y + side.b, width, height);
  }
  return save(doc);
}

// ---------------------------------------------------------------- page images (compress, redact, repair)

export interface PageImage {
  /** JPEG bytes of the whole page as displayed. */
  jpeg: Uint8Array;
  /** Display size in points. */
  width: number;
  height: number;
}

/**
 * Replace pages with flat images (the page's text and hidden content are gone). Used to burn in
 * redactions, and by the strongest compression. Pages not in the map are kept exactly as they were.
 */
export async function replacePagesWithImages(bytes: Uint8Array, replacements: Map<number, PageImage>): Promise<Uint8Array> {
  const src = await loadPdf(bytes);
  const out = await PDFDocument.create();
  const total = src.getPageCount();
  const kept = Array.from({ length: total }, (_, i) => i).filter((i) => !replacements.has(i + 1));
  const copied = new Map((await out.copyPages(src, kept)).map((p, n) => [kept[n], p]));
  for (let i = 0; i < total; i++) {
    const image = replacements.get(i + 1);
    if (!image) {
      out.addPage(copied.get(i)!);
      continue;
    }
    const page = out.addPage([image.width, image.height]);
    const embedded = await out.embedJpg(image.jpeg);
    page.drawImage(embedded, { x: 0, y: 0, width: image.width, height: image.height });
  }
  return save(out);
}

/** Rewrite the file with compact cross-reference streams; drops unused objects. Keeps text selectable. */
export async function resavePdf(bytes: Uint8Array): Promise<Uint8Array> {
  const doc = await loadPdf(bytes);
  return save(doc);
}

// ---------------------------------------------------------------- forms

export type FormField =
  | { name: string; type: "text"; value: string; multiline: boolean; maxLength?: number }
  | { name: string; type: "checkbox"; value: boolean }
  | { name: string; type: "dropdown" | "radio" | "list"; value: string; options: string[] };

export async function readFormFields(bytes: Uint8Array): Promise<FormField[]> {
  const doc = await loadPdf(bytes);
  const fields: FormField[] = [];
  for (const field of doc.getForm().getFields()) {
    const name = field.getName();
    if (field instanceof PDFTextField) {
      fields.push({ name, type: "text", value: field.getText() ?? "", multiline: field.isMultiline(), maxLength: field.getMaxLength() });
    } else if (field instanceof PDFCheckBox) fields.push({ name, type: "checkbox", value: field.isChecked() });
    else if (field instanceof PDFDropdown) fields.push({ name, type: "dropdown", value: field.getSelected()[0] ?? "", options: field.getOptions() });
    else if (field instanceof PDFOptionList) fields.push({ name, type: "list", value: field.getSelected()[0] ?? "", options: field.getOptions() });
    else if (field instanceof PDFRadioGroup) fields.push({ name, type: "radio", value: field.getSelected() ?? "", options: field.getOptions() });
  }
  return fields;
}

/** Fill form fields by name. `flatten` bakes the answers into the page so they can't be edited. */
export async function fillForm(bytes: Uint8Array, values: Record<string, string | boolean>, flatten: boolean): Promise<Uint8Array> {
  const doc = await loadPdf(bytes);
  const form = doc.getForm();
  for (const field of form.getFields()) {
    const name = field.getName();
    if (!(name in values)) continue;
    const value = values[name];
    if (field instanceof PDFTextField) {
      const text = String(value);
      if (!isStandardFontText(text)) throw new PdfEditError(`“${name}”: this form's font can only show English letters, numbers and common symbols.`);
      field.setText(text || undefined);
    } else if (field instanceof PDFCheckBox) {
      if (value) field.check();
      else field.uncheck();
    } else if (field instanceof PDFDropdown || field instanceof PDFOptionList) {
      if (value) field.select(String(value));
      else field.clear();
    } else if (field instanceof PDFRadioGroup) {
      if (value) field.select(String(value));
      else field.clear();
    }
  }
  if (flatten) form.flatten();
  return save(doc);
}

// ---------------------------------------------------------------- passwords

export interface ProtectOptions {
  /** Needed to open the file. */
  password: string;
  allowPrinting: boolean;
  allowCopying: boolean;
  allowEditing: boolean;
}

/** AES-256 encryption. A separate random owner password keeps the permissions enforceable. */
export async function protectPdf(bytes: Uint8Array, opts: ProtectOptions): Promise<Uint8Array> {
  const doc = await loadPdf(bytes);
  const owner = Array.from(crypto.getRandomValues(new Uint8Array(24)), (b) => b.toString(16).padStart(2, "0")).join("");
  doc.encrypt({
    userPassword: opts.password,
    ownerPassword: owner,
    algorithm: "AES-256",
    permissions: {
      printing: opts.allowPrinting ? "highResolution" : false,
      copying: opts.allowCopying,
      modifying: opts.allowEditing,
      annotating: opts.allowEditing,
      fillingForms: true,
      contentAccessibility: true,
      documentAssembly: opts.allowEditing,
    },
  });
  return doc.save();
}

export async function isEncrypted(bytes: Uint8Array) {
  try {
    await PDFDocument.load(bytes, { updateMetadata: false });
    return false;
  } catch (error) {
    return error instanceof EncryptedPDFError;
  }
}

const rawText = (obj: PDFInvalidObject) => {
  const buf = new Uint8Array(obj.sizeInBytes());
  obj.copyBytesInto(buf, 0);
  return new TextDecoder("latin1").decode(buf);
};

/** Remove the password (you need to know it). The saved copy opens without one. */
export async function unlockPdf(bytes: Uint8Array, password: string): Promise<Uint8Array> {
  if (!(await isEncrypted(bytes))) throw new PdfEditError("This PDF doesn't have a password, so there's nothing to unlock.");
  const doc = await loadPdf(bytes, password);
  // pdf-lib decrypts the objects but keeps two leftovers that would make readers think the new file is
  // still encrypted: the old cross-reference stream (which names the Encrypt dictionary) and that dictionary.
  for (const [ref, obj] of doc.context.enumerateIndirectObjects()) {
    if (obj instanceof PDFInvalidObject && /\/Type\s*\/XRef/.test(rawText(obj))) doc.context.delete(ref);
    else if (obj instanceof PDFDict && String(obj.get(PDFName.of("Filter"))) === "/Standard" && obj.has(PDFName.of("O")) && obj.has(PDFName.of("U"))) {
      doc.context.delete(ref);
    }
  }
  return save(doc);
}
