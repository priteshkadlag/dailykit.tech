import { describe, expect, it } from "vitest";
import { degrees, PDFDocument, StandardFonts } from "@cantoo/pdf-lib";
import {
  addPageNumbers,
  applyStamps,
  buildFromPages,
  chunkPages,
  cropPages,
  fillForm,
  formatPageNumber,
  mergePdfs,
  pageSizes,
  protectPdf,
  readFormFields,
  replacePagesWithImages,
  splitPdf,
  unlockPdf,
} from "./edit";
import { linesToMarkdown, type TextLine } from "./markdown";
import { compareTexts, diffSequences } from "./diff";

/** A PDF whose pages say "Page N" and have distinct sizes, so order can be checked. */
async function samplePdf(pages = 3, { rotate = 0 } = {}) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 1; i <= pages; i++) {
    const page = doc.addPage([400 + i, 600]);
    page.drawText(`Page ${i}`, { x: 50, y: 500, size: 24, font });
    if (rotate) page.setRotation(degrees(rotate));
  }
  return doc.save();
}

/** Read text back with pdf.js — an independent reader — as positioned items in viewport space. */
async function readText(bytes: Uint8Array, password?: string) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const task = pdfjs.getDocument({ data: bytes.slice(), password } as never);
  const doc = await task.promise;
  const pages: { text: string; x: number; y: number; width: number; height: number }[][] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const vp = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();
    pages.push(
      (content.items as { str: string; transform: number[] }[]).map((i) => {
        const [x, y] = vp.convertToViewportPoint(i.transform[4], i.transform[5]);
        return { text: i.str, x, y, width: vp.width, height: vp.height };
      }),
    );
  }
  await task.destroy();
  return pages;
}

const widths = async (bytes: Uint8Array) => (await PDFDocument.load(bytes)).getPages().map((p) => Math.round(p.getSize().width));

describe("organise", () => {
  it("merges files in order", async () => {
    const merged = await mergePdfs([await samplePdf(2), await samplePdf(3)]);
    expect(await widths(merged)).toEqual([401, 402, 401, 402, 403]);
  });

  it("reorders, rotates, duplicates and inserts blank pages", async () => {
    const out = await buildFromPages(await samplePdf(3), [{ source: 3 }, { source: 1, rotate: 90 }, { source: null }, { source: 1 }]);
    const doc = await PDFDocument.load(out);
    expect(doc.getPages().map((p) => Math.round(p.getSize().width))).toEqual([403, 401, 401, 401]);
    expect(doc.getPages().map((p) => p.getRotation().angle)).toEqual([0, 90, 0, 0]);
    const text = await readText(out);
    expect(text[2]).toEqual([]); // blank page
    expect(text[3].map((t) => t.text)).toContain("Page 1");
  });

  it("refuses to produce an empty PDF", async () => {
    await expect(buildFromPages(await samplePdf(1), [])).rejects.toThrow(/at least one page/);
  });

  it("splits into groups", async () => {
    expect(chunkPages(5, 2)).toEqual([[1, 2], [3, 4], [5]]);
    const parts = await splitPdf(await samplePdf(5), chunkPages(5, 2));
    expect(await Promise.all(parts.map(widths))).toEqual([[401, 402], [403, 404], [405]]);
  });
});

describe("page numbers", () => {
  it("formats every style", () => {
    expect(formatPageNumber("n", 3, 9)).toBe("3");
    expect(formatPageNumber("page-n-of-total", 3, 9)).toBe("Page 3 of 9");
    expect(formatPageNumber("n-of-total", 3, 9)).toBe("3 / 9");
  });

  it("numbers the chosen pages from the start number", async () => {
    const out = await addPageNumbers(await samplePdf(3), { pages: [2, 3], position: "bottom-center", format: "page-n-of-total", startAt: 1, fontSize: 10, marginPt: 20 });
    const text = await readText(out);
    expect(text[0].some((t) => t.text.startsWith("Page 1 of"))).toBe(false);
    expect(text[1].some((t) => t.text === "Page 1 of 2")).toBe(true);
    expect(text[2].some((t) => t.text === "Page 2 of 2")).toBe(true);
  });

  it.each([0, 90, 180, 270])("puts the number at the bottom of a page rotated %i°, as the reader sees it", async (rotate) => {
    const out = await addPageNumbers(await samplePdf(1, { rotate }), { pages: [1], position: "bottom-right", format: "n", startAt: 7, fontSize: 12, marginPt: 20 });
    const item = (await readText(out))[0].find((t) => t.text === "7")!;
    expect(item).toBeDefined();
    // Baseline ~20pt above the bottom edge, and near the right edge, in viewport coordinates.
    expect(item.y).toBeGreaterThan(item.height - 30);
    expect(item.x).toBeGreaterThan(item.width - 40);
  });
});

