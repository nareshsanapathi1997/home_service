import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  CheckCircle2,
  Droplets,
  FileText,
  Headset,
  type LucideIcon,
  MapPin,
  ShieldCheck,
  Snowflake,
  Star,
  Wallet,
  Wrench,
  Zap,
} from "lucide-react";

import { MarketingFooter } from "@/components/layout/marketing-footer";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { buttonVariants } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { config } from "@/lib/config";
import { formatCurrency } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const { name } = config.app;

// Icon and colour for each service, keyed by the category's iconKey.
const SERVICE_STYLE: Record<string, { icon: LucideIcon; tile: string }> = {
  zap: { icon: Zap, tile: "bg-amber-100 text-amber-700" },
  snowflake: { icon: Snowflake, tile: "bg-sky-100 text-sky-700" },
  droplets: { icon: Droplets, tile: "bg-blue-100 text-blue-700" },
};
const DEFAULT_STYLE = { icon: Wrench, tile: "bg-violet-100 text-violet-700" };

const promises = [
  { icon: BadgeCheck, title: "ID-verified pros", body: "Documents checked by our team" },
  { icon: FileText, title: "Quote before work", body: "Itemised, approved by you" },
  { icon: Wallet, title: "Pay after you agree", body: "No surprises on the bill" },
  { icon: Headset, title: "Dispute support", body: "We step in if something's wrong" },
] as const;

const steps = [
  {
    title: "Pick a service and a slot",
    body: "Choose the job, your locality and a free one-hour slot that suits you.",
  },
  {
    title: "Approve the quote",
    body: "Your technician visits, sends an itemised quote, and starts only once you accept.",
  },
  {
    title: "Pay, confirm and review",
    body: "Pay securely, confirm the work is done, and help neighbours with a review.",
  },
] as const;

