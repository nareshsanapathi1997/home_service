import { AppShell } from "@/components/layout/app-shell";
import { ActionButton } from "@/components/ui/action-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { reactivateUser, suspendUser } from "@/lib/actions/admin";
import { requireRole } from "@/lib/auth/session";
import { formatDate } from "@/lib/format";
import { adminNav } from "@/lib/nav";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Users" };

const ROLES = ["CUSTOMER", "TECHNICIAN", "ADMIN"] as const;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string }>;
}) {
  const admin = await requireRole(["ADMIN"]);
  const { q = "", role = "" } = await searchParams;
  const roleFilter = ROLES.find((r) => r === role);
  const query = q.trim();

  const users = await prisma.user.findMany({
    where: {
      ...(roleFilter ? { role: roleFilter } : {}),
      ...(query ? { OR: [{ name: { contains: query } }, { email: { contains: query } }] } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <AppShell
      title="Users"
      subtitle="Find accounts and suspend or reactivate them. Suspended users are signed out within a minute."
      role={admin.role}
      userName={admin.name ?? "Admin"}
      nav={adminNav}
    >
      <Panel padding="none">
        <div className="border-b px-6 py-4">
          <form className="flex flex-wrap gap-2">
            <Input name="q" defaultValue={query} placeholder="Search name or email" className="max-w-xs rounded-lg" aria-label="Search" />
            <NativeSelect name="role" defaultValue={roleFilter ?? ""} className="max-w-[180px]" aria-label="Role">
              <option value="">All roles</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r.toLowerCase()}
                </option>
              ))}
            </NativeSelect>
            <Button type="submit" variant="secondary" className="rounded-lg">
              Search
            </Button>
          </form>
        </div>
        <div className="px-6 pt-4">
          <PanelHeader title={`${users.length} user${users.length === 1 ? "" : "s"}`} description={users.length === 100 ? "Showing the newest 100." : undefined} />
        </div>
        <ul className="divide-y">
          {users.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
              <div>
                <p className="font-semibold">{u.name}</p>
                <p className="text-sm text-muted-foreground">
                  {u.email}
                  {u.phone ? ` · ${u.phone}` : ""} · joined {formatDate(u.createdAt)}
                </p>
                <div className="mt-2 flex gap-2">
                  <StatusBadge status={u.role} />
                  <StatusBadge status={u.accountStatus} />
                </div>
              </div>
              {u.role !== "ADMIN" ? (
                u.accountStatus === "SUSPENDED" ? (
                  <ActionButton action={reactivateUser.bind(null, u.id)} size="sm">
                    Reactivate
                  </ActionButton>
                ) : u.accountStatus === "ACTIVE" || u.accountStatus === "PENDING" ? (
                  <ActionButton
                    action={suspendUser.bind(null, u.id)}
                    size="sm"
                    variant="destructive"
                    confirmMessage={`Suspend ${u.name}? They will be signed out and unable to log in.`}
                  >
                    Suspend
                  </ActionButton>
                ) : null
              ) : null}
            </li>
          ))}
        </ul>
      </Panel>
    </AppShell>
  );
}
