import type { MetadataRoute } from "next";

import { appUrl } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { listedTechnicianWhere } from "@/lib/public-technicians";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const technicians = await prisma.technicianProfile.findMany({
    where: listedTechnicianWhere,
    select: { id: true, updatedAt: true },
  });

  return [
    { url: appUrl("/"), changeFrequency: "weekly", priority: 1 },
    { url: appUrl("/technicians"), changeFrequency: "daily", priority: 0.8 },
    ...technicians.map((t) => ({
      url: appUrl(`/technicians/${t.id}`),
      lastModified: t.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