// Illustrative preview of a booking, shown beside the hero text.
function BookingPreview() {
  return (
    <div aria-hidden className="relative mx-auto w-full max-w-md select-none">
      <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-primary/20 via-primary/5 to-premium/20 blur-2xl" />
      <div className="glass-panel p-5 pb-16 shadow-xl shadow-primary/10 sm:pb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <Zap className="size-5" />
            </span>
            <div>
              <p className="font-semibold">Electrician visit</p>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="size-3" /> Madhapur · Tue, 11:00
              </p>
            </div>
          </div>
          <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-indigo-800">
            Quote accepted
          </span>
        </div>

        <div className="mt-5 flex items-center gap-3 rounded-xl bg-muted/70 p-3">
          <span className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            RK
          </span>
          <div className="flex-1">
            <p className="flex items-center gap-1 text-sm font-semibold">
              Ravi Kumar <BadgeCheck className="size-4 text-primary" />
            </p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="size-3 fill-premium text-premium" /> 4.8 · 8 yrs experience
            </p>
          </div>
        </div>

        <div className="mt-5">
          <p className="text-xs font-medium text-muted-foreground">Available today</p>
          <div className="mt-2 grid grid-cols-4 gap-2 text-center text-xs font-medium">
            {["09:00", "11:00", "14:00", "16:00"].map((t) => (
              <span
                key={t}
                className={cn(
                  "rounded-lg border py-1.5",
                  t === "11:00" ? "border-primary bg-primary text-primary-foreground" : "bg-card"
                )}
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        <dl className="mt-5 space-y-1.5 border-t pt-4 text-sm sm:pb-10">
          {[
            ["Visit fee", "₹199"],
            ["Labour", "₹600"],
            ["Parts", "₹150"],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between text-muted-foreground">
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
          <div className="flex justify-between pt-1.5 text-base font-semibold">
            <dt>Total</dt>
            <dd>₹949</dd>
          </div>
        </dl>
      </div>

      <div className="glass-panel absolute -bottom-7 -left-8 hidden items-center gap-2.5 px-4 py-3 shadow-lg sm:flex">
        <span className="flex size-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="size-4" />
        </span>
        <div>
          <p className="text-sm font-semibold">Job completed</p>
          <p className="text-xs text-muted-foreground">Paid securely via UPI</p>
        </div>
      </div>
    </div>
  );
}

export default async function Home() {
  const categories = await prisma.serviceCategory.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="app-page-bg flex min-h-full flex-1 flex-col">
      <MarketingHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b bg-card">
          <div className="hero-grid absolute inset-0" />
          <div className="absolute -right-40 -top-40 size-[32rem] rounded-full bg-primary/10 blur-3xl" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-16 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:py-24">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3.5 py-1.5 text-sm font-semibold text-accent-foreground">
                <ShieldCheck className="size-4" />
                Verified home services in Hyderabad
              </span>
              <h1 className="mt-6 text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.5rem]">
                Fix it today with a <span className="text-gradient-brand">pro you can trust</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
                Book background-checked electricians, AC technicians and plumbers. See an itemised quote before any
                work starts, and pay only once you agree.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  href="/customer/book"
                  className={cn(buttonVariants({ size: "lg" }), "h-12 gap-2 rounded-xl px-6 text-base shadow-lg shadow-primary/25")}
                >
                  Book a technician
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/technicians"
                  className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-12 rounded-xl bg-card px-6 text-base")}
                >
                  Browse technicians
                </Link>
              </div>
              <p className="mt-6 text-sm text-muted-foreground">
                Are you a technician?{" "}
                <Link href="/register" className="font-semibold text-primary hover:underline">
                  Join {name} and get local jobs →
                </Link>
              </p>
            </div>
            <BookingPreview />
          </div>
        </section>

        {/* Promises */}
        <section className="border-b bg-card">
          <ul className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
            {promises.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <span>
                  <span className="block font-semibold">{title}</span>
                  <span className="block text-sm text-muted-foreground">{body}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Services */}
        <section id="services" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
          <SectionHeader
            eyebrow="Services"
            title="What can we fix for you?"
            description="Everyday repairs for Hyderabad homes, by technicians who work in your locality."
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => {
              const style = SERVICE_STYLE[c.iconKey ?? ""] ?? DEFAULT_STYLE;
              const Icon = style.icon;
              return (
                <Link
                  key={c.id}
                  href={`/technicians?service=${c.slug}`}
                  className="glass-panel group flex flex-col p-6 transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl"
                >
                  <span className={cn("flex size-12 items-center justify-center rounded-2xl", style.tile)}>
                    <Icon className="size-6" />
                  </span>
                  <h3 className="mt-5 text-xl font-semibold">{c.name}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{c.description}</p>
                  <div className="mt-6 flex items-center justify-between border-t pt-4">
                    <span className="text-sm text-muted-foreground">
                      {c.indicativeMin != null ? (
                        <>
                          From <span className="font-semibold text-foreground">{formatCurrency(c.indicativeMin)}</span>
                        </>
                      ) : (
                        "Quote on visit"
                      )}
                    </span>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                      See pros <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="scroll-mt-20 border-y bg-card py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeader
              eyebrow="How it works"
              title="From booking to done in three steps"
              description="Every step is tracked in your dashboard, with updates by notification and email."
            />
            <ol className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
              {steps.map(({ title, body }, i) => (
                <li key={title} className="relative">
                  {i < steps.length - 1 ? (
                    <span className="absolute left-14 right-0 top-6 hidden h-px bg-gradient-to-r from-primary/40 to-transparent md:block" />
                  ) : null}
                  <span className="flex size-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground shadow-lg shadow-primary/25">
                    {i + 1}
                  </span>
                  <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Trust */}
        <section id="trust" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <SectionHeader
                eyebrow={`Why ${name}`}
                title="Built for peace of mind"
                description="Local technicians, clear prices and a team that has your back if a job goes wrong."
              />
            </div>
            <ul className="grid gap-4 sm:grid-cols-2">
              {[
                { icon: ShieldCheck, text: "Every technician's ID and trade documents are checked before approval" },
                { icon: CalendarCheck, text: "Book only real free slots within each technician's working hours" },
                { icon: FileText, text: "Itemised quotes: visit fee, labour and parts listed separately" },
                { icon: Headset, text: "Raise a complaint or dispute and our team will review it" },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="glass-panel flex gap-3 p-5 text-sm leading-relaxed">
                  <Icon className="mt-0.5 size-5 shrink-0 text-primary" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Call to action */}
        <section className="px-4 pb-20 sm:px-6">
          <div className="premium-hero-dark mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 rounded-3xl px-8 py-12 text-white sm:flex-row sm:items-center sm:px-12">
            <div>
              <h2 className="text-2xl font-semibold sm:text-3xl">Something broken at home?</h2>
              <p className="mt-2 text-white/75">Book a verified technician in Hyderabad in under two minutes.</p>
            </div>
            <Link
              href="/customer/book"
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-premium px-6 font-semibold text-premium-foreground shadow-lg shadow-black/20 transition hover:brightness-110"
            >
              Book a service
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
