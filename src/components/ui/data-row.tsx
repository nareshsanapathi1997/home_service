import Link from "next/link";

import { cn } from "@/lib/utils";

export function DataRowList({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <ul className={cn("divide-y divide-border/80 rounded-2xl border bg-card", className)}>
      {children}
    </ul>
  );
}

export function DataRow({
  href,
  title,
  subtitle,
  trailing,
  className,
}: {
  href?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  trailing?: React.ReactNode;
  className?: string;
}) {
  const inner = (
    <>
      <div className="min-w-0 flex-1">
        <div className="font-medium text-foreground">{title}</div>
        {subtitle ? (
          <p className="mt-0.5 truncate text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {trailing ? <div className="shrink-0">{trailing}</div> : null}
    </>
  );

  const rowClass = cn(
    "flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition-colors",
    href && "hover:bg-muted/40",
    className
  );

  if (href) {
    return (
      <li>
        <Link href={href} className={rowClass}>
          {inner}
        </Link>
      </li>
    );
  }

  return <li className={rowClass}>{inner}</li>;
}
