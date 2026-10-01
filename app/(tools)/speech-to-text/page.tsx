import { SpeechToText } from "@/components/text/speech-to-text";
import type { Faq } from "@/components/shared/faq-section";
import { ToolPage } from "@/components/shared/tool-page";
import { toolMetadata } from "@/lib/seo";

const slug = "speech-to-text";
const description = "Turn your voice into text online. Dictate in English, Hindi, Marathi, Gujarati, Tamil and other languages, then edit, copy or download the transcript.";
export const metadata = toolMetadata(slug, { title: "Speech to Text – Online Voice Typing in English, Hindi & More", description });
const faqs: Faq[] = [
  { question: "Which browsers work?", answer: "Google Chrome, Microsoft Edge and Safari. Firefox doesn't support speech recognition yet." },
  { question: "Which languages can I dictate in?", answer: "English (India, US, UK), Hindi, Marathi, Gujarati, Bengali, Tamil, Telugu, Kannada, Malayalam, Punjabi, Urdu, Nepali and several international languages." },
  { question: "Is my voice recorded or stored?", answer: "We never receive your audio or text. Your browser's speech service transcribes it — Chrome and Edge send the audio to Google or Microsoft for this — and the text stays on this page until you copy or download it." },
  { question: "Can I add punctuation by voice?", answer: "In English, say 'comma', 'full stop', 'question mark', 'new line' or 'new paragraph'. You can also edit the text directly at any time." },
];
export default function Page() { return <ToolPage slug={slug} heading="Speech to Text (Voice Typing)" description={description} faqs={faqs}><SpeechToText /></ToolPage>; }
