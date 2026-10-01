import { notFound } from "next/navigation";
import { ImageToPdf } from "@/components/files/image-to-pdf";
import { AnnotatePdf } from "@/components/pdf/annotate-pdf";
import { ComparePdf } from "@/components/pdf/compare-pdf";
import { FillPdfForm } from "@/components/pdf/form-pdf";
import { MergePdf } from "@/components/pdf/merge-pdf";
import { OcrPdf } from "@/components/pdf/ocr-pdf";
import { OfficeToPdf } from "@/components/pdf/office-to-pdf";
import { CompressPdf, PdfToPdfA, RepairPdf } from "@/components/pdf/optimize-pdf";
import { PageTool } from "@/components/pdf/page-tool";
import { ProtectPdf, UnlockPdf } from "@/components/pdf/password-pdf";
import { PdfTextTool } from "@/components/pdf/pdf-text-tools";
import { PdfToOffice } from "@/components/pdf/pdf-to-office";
import { RedactPdf } from "@/components/pdf/redact-pdf";
import { SplitPdf } from "@/components/pdf/split-pdf";
import { StampPdf } from "@/components/pdf/stamp-pdf";
import type { Faq } from "@/components/shared/faq-section";
import { ToolPage } from "@/components/shared/tool-page";
import { OnlineKeyboard } from "@/components/typing/online-keyboard";
import { FontConverterTool } from "@/components/font-converter/font-converter";
import { getFontConverter, liveFontConverters, type FontConverter } from "@/lib/font-converters/registry";
import { getKeyboard, keyboards } from "@/lib/keyboard-data";
import { devTools, getDevTool } from "@/lib/dev-tools/registry";
import { DevToolRenderer } from "@/components/dev-tools/renderer";
import { fitsWithBrand, toolMetadata } from "@/lib/seo";

interface Definition {
  heading: string;
  description: string;
  tool: React.ReactNode;
  faqs?: Faq[];
  /** Tools that take locked PDFs (or make them) skip the "unlock it first" FAQ. */
  handlesPasswords?: boolean;
}

