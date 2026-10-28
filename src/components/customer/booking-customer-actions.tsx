"use client";

import { PayOnlineButton } from "@/components/customer/pay-online-button";
import { useActionForm } from "@/hooks/use-action-form";
import { acceptQuote, rejectQuote } from "@/lib/actions/quotes";
import { submitReview } from "@/lib/actions/reviews";
import { fileComplaint } from "@/lib/actions/complaints";
import { cancelBooking, confirmJobCompleted, payBookingDemo, raiseDispute } from "@/lib/actions/bookings";
import { ActionButton } from "@/components/ui/action-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/format";

type PendingQuote = {
  id: string;
  version: number;
  visitFee: number;
  labourAmount: number;
  partsAmount: number;
  otherCharges: number;
  totalAmount: number;
  notes: string | null;
};

export function BookingCustomerActions({
  bookingId,
  pendingQuote,
  hasReview,
  canPay,
  canCancel,
  canConfirm,
  canReview,
  canDispute,
  amountDue,
  onlinePayments,
}: {
  bookingId: string;
  pendingQuote?: PendingQuote;
  hasReview: boolean;
  canPay: boolean;
  canCancel: boolean;
  canConfirm: boolean;
  canReview: boolean;
  canDispute: boolean;
  amountDue?: number;
  onlinePayments: boolean;
}) {
  const [reviewState, reviewAction, reviewPending] = useActionForm(submitReview, {});
  const [disputeState, disputeAction, disputePending] = useActionForm(raiseDispute, {});
  const [complaintState, complaintAction, complaintPending] = useActionForm(fileComplaint, {});

  return (
    <div className="mt-8 space-y-6">
      {pendingQuote ? (
        <Panel className="border-primary/20 bg-primary/5">
          <PanelHeader
            title="Quote awaiting your response"
            description={`Quote v${pendingQuote.version} · Total ${formatCurrency(pendingQuote.totalAmount)}`}
          />
          <dl className="mb-4 grid gap-2 text-sm sm:grid-cols-4">
            {[
              ["Visit fee", pendingQuote.visitFee],
              ["Labour", pendingQuote.labourAmount],
              ["Parts", pendingQuote.partsAmount],
              ["Other", pendingQuote.otherCharges],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="font-medium">{formatCurrency(value)}</dd>
              </div>
            ))}
          </dl>
          {pendingQuote.notes ? (
            <p className="mb-4 text-sm text-muted-foreground">{pendingQuote.notes}</p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <ActionButton action={acceptQuote.bind(null, pendingQuote.id)}>Accept quote</ActionButton>
            <ActionButton action={rejectQuote.bind(null, pendingQuote.id)} variant="outline">
              Reject
            </ActionButton>
          </div>
        </Panel>
      ) : null}

      {canPay ? (
        <Panel>
          {onlinePayments ? (
            <>
              <PanelHeader title="Payment" description="Pay securely by UPI, card or net banking." />
              <PayOnlineButton bookingId={bookingId} amountLabel={formatCurrency(amountDue ?? 0)} />
            </>
          ) : (
            <>
              <PanelHeader
                title="Payment"
                description="Demo mode: online payment is not configured, so this records a simulated UPI payment."
              />
              <ActionButton action={payBookingDemo.bind(null, bookingId)} variant="secondary">
                Mark payment complete
              </ActionButton>
            </>
          )}
        </Panel>
      ) : null}

      {canConfirm ? (
        <Panel>
          <PanelHeader title="Confirm completion" description="Let us know the job was done to your satisfaction." />
          <ActionButton action={confirmJobCompleted.bind(null, bookingId)}>Confirm job completed</ActionButton>
        </Panel>
      ) : null}

      {canReview ? (
        <Panel>
          <PanelHeader title="Leave a review" description="Help other Hyderabad households choose great pros." />
          {hasReview || reviewState.success ? (
            <p className="text-sm text-primary">Thank you for your review.</p>
          ) : (
            <form onSubmit={reviewAction} className="space-y-4">
              <input type="hidden" name="bookingId" value={bookingId} />
              <div className="space-y-2">
                <Label htmlFor="rating">Rating</Label>
                <NativeSelect id="rating" name="rating" defaultValue="5" className="max-w-[160px]">
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n} star{n > 1 ? "s" : ""}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <Textarea name="comment" placeholder="Optional comment" rows={3} className="rounded-lg" />
              {reviewState.error ? (
                <p className="text-sm text-destructive">{reviewState.error}</p>
              ) : null}
              <Button type="submit" disabled={reviewPending} className="rounded-lg">
                {reviewPending ? "Submitting…" : "Submit review"}
              </Button>
            </form>
          )}
        </Panel>
      ) : null}

      {canDispute ? (
        <Panel>
          <PanelHeader
            title="Something wrong with the work?"
            description="Raise a dispute and our team will review it with you and the technician."
          />
          {disputeState.success ? (
            <p className="text-sm text-primary">{disputeState.success}</p>
          ) : (
            <form onSubmit={disputeAction} className="space-y-4">
              <input type="hidden" name="bookingId" value={bookingId} />
              <div className="space-y-2">
                <Label htmlFor="disputeReason">What went wrong?</Label>
                <Textarea id="disputeReason" name="reason" rows={3} required minLength={10} className="rounded-lg" />
              </div>
              {disputeState.error ? <p className="text-sm text-destructive">{disputeState.error}</p> : null}
              <Button type="submit" variant="destructive" disabled={disputePending} className="rounded-lg">
                {disputePending ? "Submitting…" : "Raise dispute"}
              </Button>
            </form>
          )}
        </Panel>
      ) : null}

      {canCancel ? (
        <Panel>
          <PanelHeader title="Cancel booking" description="You can cancel until the technician starts work." />
          <ActionButton
            action={cancelBooking.bind(null, bookingId)}
            variant="destructive"
            confirmMessage="Cancel this booking?"
          >
            Cancel booking
          </ActionButton>
        </Panel>
      ) : null}

      <Panel>
        <PanelHeader title="Report an issue" description="Our team will review complaints linked to this booking." />
        <form onSubmit={complaintAction} className="space-y-4">
          <input type="hidden" name="bookingId" value={bookingId} />
          <div className="space-y-2">
            <Label htmlFor="complaintType">Issue type</Label>
            <Input id="complaintType" name="complaintType" placeholder="e.g. Late arrival" required className="rounded-lg" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="complaintDescription">Description</Label>
            <Textarea id="complaintDescription" name="description" placeholder="Describe the problem" rows={3} required minLength={10} className="rounded-lg" />
          </div>
          {complaintState.success ? (
            <p className="text-sm text-primary">{complaintState.success}</p>
          ) : null}
          {complaintState.error ? (
            <p className="text-sm text-destructive">{complaintState.error}</p>
          ) : null}
          <Button type="submit" variant="outline" disabled={complaintPending} className="rounded-lg">
            {complaintPending ? "Submitting…" : "File complaint"}
          </Button>
        </form>
      </Panel>
    </div>
  );
}