describe("stamps and crop", () => {
  const png = Uint8Array.from(
    atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="),
    (c) => c.charCodeAt(0),
  );

  it("draws text, rectangles and images", async () => {
    const out = await applyStamps(await samplePdf(2), [
      { kind: "text", page: 1, x: 40, y: 100, text: "Approved", size: 14, color: "#1d4ed8" },
      { kind: "rect", page: 2, x: 10, y: 10, width: 50, height: 20, color: "#ffffff" },
      { kind: "image", page: 2, image: png, x: 100, y: 100, width: 80, height: 40, opacity: 0.3, angle: 45 },
    ]);
    const text = await readText(out);
    const approved = text[0].find((t) => t.text === "Approved")!;
    expect(approved.x).toBeCloseTo(40, 0);
    expect(approved.y).toBeGreaterThan(100);
    expect(approved.y).toBeLessThan(120);
  });

  it("rejects text the standard fonts can't draw", async () => {
    await expect(applyStamps(await samplePdf(1), [{ kind: "text", page: 1, x: 1, y: 1, text: "नमस्ते", size: 12, color: "#000000" }])).rejects.toThrow(/characters/);
  });

  it("crops margins from chosen pages only", async () => {
    const out = await cropPages(await samplePdf(2), [2], { top: 50, right: 20, bottom: 30, left: 10 });
    const sizes = await pageSizes(out);
    expect(sizes[0]).toEqual({ width: 401, height: 600 });
    expect(sizes[1]).toEqual({ width: 402 - 30, height: 600 - 80 });
  });

  it("maps crop margins through page rotation", async () => {
    const out = await cropPages(await samplePdf(1, { rotate: 90 }), [1], { top: 0, right: 0, bottom: 0, left: 100 });
    // Displayed 600 × 401; cutting 100 from the displayed left leaves 500 × 401.
    expect((await pageSizes(out))[0]).toEqual({ width: 500, height: 401 });
  });

  it("refuses margins that leave nothing", async () => {
    await expect(cropPages(await samplePdf(1), [1], { top: 300, right: 0, bottom: 290, left: 0 })).rejects.toThrow(/smaller margins/);
  });
});

describe("page images", () => {
  it("replaces only the given pages", async () => {
    // Smallest valid JPEG (1×1).
    const jpeg = Uint8Array.from(
      atob(
        "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=",
      ),
      (c) => c.charCodeAt(0),
    );
    const out = await replacePagesWithImages(await samplePdf(3), new Map([[2, { jpeg, width: 300, height: 200 }]]));
    const text = await readText(out);
    expect(await widths(out)).toEqual([401, 300, 403]);
    expect(text[1]).toEqual([]); // the image page has no text left to find
    expect(text[2].map((t) => t.text)).toContain("Page 3");
  });
});

describe("forms", () => {
  async function formPdf() {
    const doc = await PDFDocument.create();
    const page = doc.addPage([400, 400]);
    const form = doc.getForm();
    form.createTextField("name").addToPage(page, { x: 20, y: 300, width: 200, height: 24 });
    form.createCheckBox("agree").addToPage(page, { x: 20, y: 250, width: 16, height: 16 });
    const city = form.createDropdown("city");
    city.addOptions(["Pune", "Mumbai"]);
    city.addToPage(page, { x: 20, y: 200, width: 120, height: 24 });
    return doc.save();
  }

  it("reads and fills fields", async () => {
    const bytes = await formPdf();
    expect((await readFormFields(bytes)).map((f) => [f.name, f.type])).toEqual([
      ["name", "text"],
      ["agree", "checkbox"],
      ["city", "dropdown"],
    ]);
    const filled = await fillForm(bytes, { name: "Asha Patil", agree: true, city: "Mumbai" }, false);
    const fields = await readFormFields(filled);
    expect(fields.find((f) => f.name === "name")?.value).toBe("Asha Patil");
    expect(fields.find((f) => f.name === "agree")?.value).toBe(true);
    expect(fields.find((f) => f.name === "city")?.value).toBe("Mumbai");
  });

  it("flattening removes the fields but keeps the answers on the page", async () => {
    const flat = await fillForm(await formPdf(), { name: "Asha Patil" }, true);
    expect(await readFormFields(flat)).toEqual([]);
    expect((await readText(flat))[0].map((t) => t.text).join(" ")).toContain("Asha Patil");
  });
});

