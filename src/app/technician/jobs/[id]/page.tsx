import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { TechnicianJobActions } from "@/components/technician/job-actions";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/format";
import { technicianNav } from "@/lib/nav";
import { fileUrl } from "@/lib/uploads";

export default async function TechnicianJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole(["TECHNICIAN"]);
  const { id } = await params;

  const profile = await prisma.technicianProfile.findUnique({
    where: { userId: user.id },
  });
  if (!profile) notFound();

  const job = await prisma.booking.findFirst({
    where: { id, technicianId: profile.id },
    include: {
      category: true,
      customer: { select: { name: true, phone: true, email: true } },
      quotes: { orderBy: { version: "desc" }, take: 1 },
    },
  });
  if (!job) notFound();

  const latestQuote = job.quotes[0];

  return (
    <AppShell
      title={job.bookingReference}
      subtitle={job.category.name}
      role={user.role}
      userName={user.name ?? "Technician"}
      nav={technicianNav}
    >
      <Link href="/technician/jobs">
        <Button variant="ghost" size="sm" className="mb-4 -ml-2 gap-1 rounded-lg">
          <ArrowLeft className="size-4" />
          All jobs
        </Button>
      </Link>

      <div className="flex flex-wrap gap-2">
        <StatusBadge status={job.status} />
        <StatusBadge status={job.customerPaymentStatus} />
      </div>

      <Panel className="mt-6">
        <PanelHeader title="Customer & visit" />
        <dl className="grid gap-4 sm:grid-cols-2 text-sm">
          <div>
            <dt className="text-muted-foreground">Customer</dt>
            <dd className="font-medium">{job.customer.name}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Contact</dt>
            <dd>{job.customer.phone ?? job.customer.email}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Schedule</dt>
            <dd>
              {formatDate(job.preferredDate)} · {job.preferredTime}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">Problem</dt>
            <dd className="leading-relaxed">{job.problemDescription}</dd>
            {job.imageUrl ? (
              <a href={fileUrl(job.imageUrl)} target="_blank" rel="noreferrer" className="mt-3 inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element -- private, auth-checked file */}
                <img src={fileUrl(job.imageUrl)} alt="Photo of the problem" className="max-h-48 rounded-lg border object-cover" />
              </a>
            ) : null}
          </div>
          {latestQuote ? (
            <div>
              <dt className="text-muted-foreground">Latest quote</dt>
              <dd className="flex items-center gap-2">
                v{latestQuote.version} · {formatCurrency(latestQuote.totalAmount)}
                <StatusBadge status={latestQuote.status} />
              </dd>
            </div>
          ) : null}
          {job.finalServiceAmount != null ? (
            <div>
              <dt className="text-muted-foreground">Agreed amount</dt>
              <dd className="font-medium">{formatCurrency(job.finalServiceAmount)}</dd>
            </div>
          ) : null}
          {job.disputeReason ? (
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">Customer dispute</dt>
              <dd className="leading-relaxed text-destructive">{job.disputeReason}</dd>
            </div>
          ) : null}
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">Address</dt>
            <dd>
              {job.serviceAddress}, {job.locality}
            </dd>
          </div>
        </dl>
      </Panel>

      <TechnicianJobActions bookingId={job.id} status={job.status} />
    </AppShell>
  );
}
