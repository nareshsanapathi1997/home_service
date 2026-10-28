import Link from "next/link";
import type { Metadata } from "next";
import { Star, UserRound } from "lucide-react";

import { MarketingFooter } from "@/components/layout/marketing-footer";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { config } from "@/lib/config";
import { prisma } from "@/lib/prisma";
import { listedTechnicianWhere } from "@/lib/public-technicians";

export const metadata: Metadata = {
  title: "Verified technicians in Hyderabad",
  description: `Browse ${config.app.name}'s verified electricians, AC technicians and plumbers in Hyderabad, with ratings from real customers.`,
};

export default async function TechniciansDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string; area?: string }>;
}) {
  const { service = "", area = "" } = await searchParams;

  const [categories, areas] = await Promise.all([
    prisma.serviceCategory.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.serviceArea.findMany({ where: { isActive: true }, orderBy: { locality: "asc" } }),
  ]);
  const category = categories.find((c) => c.slug === service);
  const serviceArea = areas.find((a) => a.id === area);

  const technicians = await prisma.technicianProfile.findMany({
    where: {
      ...listedTechnicianWhere,
      ...(category
        ? { technicianServices: { some: { categoryId: category.id, isActive: true } } }
        : {}),
      ...(serviceArea
        ? { technicianServiceAreas: { some: { areaId: serviceArea.id, isActive: true } } }
        : {}),
    },
    include: {
      user: { select: { name: true } },
      technicianServices: { where: { isActive: true, category: { isActive: true } }, include: { category: true } },
      technicianServiceAreas: { where: { isActive: true, area: { isActive: true } }, include: { area: true } },
    },
    orderBy: [{ ratingAverage: "desc" }, { experienceYears: "desc" }],
    take: 60,
  });

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <MarketingHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-semibold">
          {category ? `${category.name} technicians` : "Verified technicians"}
          {serviceArea ? ` in ${serviceArea.locality}` : " in Hyderabad"}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Every technician is checked by our team before they can take bookings.
        </p>

        <form className="mt-6 flex flex-wrap gap-2">
          <NativeSelect name="service" defaultValue={category?.slug ?? ""} aria-label="Service" className="max-w-[220px]">
            <option value="">All services</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </NativeSelect>
          <NativeSelect name="area" defaultValue={serviceArea?.id ?? ""} aria-label="Area" className="max-w-[220px]">
            <option value="">All areas</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.locality}
              </option>
            ))}
          </NativeSelect>
          <Button type="submit" variant="secondary" className="rounded-lg">
            Filter
          </Button>
        </form>

        {technicians.length === 0 ? (
          <p className="mt-10 text-sm text-muted-foreground">No technicians match these filters yet.</p>
        ) : (
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {technicians.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/technicians/${t.id}`}
                  className="glass-panel flex h-full flex-col gap-3 p-5 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <UserRound className="size-5" />
                    </span>
                    <span>
                      <span className="block font-semibold">{t.user.name}</span>
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Star className="size-3.5 fill-premium text-premium" />
                        {t.ratingAverage != null && t.ratingCount > 0
                          ? `${Number(t.ratingAverage).toFixed(1)} (${t.ratingCount})`
                          : "New"}{" "}
                        · {t.experienceYears} yrs
                      </span>
                    </span>
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {t.technicianServices.map((s) => s.category.name).join(", ")}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {t.technicianServiceAreas.map((a) => a.area.locality).join(" · ")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
      <MarketingFooter />
    </div>
  );
}
