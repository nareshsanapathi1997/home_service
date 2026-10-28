import { Star } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { ActionButton } from "@/components/ui/action-button";
import { EmptyState } from "@/components/ui/empty-state";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { hideReview, restoreReview } from "@/lib/actions/admin";
import { requireRole } from "@/lib/auth/session";
import { formatDate } from "@/lib/format";
import { adminNav } from "@/lib/nav";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Reviews" };

export default async function AdminReviewsPage() {
  const admin = await requireRole(["ADMIN"]);

  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      customer: { select: { name: true } },
      technician: { include: { user: { select: { name: true } } } },
      booking: { select: { bookingReference: true } },
    },
  });

  return (
    <AppShell
      title="Reviews"
      subtitle="Hide reviews that are abusive or fake. Hidden reviews don't count towards ratings."
      role={admin.role}
      userName={admin.name ?? "Admin"}
      nav={adminNav}
    >
      <Panel padding="none">
        <div className="border-b px-6 py-4">
          <PanelHeader title="Latest reviews" />
        </div>
        {reviews.length === 0 ? (
          <div className="p-6">
            <EmptyState icon={Star} title="No reviews yet" description="Customer reviews will appear here." />
          </div>
        ) : (
          <ul className="divide-y">
            {reviews.map((r) => (
              <li key={r.id} className="flex flex-wrap items-start justify-between gap-4 px-6 py-4">
                <div className={r.isHidden ? "opacity-60" : undefined}>
                  <p className="font-semibold">
                    {"★".repeat(r.rating)}
                    <span className="text-muted-foreground">{"★".repeat(5 - r.rating)}</span>{" "}
                    <span className="text-sm font-normal text-muted-foreground">
                      {r.customer.name} → {r.technician.user.name} · {r.booking.bookingReference} ·{" "}
                      {formatDate(r.createdAt)}
                    </span>
                  </p>
                  <p className="mt-1 text-sm">{r.comment || <span className="text-muted-foreground">No comment</span>}</p>
                  {r.isHidden ? <p className="mt-1 text-xs font-medium text-destructive">Hidden</p> : null}
                </div>
                {r.isHidden ? (
                  <ActionButton action={restoreReview.bind(null, r.id)} size="sm" variant="outline">
                    Restore
                  </ActionButton>
                ) : (
                  <ActionButton action={hideReview.bind(null, r.id)} size="sm" variant="destructive">
                    Hide
                  </ActionButton>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </AppShell>
  );
}
