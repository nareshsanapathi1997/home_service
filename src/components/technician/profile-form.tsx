"use client";

import { useActionForm } from "@/hooks/use-action-form";

import {
  disableTechnicianService,
  disableTechnicianServiceArea,
  enableTechnicianService,
  enableTechnicianServiceArea,
  updateTechnicianProfile,
} from "@/lib/actions/technician";
import { ActionButton } from "@/components/ui/action-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Textarea } from "@/components/ui/textarea";

export function TechnicianProfileForm({
  bio,
  experienceYears,
  categories,
  areas,
}: {
  bio: string;
  experienceYears: number;
  categories: { id: string; name: string; enabled: boolean }[];
  areas: { id: string; name: string; enabled: boolean }[];
}) {
  const [state, action, pending] = useActionForm(updateTechnicianProfile, {});

  return (
    <div className="space-y-6">
      <Panel>
        <PanelHeader title="About you" description="Customers see this when choosing a technician." />
        <form onSubmit={action} className="max-w-xl space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" name="bio" defaultValue={bio} rows={4} className="rounded-lg" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="experienceYears">Years of experience</Label>
            <Input
              id="experienceYears"
              name="experienceYears"
              type="number"
              min={0}
              defaultValue={experienceYears}
              className="max-w-[140px] rounded-lg"
            />
          </div>
          {state.success ? <p className="text-sm text-primary">{state.success}</p> : null}
          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          <Button type="submit" disabled={pending} className="rounded-lg">
            Save profile
          </Button>
        </form>
      </Panel>

      <Panel>
        <PanelHeader title="Services offered" description="Enable categories you can take jobs for." />
        <ul className="divide-y rounded-xl border">
          {categories.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <span className="font-medium">{c.name}</span>
              <ActionButton
                action={
                  c.enabled
                    ? disableTechnicianService.bind(null, c.id)
                    : enableTechnicianService.bind(null, c.id)
                }
                size="sm"
                variant={c.enabled ? "default" : "outline"}
              >
                {c.enabled ? "Enabled" : "Enable"}
              </ActionButton>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel>
        <PanelHeader title="Areas served" description="Customers in these localities can find and book you." />
        <ul className="divide-y rounded-xl border">
          {areas.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <span className="font-medium">{a.name}</span>
              <ActionButton
                action={
                  a.enabled
                    ? disableTechnicianServiceArea.bind(null, a.id)
                    : enableTechnicianServiceArea.bind(null, a.id)
                }
                size="sm"
                variant={a.enabled ? "default" : "outline"}
              >
                {a.enabled ? "Serving" : "Add area"}
              </ActionButton>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
