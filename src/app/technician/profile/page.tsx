import { AppShell } from "@/components/layout/app-shell";
import { DocumentsPanel } from "@/components/technician/documents-panel";
import { TechnicianProfileForm } from "@/components/technician/profile-form";
import { formatDate } from "@/lib/format";
import { DOCUMENT_KINDS, fileUrl } from "@/lib/uploads";
import { requireRole } from "@/lib/auth/session";
import { technicianNav } from "@/lib/nav";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function TechnicianProfilePage() {
  const user = await requireRole(["TECHNICIAN"]);

  const [profile, categories, services, areas, serviceAreas] = await Promise.all([
    prisma.technicianProfile.findUnique({
      where: { userId: user.id },
      include: { verificationDocuments: { orderBy: { uploadedAt: "desc" } } },
    }),
    prisma.serviceCategory.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.technicianService.findMany({
      where: { technician: { userId: user.id } },
    }),
    prisma.serviceArea.findMany({ where: { isActive: true }, orderBy: { locality: "asc" } }),
    prisma.technicianServiceArea.findMany({
      where: { technician: { userId: user.id } },
    }),
  ]);

  if (!profile) notFound();

  const activeCategoryIds = new Set(services.filter((s) => s.isActive).map((s) => s.categoryId));
  const activeAreaIds = new Set(serviceAreas.filter((a) => a.isActive).map((a) => a.areaId));

  return (
    <AppShell
      title="Profile"
      subtitle="Your public bio and the services customers can book."
      role={user.role}
      userName={user.name ?? "Technician"}
      nav={technicianNav}
    >
      <TechnicianProfileForm
        bio={profile.bio ?? ""}
        experienceYears={profile.experienceYears}
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          enabled: activeCategoryIds.has(c.id),
        }))}
        areas={areas.map((a) => ({
          id: a.id,
          name: `${a.locality}, ${a.city}`,
          enabled: activeAreaIds.has(a.id),
        }))}
      />
      <div className="mt-6">
        <DocumentsPanel
          kinds={DOCUMENT_KINDS}
          locked={profile.verificationStatus === "APPROVED"}
          documents={profile.verificationDocuments.map((d) => ({
            id: d.id,
            documentType: d.documentType,
            fileName: d.fileName,
            url: fileUrl(d.documentUrl),
            uploadedAt: formatDate(d.uploadedAt),
          }))}
        />
      </div>
    </AppShell>
  );
}
