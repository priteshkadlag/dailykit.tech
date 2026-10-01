import { PDFArray, PDFDict, PDFHexString, PDFName, PDFNumber, PDFStream, PDFString, type PDFDocument } from "@cantoo/pdf-lib";
import { loadPdf, replacePagesWithImages, type PageImage } from "./edit";

/**
 * PDF/A-2b ("archival") conversion. PDF/A asks for: every font embedded, an embedded colour profile
 * (OutputIntent), XMP metadata that matches the document info, a file ID, and no JavaScript,
 * encryption, attachments or other dynamic content. Fonts can't be embedded after the fact, so
 * files that rely on the reader's fonts are rebuilt from page images instead.
 */

// ---------------------------------------------------------------- sRGB colour profile

const s15Fixed16 = (v: number) => Math.round(v * 65536);

/**
 * A compact ICC v2 display profile for sRGB (D65 white, sRGB primaries adapted to D50, gamma 2.2).
 * Built in code so no binary profile has to ship with the app.
 */
export function srgbIccProfile(): Uint8Array {
  const ascii = (s: string) => Array.from(s, (c) => c.charCodeAt(0));
  const u32 = (n: number) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
  const u16 = (n: number) => [(n >>> 8) & 255, n & 255];
  const xyz = (x: number, y: number, z: number) => [...ascii("XYZ "), 0, 0, 0, 0, ...u32(s15Fixed16(x)), ...u32(s15Fixed16(y)), ...u32(s15Fixed16(z))];
  const description = "sRGB IEC61966-2.1";
  const desc = [
    ...ascii("desc"), 0, 0, 0, 0,
    ...u32(description.length + 1), ...ascii(description), 0,
    ...u32(0), ...u32(0), // Unicode language and length
    ...u16(0), 0, ...new Array(67).fill(0), // ScriptCode code, length and the fixed 67-byte field
  ];
  const cprt = [...ascii("text"), 0, 0, 0, 0, ...ascii("No copyright, use freely"), 0];
  const curve = [...ascii("curv"), 0, 0, 0, 0, ...u32(1), ...u16(0x0233)]; // gamma 2.2 as u8Fixed8

  const tags: [string, number[]][] = [
    ["desc", desc],
    ["cprt", cprt],
    ["wtpt", xyz(0.9505, 1, 1.089)],
    ["rXYZ", xyz(0.4361, 0.2225, 0.0139)],
    ["gXYZ", xyz(0.3851, 0.7169, 0.0971)],
    ["bXYZ", xyz(0.1431, 0.0606, 0.7141)],
    ["rTRC", curve],
  ];
  // The three tone curves are identical, so the green and blue tags point at the red one's data.
  const shared: [string, string][] = [["gTRC", "rTRC"], ["bTRC", "rTRC"]];

  const tableSize = 4 + (tags.length + shared.length) * 12;
  let offset = 128 + tableSize;
  const placed = new Map<string, { offset: number; size: number }>();
  const data: number[] = [];
  for (const [sig, bytes] of tags) {
    placed.set(sig, { offset, size: bytes.length });
    const padded = [...bytes, ...new Array((4 - (bytes.length % 4)) % 4).fill(0)];
    data.push(...padded);
    offset += padded.length;
  }
  const table = [...u32(tags.length + shared.length)];
  for (const [sig] of tags) table.push(...ascii(sig), ...u32(placed.get(sig)!.offset), ...u32(placed.get(sig)!.size));
  for (const [sig, source] of shared) table.push(...ascii(sig), ...u32(placed.get(source)!.offset), ...u32(placed.get(source)!.size));

  const total = 128 + table.length + data.length;
  const header = [
    ...u32(total),
    0, 0, 0, 0, // preferred CMM
    0x02, 0x10, 0, 0, // version 2.1
    ...ascii("mntr"), ...ascii("RGB "), ...ascii("XYZ "),
    ...u16(2024), ...u16(1), ...u16(1), ...u16(0), ...u16(0), ...u16(0),
    ...ascii("acsp"),
    0, 0, 0, 0, // platform
    0, 0, 0, 0, // flags
    0, 0, 0, 0, // manufacturer
    0, 0, 0, 0, // model
    0, 0, 0, 0, 0, 0, 0, 0, // attributes
    0, 0, 0, 0, // perceptual intent
    ...u32(s15Fixed16(0.9642)), ...u32(s15Fixed16(1)), ...u32(s15Fixed16(0.8249)), // D50 illuminant
    0, 0, 0, 0, // creator
  ];
  const out = new Uint8Array(total);
  out.set(header, 0); // the profile ID and reserved bytes up to 128 stay zero
  out.set(table, 128);
  out.set(data, 128 + table.length);
  return out;
}

