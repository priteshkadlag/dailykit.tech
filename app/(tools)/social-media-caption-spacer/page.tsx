import { CaptionSpacer } from "@/components/text/content-tools";
import { ToolPage } from "@/components/shared/tool-page";
import { toolMetadata } from "@/lib/seo";

const slug = "social-media-caption-spacer";
const description = "Preserve intentional blank lines in Instagram, LinkedIn and other social captions by adding compatible invisible spacing characters.";
export const metadata = toolMetadata(slug, { title: "Social Media Caption Spacer & Line Break Tool", description });
const faqs = [
  { question: "How does the caption spacer work?", answer: "It places a Braille blank character on otherwise empty lines so compatible social platforms are less likely to collapse the spacing." },
  { question: "Does it work on Instagram and LinkedIn?", answer: "It can work in caption and post fields that preserve the chosen Unicode character, but platform behavior can change. Always preview before publishing." },
  { question: "Will visible characters appear in my caption?", answer: "The inserted Braille blank normally appears empty, though selection, accessibility tools or unsupported fonts may reveal or describe it." },
  { question: "Can I add several blank lines?", answer: "Yes. Add the blank lines you want in the input; the tool places one invisible character on each empty line." },
  { question: "Does the tool post to my account?", answer: "No. It only formats and copies text in your browser. You paste and publish the caption yourself." },
];
export default function Page() { return <ToolPage slug={slug} heading="Social Media Caption Spacer" description={description} faqs={faqs}><CaptionSpacer /></ToolPage>; }
