import { toolMetadata } from "@/lib/seo";
import { PdfToImage } from "@/components/files/pdf-to-image";
import type { Faq } from "@/components/shared/faq-section";
import { ToolPage } from "@/components/shared/tool-page";

const slug = "pdf-to-image";
const description =
  "Convert PDF pages to high-quality JPG or PNG. Choose pages, resolution and quality, then download one by one or as a ZIP — never uploaded.";

export const metadata = toolMetadata(slug, {
  title: "PDF to Image Converter – PDF to JPG / PNG Free (No Upload)",
  description,
});

const faqs: Faq[] = [
  {
    question: "Is my PDF uploaded anywhere?",
    answer: "No. Pages are rendered by your own browser. The PDF never leaves your device.",
  },
  {
    question: "Which resolution should I use?",
    answer: "Screen (72 dpi) is enough for WhatsApp and web. Standard (150 dpi) is a good default. Use Print (300 dpi) for printing or when you need to zoom into small text.",
  },
  {
    question: "JPG or PNG?",
    answer: "JPG gives much smaller files and suits scanned pages and photos. PNG is lossless — best for pages with sharp text, diagrams or screenshots.",
  },
  {
    question: "How do I convert only some pages?",
    answer: "Type page numbers and ranges in the Pages box, for example “1-3, 5”. Leave it empty to convert every page.",
  },
  {
    question: "Can I convert a password-protected PDF?",
    answer: "Not yet. Remove the password first (most PDF readers let you save an unlocked copy), then convert it here.",
  },
];

export default function Page() {
  return (
    <ToolPage slug={slug} heading="PDF to Image" description={description} faqs={faqs}>
      <PdfToImage />
    </ToolPage>
  );
}
