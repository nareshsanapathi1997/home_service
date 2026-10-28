"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActionForm } from "@/hooks/use-action-form";
import { createArea, createCategory } from "@/lib/actions/admin";

function Message({ state }: { state: { error?: string; success?: string } }) {
  if (state.error) return <p className="text-sm text-destructive sm:col-span-full">{state.error}</p>;
  if (state.success) return <p className="text-sm text-primary sm:col-span-full">{state.success}</p>;
  return null;
}

export function NewCategoryForm() {
  const [state, action, pending] = useActionForm(createCategory, {});
  return (
    <form onSubmit={action} className="grid gap-3 sm:grid-cols-4 sm:items-end">
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="categoryName">Service name</Label>
        <Input id="categoryName" name="name" required placeholder="e.g. Carpentry" className="rounded-lg" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="indicativeMin">From (₹)</Label>
        <Input id="indicativeMin" name="indicativeMin" type="number" min={0} className="rounded-lg" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="indicativeMax">To (₹)</Label>
        <Input id="indicativeMax" name="indicativeMax" type="number" min={0} className="rounded-lg" />
      </div>
      <div className="space-y-2 sm:col-span-3">
        <Label htmlFor="categoryDescription">Short description</Label>
        <Input id="categoryDescription" name="description" className="rounded-lg" />
      </div>
      <Button type="submit" disabled={pending} className="rounded-lg">
        {pending ? "Adding…" : "Add service"}
      </Button>
      <Message state={state} />
    </form>
  );
}

export function NewAreaForm() {
  const [state, action, pending] = useActionForm(createArea, {});
  return (
    <form onSubmit={action} className="grid gap-3 sm:grid-cols-4 sm:items-end">
      <div className="space-y-2">
        <Label htmlFor="areaCity">City</Label>
        <Input id="areaCity" name="city" defaultValue="Hyderabad" required className="rounded-lg" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="areaLocality">Locality</Label>
        <Input id="areaLocality" name="locality" required placeholder="e.g. Kondapur" className="rounded-lg" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="areaPincode">Pincode</Label>
        <Input id="areaPincode" name="pincode" inputMode="numeric" maxLength={6} className="rounded-lg" />
      </div>
      <Button type="submit" disabled={pending} className="rounded-lg">
        {pending ? "Adding…" : "Add area"}
      </Button>
      <Message state={state} />
    </form>
  );
}
