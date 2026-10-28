import Link from "next/link";

import { BrandLogo } from "@/components/brand/logo";
import { config } from "@/lib/config";

export function MarketingFooter() {
  const { contactEmail, contactPhone } = config.app;

  return (
    <footer className="border-t bg-card">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <BrandLogo showTagline />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Verified home service professionals for Hyderabad — electricians, AC repair,
            and plumbing with transparent quotes.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold">Explore</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link href="/#services" className="hover:text-primary">
                Services
              </Link>
            </li>
            <li>
              <Link href="/#how-it-works" className="hover:text-primary">
                How it works
              </Link>
            </li>
            <li>
              <Link href="/technicians" className="hover:text-primary">
                Find technicians
              </Link>
            </li>
            <li>
              <Link href="/customer/book" className="hover:text-primary">
                Book a visit
              </Link>
            </li>
            <li>
              <Link href="/register" className="hover:text-primary">
                Join as technician
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold">Contact</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <a href={`mailto:${contactEmail}`} className="hover:text-primary">
                {contactEmail}
              </a>
            </li>
            <li>{contactPhone}</li>
          </ul>
        </div>
      </div>
      <div className="border-t py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {config.app.name}. All rights reserved.
      </div>
    </footer>
  );
}
