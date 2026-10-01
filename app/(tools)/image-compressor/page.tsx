import { toolMetadata } from "@/lib/seo";
import { ImageCompressor } from "@/components/files/image-compressor";
import type { Faq } from "@/components/shared/faq-section";
import { ToolPage } from "@/components/shared/tool-page";

const slug = "image-compressor";
const description =
  "Reduce JPG, PNG and WEBP file size without visible loss. Compress many photos at once, compare sizes and download singly or as a ZIP. No upload.";

export const metadata = toolMetadata(slug, {
  title: "Image Compressor – Reduce Photo Size in KB (No Upload)",
  description,
});

const faqs: Faq[] = [
  {
    question: "How much smaller will my images get?",
    answer: "Phone photos typically shrink by 60–90% at Medium compression, especially if you also set a maximum width like 1920 px. Images that are already optimised may not get smaller — in that case the original is kept.",
  },
  {
    question: "Will compression reduce quality?",
    answer: "Low and Medium compression are hard to tell apart from the original on a screen. High compression gives the smallest files with some softening. Use Custom to choose the exact quality.",
  },
  {
    question: "How do I reduce an image to under 100 KB or 50 KB?",
    answer: "Set Maximum width to 1080 px or 800 px and choose High compression. For forms that need a specific size, lower the Custom quality until the result is under the limit.",
  },
  {
    question: "Why did my PNG become WEBP?",
    answer: "PNG is a lossless format, so re-saving it as PNG rarely saves space. Automatic mode converts it to WEBP, which is much smaller and still supports transparency. Choose PNG under Output format to keep PNG.",
  },
  {
    question: "Are my photos uploaded?",
    answer: "No. Compression runs entirely in your browser and your images never leave your device.",
  },
];

export default function Page() {
  return (
    <ToolPage slug={slug} heading="Image Compressor" description={description} faqs={faqs}>
      <ImageCompressor />
    </ToolPage>
  );
}
