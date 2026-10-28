import { notFound } from "next/navigation";
import { IndianRupee, Wallet } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { DataRow, DataRowList } from "@/components/ui/data-row";
import { EmptyState } from "@/components/ui/empty-state";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireRole } from "@/lib/auth/session";
import { formatCurrency, formatDate } from "@/lib/format";
import { technicianNav } from "@/lib/nav";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Earnings" };

export default async function TechnicianEarningsPage() {
  const user = await requireRole(["TECHNICIAN"]);
  const profile = await prisma.technicianProfile.findUnique({ where: { userId: user.id } });
  if (!profile) notFound();

  const paidJobs = await prisma.booking.findMany({
    where: { technicianId: profile.id, customerPaymentStatus: { in: ["PAID", "REFUNDED"] } },
    orderBy: { updatedAt: "desc" },
    include: { category: true, commissionRecord: true },
  });

  const paid = paidJobs.filter((j) => j.customerPaymentStatus === "PAID");
  const gross = paid.reduce((sum, j) => sum + Number(j.finalServiceAmount ?? 0), 0);
  const commission = paid.reduce((sum, j) => sum + Number(j.commissionAmount ?? 0), 0);
  const commissionDue = paid
    .filter((j) => j.commissionRecord?.reconciliationStatus === "PENDING")
    .reduce((sum, j) => sum + Number(j.commissionRecord?.amountDue ?? 0), 0);

  return (
    <AppShell
      title="Earnings"
      subtitle="Customer payments on your jobs and the platform commission on each."
      role={user.role}
      userName={user.name ?? "Technician"}
      nav={technicianNav}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Customer payments" value={formatCurrency(gross)} icon={IndianRupee} hint={`${paid.length} paid jobs`} />
        <StatCard label="Your earnings" value={formatCurrency(gross - commission)} icon={Wallet} hint="After platform commission" />
        <StatCard label="Commission to settle" value={formatCurrency(commissionDue)} hint="Not yet reconciled by FixNear" />
      </div>

      <Panel className="mt-10">
        <PanelHeader title="Paid jobs" />
        {paidJobs.length === 0 ? (
          <EmptyState icon={IndianRupee} title="No payments yet" description="Jobs appear here once customers pay." />
        ) : (
          <DataRowList>
            {paidJobs.map((job) => (
              <DataRow
                key={job.id}
                href={`/technician/jobs/${job.id}`}
                title={`${job.bookingReference} · ${formatCurrency(job.finalServiceAmount ?? 0)}`}
                subtitle={`${job.category.name} · ${formatDate(job.preferredDate)} · Commission ${formatCurrency(
                  job.commissionAmount ?? 0
                )}`}
                trailing={
                  <StatusBadge
                    status={
                      job.customerPaymentStatus === "REFUNDED"
                        ? "REFUNDED"
                        : job.commissionRecord?.reconciliationStatus ?? "PENDING"
                    }
                  />
                }
              />
            ))}
          </DataRowList>
        )}
      </Panel>
    </AppShell>
  );
}
