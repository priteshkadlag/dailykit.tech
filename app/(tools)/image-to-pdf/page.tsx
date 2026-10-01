import { toolMetadata } from "@/lib/seo";
import { ImageToPdf } from "@/components/files/image-to-pdf";
import type { Faq } from "@/components/shared/faq-section";
import { ToolPage } from "@/components/shared/tool-page";

const slug = "image-to-pdf";
const description =
  "Combine JPG, PNG and WEBP images into one PDF. Reorder pages, choose A4, A5, Letter or original size, set orientation, margins and quality — all in your browser, with no upload.";

export const metadata = toolMetadata(slug, {
  title: "Image to PDF Converter – JPG, PNG to PDF Free (No Upload)",
  description,
});

const faqs: Faq[] = [
  {
    question: "Are my images uploaded to a server?",
    answer: "No. The PDF is created entirely in your browser. Your images never leave your device and are cleared from memory when you close or leave the page.",
  },
  {
    question: "Can I change the order of pages?",
    answer: "Yes. Drag the thumbnails on a computer, or use the arrow buttons under each image on a phone. Page 1 is the first thumbnail.",
  },
  {
    question: "Which page size should I choose?",
    answer: "A4 is standard for documents in India. Choose “Original image size” to make each page exactly the size of its photo, with no white borders.",
  },
  {
    question: "How do I make the PDF smaller?",
    answer: "Choose “Smallest file” under Image quality. It lowers resolution to about 150 dpi on A4, which is still sharp on screen and fine for most uploads and emails.",
  },
  {
    question: "Are phone photos rotated correctly?",
    answer: "Yes. The photo's orientation information is applied, so portrait photos from phones appear upright.",
  },
];

export default function Page() {
  return (
    <ToolPage slug={slug} heading="Image to PDF" description={description} faqs={faqs}>
      <ImageToPdf />
    </ToolPage>
  );
}
