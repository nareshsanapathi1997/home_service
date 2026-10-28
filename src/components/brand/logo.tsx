import Link from "next/link";
import { Wrench } from "lucide-react";

import { config } from "@/lib/config";
import { cn } from "@/lib/utils";

export function BrandLogo({
  className,
  showTagline = false,
  href = "/",
  variant = "default",
}: {
  className?: string;
  showTagline?: boolean;
  href?: string;
  variant?: "default" | "onPrimary";
}) {
  const { name } = config.app;
  const onPrimary = variant === "onPrimary";

  return (
    <Link href={href} className={cn("group flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "relative flex size-9 items-center justify-center rounded-xl shadow-sm transition group-hover:-rotate-6",
          onPrimary ? "bg-white/15 text-white ring-1 ring-white/25" : "bg-primary text-primary-foreground shadow-primary/30"
        )}
      >
        <Wrench className="size-[18px]" strokeWidth={2.4} />
        <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-premium ring-2 ring-background" />
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "text-[17px] font-bold tracking-tight",
            onPrimary ? "text-white" : "text-foreground"
          )}
        >
          {name}
        </span>
        {showTagline ? (
          <span
            className={cn(
              "mt-0.5 text-[10px] font-medium uppercase tracking-wider",
              onPrimary ? "text-white/70" : "text-muted-foreground"
            )}
          >
            Hyderabad
          </span>
        ) : null}
      </span>
    </Link>
  );
}
