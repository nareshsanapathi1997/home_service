"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/action-state";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function markAllNotificationsRead(): Promise<ActionState> {
  const user = await requireUser();
  await prisma.notification.updateMany({
    where: { recipientId: user.id, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
  revalidatePath("/notifications");
  return {};
}
