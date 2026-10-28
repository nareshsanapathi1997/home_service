import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { BrandLogo } from "@/components/brand/logo";
import { config } from "@/lib/config";

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  const { name } = config.app;

  return (
    <div className="app-page-bg flex min-h-full flex-1">
      <div className="relative hidden w-[44%] overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="premium-hero-dark absolute inset-0" />
        <div className="hero-grid absolute inset-0 opacity-30" />
        <div className="relative">
          <BrandLogo variant="onPrimary" href="/" />
        </div>
        <div className="relative max-w-md text-white">
          <h1 className="text-3xl font-semibold leading-tight">
            Home repairs you can trust in Hyderabad
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-white/85">
            {name} connects you with verified electricians, AC technicians, and plumbers.
            Book visits, approve quotes, pay securely, and rate your experience.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-white/90">
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="size-4 text-premium" />
              Background-checked professionals
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="size-4 text-premium" />
              Itemized quotes before work starts
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="size-4 text-premium" />
              Support if something goes wrong
            </li>
          </ul>
        </div>
        <p className="relative text-xs text-white/60">Serving Madhapur, Gachibowli, Kukatpally & more</p>
      </div>

      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-8 lg:px-16">
        <div className="mb-8 lg:hidden">
          <BrandLogo showTagline />
        </div>
        <div className="mx-auto w-full max-w-md">
          <h2 className="text-2xl font-semibold">{title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          <div className="glass-panel mt-8 p-6 sm:p-8">{children}</div>
          <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>
        </div>
      </div>
    </div>
  );
}

export function AuthFooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className="font-semibold text-primary underline-offset-4 hover:underline">
      {children}
    </Link>
  );
}
