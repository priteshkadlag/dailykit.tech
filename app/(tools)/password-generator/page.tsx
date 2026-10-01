import { toolMetadata } from "@/lib/seo";
import type { Faq } from "@/components/shared/faq-section";
import { ToolPage } from "@/components/shared/tool-page";
import { PasswordGeneratorLoader } from "@/components/security/password-loader";

const slug = "password-generator";
const description =
  "Generate strong random passwords on your own device. Choose length and character types, check strength and copy in one tap. Never sent or stored.";

export const metadata = toolMetadata(slug, {
  title: "Strong Password Generator – Secure Random Passwords",
  description,
});

const faqs: Faq[] = [
  {
    question: "Is it safe to generate a password on a website?",
    answer: "Here, yes: the password is created in your browser using the Web Crypto API's cryptographically secure random generator. It is never sent to our servers, never saved, and not included in the page we deliver.",
  },
  {
    question: "How long should my password be?",
    answer: "Use at least 12 characters, and 16 or more for email, banking and other important accounts. Length adds more strength than complexity.",
  },
  {
    question: "What does “bits of entropy” mean?",
    answer: "It measures how many guesses an attacker would need: each extra bit doubles the work. Under 45 bits is weak, 45–70 is medium, and 70 or more is strong.",
  },
  {
    question: "How do I remember strong passwords?",
    answer: "Don't try to — use a password manager (such as the one built into your phone or browser) to store a different strong password for every account.",
  },
];

export default function Page() {
  return (
    <ToolPage slug={slug} heading="Password Generator" description={description} faqs={faqs}>
      <PasswordGeneratorLoader />
    </ToolPage>
  );
}
