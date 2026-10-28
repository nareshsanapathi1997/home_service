import Link from "next/link";
import { Bell } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { ActionButton } from "@/components/ui/action-button";
import { EmptyState } from "@/components/ui/empty-state";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { markAllNotificationsRead } from "@/lib/actions/notifications";
import { requireUser } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/format";
import { navForRole } from "@/lib/nav";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const user = await requireUser();

  const notifications = await prisma.notification.findMany({
    where: { recipientId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <AppShell
      title="Notifications"
      subtitle="Updates about your bookings and account."
      role={user.role}
      userName={user.name ?? "Account"}
      nav={navForRole(user.role)}
    >
      <Panel padding="none">
        <div className="border-b px-6 py-4">
          <PanelHeader
            title={unread > 0 ? `${unread} unread` : "All caught up"}
            action={
              unread > 0 ? (
                <ActionButton action={markAllNotificationsRead} variant="outline" size="sm">
                  Mark all as read
                </ActionButton>
              ) : null
            }
          />
        </div>
        {notifications.length === 0 ? (
          <div className="p-6">
            <EmptyState icon={Bell} title="No notifications yet" description="Booking updates will appear here." />
          </div>
        ) : (
          <ul className="divide-y">
            {notifications.map((n) => (
              <li key={n.id}>
                <Link
                  href={`/notifications/${n.id}`}
                  prefetch={false}
                  className={cn(
                    "flex items-start gap-3 px-6 py-4 transition hover:bg-muted/50",
                    !n.isRead && "bg-primary/5"
                  )}
                >
                  <span
                    aria-hidden
                    className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.isRead ? "bg-transparent" : "bg-primary")}
                  />
                  <span className="min-w-0 flex-1">
                    <span className={cn("block text-sm", !n.isRead && "font-semibold")}>{n.title}</span>
                    <span className="block text-sm text-muted-foreground">{n.message}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">{formatDateTime(n.createdAt)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </AppShell>
  );
}
