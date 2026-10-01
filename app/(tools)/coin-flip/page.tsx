import { CoinFlip } from "@/components/productivity/random-tools";
import type { Faq } from "@/components/shared/faq-section";
import { ToolPage } from "@/components/shared/tool-page";
import { toolMetadata } from "@/lib/seo";

const slug = "coin-flip";
const description = "Flip a coin online for heads or tails. Flip one coin or up to 100 at once and keep a running tally of the results.";
export const metadata = toolMetadata(slug, { title: "Coin Flip – Heads or Tails Online", description });
const faqs: Faq[] = [
  { question: "Is the coin flip fair?", answer: "Yes. Each flip uses your browser's cryptographic random number generator, so heads and tails are exactly 50/50." },
  { question: "Can I flip more than one coin?", answer: "Yes — set 'Coins per flip' up to 100 to see how many came up heads and tails." },
  { question: "Why don't I get exactly 50% heads?", answer: "Over a few flips, streaks are normal. The percentages get closer to 50% the more times you flip." },
];
export default function Page() { return <ToolPage slug={slug} heading="Flip a Coin" description={description} faqs={faqs}><CoinFlip /></ToolPage>; }
