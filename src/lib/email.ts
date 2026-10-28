import { appendFile } from "node:fs/promises";
import nodemailer, { type Transporter } from "nodemailer";

import { config } from "@/lib/config";

type Email = { to: string; subject: string; text: string };

let transporter: Transporter | null = null;

function smtpTransport() {
  if (!process.env.SMTP_HOST) return null;
  transporter ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
  return transporter;
}

// Without SMTP settings, emails go to a local outbox file so flows like
// password reset can still be used and tested during development.
export const DEV_OUTBOX = ".mail-outbox.log";

export async function sendEmail(email: Email) {
  const transport = smtpTransport();
  if (!transport) {
    const entry = `--- ${new Date().toISOString()}\nTo: ${email.to}\nSubject: ${email.subject}\n\n${email.text}\n\n`;
    await appendFile(DEV_OUTBOX, entry, "utf8");
    console.info(`[email:dev-outbox] ${email.subject} -> ${email.to}`);
    return;
  }
  await transport.sendMail({
    from: process.env.FROM_EMAIL || config.app.contactEmail,
    ...email,
  });
}

// Notification emails must never break the action that triggered them.
export function sendEmailInBackground(email: Email) {
  sendEmail(email).catch((error) => {
    console.error("[email] failed to send", email.subject, error);
  });
}

export function appUrl(path: string) {
  const base = process.env.AUTH_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
  return new URL(path, base).toString();
}