// ---------------------------------------------------------------- fonts

const FONT_FILES = ["FontFile", "FontFile2", "FontFile3"].map((k) => PDFName.of(k));

/** Names of fonts the file uses but doesn't include (the reader has to supply them). */
export function unembeddedFonts(doc: PDFDocument): string[] {
  const missing = new Set<string>();
  for (const [, obj] of doc.context.enumerateIndirectObjects()) {
    if (!(obj instanceof PDFDict) || obj.get(PDFName.of("Type")) !== PDFName.of("Font")) continue;
    const subtype = obj.get(PDFName.of("Subtype"));
    // Type 3 fonts are drawn from the file itself; Type 0 fonts are checked through their descendant.
    if (subtype === PDFName.of("Type3") || subtype === PDFName.of("Type0")) continue;
    const descriptor = obj.lookup(PDFName.of("FontDescriptor"));
    if (!(descriptor instanceof PDFDict) || !FONT_FILES.some((k) => descriptor.has(k))) {
      missing.add(String(obj.get(PDFName.of("BaseFont")) ?? "Unnamed font").replace(/^\//, ""));
    }
  }
  return [...missing].sort();
}

// ---------------------------------------------------------------- metadata

const xmlEscape = (s: string) => s.replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[c]!);

/** XMP with the PDF/A-2b identification; values mirror the document info dictionary exactly. */
export function pdfaXmp({ title, date, tool }: { title: string; date: Date; tool: string }) {
  const iso = date.toISOString().replace(/\.\d{3}Z$/, "Z");
  return `<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
 <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
  <rdf:Description rdf:about=""
    xmlns:pdfaid="http://www.aiim.org/pdfa/ns/id/"
    xmlns:dc="http://purl.org/dc/elements/1.1/"
    xmlns:xmp="http://ns.adobe.com/xap/1.0/"
    xmlns:pdf="http://ns.adobe.com/pdf/1.3/">
   <pdfaid:part>2</pdfaid:part>
   <pdfaid:conformance>B</pdfaid:conformance>
   <dc:format>application/pdf</dc:format>
   <dc:title><rdf:Alt><rdf:li xml:lang="x-default">${xmlEscape(title)}</rdf:li></rdf:Alt></dc:title>
   <xmp:CreatorTool>${xmlEscape(tool)}</xmp:CreatorTool>
   <xmp:CreateDate>${iso}</xmp:CreateDate>
   <xmp:ModifyDate>${iso}</xmp:ModifyDate>
   <xmp:MetadataDate>${iso}</xmp:MetadataDate>
   <pdf:Producer>${xmlEscape(tool)}</pdf:Producer>
  </rdf:Description>
 </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
}

// ---------------------------------------------------------------- conversion

/** Remove what PDF/A forbids: scripts, automatic actions, attachments, XFA forms. */
function stripDynamicContent(doc: PDFDocument) {
  const catalog = doc.catalog;
  const n = (s: string) => PDFName.of(s);
  catalog.delete(n("AA"));
  const openAction = catalog.lookup(n("OpenAction"));
  if (openAction instanceof PDFDict && openAction.get(n("S")) !== n("GoTo")) catalog.delete(n("OpenAction"));
  const names = catalog.lookup(n("Names"));
  if (names instanceof PDFDict) {
    names.delete(n("JavaScript"));
    names.delete(n("EmbeddedFiles"));
  }
  const acroForm = catalog.lookup(n("AcroForm"));
  if (acroForm instanceof PDFDict) {
    acroForm.delete(n("XFA"));
    acroForm.delete(n("NeedAppearances"));
  }
  for (const page of doc.getPages()) {
    page.node.delete(n("AA"));
    const annots = page.node.lookup(n("Annots"));
    if (!(annots instanceof PDFArray)) continue;
    const kept = [];
    for (let i = 0; i < annots.size(); i++) {
      const annot = annots.lookup(i);
      if (!(annot instanceof PDFDict)) continue;
      const subtype = annot.get(n("Subtype"));
      // Media, sound and script-driven annotations aren't allowed; the rest must print and have an appearance.
      if ([n("Movie"), n("Sound"), n("Screen"), n("3D"), n("RichMedia"), n("FileAttachment")].includes(subtype as PDFName)) continue;
      if (subtype !== n("Link") && subtype !== n("Popup") && !annot.has(n("AP"))) continue;
      const action = annot.lookup(n("A"));
      if (action instanceof PDFDict && [n("JavaScript"), n("Launch"), n("Sound"), n("Movie"), n("ResetForm"), n("ImportData")].includes(action.get(n("S")) as PDFName)) annot.delete(n("A"));
      annot.delete(n("AA"));
      const flags = annot.lookup(n("F"));
      const value = flags instanceof PDFNumber ? flags.asNumber() : 0;
      // Print on (4); hidden (2), invisible (1), no-view (32) and toggle-no-view (256) off.
      annot.set(n("F"), PDFNumber.of((value | 4) & ~(1 | 2 | 32 | 256)));
      kept.push(annots.get(i));
    }
    page.node.set(n("Annots"), doc.context.obj(kept));
  }
}

async function makeArchival(doc: PDFDocument, title: string, now: Date) {
  const tool = "DailyKit";
  stripDynamicContent(doc);

  // Document info — cleared, then only the fields the XMP mirrors.
  const info = doc.context.lookup(doc.context.trailerInfo.Info);
  if (info instanceof PDFDict) for (const key of info.keys()) info.delete(key);
  doc.setTitle(title);
  doc.setCreator(tool);
  doc.setProducer(tool);
  doc.setCreationDate(now);
  doc.setModificationDate(now);

  const metadata = doc.context.stream(new TextEncoder().encode(pdfaXmp({ title, date: now, tool })), { Type: "Metadata", Subtype: "XML" });
  doc.catalog.set(PDFName.of("Metadata"), doc.context.register(metadata));

  const profile = doc.context.flateStream(srgbIccProfile(), { N: 3 });
  const intent = doc.context.obj({
    Type: "OutputIntent",
    S: "GTS_PDFA1",
    OutputConditionIdentifier: PDFString.of("sRGB IEC61966-2.1"),
    Info: PDFString.of("sRGB IEC61966-2.1"),
    DestOutputProfile: doc.context.register(profile),
  });
  doc.catalog.set(PDFName.of("OutputIntents"), doc.context.obj([intent]));

  const id = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("");
  doc.context.trailerInfo.ID = doc.context.obj([PDFHexString.of(id), PDFHexString.of(id)]);

  return doc.save({ useObjectStreams: false });
}

export interface PdfaResult {
  bytes: Uint8Array;
  /** Fonts the original uses without including them. */
  missingFonts: string[];
  /** True when the pages were rebuilt from images (text no longer selectable). */
  rasterized: boolean;
}

/** LZW compression is banned in PDF/A and can't be re-encoded here, so such files are rebuilt. */
function usesLzw(doc: PDFDocument) {
  for (const [, obj] of doc.context.enumerateIndirectObjects()) {
    if (!(obj instanceof PDFStream)) continue;
    const filter = obj.dict.lookup(PDFName.of("Filter"));
    const filters = filter instanceof PDFArray ? filter.asArray() : [filter];
    if (filters.includes(PDFName.of("LZWDecode"))) return true;
  }
  return false;
}

/**
 * Convert to PDF/A-2b. If the original relies on fonts it doesn't include (or uses LZW), `renderPages`
 * is called to supply page images and the file is rebuilt from them.
 */
export async function convertToPdfA(
  bytes: Uint8Array,
  { title, renderPages, forceImages = false }: { title: string; renderPages?: () => Promise<Map<number, PageImage>>; forceImages?: boolean },
): Promise<PdfaResult> {
  const now = new Date(Math.floor(Date.now() / 1000) * 1000);
  const original = await loadPdf(bytes);
  const missingFonts = unembeddedFonts(original);
  const rasterized = forceImages || missingFonts.length > 0 || usesLzw(original);
  if (rasterized && !renderPages) throw new Error("Page images are needed to archive this file.");
  const source = rasterized ? await loadPdf(await replacePagesWithImages(bytes, await renderPages!())) : original;
  return { bytes: await makeArchival(source, title, now), missingFonts, rasterized };
}
