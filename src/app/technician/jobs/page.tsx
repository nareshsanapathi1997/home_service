import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { DataRow, DataRowList } from "@/components/ui/data-row";
import { EmptyState } from "@/components/ui/empty-state";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { technicianNav } from "@/lib/nav";
import { Briefcase } from "lucide-react";

export default async function TechnicianJobsPage() {
  const user = await requireRole(["TECHNICIAN"]);
  const profile = await prisma.technicianProfile.findUnique({
    where: { userId: user.id },
  });
  if (!profile) notFound();

  const jobs = await prisma.booking.findMany({
    where: { technicianId: profile.id },
    orderBy: { createdAt: "desc" },
    include: { category: true, customer: { select: { name: true } } },
  });

  return (
    <AppShell
      title="All jobs"
      subtitle="Manage requests, quotes, and job status."
      role={user.role}
      userName={user.name ?? "Technician"}
      nav={technicianNav}
    >
      <Panel padding="none">
        <div className="border-b px-6 py-4">
          <PanelHeader title="Job list" description={`${jobs.length} total`} />
        </div>
        {jobs.length === 0 ? (
          <div className="p-6">
            <EmptyState icon={Briefcase} title="No jobs" description="New customer requests will show here." />
          </div>
        ) : (
          <DataRowList className="border-0">
            {jobs.map((job) => (
              <DataRow
                key={job.id}
                href={`/technician/jobs/${job.id}`}
                title={job.bookingReference}
                subtitle={`${job.category.name} · ${job.customer.name} · ${formatDate(job.preferredDate)}`}
                trailing={<StatusBadge status={job.status} />}
              />
            ))}
          </DataRowList>
        )}
      </Panel>
    </AppShell>
  );
}
