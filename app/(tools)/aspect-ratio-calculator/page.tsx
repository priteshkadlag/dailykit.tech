import { AspectRatioCalculator } from "@/components/creator/creator-tools";
import type { Faq } from "@/components/shared/faq-section";
import { ToolPage } from "@/components/shared/tool-page";
import { toolMetadata } from "@/lib/seo";

const slug = "aspect-ratio-calculator";
const description = "Work out the exact crop, crop position and export size when turning a 16:9 YouTube video into a 9:16 Reel, TikTok or Short — or any other aspect ratio.";

export const metadata = toolMetadata(slug, { title: "Aspect Ratio Calculator – 16:9 to 9:16 for Reels & Shorts", description });

const faqs: Faq[] = [
  { question: "What size is a 9:16 video?", answer: "The standard 9:16 export size is 1080 × 1920 pixels, used by Instagram Reels, TikTok and YouTube Shorts." },
  { question: "How big is a 9:16 crop from a 1920 × 1080 video?", answer: "The largest 9:16 area inside a 1920 × 1080 frame is 606 × 1080 pixels, starting 657 pixels from the left edge for a centred crop. Scale it up to 1080 × 1920 when you export." },
  { question: "Why are the sizes always even numbers?", answer: "Most video encoders, including H.264, need even widths and heights, so the calculator rounds down to the nearest even pixel." },
  { question: "What's the difference between cropping and fitting?", answer: "Cropping cuts the frame down to the new shape and loses the edges. Fitting keeps the whole picture and adds bars (letterbox or pillarbox) to fill the new shape." },
  { question: "What size should an Instagram portrait video be?", answer: "Use 4:5 at 1080 × 1350 pixels for feed posts, or 9:16 at 1080 × 1920 for Reels and Stories." },
];

export default function Page() {
  return <ToolPage slug={slug} heading="Aspect Ratio Calculator" description={description} faqs={faqs} guide={<>
    <h2>How to crop a video for Reels, TikTok and Shorts</h2>
    <p>Enter your source video’s size and pick the target ratio. The <strong>crop size</strong> is the largest area of the new shape that fits inside your frame, and the <strong>crop position</strong> centres it. Enter both in your editor’s crop tool, then export at the <strong>export size</strong> shown — 1080 pixels on the short side, which is what the social platforms use.</p>
    <h2>Keeping the whole frame instead</h2>
    <p>If cropping would cut out something important, use the <strong>fit</strong> size instead: it’s a canvas of the new shape that holds your whole video, with bars of the size shown on each side. Many creators fill those bars with a blurred copy of the video.</p>
  </>}><AspectRatioCalculator /></ToolPage>;
}
