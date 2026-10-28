import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { notificationHref } from "@/lib/notification-links";
import { prisma } from "@/lib/prisma";

// Opening a notification marks it read and forwards to what it is about.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.redirect(new URL("/login", request.url));

  const { id } = await params;
  const notification = await prisma.notification.findFirst({
    where: { id, recipientId: session.user.id },
  });
  if (!notification) return NextResponse.redirect(new URL("/notifications", request.url));

  if (!notification.isRead) {
    await prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  }
  return NextResponse.redirect(new URL(notificationHref(session.user.role, notification), request.url));
}
