import "server-only";
import nodemailer from "nodemailer";
import { siteConfig } from "@/lib/site";

export interface Email {
  to: string;
  subject: string;
  text: string;
  html: string;
}

/**
 * Sends through SMTP when SMTP_URL is set. In development without SMTP the message is printed to the
 * server console so flows like password reset can still be tested; in production it's an error.
 */
export async function sendEmail(email: Email) {
  if (!process.env.SMTP_URL) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`\n[email] To: ${email.to}\n[email] Subject: ${email.subject}\n${email.text}\n`);
      return;
    }
    throw new Error("SMTP_URL is not configured — cannot send email.");
  }
  const transport = nodemailer.createTransport(process.env.SMTP_URL);
  await transport.sendMail({ from: process.env.EMAIL_FROM || `${siteConfig.name} <no-reply@localhost>`, ...email });
}

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export function passwordResetEmail(to: string, url: string, name?: string | null): Email {
  const greeting = name ? `Hi ${name},` : "Hi,";
  return {
    to,
    subject: `Reset your ${siteConfig.name} password`,
    text: `${greeting}\n\nUse this link to choose a new password. It works once and expires in 60 minutes:\n${url}\n\nIf you didn't ask for this, you can ignore this email. Your password won't change.\n\n— ${siteConfig.name}`,
    html: `<p>${escapeHtml(greeting)}</p><p>Use the button below to choose a new password. The link works once and expires in 60 minutes.</p><p><a href="${escapeHtml(url)}" style="display:inline-block;background:#1d4ed8;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Reset password</a></p><p style="color:#555;font-size:13px">If you didn't ask for this, you can ignore this email. Your password won't change.</p><p>— ${escapeHtml(siteConfig.name)}</p>`,
  };
}
