"use client";

import { useActionForm } from "@/hooks/use-action-form";

import {
  acceptBookingRequest,
  finishBookingJob,
  rejectBookingRequest,
  startBookingJob,
} from "@/lib/actions/bookings";
import { submitQuote } from "@/lib/actions/quotes";
import { ActionButton } from "@/components/ui/action-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Textarea } from "@/components/ui/textarea";

export function TechnicianJobActions({
  bookingId,
  status,
}: {
  bookingId: string;
  status: string;
}) {
  const [quoteState, quoteAction, quotePending] = useActionForm(submitQuote, {});

  return (
    <div className="mt-8 space-y-6">
      {status === "REQUESTED" ? (
        <Panel>
          <PanelHeader title="Respond to request" description="Accept if you can take this job." />
          <div className="flex flex-wrap gap-2">
            <ActionButton action={acceptBookingRequest.bind(null, bookingId)}>Accept job</ActionButton>
            <ActionButton
              action={rejectBookingRequest.bind(null, bookingId)}
              variant="outline"
              confirmMessage="Decline this booking request?"
            >
              Decline
            </ActionButton>
          </div>
        </Panel>
      ) : null}

      {status === "ACCEPTED" || status === "QUOTE_PENDING" || status === "REQUESTED" ? (
        <Panel>
          <PanelHeader
            title={status === "QUOTE_PENDING" ? "Send revised quote" : "Send quote"}
            description={
              status === "QUOTE_PENDING"
                ? "A new quote replaces the one awaiting the customer's response."
                : "Break down visit fee, labour, and parts."
            }
          />
          <form onSubmit={quoteAction} className="grid gap-4 sm:grid-cols-2">
            <input type="hidden" name="bookingId" value={bookingId} />
            <div className="space-y-2">
              <Label htmlFor="visitFee">Visit fee (₹)</Label>
              <Input id="visitFee" name="visitFee" type="number" min={0} step="0.01" defaultValue={199} className="rounded-lg" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="labourAmount">Labour (₹)</Label>
              <Input id="labourAmount" name="labourAmount" type="number" min={0} step="0.01" defaultValue={500} className="rounded-lg" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partsAmount">Parts (₹)</Label>
              <Input id="partsAmount" name="partsAmount" type="number" min={0} step="0.01" defaultValue={0} className="rounded-lg" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="otherCharges">Other (₹)</Label>
              <Input id="otherCharges" name="otherCharges" type="number" min={0} step="0.01" defaultValue={0} className="rounded-lg" />
            </div>
            <Textarea name="notes" className="sm:col-span-2 rounded-lg" placeholder="Notes for customer" rows={2} />
            {quoteState.error ? (
              <p className="text-sm text-destructive sm:col-span-2">{quoteState.error}</p>
            ) : null}
            {quoteState.success ? (
              <p className="text-sm text-primary sm:col-span-2">{quoteState.success}</p>
            ) : null}
            <Button type="submit" disabled={quotePending} className="rounded-lg sm:col-span-2">
              {quotePending ? "Sending…" : "Send quote"}
            </Button>
          </form>
        </Panel>
      ) : null}

      {status === "QUOTE_ACCEPTED" ? (
        <Panel>
          <PanelHeader title="On site" description="The customer accepted your quote." />
          <ActionButton action={startBookingJob.bind(null, bookingId)}>Start job</ActionButton>
        </Panel>
      ) : null}

      {status === "IN_PROGRESS" ? (
        <Panel>
          <PanelHeader title="Finish work" description="Customer will confirm completion before review." />
          <ActionButton action={finishBookingJob.bind(null, bookingId)}>Mark work finished</ActionButton>
        </Panel>
      ) : null}
    </div>
  );
}
