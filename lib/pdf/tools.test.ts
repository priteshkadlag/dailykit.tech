import { describe, expect, it } from "vitest";
import { deflateSync, crc32 } from "node:zlib";
import { PDFDocument, PDFName, PDFRawStream, rgb, StandardFonts } from "@cantoo/pdf-lib";
import { sniffMime, DOCX_MIME, PPTX_MIME, XLSX_MIME } from "@/lib/files/validation";
import { addTextLayer, applyStamps, unlockPdf } from "./edit";
import { markdownToDocx } from "./docx";
import { compressPdfImages, unpredictPng, type ImageCodec } from "./compress";
import { convertToPdfA, srgbIccProfile, unembeddedFonts } from "./pdfa";
import { cellValue, findInFragments, fragmentsToLines, fragmentsToTable, type TextFragment } from "./text";
import { keywords, splitSentences, summarize } from "./summarize";
import { planBreaks } from "./dom-to-pdf";

async function readText(bytes: Uint8Array) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const task = pdfjs.getDocument({ data: bytes.slice() } as never);
  const doc = await task.promise;
  const pages: { text: string; x: number; y: number }[][] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const vp = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();
    pages.push(
      (content.items as { str: string; transform: number[] }[]).map((i) => {
        const [x, y] = vp.convertToViewportPoint(i.transform[4], i.transform[5]);
        return { text: i.str, x, y };
      }),
    );
  }
  await task.destroy();
  return pages;
}

async function blankPdf(pages = 1) {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i++) doc.addPage([400, 600]).drawRectangle({ x: 20, y: 20, width: 50, height: 50, color: rgb(0.2, 0.4, 0.8) });
  return doc.save();
}

/** A real RGB PNG (noisy, so it doesn't compress to nothing). */
function pngBytes(width: number, height: number) {
  const chunk = (type: string, data: Buffer) => {
    const body = Buffer.concat([Buffer.from(type, "latin1"), data]);
    const out = Buffer.alloc(12 + data.length);
    out.writeUInt32BE(data.length, 0);
    body.copy(out, 4);
    out.writeUInt32BE(crc32(body) >>> 0, 8 + data.length);
    return out;
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.set([8, 2, 0, 0, 0], 8); // 8-bit RGB
  const raw = Buffer.alloc((width * 3 + 1) * height);
  let seed = 7;
  for (let i = 0; i < raw.length; i++) {
    seed = (Math.imul(seed, 1103515245) + 12345) >>> 0;
    raw[i] = i % (width * 3 + 1) === 0 ? 0 : seed >>> 24;
  }
  return new Uint8Array(Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]));
}

describe("stamps", () => {
  it("draws rotated, semi-transparent watermark text", async () => {
    const out = await applyStamps(await blankPdf(), [{ kind: "text", page: 1, x: 100, y: 280, text: "CONFIDENTIAL", size: 40, color: "#888888", opacity: 0.3, angle: 45, bold: true }]);
    const [page] = await readText(out);
    expect(page.map((i) => i.text).join("")).toContain("CONFIDENTIAL");
    // Rotated around its centre, so it stays on the page.
    for (const item of page) {
      expect(item.x).toBeGreaterThan(0);
      expect(item.y).toBeLessThan(600);
    }
  });
});

describe("OCR text layer", () => {
  it("adds invisible, searchable words where they appear on the page", async () => {
    const { bytes, words } = await addTextLayer(await blankPdf(), [
      { page: 1, words: [{ text: "Invoice", x: 50, y: 100, width: 80, height: 20 }, { text: "नमस्ते", x: 50, y: 140, width: 60, height: 20 }] },
    ]);
    expect(words).toBe(1); // the Devanagari word can't be written with the standard fonts
    const [page] = await readText(bytes);
    const item = page.find((i) => i.text === "Invoice")!;
    expect(item).toBeDefined();
    expect(item.x).toBeCloseTo(50, 0);
    expect(item.y).toBeGreaterThan(100);
    expect(item.y).toBeLessThan(120);
  });
});