const definitions: Record<string, Definition> = {
  // ---- Organize
  "merge-pdf": {
    heading: "Merge PDF",
    description: "Combine up to 20 PDF files in the order you choose. Everything is processed privately in your browser.",
    tool: <MergePdf />,
    faqs: [{ question: "Is there a page limit?", answer: "You can merge up to 20 files of up to 100 MB each. Very large merges work faster on a computer than on a phone." }],
  },
  "split-pdf": {
    heading: "Split PDF",
    description: "Separate a PDF by page ranges, every N pages or into single pages, without uploading the document.",
    tool: <SplitPdf />,
    faqs: [{ question: "How do I get several files at once?", answer: "Enter ranges separated by commas, such as 1-3, 4-6, 7. Each range becomes its own PDF, and all of them download together as a ZIP." }],
  },
  "remove-pdf-pages": {
    heading: "Remove PDF Pages",
    description: "Select unwanted pages and save a clean copy of your PDF entirely in your browser.",
    tool: <PageTool mode="remove" />,
  },
  "extract-pdf-pages": {
    heading: "Extract PDF Pages",
    description: "Pick pages from a PDF and save them together or as separate PDF files.",
    tool: <PageTool mode="extract" />,
  },
  "organize-pdf": {
    heading: "Organize PDF",
    description: "Reorder, rotate, duplicate, remove, and insert blank pages in your PDF.",
    tool: <PageTool mode="organize" />,
  },
  "scan-to-pdf": {
    heading: "Scan to PDF",
    description: "Turn document photos into an ordered PDF with page size, margins, orientation, and quality controls.",
    tool: <ImageToPdf />,
    faqs: [{ question: "Can I use my phone camera?", answer: "Yes. On a phone, choosing files lets you take photos directly with the camera. Add each page, put them in order, and save one PDF." }],
  },
  // ---- Optimize
  "compress-pdf": {
    heading: "Compress PDF",
    description: "Reduce PDF size by recompressing the photos inside it — text stays sharp and selectable. Four levels, nothing uploaded.",
    tool: <CompressPdf />,
    faqs: [
      { question: "Will compression make my text blurry?", answer: "No. Light, Recommended and Strong only recompress the photos and scans inside the PDF; text and drawings stay sharp. Only Maximum turns pages into images." },
      { question: "Why did my file barely shrink?", answer: "PDFs made mostly of text are already small, so there's little to remove. Scanned documents and photo-heavy files shrink the most — try Strong or Maximum for those." },
    ],
  },
  "repair-pdf": {
    heading: "Repair PDF",
    description: "Fix PDFs that won't open or show errors by rebuilding their structure — or rescuing each page when the damage is severe.",
    tool: <RepairPdf />,
    handlesPasswords: true,
    faqs: [{ question: "What if the file can't be fully repaired?", answer: "If the structure is too damaged to rebuild, the tool rescues every page it can read as an image, so you keep the content even if the text can no longer be selected." }],
  },
  "ocr-pdf": {
    heading: "OCR PDF",
    description: "Make scanned PDFs searchable and copyable. Recognises English, Hindi, Marathi and other Indian languages on your device.",
    tool: <OcrPdf />,
    faqs: [
      { question: "Does the PDF look different after OCR?", answer: "No. The pages stay exactly as they were; an invisible text layer is added on top so you can search, select and copy the text." },
      { question: "Is anything uploaded?", answer: "Your PDF is not. The recogniser downloads its language data (a few MB) from a public CDN the first time you use a language; recognition itself runs in your browser." },
    ],
  },
  // ---- Convert to PDF
  "word-to-pdf": {
    heading: "Word to PDF",
    description: "Convert DOCX documents to PDF with headings, lists, tables and pictures — including Hindi and other Indian scripts.",
    tool: <OfficeToPdf source="word" />,
    faqs: [{ question: "Can I convert an old .doc file?", answer: "Not directly. Open it in Word, LibreOffice or Google Docs, save it as .docx, then convert it here." }],
  },
  "powerpoint-to-pdf": {
    heading: "PowerPoint to PDF",
    description: "Convert PPTX presentations to PDF, one slide per page, with text, pictures, shapes, tables and backgrounds.",
    tool: <OfficeToPdf source="powerpoint" />,
    faqs: [{ question: "Is every slide element supported?", answer: "Text, pictures, shapes, tables, groups and backgrounds are drawn. Charts, SmartArt, animations and special effects aren't; for pixel-perfect output use PowerPoint's own Save as PDF." }],
  },
  "excel-to-pdf": {
    heading: "Excel to PDF",
    description: "Convert XLSX, XLS and CSV spreadsheets to PDF, with wide sheets shrunk to fit the page and automatic orientation.",
    tool: <OfficeToPdf source="excel" />,
  },
  "html-to-pdf": {
    heading: "HTML to PDF",
    description: "Turn HTML code or a saved web page into a clean, searchable PDF. Scripts are removed and nothing is loaded from the web.",
    tool: <OfficeToPdf source="html" />,
    faqs: [{ question: "Can I enter a website address?", answer: "Browsers don't let one site download another site's pages, so save the page first (Ctrl+S) and upload the file — or use your browser's Print → Save as PDF on that page." }],
  },
  // ---- Convert from PDF
  "pdf-to-word": {
    heading: "PDF to Word",
    description: "Convert PDF text into an editable Word document with headings, paragraphs and lists preserved.",
    tool: <PdfToOffice target="word" />,
  },
  "pdf-to-powerpoint": {
    heading: "PDF to PowerPoint",
    description: "Turn each PDF page into a PowerPoint slide — as an exact picture of the page or as editable text.",
    tool: <PdfToOffice target="powerpoint" />,
  },
  "pdf-to-excel": {
    heading: "PDF to Excel",
    description: "Pull tables from bank statements, invoices and reports into Excel, with columns lined up and amounts as real numbers.",
    tool: <PdfToOffice target="excel" />,
    faqs: [{ question: "Does it work with scanned statements?", answer: "Scanned pages are pictures with no text to read. Run OCR PDF first, then convert the searchable result to Excel." }],
  },
  "pdf-to-pdfa": {
    heading: "PDF to PDF/A",
    description: "Convert to PDF/A-2b for long-term archiving and government portals — with colour profile, metadata and embedded fonts.",
    tool: <PdfToPdfA />,
    faqs: [{ question: "Why were my pages turned into images?", answer: "PDF/A requires every font to be inside the file. When the original relies on fonts it doesn't include, pages are rebuilt as images so the archive looks the same on every computer." }],
  },
  // ---- Edit
  "rotate-pdf": {
    heading: "Rotate PDF",
    description: "Rotate individual PDF pages or turn every page left or right in one step.",
    tool: <PageTool mode="rotate" />,
  },
  "add-page-numbers": {
    heading: "Add Page Numbers",
    description: "Number PDF pages in any corner or centre, in the style you choose, starting from any number — with a live preview.",
    tool: <StampPdf mode="numbers" />,
    faqs: [{ question: "Can I skip the cover page?", answer: "Yes. Enter the pages to number, such as 2-, and set “Start at” to 1 so the second page is numbered 1." }],
  },
  "add-watermark": {
    heading: "Add Watermark",
    description: "Stamp text or a logo across your PDF pages, with size, colour, transparency, angle and repeat options.",
    tool: <StampPdf mode="watermark" />,
  },
  "crop-pdf": {
    heading: "Crop PDF",
    description: "Trim margins from PDF pages — set each side yourself or detect the white border automatically.",
    tool: <StampPdf mode="crop" />,
  },
  "edit-pdf": {
    heading: "Edit PDF",
    description: "Add text, pictures and white-out boxes anywhere on a PDF. Drag to place, resize, and save — nothing uploaded.",
    tool: <AnnotatePdf mode="edit" />,
    faqs: [{ question: "Can I change text that's already in the PDF?", answer: "Cover the old text with a white-out box, then type the new text on top. The result looks edited, and works for any PDF." }],
  },
  "pdf-forms": {
    heading: "Fill PDF Forms",
    description: "Fill in the fields of an interactive PDF form, then save it editable or flattened so the answers can't change.",
    tool: <FillPdfForm />,
    faqs: [{ question: "My form has no fields to fill — what now?", answer: "Some forms are just printed pages. Use Edit PDF to type your answers anywhere on the page instead." }],
  },
  // ---- Security
  "unlock-pdf": {
    heading: "Unlock PDF",
    description: "Remove a known password or printing/copying restrictions and save an unlocked copy.",
    tool: <UnlockPdf />,
    handlesPasswords: true,
    faqs: [{ question: "Can this unlock a PDF if I've forgotten the password?", answer: "No. You need the password that opens the file. PDFs that open without one but block printing or copying can be unlocked without a password." }],
  },
  "protect-pdf": {
    heading: "Protect PDF",
    description: "Encrypt a PDF with an AES-256 password and choose whether people can print, copy or edit it.",
    tool: <ProtectPdf />,
    faqs: [{ question: "What if I forget the password?", answer: "It can't be recovered — not by us or anyone else. Keep the password somewhere safe, and keep an unprotected copy if you need one." }],
  },
  "sign-pdf": {
    heading: "Sign PDF",
    description: "Draw, type or upload your signature and place it on any page, along with the date or your name.",
    tool: <AnnotatePdf mode="sign" />,
    faqs: [{ question: "Is this a legally valid digital signature?", answer: "It adds a picture of your signature, like signing a printout — widely accepted for everyday documents. It isn't a certificate-based (DSC) signature required for some government filings." }],
  },
  "redact-pdf": {
    heading: "Redact PDF",
    description: "Permanently black out sensitive text — find every match or draw boxes — with the hidden text truly removed.",
    tool: <RedactPdf />,
    faqs: [{ question: "Is the redacted text really gone?", answer: "Yes. Pages you redact are rebuilt as images with the black boxes burned in, so the text underneath can't be copied, searched or recovered. Other pages are left untouched." }],
  },
  "compare-pdf": {
    heading: "Compare PDF",
    description: "See exactly what changed between two versions of a PDF: added, removed and edited lines, word by word.",
    tool: <ComparePdf />,
  },
  // ---- Intelligence
  "pdf-to-markdown": {
    heading: "PDF to Markdown",
    description: "Extract PDF text into structured Markdown with headings and lists.",
    tool: <PdfTextTool mode="markdown" />,
  },
  "ai-pdf-summarizer": {
    heading: "PDF Summarizer",
    description: "Get the key points of any PDF in seconds, with main topics and reading time — privately, on your device.",
    tool: <PdfTextTool mode="summary" />,
    faqs: [{ question: "How is the summary made?", answer: "By default the tool picks the sentences that best cover the document's main topics, word for word, so nothing is invented. In Chrome with built-in AI, you can also choose an on-device AI summary." }],
  },
  "translate-pdf": {
    heading: "Translate PDF",
    description: "Translate PDF text into Hindi, Marathi, Tamil and 15 other languages with Chrome's on-device translator.",
    tool: <PdfTextTool mode="translate" />,
    faqs: [{ question: "Which browsers can translate?", answer: "Desktop Google Chrome 138 or newer, which includes a private on-device translator. In other browsers you can download the text as a Word file to translate elsewhere." }],
  },
};

