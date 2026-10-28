import { cn } from "@/lib/utils";

export function Panel({
  className,
  children,
  padding = "default",
}: {
  className?: string;
  children: React.ReactNode;
  padding?: "none" | "default" | "lg";
}) {
  const pad =
    padding === "none" ? "" : padding === "lg" ? "p-8" : "p-6";
  return (
    <div
      className={cn(
        "glass-panel overflow-hidden",
        pad,
        className
      )}
    >
      {children}
    </div>
  );
}

export function PanelHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
