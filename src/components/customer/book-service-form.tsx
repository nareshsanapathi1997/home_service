"use client";

import { useState, useTransition } from "react";
import { Search, UserRound } from "lucide-react";

import { useActionForm } from "@/hooks/use-action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Textarea } from "@/components/ui/textarea";
import { createBooking, getAvailableSlots, searchTechnicians } from "@/lib/actions/bookings";
import type { TechnicianSearchResult } from "@/lib/actions/bookings";
import { cn } from "@/lib/utils";

type Category = { id: string; name: string };
type Area = { id: string; locality: string; city: string };

function StepBadge({ n, active }: { n: number; active?: boolean }) {
  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
        active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
      )}
    >
      {n}
    </span>
  );
}

export function BookServiceForm({
  categories,
  areas,
  minDate,
}: {
  categories: Category[];
  areas: Area[];
  minDate: string;
}) {
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [serviceAreaId, setServiceAreaId] = useState(areas[0]?.id ?? "");
  const [technicians, setTechnicians] = useState<TechnicianSearchResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [selectedTech, setSelectedTech] = useState<string>("");
  const [searchPending, startSearch] = useTransition();
  const [bookState, bookAction, bookPending] = useActionForm(createBooking, {});
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<string[] | null>(null);
  const [slotsPending, startSlots] = useTransition();

  function resetSearch() {
    setTechnicians([]);
    setSelectedTech("");
    setSearched(false);
    setSlots(null);
  }

  function loadSlots(technicianId: string, day: string) {
    setSlots(null);
    if (!technicianId || !day) return;
    startSlots(async () => {
      setSlots(await getAvailableSlots(technicianId, day));
    });
  }

  function chooseTechnician(technicianId: string) {
    setSelectedTech(technicianId);
    loadSlots(technicianId, date);
  }

  function runSearch() {
    const fd = new FormData();
    fd.set("categoryId", categoryId);
    fd.set("serviceAreaId", serviceAreaId);
    startSearch(async () => {
      const results = await searchTechnicians(fd);
      setTechnicians(results);
      setSelectedTech(results[0]?.id ?? "");
      setSearched(true);
      loadSlots(results[0]?.id ?? "", date);
    });
  }

  return (
    <div className="space-y-6">
      <Panel>
        <div className="flex gap-4">
          <StepBadge n={1} active />
          <div className="flex-1">
            <PanelHeader
              title="Service & area"
              description="Choose what you need and where in Hyderabad."
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="categoryId">Category</Label>
                <NativeSelect
                  id="categoryId"
                  value={categoryId}
                  onChange={(e) => {
                    setCategoryId(e.target.value);
                    resetSearch();
                  }}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <div className="space-y-2">
                <Label htmlFor="serviceAreaId">Locality</Label>
                <NativeSelect
                  id="serviceAreaId"
                  value={serviceAreaId}
                  onChange={(e) => {
                    setServiceAreaId(e.target.value);
                    resetSearch();
                  }}
                >
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.locality}, {a.city}
                    </option>
                  ))}
                </NativeSelect>
              </div>
            </div>
            <Button
              type="button"
              className="mt-5 h-10 gap-2 rounded-lg px-4"
              disabled={searchPending}
              onClick={() => runSearch()}
            >
              <Search className="size-4" />
              {searchPending ? "Searching…" : "Find technicians"}
            </Button>
          </div>
        </div>
      </Panel>

      {searched && technicians.length === 0 ? (
        <Panel>
          <p className="text-sm text-muted-foreground">
            No verified technicians offer this service in this locality yet. Try another locality.
          </p>
        </Panel>
      ) : null}

      {technicians.length > 0 ? (
        <Panel>
          <div className="flex gap-4">
            <StepBadge n={2} active />
            <div className="flex-1">
              <PanelHeader title="Choose technician" description="Verified pros matching your area." />
              <ul className="space-y-3">
                {technicians.map((t) => (
                  <li key={t.id}>
                    <label
                      className={cn(
                        "flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition",
                        selectedTech === t.id
                          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                          : "hover:border-primary/30"
                      )}
                    >
                      <input
                        type="radio"
                        name="technicianPick"
                        value={t.id}
                        checked={selectedTech === t.id}
                        onChange={() => chooseTechnician(t.id)}
                        className="mt-1"
                      />
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <UserRound className="size-5" />
                      </span>
                      <span className="min-w-0">
                        <span className="font-semibold">{t.name}</span>
                        <span className="mt-0.5 block text-sm text-muted-foreground">
                          {t.experienceYears} yrs experience · Rating{" "}
                          {t.ratingAverage != null ? `${t.ratingAverage.toFixed(1)} (${t.ratingCount})` : "New"}
                        </span>
                        {t.bio ? (
                          <span className="mt-1 block text-sm text-muted-foreground">{t.bio}</span>
                        ) : null}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Panel>
      ) : null}

      {selectedTech ? (
        <Panel>
          <div className="flex gap-4">
            <StepBadge n={3} active />
            <div className="flex-1">
              <PanelHeader title="Visit details" description="Tell the technician when and where to come." />
              <form onSubmit={bookAction} className="grid gap-4 sm:grid-cols-2">
                <input type="hidden" name="categoryId" value={categoryId} />
                <input type="hidden" name="serviceAreaId" value={serviceAreaId} />
                <input type="hidden" name="technicianId" value={selectedTech} />
                <div className="space-y-2">
                  <Label htmlFor="preferredDate">Preferred date</Label>
                  <Input
                    id="preferredDate"
                    name="preferredDate"
                    type="date"
                    min={minDate}
                    required
                    value={date}
                    onChange={(e) => {
                      setDate(e.target.value);
                      loadSlots(selectedTech, e.target.value);
                    }}
                    className="h-11 rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preferredTime">Preferred time</Label>
                  <NativeSelect
                    id="preferredTime"
                    name="preferredTime"
                    required
                    disabled={!slots || slots.length === 0}
                    key={`${selectedTech}-${date}`}
                  >
                    {!date ? (
                      <option value="">Pick a date first</option>
                    ) : slotsPending || !slots ? (
                      <option value="">Loading times…</option>
                    ) : slots.length === 0 ? (
                      <option value="">No free times on this day</option>
                    ) : (
                      slots.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))
                    )}
                  </NativeSelect>
                  {date && slots && slots.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      This technician isn&apos;t working or is fully booked that day. Try another date.
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="serviceAddress">Address</Label>
                  <Input id="serviceAddress" name="serviceAddress" required className="h-11 rounded-lg" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="locality">Locality</Label>
                  <Input id="locality" name="locality" required className="h-11 rounded-lg" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="photo">Photo of the problem (optional)</Label>
                  <Input
                    id="photo"
                    name="photo"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="h-11 rounded-lg"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="problemDescription">Problem description</Label>
                  <Textarea id="problemDescription" name="problemDescription" rows={4} required minLength={10} className="rounded-lg" />
                </div>
                {bookState.error ? (
                  <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive sm:col-span-2">
                    {bookState.error}
                  </p>
                ) : null}
                <Button type="submit" disabled={bookPending} className="h-11 rounded-lg sm:col-span-2">
                  {bookPending ? "Submitting…" : "Submit booking request"}
                </Button>
              </form>
            </div>
          </div>
        </Panel>
      ) : null}
    </div>
  );
}
