import { AppShell } from "@/components/layout/app-shell";
import { AvailabilityForm } from "@/components/technician/availability-form";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { requireRole } from "@/lib/auth/session";
import { ActionButton } from "@/components/ui/action-button";
import { removeAvailability } from "@/lib/actions/technician";
import { technicianNav } from "@/lib/nav";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function TechnicianAvailabilityPage() {
  const user = await requireRole(["TECHNICIAN"]);

  const profile = await prisma.technicianProfile.findUnique({
    where: { userId: user.id },
    include: { technicianAvailabilities: { orderBy: { dayOfWeek: "asc" } } },
  });
  if (!profile) notFound();

  return (
    <AppShell
      title="Availability"
      subtitle="Weekly hours customers can request (IST)."
      role={user.role}
      userName={user.name ?? "Technician"}
      nav={technicianNav}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <PanelHeader title="Current schedule" />
          {profile.technicianAvailabilities.length === 0 ? (
            <p className="text-sm text-muted-foreground">No slots yet — add your first below.</p>
          ) : (
            <ul className="space-y-2">
              {profile.technicianAvailabilities.map((slot) => (
                <li
                  key={slot.id}
                  className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3 text-sm"
                >
                  <span className="font-medium">{days[slot.dayOfWeek]}</span>
                  <span className="flex items-center gap-3 text-muted-foreground">
                    {slot.startTime} – {slot.endTime}
                    <ActionButton action={removeAvailability.bind(null, slot.id)} variant="ghost" size="sm">
                      Remove
                    </ActionButton>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <AvailabilityForm />
      </div>
    </AppShell>
  );
}