type PdfToolSlug = keyof typeof definitions;

const commonFaqs: Faq[] = [
  {
    question: "Are my PDF files uploaded?",
    answer: "No. The files are processed by your browser and never sent to the DailyKit server.",
  },
  {
    question: "Will this work on a phone?",
    answer: "Yes. The controls are designed for phones and computers, although large PDFs may work faster on a computer.",
  },
];

const lockedFaq: Faq = {
  question: "Can I use a password-protected PDF?",
  answer: "Remove the password first with Unlock PDF (you'll need to know it), then use the unlocked copy here.",
};

function converterDescription(converter: FontConverter) {
  if (converter.language === "English") return `Convert ${converter.from.label} spelling to ${converter.to.label} instantly — colour ⇄ color, organise ⇄ organize, centre ⇄ center and hundreds more.`;
  // Built from the converter's name, which is unique (two converters can share font labels, e.g. Krutidev and Krutidev 010).
  return `Free ${converter.name} converter for ${converter.language}: paste your text and convert it instantly. It runs in your browser, so your text is never uploaded.`;
}

function converterFaqs(converter: FontConverter): Faq[] {
  const { from, to } = converter;
  const legacy = from.font ?? to.font;
  const faqs: Faq[] = [];
  if (legacy) {
    faqs.push(
      { question: `Why does ${legacy} text look like English letters?`, answer: `${legacy} is a legacy font-based encoding: the file stores English letters and symbols, and the ${legacy} font draws them as ${converter.language}. Unicode text shows correctly in any font, on any phone or website.` },
      { question: to.font ? `How do I use the converted ${to.label} text?` : `Where do I get ${from.label} text from?`, answer: to.font ? `Copy it and paste into Word, PageMaker, CorelDRAW or Photoshop, then set the font to ${to.font}. The Word file download already has the font applied — you only need the font installed on your computer.` : `Copy it from the document where it's typed in ${from.font} (Word, PageMaker, an old PDF). It will look like English gibberish outside that font — that's expected. Paste it here as it is.` },
    );
  }
  if (from.fallbackFont || to.fallbackFont) faqs.push({ question: "Is DevLys the same as Kruti Dev?", answer: "DevLys 010 and Kruti Dev 010 use the same keyboard encoding, so the same text displays correctly in either font." });
  if (converter.slug === "hindi-to-roman") faqs.push({ question: "What is the difference between Simple and IAST?", answer: "Simple (Hinglish) is how Hindi is usually written in English letters — भारत becomes bharat and silent vowels are dropped. IAST is the scholarly standard with accents that keeps every sound — bhārata." });
  if (converter.language === "English") faqs.push({ question: "Does it change words like “program” or “check”?", answer: "UK → US converts programme, cheque, tyre and similar words. US → UK leaves program, check, tire, license and practice alone, because in British English their spelling depends on meaning." });
  if (from.script === "devanagari") faqs.push({ question: "Can I type in English letters?", answer: "Yes. Turn Transliteration ON and type phonetically — “namaste” becomes नमस्ते. Press Space to accept each word." });
  faqs.push({ question: "Is my text uploaded anywhere?", answer: "No. The conversion runs entirely in your browser; nothing is sent to our servers." });
  return faqs;
}

