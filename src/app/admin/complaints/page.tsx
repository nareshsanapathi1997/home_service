import { AppShell } from "@/components/layout/app-shell";
import {
  dismissComplaint,
  markComplaintInProgress,
  resolveComplaint,
} from "@/lib/actions/admin";
import { requireRole } from "@/lib/auth/session";
import { adminNav } from "@/lib/nav";
import { prisma } from "@/lib/prisma";
import { ActionButton } from "@/components/ui/action-button";
import { EmptyState } from "@/components/ui/empty-state";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/format";
import { MessageSquareWarning } from "lucide-react";

export default async function AdminComplaintsPage() {
  const user = await requireRole(["ADMIN"]);

  const complaints = await prisma.complaint.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      reporter: { select: { name: true, email: true } },
      booking: { select: { bookingReference: true } },
    },
  });

  return (
    <AppShell
      title="Complaints"
      subtitle="Track and resolve customer-reported issues."
      role={user.role}
      userName={user.name ?? "Admin"}
      nav={adminNav}
    >
      <Panel padding="none">
        <div className="border-b px-6 py-4">
          <PanelHeader title="Complaint queue" />
        </div>
        {complaints.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={MessageSquareWarning}
              title="No complaints"
              description="When customers file complaints, they will appear here for review."
            />
          </div>
        ) : (
          <ul className="divide-y">
            {complaints.map((c) => (
              <li key={c.id} className="space-y-4 px-6 py-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{c.complaintType}</p>
                    <p className="text-sm text-muted-foreground">
                      {c.reporter.name} · {formatDate(c.createdAt)}
                      {c.booking ? ` · ${c.booking.bookingReference}` : ""}
                    </p>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
                <p className="text-sm leading-relaxed">{c.description}</p>
                {c.status === "OPEN" || c.status === "IN_PROGRESS" ? (
                  <div className="flex flex-wrap gap-2">
                    <ActionButton action={markComplaintInProgress.bind(null, c.id)} size="sm" variant="secondary">
                      In progress
                    </ActionButton>
                    <ActionButton action={resolveComplaint.bind(null, c.id)} size="sm">
                      Resolve
                    </ActionButton>
                    <ActionButton action={dismissComplaint.bind(null, c.id)} size="sm" variant="outline">
                      Dismiss
                    </ActionButton>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </AppShell>
  );
}