describe("PDF/A", () => {
  it("builds a well-formed sRGB ICC profile", () => {
    const icc = srgbIccProfile();
    const view = new DataView(icc.buffer);
    expect(view.getUint32(0)).toBe(icc.length);
    expect(String.fromCharCode(...icc.slice(36, 40))).toBe("acsp");
    expect(String.fromCharCode(...icc.slice(12, 20))).toBe("mntrRGB ");
    const count = view.getUint32(128);
    expect(count).toBe(9);
    for (let i = 0; i < count; i++) {
      const offset = view.getUint32(132 + i * 12 + 4);
      const size = view.getUint32(132 + i * 12 + 8);
      expect(offset % 4).toBe(0);
      expect(offset + size).toBeLessThanOrEqual(icc.length);
    }
  });

  it("finds fonts that aren't embedded", async () => {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    doc.addPage().drawText("Hello", { x: 50, y: 50, font });
    expect(unembeddedFonts(await PDFDocument.load(await doc.save()))).toEqual(["Helvetica"]);
  });

  it("adds identification, colour profile, file ID and matching info", async () => {
    const { bytes, rasterized } = await convertToPdfA(await blankPdf(2), { title: "Annual report – 2025" });
    expect(rasterized).toBe(false);
    const doc = await PDFDocument.load(bytes, { updateMetadata: false });
    const metadata = doc.catalog.lookup(PDFName.of("Metadata")) as PDFRawStream;
    const xmp = new TextDecoder().decode(metadata.contents);
    expect(xmp).toContain("<pdfaid:part>2</pdfaid:part>");
    expect(xmp).toContain("<pdfaid:conformance>B</pdfaid:conformance>");
    expect(xmp).toContain("Annual report – 2025");
    const intents = doc.catalog.lookup(PDFName.of("OutputIntents"));
    expect(intents?.toString()).toContain("GTS_PDFA1");
    expect(doc.getProducer()).toBe("DailyKit");
    expect(doc.getTitle()).toBe("Annual report – 2025");
    expect(doc.context.trailerInfo.ID).toBeDefined();
    expect(doc.getPageCount()).toBe(2);
  });

  it("asks for page images when fonts would be missing", async () => {
    const doc = await PDFDocument.create();
    doc.addPage().drawText("Hello", { x: 50, y: 50, font: await doc.embedFont(StandardFonts.Helvetica) });
    await expect(convertToPdfA(await doc.save(), { title: "x" })).rejects.toThrow(/Page images/);
  });
});

describe("compress", () => {
  it("undoes PNG predictors", () => {
    // Two 2-pixel grey rows: "Sub" filter then "Up" filter.
    const data = new Uint8Array([1, 10, 5, 2, 1, 1]);
    expect([...unpredictPng(data, 2, 1)]).toEqual([10, 15, 11, 16]);
  });

  it("replaces large images with smaller JPEGs and keeps the rest", async () => {
    const doc = await PDFDocument.create();
    const image = await doc.embedPng(pngBytes(120, 90));
    doc.addPage([400, 400]).drawImage(image, { x: 10, y: 10, width: 120, height: 90 });
    const bytes = await doc.save();

    const seen: { kind: string; width: number; height: number }[] = [];
    const fakeJpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
    const codec: ImageCodec = {
      async toJpeg(source, { maxSide }) {
        seen.push({ kind: source.kind, width: source.width, height: source.height });
        if (source.kind === "raw") expect(source.pixels.length).toBe(120 * 90 * 3);
        const scale = Math.min(1, maxSide / Math.max(source.width, source.height));
        return { bytes: fakeJpeg, width: Math.round(source.width * scale), height: Math.round(source.height * scale) };
      },
    };
    const result = await compressPdfImages(bytes, { maxSide: 60, quality: 0.6, codec });
    expect(seen).toEqual([{ kind: "raw", width: 120, height: 90 }]);
    expect(result).toMatchObject({ images: 1, recompressed: 1 });
    expect(result.bytes.length).toBeLessThan(bytes.length);

    const out = await PDFDocument.load(result.bytes);
    const images = [...out.context.enumerateIndirectObjects()].map(([, o]) => o).filter((o): o is PDFRawStream => o instanceof PDFRawStream && o.dict.get(PDFName.of("Subtype")) === PDFName.of("Image"));
    expect(images).toHaveLength(1);
    expect(images[0].dict.get(PDFName.of("Filter"))).toBe(PDFName.of("DCTDecode"));
    expect(images[0].dict.get(PDFName.of("Width"))?.toString()).toBe("60");
  });
});

const frag = (text: string, x: number, y: number, width = text.length * 5, size = 10): TextFragment => ({ text, x, y, width, size });

describe("text layout", () => {
  it("joins fragments into lines", () => {
    const lines = fragmentsToLines([frag("World", 60, 100), frag("Hello", 20, 100.5), frag("Next line", 20, 120)]);
    expect(lines.map((l) => l.text)).toEqual(["Hello World", "Next line"]);
  });

  it("lays tables out in aligned columns", () => {
    const rows = fragmentsToTable([
      frag("Item", 20, 100), frag("Qty", 200, 100), frag("Amount", 300, 100),
      frag("Pen", 20, 115), frag("2", 200, 115), frag("1,20,000.50", 300, 115),
      frag("Note", 20, 130), frag("—", 300, 130),
    ]);
    expect(rows).toEqual([
      ["Item", "Qty", "Amount"],
      ["Pen", "2", "1,20,000.50"],
      ["Note", "", "—"],
    ]);
  });

  it("turns numbers into numbers but keeps codes as text", () => {
    expect(cellValue("1,20,000.50")).toBe(120000.5);
    expect(cellValue("1,234")).toBe(1234);
    expect(cellValue("-42")).toBe(-42);
    expect(cellValue("0042")).toBe("0042");
    expect(cellValue("12%")).toBe("12%");
    expect(cellValue("GST 18")).toBe("GST 18");
  });

  it("finds every match to redact", () => {
    const boxes = findInFragments([frag("PAN: ABCDE1234F and ABCDE1234F", 10, 100, 150)], "abcde1234f", 2);
    expect(boxes).toHaveLength(2);
    expect(boxes[0].page).toBe(2);
    expect(boxes[0].x).toBeGreaterThan(10);
    expect(boxes[1].x).toBeGreaterThan(boxes[0].x + boxes[0].width - 5);
  });
});

