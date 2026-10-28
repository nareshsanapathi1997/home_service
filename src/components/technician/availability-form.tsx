"use client";

import { useActionForm } from "@/hooks/use-action-form";

import { setAvailability } from "@/lib/actions/technician";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Panel, PanelHeader } from "@/components/ui/panel";

const days = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

export function AvailabilityForm() {
  const [state, action, pending] = useActionForm(setAvailability, {});

  return (
    <Panel>
      <PanelHeader title="Add or update slot" />
      <form onSubmit={action} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="dayOfWeek">Day</Label>
          <NativeSelect id="dayOfWeek" name="dayOfWeek" required defaultValue="1">
            {days.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startTime">Start</Label>
            <Input id="startTime" name="startTime" type="time" defaultValue="09:00" required className="rounded-lg" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endTime">End</Label>
            <Input id="endTime" name="endTime" type="time" defaultValue="18:00" required className="rounded-lg" />
          </div>
        </div>
        {state.success ? <p className="text-sm text-primary">{state.success}</p> : null}
        {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
        <Button type="submit" disabled={pending} className="rounded-lg">
          Save slot
        </Button>
      </form>
    </Panel>
  );
}
