import { toolMetadata } from "@/lib/seo";
import { ImageResizer } from "@/components/files/image-resizer";
import type { Faq } from "@/components/shared/faq-section";
import { ToolPage } from "@/components/shared/tool-page";

const slug = "image-resizer";
const description =
  "Resize photos to exact pixels or one-click presets for Instagram, YouTube, passport photos and A4. Crop, fit or stretch — right in your browser.";

export const metadata = toolMetadata(slug, {
  title: "Image Resizer – Resize Photos for Instagram, Passport & More",
  description,
});

const faqs: Faq[] = [
  {
    question: "What size is a passport photo?",
    answer: "Indian passport and visa photos are 35 × 45 mm. The Passport Photo preset creates 413 × 531 pixels, which prints at exactly that size at 300 dpi.",
  },
  {
    question: "What does “Fill & crop” mean?",
    answer: "When the new size has a different shape from your photo, Fill & crop fills the whole frame and trims the edges evenly. Fit inside shows the whole photo with a background colour around it. Stretch distorts the photo to fit.",
  },
  {
    question: "Does resizing reduce file size?",
    answer: "Making an image smaller in pixels almost always reduces its file size. To reduce file size further without changing dimensions, use the Image Compressor.",
  },
  {
    question: "What are the best sizes for social media?",
    answer: "Instagram post 1080 × 1080, Instagram story 1080 × 1920, YouTube thumbnail 1280 × 720, and Facebook link post 1200 × 630. All are available as presets.",
  },
];

export default function Page() {
  return (
    <ToolPage slug={slug} heading="Image Resizer" description={description} faqs={faqs}>
      <ImageResizer />
    </ToolPage>
  );
}
