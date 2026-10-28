import { AppShell } from "@/components/layout/app-shell";
import {
  approveTechnicianProfile,
  rejectTechnicianProfile,
} from "@/lib/actions/admin";
import { requireRole } from "@/lib/auth/session";
import { adminNav } from "@/lib/nav";
import { prisma } from "@/lib/prisma";
import { ActionButton } from "@/components/ui/action-button";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { fileUrl } from "@/lib/uploads";

export default async function AdminVerificationPage() {
  const user = await requireRole(["ADMIN"]);

  const profiles = await prisma.technicianProfile.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      verificationDocuments: { orderBy: { uploadedAt: "desc" } },
      technicianServices: { where: { isActive: true }, include: { category: true } },
      technicianServiceAreas: { where: { isActive: true }, include: { area: true } },
    },
  });

  return (
    <AppShell
      title="Technician verification"
      subtitle="Review applications before technicians appear in customer search."
      role={user.role}
      userName={user.name ?? "Admin"}
      nav={adminNav}
    >
      <Panel padding="none">
        <div className="border-b px-6 py-4">
          <PanelHeader title="All technician profiles" description={`${profiles.length} total`} />
        </div>
        <ul className="divide-y">
          {profiles.map((p) => (
            <li key={p.id} className="flex flex-wrap items-start justify-between gap-4 px-6 py-5">
              <div>
                <p className="font-semibold">{p.user.name}</p>
                <p className="text-sm text-muted-foreground">
                  {p.user.email}
                  {p.user.phone ? ` · ${p.user.phone}` : ""}
                </p>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  {p.bio || "No bio provided."}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusBadge status={p.verificationStatus} />
                  <span className="text-xs text-muted-foreground">{p.experienceYears} yrs exp.</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Services: {p.technicianServices.map((s) => s.category.name).join(", ") || "none"} · Areas:{" "}
                  {p.technicianServiceAreas.map((a) => a.area.locality).join(", ") || "none"}
                </p>
                <div className="mt-2 text-sm">
                  {p.verificationDocuments.length === 0 ? (
                    <span className="text-amber-700">No documents uploaded</span>
                  ) : (
                    <ul className="flex flex-wrap gap-x-4 gap-y-1">
                      {p.verificationDocuments.map((d) => (
                        <li key={d.id}>
                          <a href={fileUrl(d.documentUrl)} target="_blank" rel="noreferrer" className="text-primary underline">
                            {d.documentType}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              {p.verificationStatus === "PENDING" ? (
                <div className="flex gap-2">
                  <ActionButton action={approveTechnicianProfile.bind(null, p.id)} size="sm">
                      Approve
                    </ActionButton>
                  <ActionButton action={rejectTechnicianProfile.bind(null, p.id)} size="sm" variant="outline">
                      Reject
                    </ActionButton>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </Panel>
    </AppShell>
  );
}
