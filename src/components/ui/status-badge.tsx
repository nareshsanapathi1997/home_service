import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  REQUESTED: "border-amber-200 bg-amber-50 text-amber-800",
  ACCEPTED: "border-blue-200 bg-blue-50 text-blue-800",
  QUOTE_PENDING: "border-violet-200 bg-violet-50 text-violet-800",
  QUOTE_ACCEPTED: "border-indigo-200 bg-indigo-50 text-indigo-800",
  IN_PROGRESS: "border-sky-200 bg-sky-50 text-sky-800",
  AWAITING_CUSTOMER_CONFIRMATION: "border-orange-200 bg-orange-50 text-orange-800",
  COMPLETED: "border-emerald-200 bg-emerald-50 text-emerald-900",
  CANCELLED: "border-red-200 bg-red-50 text-red-800",
  REJECTED: "border-red-200 bg-red-50 text-red-800",
  PENDING: "border-amber-200 bg-amber-50 text-amber-900",
  PAID: "border-emerald-200 bg-emerald-50 text-emerald-900",
  UNPAID: "border-zinc-200 bg-zinc-100 text-zinc-700",
  OPEN: "border-amber-200 bg-amber-50 text-amber-900",
  IN_PROGRESS_C: "border-sky-200 bg-sky-50 text-sky-900",
  RESOLVED: "border-emerald-200 bg-emerald-50 text-emerald-900",
  RECONCILED: "border-emerald-200 bg-emerald-50 text-emerald-900",
  DISPUTED: "border-red-200 bg-red-50 text-red-800",
  REFUNDED: "border-zinc-200 bg-zinc-100 text-zinc-700",
  ACTIVE: "border-emerald-200 bg-emerald-50 text-emerald-900",
  SUSPENDED: "border-red-200 bg-red-50 text-red-800",
  APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-900",
  DISMISSED: "border-zinc-200 bg-zinc-100 text-zinc-700",
  CLOSED: "border-zinc-200 bg-zinc-100 text-zinc-700",
};

export function StatusBadge({ status }: { status: string }) {
  const label = status.replaceAll("_", " ").toLowerCase();
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        styles[status] ?? "bg-muted text-muted-foreground"
      )}
    >
      {label}
    </Badge>
  );
}
