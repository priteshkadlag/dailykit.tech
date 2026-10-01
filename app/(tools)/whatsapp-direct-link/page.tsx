import { WhatsappDirectLink } from "@/components/whatsapp/direct-link";
import type { Faq } from "@/components/shared/faq-section";
import { ToolPage } from "@/components/shared/tool-page";
import { toolMetadata } from "@/lib/seo";

const slug = "whatsapp-direct-link";
const description = "Open a WhatsApp chat with any number without saving it to contacts. Create a wa.me click-to-chat link with a pre-filled message and QR code.";
export const metadata = toolMetadata(slug, { title: "WhatsApp Direct Link – Chat Without Saving the Number", description });
const faqs: Faq[] = [
  { question: "How do I message someone on WhatsApp without saving their number?", answer: "Enter their number, tap 'Open chat', and WhatsApp opens a conversation with them directly — no contact needed." },
  { question: "What is a wa.me link?", answer: "WhatsApp's official click-to-chat link: https://wa.me/ followed by the full international number without + or spaces. Anyone who opens it can message that number." },
  { question: "Can I share the link with customers?", answer: "Yes. Put it on your website, Instagram bio, visiting card or invoices, or share the QR code so customers can message you in one tap." },
  { question: "Does the number need a country code?", answer: "The calculator adds the country code you choose. If the number is from another country, type it with + and its country code." },
];
export default function Page() { return <ToolPage slug={slug} heading="WhatsApp Direct Chat Link" description={description} faqs={faqs}><WhatsappDirectLink /></ToolPage>; }
