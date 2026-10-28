import Link from "next/link";
import { Briefcase, Shield } from "lucide-react";

import { AppShell, DashboardLink } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { DataRow, DataRowList } from "@/components/ui/data-row";
import { EmptyState } from "@/components/ui/empty-state";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { CLOSED_STATUSES } from "@/lib/booking-workflow";
import { technicianNav } from "@/lib/nav";

export default async function TechnicianDashboardPage() {
  const user = await requireRole(["TECHNICIAN"]);

  const profile = await prisma.technicianProfile.findUnique({
    where: { userId: user.id },
    include: {
      _count: {
        select: {
          technicianServices: { where: { isActive: true } },
          technicianServiceAreas: { where: { isActive: true } },
        },
      },
    },
  });

  const jobs = profile
    ? await prisma.booking.findMany({
        where: { technicianId: profile.id },
        orderBy: { createdAt: "desc" },
        include: {
          category: true,
          customer: { select: { name: true } },
        },
      })
    : [];

  const openJobs = jobs.filter((j) => !CLOSED_STATUSES.includes(j.status)).length;
  const needsSetup =
    profile != null &&
    (profile._count.technicianServices === 0 || profile._count.technicianServiceAreas === 0);

  return (
    <AppShell
      title="Your jobs"
      subtitle="Accept requests, send quotes, and keep your profile and availability up to date."
      role={user.role}
      userName={user.name ?? "Technician"}
      nav={technicianNav}
    >
      {profile ? (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
          <Shield className="size-4 text-primary" />
          <span>
            Verification status: <StatusBadge status={profile.verificationStatus} />
          </span>
          {!profile.isVerified ? (
            <span className="text-muted-foreground">
              — Admin approval required before new bookings appear in search.
            </span>
          ) : null}
        </div>
      ) : null}

      {needsSetup ? (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Customers can only find you once you enable at least one service and one area on your{" "}
          <Link href="/technician/profile" className="font-medium underline">
            profile
          </Link>
          .
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total jobs" value={jobs.length} icon={Briefcase} />
        <StatCard label="Active" value={openJobs} />
        <StatCard
          label="Rating"
          value={
            profile?.ratingAverage
              ? Number(profile.ratingAverage).toFixed(1)
              : "—"
          }
          hint={`${profile?.ratingCount ?? 0} reviews`}
        />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <DashboardLink href="/technician/jobs" label="Jobs" description="Accept requests and send quotes." />
        <DashboardLink href="/technician/profile" label="Profile" description="Update bio and services offered." />
        <DashboardLink href="/technician/availability" label="Availability" description="Set weekly working hours." />
      </div>

      <Panel className="mt-10">
        <PanelHeader
          title="Recent jobs"
          action={
            <Link href="/technician/jobs">
              <Button variant="outline" size="sm" className="rounded-lg">
                View all
              </Button>
            </Link>
          }
        />
        {jobs.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No jobs yet"
            description="When customers book you, job requests will appear here."
          />
        ) : (
          <DataRowList>
            {jobs.slice(0, 10).map((job) => (
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
