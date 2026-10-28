"use server";

import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";

import type { ActionState } from "@/lib/action-state";
import { config } from "@/lib/config";
import { appUrl, sendEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

const TOKEN_TTL_MS = 60 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

const RESET_SENT =
  "If an account exists for that email, we've sent a link to reset the password. It expires in 1 hour.";

export async function requestPasswordReset(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = z.string().trim().email().safeParse(formData.get("email"));
  if (!parsed.success) return { error: "Enter a valid email address." };
  const email = parsed.data.toLowerCase();

  const user = await prisma.user.findUnique({ where: { email } });
  // Same answer whether or not the account exists, so emails can't be probed.
  if (!user || user.accountStatus === "SUSPENDED" || user.accountStatus === "REJECTED") {
    return { success: RESET_SENT };
  }

  const recent = await prisma.passwordResetToken.findFirst({
    where: { userId: user.id, createdAt: { gt: new Date(Date.now() - RESEND_COOLDOWN_MS) } },
  });
  if (recent) return { success: RESET_SENT };

  const token = randomBytes(32).toString("hex");
  await prisma.$transaction([
    prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } }),
    prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
      },
    }),
  ]);

  try {
    await sendEmail({
      to: user.email,
      subject: `Reset your ${config.app.name} password`,
      text: `Hi ${user.name},\n\nUse this link to set a new password. It expires in 1 hour:\n${appUrl(
        `/reset-password?token=${token}`
      )}\n\nIf you didn't ask for this, you can ignore this email.`,
    });
  } catch (error) {
    console.error("[password-reset] email failed", error);
    return { error: "We couldn't send the email right now. Please try again shortly." };
  }

  return { success: RESET_SENT };
}

const resetSchema = z
  .object({
    token: z.string().regex(/^[a-f0-9]{64}$/),
    password: z.string().min(6).max(100),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, { message: "Passwords don't match." });

export async function resetPassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = resetSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      error:
        issue?.path.length === 0
          ? issue.message
          : issue?.path[0] === "token"
            ? "This reset link is invalid."
            : "Password must be at least 6 characters.",
    };
  }

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(parsed.data.token) },
  });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return { error: "This reset link is invalid or has expired. Please request a new one." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const used = await prisma.$transaction(async (tx) => {
    const claimed = await tx.passwordResetToken.updateMany({
      where: { id: record.id, usedAt: null },
      data: { usedAt: new Date() },
    });
    if (claimed.count === 0) return false;
    await tx.user.update({ where: { id: record.userId }, data: { passwordHash } });
    await tx.passwordResetToken.deleteMany({ where: { userId: record.userId, usedAt: null } });
    return true;
  });
  if (!used) return { error: "This reset link has already been used." };

  redirect("/login?reset=1");
}
