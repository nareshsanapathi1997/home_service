import Link from "next/link";
import { Bell } from "lucide-react";

import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function NotificationBell() {
  const user = await getSessionUser();
  if (!user) return null;

  const unread = await prisma.notification.count({
    where: { recipientId: user.id, isRead: false },
  });

  return (
    <Link
      href="/notifications"
      aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
      className="relative inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
    >
      <Bell className="size-5" />
      {unread > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 flex min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[11px] font-semibold leading-5 text-white">
          {unread > 99 ? "99+" : unread}
        </span>
      ) : null}
    </Link>
  );
}
