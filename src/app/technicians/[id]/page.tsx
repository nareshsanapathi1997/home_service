import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BadgeCheck, MapPin, Star, UserRound } from "lucide-react";

import { MarketingFooter } from "@/components/layout/marketing-footer";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { config } from "@/lib/config";
import { formatDate } from "@/lib/format";
import { firstName, getPublicTechnician } from "@/lib/public-technicians";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const technician = await getPublicTechnician((await params).id);
  if (!technician) return { title: "Technician not found" };

  const services = technician.technicianServices.map((s) => s.category.name).join(", ");
  const description = `${technician.user.name}: verified ${services} technician in Hyderabad with ${technician.experienceYears} years of experience. Book on ${config.app.name}.`;
  return {
    title: `${technician.user.name} – ${services}`,
    description,
    openGraph: { title: technician.user.name, description },
  };
}

export default async function TechnicianProfilePage({ params }: Props) {
  const technician = await getPublicTechnician((await params).id);
  if (!technician) notFound();

  const rating =
    technician.ratingAverage != null && technician.ratingCount > 0 ? Number(technician.ratingAverage) : null;

  // Structured data so search engines can show the rating.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: technician.user.name,
    description: technician.bio || undefined,
    areaServed: technician.technicianServiceAreas.map((a) => `${a.area.locality}, ${a.area.city}`),
    ...(rating != null
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: rating.toFixed(1),
            reviewCount: technician.ratingCount,
          },
        }
      : {}),
  };

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <MarketingHeader />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6">
        <Link href="/technicians" className="text-sm text-muted-foreground hover:text-foreground">
          ← All technicians
        </Link>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-center gap-4">
            <span className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UserRound className="size-8" />
            </span>
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-semibold">
                {technician.user.name}
                <BadgeCheck className="size-5 text-primary" aria-label="Verified" />
              </h1>
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                <Star className="size-4 fill-premium text-premium" />
                {rating != null ? `${rating.toFixed(1)} from ${technician.ratingCount} reviews` : "No reviews yet"} ·{" "}
                {technician.experienceYears} years experience
              </p>
            </div>
          </div>
          <Link href="/customer/book">
            <Button className="rounded-lg">Book a visit</Button>
          </Link>
        </div>

        {technician.bio ? <p className="mt-6 max-w-2xl leading-relaxed">{technician.bio}</p> : null}

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <Panel>
            <PanelHeader title="Services" />
            <ul className="space-y-1 text-sm">
              {technician.technicianServices.map((s) => (
                <li key={s.id}>{s.category.name}</li>
              ))}
            </ul>
            <PanelHeader title="Areas" />
            <p className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
              {technician.technicianServiceAreas.map((a) => (
                <span key={a.id} className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5 text-muted-foreground" />
                  {a.area.locality}
                </span>
              ))}
            </p>
          </Panel>
          <Panel>
            <PanelHeader title="Working hours" />
            {technician.technicianAvailabilities.length === 0 ? (
              <p className="text-sm text-muted-foreground">Hours not published yet.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {technician.technicianAvailabilities.map((a) => (
                  <li key={a.id} className="flex justify-between">
                    <span>{DAYS[a.dayOfWeek]}</span>
                    <span className="text-muted-foreground">
                      {a.startTime} – {a.endTime}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <Panel className="mt-6">
          <PanelHeader title="Reviews" />
          {technician.reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reviews yet.</p>
          ) : (
            <ul className="divide-y">
              {technician.reviews.map((r) => (
                <li key={r.id} className="py-3">
                  <p className="text-sm">
                    <span className="text-premium">{"★".repeat(r.rating)}</span>
                    <span className="text-muted-foreground">{"★".repeat(5 - r.rating)}</span>{" "}
                    <span className="font-medium">{firstName(r.customer.name)}</span>
                    <span className="text-muted-foreground"> · {formatDate(r.createdAt)}</span>
                  </p>
                  {r.comment ? <p className="mt-1 text-sm leading-relaxed">{r.comment}</p> : null}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </main>
      <MarketingFooter />
    </div>
  );
}