/** The converter going the other way, when there is one. */
function reverseOf(converter: FontConverter) {
  const reverse = liveFontConverters.find((other) => other.from.label === converter.to.label && other.to.label === converter.from.label);
  return reverse && { slug: reverse.slug, name: reverse.name };
}

export const dynamicParams = false;

export function generateStaticParams() {
  return [...Object.keys(definitions), ...keyboards.map((keyboard) => keyboard.slug), ...liveFontConverters.map((converter) => converter.slug), ...devTools.map((tool) => tool.slug)].map((pdfTool) => ({ pdfTool }));
}

export async function generateMetadata({ params }: PageProps<"/[pdfTool]">) {
  const { pdfTool } = await params;
  const definition = definitions[pdfTool as PdfToolSlug];
  const keyboard = getKeyboard(pdfTool);
  const converter = getFontConverter(pdfTool);
  const devTool = getDevTool(pdfTool);
  if (devTool) {
    const withSuffix = `${devTool.heading} – Free Online Tool`;
    return toolMetadata(pdfTool, { title: fitsWithBrand(withSuffix) ? withSuffix : devTool.heading, description: devTool.description });
  }
  if (converter?.live) return toolMetadata(pdfTool, { title: `Free ${converter.name} Converter${converter.language === "English" ? "" : ` (${converter.language})`}`, description: converterDescription(converter) });
  if (keyboard) return toolMetadata(pdfTool, { title: `${keyboard.name} – Type ${keyboard.language} Online`, description: `Type ${keyboard.language} online using a visual ${keyboard.name} with formatting, copy, print, TXT and DOC export.` });
  if (!definition) return {};
  return toolMetadata(pdfTool, {
    title: `${definition.heading} Online Free – Private, No Upload`,
    description: definition.description,
  });
}

