import { prisma } from "@/lib/prisma";

// Technicians who are publicly listed: approved, active, and offering at least one live service.
export const listedTechnicianWhere = {
  isVerified: true,
  verificationStatus: "APPROVED" as const,
  user: { accountStatus: "ACTIVE" as const },
  technicianServices: { some: { isActive: true, category: { isActive: true } } },
};

export async function getPublicTechnician(id: string) {
  return prisma.technicianProfile.findFirst({
    where: { id, ...listedTechnicianWhere },
    include: {
      user: { select: { name: true } },
      technicianServices: { where: { isActive: true, category: { isActive: true } }, include: { category: true } },
      technicianServiceAreas: { where: { isActive: true, area: { isActive: true } }, include: { area: true } },
      technicianAvailabilities: { where: { isActive: true }, orderBy: { dayOfWeek: "asc" } },
      reviews: {
        where: { isHidden: false },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { customer: { select: { name: true } } },
      },
    },
  });
}

// Reviewers are shown by first name only.
export function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? "Customer";
}