describe("passwords", () => {
  it("protect → needs the password → unlock → opens freely with the text intact", async () => {
    const locked = await protectPdf(await samplePdf(2), { password: "chai@123", allowPrinting: true, allowCopying: false, allowEditing: false });
    await expect(readText(locked)).rejects.toThrow();
    expect((await readText(locked, "chai@123"))[1].map((t) => t.text)).toContain("Page 2");

    await expect(unlockPdf(locked, "wrong")).rejects.toThrow(/password isn't right/);
    const open = await unlockPdf(locked, "chai@123");
    expect(new TextDecoder("latin1").decode(open)).not.toContain("/Encrypt");
    expect((await readText(open))[0].map((t) => t.text)).toContain("Page 1");
  });

  it("says so when there's no password to remove", async () => {
    await expect(unlockPdf(await samplePdf(1), "x")).rejects.toThrow(/doesn't have a password/);
  });

  it("other tools explain what to do with a locked file", async () => {
    const locked = await protectPdf(await samplePdf(1), { password: "p", allowPrinting: true, allowCopying: true, allowEditing: true });
    await expect(mergePdfs([locked, await samplePdf(1)])).rejects.toThrow(/Unlock PDF/);
  });
});

describe("markdown", () => {
  const line = (text: string, y: number, size = 11): TextLine => ({ text, y, size, x: 50 });

  it("builds headings, paragraphs and lists", () => {
    const md = linesToMarkdown([
      [
        line("Quarterly Report", 40, 24),
        line("Sales grew strongly this quarter across", 80),
        line("all regions, led by the west.", 94),
        line("Highlights", 130, 15),
        line("• New stores in Pune", 150),
        line("• Online orders doubled", 164),
        line("1. Hire staff", 190),
        line("2. Expand delivery", 204),
      ],
    ]);
    expect(md).toBe(
      "# Quarterly Report\n\nSales grew strongly this quarter across all regions, led by the west.\n\n## Highlights\n\n- New stores in Pune\n- Online orders doubled\n1. Hire staff\n2. Expand delivery\n",
    );
  });

  it("re-joins words hyphenated across lines and splits paragraphs on gaps", () => {
    const md = linesToMarkdown([[line("The docu-", 10), line("ment is ready.", 24), line("New paragraph here.", 70)]]);
    expect(md).toBe("The document is ready.\n\nNew paragraph here.\n");
  });

  it("escapes text that would otherwise become Markdown", () => {
    expect(linesToMarkdown([[line("# not a heading", 10)]])).toBe("\\# not a heading\n");
  });
});

describe("compare", () => {
  it("finds the minimal line diff", () => {
    expect(diffSequences(["a", "b", "c"], ["a", "x", "c"])).toEqual([
      { type: "equal", text: "a" },
      { type: "removed", text: "b" },
      { type: "added", text: "x" },
      { type: "equal", text: "c" },
    ]);
  });

  it("pairs edited lines with word-level changes and ignores spacing", () => {
    const r = compareTexts(["Total amount due: ₹5,000", "Thank  you", "Old footer"], ["Total amount due: ₹7,500", "Thank you", "Signed by Asha", "Old footer"]);
    expect(r.changed).toBe(1);
    expect(r.added).toBe(1);
    expect(r.removed).toBe(0);
    const edit = r.changes.find((c) => c.type === "changed");
    expect(edit && edit.type === "changed" && edit.words.filter((w) => w.type !== "equal").map((w) => w.text)).toEqual(["₹5,000", "₹7,500"]);
  });
});
