"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { confirmOnlinePayment, startOnlinePayment } from "@/lib/actions/bookings";

type RazorpayResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayCheckout = { open: () => void; on: (event: string, cb: () => void) => void };

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayCheckout;
  }
}

const CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

function loadCheckout() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = CHECKOUT_SRC;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function PayOnlineButton({ bookingId, amountLabel }: { bookingId: string; amountLabel: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    setPending(true);
    setError(null);

    if (!(await loadCheckout()) || !window.Razorpay) {
      setError("Could not load the payment window. Check your connection and try again.");
      setPending(false);
      return;
    }

    const { order, error: startError } = await startOnlinePayment(bookingId);
    if (!order) {
      setError(startError ?? "Could not start the payment.");
      setPending(false);
      return;
    }

    const checkout = new window.Razorpay({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      name: order.name,
      description: order.description,
      order_id: order.id,
      prefill: order.customer,
      handler: async (response: RazorpayResponse) => {
        const result = await confirmOnlinePayment(bookingId, {
          orderId: response.razorpay_order_id,
          paymentId: response.razorpay_payment_id,
          signature: response.razorpay_signature,
        });
        if (result.error) setError(result.error);
        setPending(false);
        router.refresh();
      },
      modal: { ondismiss: () => setPending(false) },
    });
    checkout.on("payment.failed", () => setError("Payment failed. No money was taken; please try again."));
    checkout.open();
  }

  return (
    <div>
      <Button type="button" onClick={pay} disabled={pending} className="rounded-lg">
        {pending ? "Opening payment…" : `Pay ${amountLabel} online`}
      </Button>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
