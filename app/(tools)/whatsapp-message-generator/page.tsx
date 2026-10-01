import { toolMetadata } from "@/lib/seo";
import type { Faq } from "@/components/shared/faq-section";
import { ToolPage } from "@/components/shared/tool-page";
import { WhatsappGenerator } from "@/components/whatsapp/whatsapp-generator";

const slug = "whatsapp-message-generator";
const description =
  "Ready-to-send WhatsApp messages for orders, payment reminders, deliveries, appointments, follow-ups and festivals. Fill in details and send in one tap.";

export const metadata = toolMetadata(slug, {
  title: "WhatsApp Message Generator – Business Message Templates",
  description,
});

const faqs: Faq[] = [
  {
    question: "How does “Open WhatsApp” work?",
    answer: "It opens WhatsApp (the app on your phone, or WhatsApp Web on a computer) with your message already typed. If you entered a number, the chat with that person opens; otherwise you choose the contact. You still tap Send yourself.",
  },
  {
    question: "Do I need to save the customer's number first?",
    answer: "No. Type their mobile number and WhatsApp opens a chat with them directly, even if they're not in your contacts. Indian numbers get +91 added automatically.",
  },
  {
    question: "Can I change the message?",
    answer: "Yes — tap the message preview and edit it freely. Use “Reset to template” to go back to the generated text with your latest details.",
  },
  {
    question: "Is this the WhatsApp Business API?",
    answer: "No. It creates a standard WhatsApp link, so it works with regular WhatsApp and WhatsApp Business apps without any setup or fees. Messages are sent from your own account.",
  },
];

export default function Page() {
  return (
    <ToolPage slug={slug} heading="WhatsApp Message Generator" description={description} faqs={faqs}>
      <WhatsappGenerator />
    </ToolPage>
  );
}
