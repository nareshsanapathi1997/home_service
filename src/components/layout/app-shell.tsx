import Link from "next/link";

import { signOut } from "@/auth";
import { BrandLogo } from "@/components/brand/logo";
import { DashboardNav } from "@/components/layout/dashboard-nav";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { Button } from "@/components/ui/button";
import { roleHomePath } from "@/lib/auth/session";
import type { Role } from "@prisma/client";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";

type NavItem = { href: string; label: string };

export function AppShell({
  title,
  subtitle,
  nav,
  role,
  userName,
  children,
}: {
  title: string;
  subtitle?: string;
  nav: NavItem[];
  role: Role;
  userName: string;
  children: React.ReactNode;
}) {
  // Long menus get their own row at every width instead of crowding the header.
  const inlineNav = nav.length <= 5;
  const roleLabel =
    role === "ADMIN" ? "Admin" : role === "TECHNICIAN" ? "Technician" : "Customer";

  return (
    <div className="app-page-bg flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-40 border-b bg-card/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-6">
            <BrandLogo showTagline className="shrink-0" />
            {inlineNav ? (
              <div className="hidden md:block">
                <DashboardNav items={nav} />
              </div>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <span className="hidden rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-accent-foreground sm:inline">
              {roleLabel}
            </span>
            <Link
              href={roleHomePath(role)}
              className="hidden max-w-[140px] truncate text-sm text-muted-foreground hover:text-foreground sm:inline"
            >
              {userName}
            </Link>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <Button type="submit" variant="outline" size="sm" className="rounded-lg">
                Sign out
              </Button>
            </form>
          </div>
        </div>
        <div className={cn("border-t border-border/60", inlineNav && "md:hidden")}>
          <div className="mx-auto max-w-6xl overflow-x-auto px-4 py-2 sm:px-6">
            <DashboardNav items={nav} />
          </div>
        </div>
      </header>

      <div className="relative overflow-hidden border-b bg-card">
        <div className="hero-grid pointer-events-none absolute inset-y-0 right-0 w-1/2 opacity-60" />
        <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            {roleLabel} workspace
          </p>
          <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">{title}</h1>
          {subtitle ? (
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
      </div>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>
    </div>
  );
}

export function DashboardLink({
  href,
  label,
  description,
}: {
  href: string;
  label: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group glass-panel flex flex-col justify-between p-6 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg"
      )}
    >
      <div>
        <p className="font-semibold text-foreground group-hover:text-primary">{label}</p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
        Open
        <ArrowUpRight className="size-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </span>
    </Link>
  );
}
