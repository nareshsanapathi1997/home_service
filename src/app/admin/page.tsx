import { AppShell, DashboardLink } from "@/components/layout/app-shell";
import { StatCard } from "@/components/ui/stat-card";
import { requireRole } from "@/lib/auth/session";
import { adminNav } from "@/lib/nav";
import { prisma } from "@/lib/prisma";
import { AlertCircle, BadgeCheck, IndianRupee, Scale } from "lucide-react";

export default async function AdminDashboardPage() {
  const user = await requireRole(["ADMIN"]);

  const [pendingTech, openComplaints, pendingCommission, openDisputes] = await Promise.all([
    prisma.technicianProfile.count({
      where: { verificationStatus: "PENDING" },
    }),
    prisma.complaint.count({ where: { status: "OPEN" } }),
    prisma.commissionRecord.count({
      where: { reconciliationStatus: "PENDING" },
    }),
    prisma.booking.count({ where: { status: "DISPUTED" } }),
  ]);

  return (
    <AppShell
      title="Operations center"
      subtitle="Verify technicians, resolve complaints, and reconcile platform commission."
      role={user.role}
      userName={user.name ?? "Admin"}
      nav={adminNav}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Pending verifications"
          value={pendingTech}
          icon={BadgeCheck}
          hint="Technician applications awaiting review"
        />
        <StatCard
          label="Open complaints"
          value={openComplaints}
          icon={AlertCircle}
          hint="Customer-reported issues"
        />
        <StatCard
          label="Commission pending"
          value={pendingCommission}
          icon={IndianRupee}
          hint="Paid jobs awaiting reconciliation"
        />
        <StatCard label="Open disputes" value={openDisputes} icon={Scale} hint="Customers contesting work" />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <DashboardLink
          href="/admin/verification"
          label="Technician verification"
          description="Approve or reject new technician applications."
        />
        <DashboardLink
          href="/admin/complaints"
          label="Complaints"
          description="Assign and resolve customer complaints."
        />
        <DashboardLink
          href="/admin/commission"
          label="Commission"
          description="Reconcile platform commission on paid jobs."
        />
        <DashboardLink href="/admin/disputes" label="Disputes" description="Settle contested jobs or refund customers." />
        <DashboardLink href="/admin/users" label="Users" description="Search accounts, suspend or reactivate them." />
        <DashboardLink
          href="/admin/catalog"
          label="Services & areas"
          description="Add or disable services and localities."
        />
        <DashboardLink href="/admin/reviews" label="Reviews" description="Hide abusive or fake reviews." />
      </div>
    </AppShell>
  );
}
