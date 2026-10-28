import Link from "next/link";

import { auth } from "@/auth";
import { BrandLogo } from "@/components/brand/logo";
import { Button, buttonVariants } from "@/components/ui/button";
import { roleHomePath } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

export async function MarketingHeader() {
  const session = await auth();
  const dashboardHref = session?.user
    ? roleHomePath(session.user.role)
    : "/login";

  return (
    <header className="sticky top-0 z-50 border-b bg-card/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <BrandLogo showTagline />
        <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
          <Link href="/#services" className="transition hover:text-primary">
            Services
          </Link>
          <Link href="/technicians" className="transition hover:text-primary">
            Technicians
          </Link>
          <Link href="/#how-it-works" className="transition hover:text-primary">
            How it works
          </Link>
          <Link href="/#trust" className="transition hover:text-primary">
            Why FixNear
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          {session?.user ? (
            <>
              <Link
                href={dashboardHref}
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "rounded-lg")}
              >
                Dashboard
              </Link>
              <Link href="/customer/book">
                <Button size="sm" className="rounded-lg shadow-sm">
                  Book service
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "rounded-lg")}
              >
                Sign in
              </Link>
              <Link href="/register">
                <Button size="sm" className="rounded-lg shadow-sm">
                  Get started
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
