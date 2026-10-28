import { AppShell } from "@/components/layout/app-shell";
import { BookServiceForm } from "@/components/customer/book-service-form";
import { requireRole } from "@/lib/auth/session";
import { todayInIndia } from "@/lib/booking-workflow";
import { customerNav } from "@/lib/nav";
import { prisma } from "@/lib/prisma";

export default async function BookServicePage() {
  const user = await requireRole(["CUSTOMER"]);

  const [categories, areas] = await Promise.all([
    prisma.serviceCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
    prisma.serviceArea.findMany({
      where: { isActive: true, city: "Hyderabad" },
      orderBy: { locality: "asc" },
      select: { id: true, locality: true, city: true },
    }),
  ]);

  return (
    <AppShell
      title="Book a service"
      subtitle="Search verified technicians by category and Hyderabad locality."
      role={user.role}
      userName={user.name ?? "Customer"}
      nav={customerNav}
    >
      <BookServiceForm categories={categories} areas={areas} minDate={todayInIndia()} />
    </AppShell>
  );
}
