import { AppShell } from "@/components/layout/app-shell";
import { reconcileCommissionRecord } from "@/lib/actions/admin";
import { requireRole } from "@/lib/auth/session";
import { adminNav } from "@/lib/nav";
import { prisma } from "@/lib/prisma";
import { ActionButton } from "@/components/ui/action-button";
import { EmptyState } from "@/components/ui/empty-state";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency } from "@/lib/format";
import { IndianRupee } from "lucide-react";

export default async function AdminCommissionPage() {
  const user = await requireRole(["ADMIN"]);

  const records = await prisma.commissionRecord.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      booking: { select: { bookingReference: true } },
      technician: { include: { user: { select: { name: true } } } },
    },
  });

  return (
    <AppShell
      title="Commission"
      subtitle="Reconcile platform fees after customers mark bookings as paid."
      role={user.role}
      userName={user.name ?? "Admin"}
      nav={adminNav}
    >
      <Panel padding="none">
        <div className="border-b px-6 py-4">
          <PanelHeader title="Commission records" />
        </div>
        {records.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={IndianRupee}
              title="No commission yet"
              description="Records appear when customers complete demo payment on accepted quotes."
            />
          </div>
        ) : (
          <ul className="divide-y">
            {records.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-4 px-6 py-5"
              >
                <div>
                  <p className="font-semibold">{r.booking.bookingReference}</p>
                  <p className="text-sm text-muted-foreground">
                    {r.technician.user.name} · Due {formatCurrency(r.amountDue)} ·{" "}
                    {(Number(r.agreedRate) * 100).toFixed(1)}% rate
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={r.reconciliationStatus} />
                  {r.reconciliationStatus === "PENDING" ? (
                    <ActionButton action={reconcileCommissionRecord.bind(null, r.id)} size="sm">
                      Reconcile
                    </ActionButton>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </AppShell>
  );
}
