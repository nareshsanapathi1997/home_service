import Link from "next/link";
import { CalendarClock, PlusCircle } from "lucide-react";

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
import { customerNav } from "@/lib/nav";

export default async function CustomerDashboardPage() {
  const user = await requireRole(["CUSTOMER"]);

  const bookings = await prisma.booking.findMany({
    where: { customerId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      category: true,
      technician: { include: { user: { select: { name: true } } } },
    },
  });

  const active = bookings.filter((b) => !CLOSED_STATUSES.includes(b.status)).length;
  const completed = bookings.filter((b) => b.status === "COMPLETED").length;

  return (
    <AppShell
      title="Your home services"
      subtitle="Book verified technicians, track quotes, and manage payments in one place."
      role={user.role}
      userName={user.name ?? "Customer"}
      nav={customerNav}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total bookings" value={bookings.length} icon={CalendarClock} />
        <StatCard label="Active jobs" value={active} hint="In progress or awaiting action" />
        <StatCard label="Completed" value={completed} />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <DashboardLink
          href="/customer/book"
          label="Book a service"
          description="Search verified technicians in Hyderabad and request a visit."
        />
        <DashboardLink
          href="/customer#bookings"
          label="Manage bookings"
          description="View quotes, pay, and leave reviews on completed jobs."
        />
      </div>

      <div id="bookings" className="scroll-mt-24">
        <Panel className="mt-10">
          <PanelHeader
            title="Your bookings"
            description="Tap a booking to view quotes, payment, and reviews."
            action={
              <Link href="/customer/book">
                <Button size="sm" className="rounded-lg gap-1">
                  <PlusCircle className="size-4" />
                  New booking
                </Button>
              </Link>
            }
          />
          {bookings.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title="No bookings yet"
              description="When you request a technician, your bookings and quotes will show up here."
              action={
                <Link href="/customer/book">
                  <Button className="rounded-lg">Book your first service</Button>
                </Link>
              }
            />
          ) : (
            <DataRowList>
              {bookings.map((b) => (
                <DataRow
                  key={b.id}
                  href={`/customer/bookings/${b.id}`}
                  title={b.bookingReference}
                  subtitle={`${b.category.name} · ${b.technician.user.name} · ${formatDate(b.preferredDate)}`}
                  trailing={<StatusBadge status={b.status} />}
                />
              ))}
            </DataRowList>
          )}
        </Panel>
      </div>
    </AppShell>
  );
}