describe("summaries", () => {
  const text =
    "Solar power is growing quickly across India. Rooftop solar panels cut electricity bills for homes and shops. " +
    "The weather was pleasant yesterday. Government subsidies make rooftop solar panels cheaper to install. " +
    "Many families now use solar power for fans, lights and pumps. Dr. Rao said solar power adoption doubled. " +
    "Cricket scores were high last week. Net metering lets homes sell extra solar power back to the grid.";

  it("splits sentences without breaking at abbreviations", () => {
    expect(splitSentences("Dr. Rao paid Rs. 500. It worked!")).toEqual(["Dr. Rao paid Rs. 500.", "It worked!"]);
  });

  it("picks on-topic sentences in their original order", () => {
    const summary = summarize(text, "short");
    expect(summary.length).toBeGreaterThanOrEqual(3);
    expect(summary.join(" ")).not.toMatch(/weather|Cricket/);
    const order = summary.map((s) => text.indexOf(s));
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(keywords(text, 3)).toContain("solar");
  });
});

describe("page breaks", () => {
  it("never cuts through a line", () => {
    const lines = Array.from({ length: 30 }, (_, i) => ({ top: i * 20 + 2, bottom: i * 20 + 18 }));
    const slices = planBreaks(lines, 600, 250);
    expect(slices[0]).toEqual({ start: 0, end: 242 });
    for (const s of slices) {
      expect(s.end - s.start).toBeLessThanOrEqual(250);
      for (const l of lines) expect(l.top < s.end && l.bottom > s.end).toBe(false);
    }
    expect(slices[slices.length - 1].end).toBe(600);
  });

  it("cuts a block taller than a page", () => {
    expect(planBreaks([{ top: 0, bottom: 900 }], 900, 400)).toEqual([
      { start: 0, end: 400 },
      { start: 400, end: 800 },
      { start: 800, end: 900 },
    ]);
  });
});

describe("file types", () => {
  const zip = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 20, 0, 0, 0, 8, 0, 1, 2, 3, 4, 5, 6]);
  it("tells office files apart by extension once the content is a ZIP", () => {
    expect(sniffMime(zip, "report.docx")).toBe(DOCX_MIME);
    expect(sniffMime(zip, "sheet.XLSX")).toBe(XLSX_MIME);
    expect(sniffMime(zip, "deck.pptx")).toBe(PPTX_MIME);
    expect(sniffMime(zip, "archive.zip")).toBeNull();
    expect(sniffMime(new TextEncoder().encode("<!doctype html><p>"), "page.html")).toBe("text/html");
    expect(sniffMime(new Uint8Array([0x4d, 0x5a, 0, 0]), "virus.html")).toBeNull();
  });
});

describe("passwords", () => {
  it("removes restrictions from a PDF that opens without a password", async () => {
    const doc = await PDFDocument.load(await blankPdf());
    doc.encrypt({ userPassword: "", ownerPassword: "owner-secret", permissions: { printing: false, copying: false } });
    const locked = await doc.save();
    const unlocked = await unlockPdf(locked, "");
    await expect(PDFDocument.load(unlocked)).resolves.toBeDefined();
  });
});

describe("centred stamps", () => {
  it("centres a watermark on its anchor point", async () => {
    const out = await applyStamps(await blankPdf(), [{ kind: "text", page: 1, x: 200, y: 300, anchor: "center", text: "DRAFT", size: 40, color: "#000000" }]);
    const [page] = await readText(out);
    const item = page.find((i) => i.text === "DRAFT")!;
    // Helvetica "DRAFT" at 40pt is 133.3pt wide, so its left edge sits 66.7pt left of centre.
    expect(item.x).toBeCloseTo(200 - 133.32 / 2, 0);
    expect(item.y).toBeGreaterThan(300);
    expect(item.y).toBeLessThan(325);
  });
});

describe("Word output", () => {
  it("keeps headings, lists and page breaks", async () => {
    const blob = await markdownToDocx("# Title\n\nFirst paragraph\ncontinues.\n\n- one\n- two\n\n1. first\n\n---\n\n\\# not a heading");
    const { unzipSync, strFromU8 } = await import("fflate");
    const xml = strFromU8(unzipSync(new Uint8Array(await blob.arrayBuffer()))["word/document.xml"]);
    expect(xml).toContain('w:val="Heading1"');
    expect(xml).toContain("First paragraph continues.");
    expect(xml.match(/<w:numPr>/g)?.length).toBe(3);
    expect(xml).toContain('w:type="page"');
    expect(xml).toContain("# not a heading");
  });
});
