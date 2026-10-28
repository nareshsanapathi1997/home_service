import { createHmac, timingSafeEqual } from "node:crypto";

// Razorpay is used when both keys are set; otherwise the app falls back to demo payments.
export function razorpayKeys() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  return keyId && keySecret ? { keyId, keySecret } : null;
}

export async function createRazorpayOrder(amountRupees: number, receipt: string) {
  const keys = razorpayKeys();
  if (!keys) throw new Error("Razorpay is not configured");

  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${keys.keyId}:${keys.keySecret}`).toString("base64")}`,
    },
    body: JSON.stringify({
      amount: Math.round(amountRupees * 100),
      currency: "INR",
      receipt,
    }),
  });
  if (!response.ok) {
    throw new Error(`Razorpay order failed: ${response.status} ${await response.text()}`);
  }
  const order = (await response.json()) as { id: string; amount: number; currency: string };
  return order;
}

// Checks the signature Razorpay Checkout returns: HMAC-SHA256 of "order_id|payment_id".
export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string
) {
  const expected = createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}