export default async function PdfToolPage({ params }: PageProps<"/[pdfTool]">) {
  const { pdfTool } = await params;
  const definition = definitions[pdfTool as PdfToolSlug];
  const keyboard = getKeyboard(pdfTool);
  const converter = getFontConverter(pdfTool);
  const devTool = getDevTool(pdfTool);
  if (devTool) {
    return <ToolPage slug={pdfTool} heading={devTool.heading} description={devTool.description} faqs={devTool.faqs}><DevToolRenderer slug={pdfTool} /></ToolPage>;
  }
  if (converter?.live) {
    return <ToolPage slug={pdfTool} heading={`${converter.name} Converter`} description={converterDescription(converter)} faqs={converterFaqs(converter)}>
      <FontConverterTool converter={converter} reverse={reverseOf(converter)} />
    </ToolPage>;
  }
  if (keyboard) {
    const description = `Type ${keyboard.language} online using a visual ${keyboard.name}. Format, copy, print, and export your text without installing software.`;
    const faqs: Faq[] = [
      { question: `How do I type with the ${keyboard.name}?`, answer: "Click the on-screen keys, or type on your computer keyboard — each key produces the character shown in the same position on the layout. Hold Shift for the upper character on a key." },
      ...(keyboard.keys.some((key) => key.alt) ? [{ question: "How do I type the small characters at the bottom of some keys?", answer: "Press AltGr (or Ctrl+Alt) together with the key, or turn on the AltGr button under the on-screen keyboard." }] : []),
      ...(keyboard.legacy ? [{ question: "Why does copied Kruti Dev text look like English letters?", answer: "Kruti Dev is a font-based layout: the text is stored as English letters and the Kruti Dev font draws them as Hindi. Paste it into Word or another app and set the font to Kruti Dev 010 (or the one you used). For text that works everywhere, use the Hindi Mangal (Unicode) keyboard instead." }] : []),
      { question: "Can I save what I type?", answer: "Yes. Download plain text or a Word-compatible DOC file, copy everything, or print directly from the editor. Your text stays in your browser and is never uploaded." },
    ];
    return <ToolPage slug={pdfTool} heading={`${keyboard.name} Online`} description={description} faqs={faqs}><OnlineKeyboard keyboard={keyboard} /></ToolPage>;
  }
  if (!definition) notFound();

  const faqs = [...(definition.faqs ?? []), ...commonFaqs, ...(definition.handlesPasswords ? [] : [lockedFaq])];
  return (
    <ToolPage slug={pdfTool} heading={definition.heading} description={definition.description} faqs={faqs}>
      {definition.tool}
    </ToolPage>
  );
}
