import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { BookingCustomerActions } from "@/components/customer/booking-customer-actions";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireRole } from "@/lib/auth/session";
import { canCancel, canDispute, canPay } from "@/lib/booking-workflow";
import { razorpayKeys } from "@/lib/razorpay";
import { fileUrl } from "@/lib/uploads";
import { customerNav } from "@/lib/nav";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/format";

export default async function CustomerBookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole(["CUSTOMER"]);
  const { id } = await params;

  const booking = await prisma.booking.findFirst({
    where: { id, customerId: user.id },
    include: {
      category: true,
      serviceArea: true,
      technician: { include: { user: { select: { name: true, phone: true } } } },
      quotes: { orderBy: { version: "desc" } },
      reviews: true,
      bookingEvents: { orderBy: { timestamp: "desc" }, take: 20 },
    },
  });

  if (!booking) notFound();

  const pendingQuote = booking.quotes.find((q) => q.status === "PENDING");

  return (
    <AppShell
      title={booking.bookingReference}
      subtitle={`${booking.category.name} · ${booking.locality}`}
      role={user.role}
      userName={user.name ?? "Customer"}
      nav={customerNav}
    >
      <Link href="/customer">
        <Button variant="ghost" size="sm" className="mb-4 -ml-2 gap-1 rounded-lg">
          <ArrowLeft className="size-4" />
          Back to dashboard
        </Button>
      </Link>

      <div className="flex flex-wrap gap-2">
        <StatusBadge status={booking.status} />
        <StatusBadge status={booking.customerPaymentStatus} />
        {booking.paymentReference ? (
          <span className="text-xs text-muted-foreground">Ref {booking.paymentReference}</span>
        ) : null}
      </div>

      <Panel className="mt-6">
        <PanelHeader title="Booking details" />
        <dl className="grid gap-5 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Service</dt>
            <dd className="mt-1 font-medium">{booking.category.name}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Technician</dt>
            <dd className="mt-1 font-medium">
              {booking.technician.user.name}
              {booking.technician.user.phone && !["REQUESTED", "REJECTED", "CANCELLED"].includes(booking.status) ? (
                <span className="block text-sm font-normal text-muted-foreground">
                  {booking.technician.user.phone}
                </span>
              ) : null}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Schedule</dt>
            <dd className="mt-1">
              {formatDate(booking.preferredDate)} · {booking.preferredTime}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Area</dt>
            <dd className="mt-1">
              {booking.locality}, {booking.serviceArea.locality}, {booking.serviceArea.city}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Address</dt>
            <dd className="mt-1">{booking.serviceAddress}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Problem</dt>
            <dd className="mt-1 leading-relaxed">{booking.problemDescription}</dd>
            {booking.imageUrl ? (
              <a href={fileUrl(booking.imageUrl)} target="_blank" rel="noreferrer" className="mt-3 inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element -- private, auth-checked file */}
                <img
                  src={fileUrl(booking.imageUrl)}
                  alt="Photo of the problem"
                  className="max-h-48 rounded-lg border object-cover"
                />
              </a>
            ) : null}
          </div>
          {booking.disputeReason ? (
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Dispute</dt>
              <dd className="mt-1 leading-relaxed">{booking.disputeReason}</dd>
            </div>
          ) : null}
          {booking.finalServiceAmount != null ? (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Agreed amount</dt>
              <dd className="mt-1 text-lg font-semibold text-primary">
                {formatCurrency(booking.finalServiceAmount)}
              </dd>
            </div>
          ) : null}
        </dl>
      </Panel>

      <BookingCustomerActions
        bookingId={booking.id}
        pendingQuote={
          pendingQuote && booking.status === "QUOTE_PENDING"
            ? {
                id: pendingQuote.id,
                version: pendingQuote.version,
                visitFee: Number(pendingQuote.visitFee),
                labourAmount: Number(pendingQuote.labourAmount),
                partsAmount: Number(pendingQuote.partsAmount),
                otherCharges: Number(pendingQuote.otherCharges),
                totalAmount: Number(pendingQuote.totalAmount),
                notes: pendingQuote.notes,
              }
            : undefined
        }
        hasReview={booking.reviews.length > 0}
        canPay={canPay(booking.status, booking.customerPaymentStatus, booking.finalServiceAmount)}
        canCancel={canCancel(booking.status)}
        canConfirm={booking.status === "AWAITING_CUSTOMER_CONFIRMATION"}
        canReview={booking.status === "COMPLETED"}
        canDispute={canDispute(booking.status)}
        amountDue={booking.finalServiceAmount != null ? Number(booking.finalServiceAmount) : undefined}
        onlinePayments={razorpayKeys() != null}
      />

      <Panel className="mt-8">
        <PanelHeader title="Activity timeline" />
        <ul className="space-y-3 border-l-2 border-primary/20 pl-4">
          {booking.bookingEvents.map((e) => (
            <li key={e.id} className="relative text-sm">
              <span className="absolute -left-[calc(1rem+5px)] top-1.5 size-2 rounded-full bg-primary" />
              <span className="font-medium">{e.newState.replaceAll("_", " ")}</span>
              <span className="text-muted-foreground"> · {formatDate(e.timestamp)}</span>
              {e.reason ? <p className="text-muted-foreground">{e.reason}</p> : null}
            </li>
          ))}
        </ul>
      </Panel>
    </AppShell>
  );
}
