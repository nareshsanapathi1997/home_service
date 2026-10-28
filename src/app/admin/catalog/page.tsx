import { AppShell } from "@/components/layout/app-shell";
import { NewAreaForm, NewCategoryForm } from "@/components/admin/catalog-forms";
import { ActionButton } from "@/components/ui/action-button";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { disableArea, disableCategory, enableArea, enableCategory } from "@/lib/actions/admin";
import { requireRole } from "@/lib/auth/session";
import { formatCurrency } from "@/lib/format";
import { adminNav } from "@/lib/nav";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Services & areas" };

export default async function AdminCatalogPage() {
  const admin = await requireRole(["ADMIN"]);

  const [categories, areas] = await Promise.all([
    prisma.serviceCategory.findMany({
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { technicianServices: { where: { isActive: true } } } } },
    }),
    prisma.serviceArea.findMany({
      orderBy: [{ city: "asc" }, { locality: "asc" }],
      include: { _count: { select: { technicianServiceAreas: { where: { isActive: true } } } } },
    }),
  ]);

  return (
    <AppShell
      title="Services & areas"
      subtitle="What customers can book and where. Disabled items disappear from booking and search."
      role={admin.role}
      userName={admin.name ?? "Admin"}
      nav={adminNav}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <PanelHeader title="Services" />
          <ul className="mb-6 divide-y rounded-xl border">
            {categories.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <span>
                  <span className={c.isActive ? "font-medium" : "font-medium text-muted-foreground line-through"}>
                    {c.name}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {c._count.technicianServices} technicians
                    {c.indicativeMin != null && c.indicativeMax != null
                      ? ` · ${formatCurrency(c.indicativeMin)}–${formatCurrency(c.indicativeMax)}`
                      : ""}
                  </span>
                </span>
                <ActionButton
                  action={(c.isActive ? disableCategory : enableCategory).bind(null, c.id)}
                  size="sm"
                  variant={c.isActive ? "outline" : "default"}
                >
                  {c.isActive ? "Disable" : "Enable"}
                </ActionButton>
              </li>
            ))}
          </ul>
          <NewCategoryForm />
        </Panel>

        <Panel>
          <PanelHeader title="Areas" />
          <ul className="mb-6 divide-y rounded-xl border">
            {areas.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <span>
                  <span className={a.isActive ? "font-medium" : "font-medium text-muted-foreground line-through"}>
                    {a.locality}, {a.city}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {a.pincode ? `${a.pincode} · ` : ""}
                    {a._count.technicianServiceAreas} technicians
                  </span>
                </span>
                <ActionButton
                  action={(a.isActive ? disableArea : enableArea).bind(null, a.id)}
                  size="sm"
                  variant={a.isActive ? "outline" : "default"}
                >
                  {a.isActive ? "Disable" : "Enable"}
                </ActionButton>
              </li>
            ))}
          </ul>
          <NewAreaForm />
        </Panel>
      </div>
    </AppShell>
  );
}
