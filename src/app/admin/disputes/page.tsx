import { Scale } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { ActionButton } from "@/components/ui/action-button";
import { EmptyState } from "@/components/ui/empty-state";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { resolveDisputeAsCompleted, resolveDisputeWithRefund } from "@/lib/actions/bookings";
import { requireRole } from "@/lib/auth/session";
import { formatCurrency, formatDate } from "@/lib/format";
import { adminNav } from "@/lib/nav";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Disputes" };

export default async function AdminDisputesPage() {
  const admin = await requireRole(["ADMIN"]);

  const disputes = await prisma.booking.findMany({
    where: { status: "DISPUTED" },
    orderBy: { disputedAt: "asc" },
    include: {
      category: true,
      customer: { select: { name: true, email: true, phone: true } },
      technician: { include: { user: { select: { name: true, email: true, phone: true } } } },
    },
  });

  return (
    <AppShell
      title="Disputes"
      subtitle="Bookings where the customer contested the work. Settle each one for the technician, or cancel and refund."
      role={admin.role}
      userName={admin.name ?? "Admin"}
      nav={adminNav}
    >
      <Panel padding="none">
        <div className="border-b px-6 py-4">
          <PanelHeader title={`${disputes.length} open dispute${disputes.length === 1 ? "" : "s"}`} />
        </div>
        {disputes.length === 0 ? (
          <div className="p-6">
            <EmptyState icon={Scale} title="No open disputes" description="Disputed bookings will appear here." />
          </div>
        ) : (
          <ul className="divide-y">
            {disputes.map((b) => (
              <li key={b.id} className="space-y-3 px-6 py-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{b.bookingReference}</p>
                    <p className="text-sm text-muted-foreground">
                      {b.category.name} · {formatDate(b.preferredDate)} · raised{" "}
                      {b.disputedAt ? formatDate(b.disputedAt) : "—"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <StatusBadge status={b.status} />
                    <StatusBadge status={b.customerPaymentStatus} />
                  </div>
                </div>
                <dl className="grid gap-2 text-sm sm:grid-cols-3">
                  <div>
                    <dt className="text-muted-foreground">Customer</dt>
                    <dd>
                      {b.customer.name} · {b.customer.phone ?? b.customer.email}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Technician</dt>
                    <dd>
                      {b.technician.user.name} · {b.technician.user.phone ?? b.technician.user.email}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Amount</dt>
                    <dd>{b.finalServiceAmount != null ? formatCurrency(b.finalServiceAmount) : "—"}</dd>
                  </div>
                </dl>
                <p className="rounded-lg bg-muted/50 px-3 py-2 text-sm leading-relaxed">{b.disputeReason}</p>
                <div className="flex flex-wrap gap-2">
                  <ActionButton
                    action={resolveDisputeAsCompleted.bind(null, b.id)}
                    size="sm"
                    confirmMessage="Close the dispute and mark the job completed?"
                  >
                    Mark completed
                  </ActionButton>
                  <ActionButton
                    action={resolveDisputeWithRefund.bind(null, b.id)}
                    size="sm"
                    variant="destructive"
                    confirmMessage={
                      b.customerPaymentStatus === "PAID"
                        ? "Cancel the booking and mark the payment refunded? Refund the customer through your payment provider."
                        : "Cancel the booking?"
                    }
                  >
                    {b.customerPaymentStatus === "PAID" ? "Cancel & refund" : "Cancel booking"}
                  </ActionButton>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </AppShell>
  );
}
