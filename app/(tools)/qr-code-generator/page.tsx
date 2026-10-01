import { toolMetadata } from "@/lib/seo";
import { QrGenerator } from "@/components/qr/qr-generator";
import type { Faq } from "@/components/shared/faq-section";
import { ToolPage } from "@/components/shared/tool-page";

const slug = "qr-code-generator";
const description =
  "Create QR codes for UPI payments, websites, WhatsApp, WiFi, phone, email and text. Choose colours, size and error correction, add your logo, and download as PNG or SVG — free, with no expiry.";

export const metadata = toolMetadata(slug, {
  title: "QR Code Generator – UPI, WiFi, WhatsApp & URL QR Codes (Free)",
  description,
});

const faqs: Faq[] = [
  {
    question: "How do I make a UPI payment QR code for my shop?",
    answer: "Choose UPI Payment, enter your UPI ID (like yourname@okhdfc) and your name. Leave the amount empty so customers can type any amount, or set a fixed amount for a specific bill. It works with GPay, PhonePe, Paytm, BHIM and bank apps.",
  },
  {
    question: "Do these QR codes expire?",
    answer: "No. The information is stored in the code itself, not on our servers, so it keeps working forever and there are no scan limits.",
  },
  {
    question: "PNG or SVG — which should I download?",
    answer: "PNG is best for WhatsApp, websites and documents. SVG is a vector file that stays sharp at any size — best for printing on banners, standees and packaging.",
  },
  {
    question: "Can I add my logo?",
    answer: "Yes. The logo is placed in the centre and error correction is set to High automatically so the code still scans. Always test-scan before printing.",
  },
  {
    question: "Why won't my coloured QR code scan?",
    answer: "Scanners need a dark code on a light background with strong contrast. The generator warns you if your colours may cause problems.",
  },
  {
    question: "How does a WiFi QR code work?",
    answer: "Guests scan it with their phone camera and join your network without typing the password. Enter the exact network name and password, and choose the security type your router uses (usually WPA/WPA2).",
  },
];

export default function Page() {
  return (
    <ToolPage slug={slug} heading="QR Code Generator" description={description} faqs={faqs}>
      <QrGenerator />
    </ToolPage>
  );
}
