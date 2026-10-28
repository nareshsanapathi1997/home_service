"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionState } from "@/lib/action-state";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { canQuote } from "@/lib/booking-workflow";
import { appUrl, sendEmailInBackground } from "@/lib/email";
import { notifyBooking } from "@/lib/notifications";

export type { ActionState };

const money = z.coerce.number().min(0).max(1_000_000);

const quoteSchema = z.object({
  bookingId: z.string().min(1),
  visitFee: money,
  labourAmount: money,
  partsAmount: money,
  otherCharges: money,
  notes: z.string().max(2000).optional(),
});

function revalidateBooking(bookingId: string) {
  revalidatePath(`/technician/jobs/${bookingId}`);
  revalidatePath(`/customer/bookings/${bookingId}`);
  revalidatePath("/customer");
  revalidatePath("/technician");
}

export async function submitQuote(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireRole(["TECHNICIAN"]);
  const parsed = quoteSchema.safeParse({
    bookingId: formData.get("bookingId"),
    visitFee: formData.get("visitFee") || 0,
    labourAmount: formData.get("labourAmount") || 0,
    partsAmount: formData.get("partsAmount") || 0,
    otherCharges: formData.get("otherCharges") || 0,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) return { error: "Enter valid, non-negative amounts." };
  const data = parsed.data;

  const profile = await prisma.technicianProfile.findUnique({
    where: { userId: user.id },
  });
  if (!profile) return { error: "Technician profile not found." };

  const booking = await prisma.booking.findFirst({
    where: { id: data.bookingId, technicianId: profile.id },
    include: { customer: { select: { email: true } } },
  });
  if (!booking) return { error: "Booking not found." };
  if (!canQuote(booking.status)) {
    return { error: "Quotes can only be sent before the customer accepts one." };
  }

  const subtotal = data.visitFee + data.labourAmount + data.partsAmount + data.otherCharges;
  if (subtotal <= 0) return { error: "Quote total must be more than zero." };

  await prisma.$transaction(async (tx) => {
    // A new quote supersedes any quote still awaiting a response.
    await tx.quote.updateMany({
      where: { bookingId: booking.id, status: "PENDING" },
      data: { status: "REJECTED", rejectedAt: new Date(), customerNotes: "Superseded by a newer quote" },
    });

    const latest = await tx.quote.findFirst({
      where: { bookingId: booking.id },
      orderBy: { version: "desc" },
    });

    await tx.quote.create({
      data: {
        bookingId: booking.id,
        technicianId: profile.id,
        version: (latest?.version ?? 0) + 1,
        visitFee: data.visitFee,
        labourAmount: data.labourAmount,
        partsAmount: data.partsAmount,
        otherCharges: data.otherCharges,
        subtotal,
        totalAmount: subtotal,
        notes: data.notes,
      },
    });

    await tx.booking.update({
      where: { id: booking.id },
      data: {
        status: "QUOTE_PENDING",
        bookingEvents: {
          create: {
            actorId: user.id,
            previousState: booking.status,
            newState: "QUOTE_PENDING",
            reason: `Quote of ₹${subtotal} sent`,
          },
        },
      },
    });

    await notifyBooking(
      tx,
      booking.customerId,
      booking.id,
      "QUOTE",
      "New quote received",
      `Your technician sent a quote of ₹${subtotal}.`
    );
  });

  sendEmailInBackground({
    to: booking.customer.email,
    subject: `New quote for booking ${booking.bookingReference}`,
    text: `Your technician sent a quote of Rs ${subtotal}. Review and accept it here:\n${appUrl(
      `/customer/bookings/${booking.id}`
    )}`,
  });

  revalidateBooking(booking.id);
  return { success: "Quote sent to customer." };
}

async function respondToQuote(quoteId: string, accept: boolean): Promise<ActionState> {
  const user = await requireRole(["CUSTOMER"]);

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: {
      booking: { include: { technician: { select: { userId: true, user: { select: { email: true } } } } } },
    },
  });
  if (!quote || quote.booking.customerId !== user.id) {
    return { error: "Quote not found." };
  }
  if (quote.status !== "PENDING" || quote.booking.status !== "QUOTE_PENDING") {
    return { error: "This quote is no longer open. Refresh the page." };
  }

  const now = new Date();
  const nextStatus = accept ? "QUOTE_ACCEPTED" : "ACCEPTED";

  const applied = await prisma.$transaction(async (tx) => {
    const result = await tx.quote.updateMany({
      where: { id: quoteId, status: "PENDING" },
      data: {
        status: accept ? "ACCEPTED" : "REJECTED",
        respondedAt: now,
        ...(accept ? { approvedAt: now } : { rejectedAt: now }),
      },
    });
    if (result.count === 0) return false;

    await tx.booking.update({
      where: { id: quote.bookingId },
      data: {
        status: nextStatus,
        ...(accept ? { finalServiceAmount: quote.totalAmount } : {}),
        bookingEvents: {
          create: {
            actorId: user.id,
            previousState: quote.booking.status,
            newState: nextStatus,
            reason: accept ? "Customer accepted the quote" : "Customer rejected the quote",
          },
        },
      },
    });

    await notifyBooking(
      tx,
      quote.booking.technician.userId,
      quote.bookingId,
      "QUOTE",
      accept ? "Quote accepted" : "Quote rejected",
      accept
        ? "The customer accepted your quote. You can start the job."
        : "The customer rejected your quote. You can send a revised one."
    );
    return true;
  });

  if (!applied) return { error: "This quote is no longer open. Refresh the page." };

  sendEmailInBackground({
    to: quote.booking.technician.user.email,
    subject: `Quote ${accept ? "accepted" : "rejected"} for booking ${quote.booking.bookingReference}`,
    text: `${
      accept
        ? "The customer accepted your quote. You can start the job."
        : "The customer rejected your quote. You can send a revised one."
    }\n${appUrl(`/technician/jobs/${quote.bookingId}`)}`,
  });

  revalidateBooking(quote.bookingId);
  return { success: accept ? "Quote accepted." : "Quote rejected." };
}

export async function acceptQuote(quoteId: string): Promise<ActionState> {
  return respondToQuote(quoteId, true);
}

export async function rejectQuote(quoteId: string): Promise<ActionState> {
  return respondToQuote(quoteId, false);
}
