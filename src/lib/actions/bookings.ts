"use server";

import type { Booking, BookingStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import type { ActionState } from "@/lib/action-state";
import { prisma } from "@/lib/prisma";
import { requireRole, requireUser } from "@/lib/auth/session";
import { createBookingReference } from "@/lib/booking-reference";
import {
  calculateCommission,
  canPay,
  canTransition,
  todayInIndia,
} from "@/lib/booking-workflow";
import { config } from "@/lib/config";
import { appUrl, sendEmailInBackground } from "@/lib/email";
import { notifyBooking } from "@/lib/notifications";
import { createRazorpayOrder, razorpayKeys, verifyRazorpaySignature } from "@/lib/razorpay";
import { availableSlots, nowInIndia } from "@/lib/slots";
import { IMAGE_TYPES, saveUpload, uploadedFile, validateUpload } from "@/lib/uploads";

export type { ActionState };

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const bookSchema = z.object({
  categoryId: z.string().min(1),
  serviceAreaId: z.string().min(1),
  technicianId: z.string().min(1),
  preferredDate: dateString,
  preferredTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  serviceAddress: z.string().trim().min(5).max(500),
  locality: z.string().trim().min(2).max(120),
  problemDescription: z.string().trim().min(10).max(2000),
});

export type TechnicianSearchResult = {
  id: string;
  name: string;
  bio: string;
  experienceYears: number;
  ratingAverage: number | null;
  ratingCount: number;
};

const OPEN_BOOKING_STATUSES: BookingStatus[] = [
  "REQUESTED",
  "ACCEPTED",
  "QUOTE_PENDING",
  "QUOTE_ACCEPTED",
  "IN_PROGRESS",
  "AWAITING_CUSTOMER_CONFIRMATION",
];

function dateValue(date: string) {
  return new Date(`${date}T00:00:00.000Z`);
}

// Technicians who can actually take a booking for this category in this area.
function bookableTechnicianWhere(categoryId: string, serviceAreaId: string) {
  return {
    isVerified: true,
    verificationStatus: "APPROVED" as const,
    technicianServices: { some: { categoryId, isActive: true } },
    technicianServiceAreas: { some: { areaId: serviceAreaId, isActive: true } },
    user: { accountStatus: "ACTIVE" as const },
  };
}

async function technicianSlots(db: Prisma.TransactionClient | typeof prisma, technicianId: string, date: string) {
  const [windows, taken] = await Promise.all([
    db.technicianAvailability.findMany({ where: { technicianId, isActive: true } }),
    db.booking.findMany({
      where: { technicianId, preferredDate: dateValue(date), status: { in: OPEN_BOOKING_STATUSES } },
      select: { preferredTime: true },
    }),
  ]);
  return availableSlots(windows, date, taken.map((b) => b.preferredTime), nowInIndia());
}

function emailBookingUpdate(
  to: string | null | undefined,
  reference: string,
  message: string,
  path: string
) {
  if (!to) return;
  sendEmailInBackground({
    to,
    subject: `${config.app.name} booking ${reference}`,
    text: `${message}\n\nView the booking: ${appUrl(path)}`,
  });
}

export async function searchTechnicians(formData: FormData): Promise<TechnicianSearchResult[]> {
  await requireRole(["CUSTOMER"]);
  const categoryId = String(formData.get("categoryId") ?? "");
  const serviceAreaId = String(formData.get("serviceAreaId") ?? "");
  const q = String(formData.get("q") ?? "").trim();

  if (!categoryId || !serviceAreaId) return [];

  const base = bookableTechnicianWhere(categoryId, serviceAreaId);
  const technicians = await prisma.technicianProfile.findMany({
    where: {
      ...base,
      // MySQL's default collation already compares case-insensitively.
      user: { ...base.user, ...(q ? { name: { contains: q } } : {}) },
    },
    include: { user: { select: { name: true } } },
    orderBy: [{ ratingAverage: "desc" }, { experienceYears: "desc" }],
    take: 20,
  });

  return technicians.map((t) => ({
    id: t.id,
    name: t.user.name,
    bio: t.bio ?? "",
    experienceYears: t.experienceYears,
    ratingAverage: t.ratingAverage != null ? Number(t.ratingAverage) : null,
    ratingCount: t.ratingCount,
  }));
}

export async function getAvailableSlots(technicianId: string, date: string): Promise<string[]> {
  await requireRole(["CUSTOMER"]);
  if (!dateString.safeParse(date).success || date < todayInIndia()) return [];
  return technicianSlots(prisma, technicianId, date);
}

export async function createBooking(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireRole(["CUSTOMER"]);

  const parsed = bookSchema.safeParse({
    categoryId: formData.get("categoryId"),
    serviceAreaId: formData.get("serviceAreaId"),
    technicianId: formData.get("technicianId"),
    preferredDate: formData.get("preferredDate"),
    preferredTime: formData.get("preferredTime"),
    serviceAddress: formData.get("serviceAddress"),
    locality: formData.get("locality"),
    problemDescription: formData.get("problemDescription"),
  });

  if (!parsed.success) {
    return {
      error:
        "Please fill all fields: a date, an available time, an address, and a problem description of at least 10 characters.",
    };
  }
  const data = parsed.data;

  if (data.preferredDate < todayInIndia()) {
    return { error: "Preferred date cannot be in the past." };
  }

  const photo = uploadedFile(formData.get("photo"));
  if (photo) {
    const problem = validateUpload(photo, IMAGE_TYPES);
    if (problem) return { error: problem };
  }

  const technician = await prisma.technicianProfile.findFirst({
    where: {
      id: data.technicianId,
      ...bookableTechnicianWhere(data.categoryId, data.serviceAreaId),
      technicianServices: {
        some: { categoryId: data.categoryId, isActive: true, category: { isActive: true } },
      },
      technicianServiceAreas: {
        some: { areaId: data.serviceAreaId, isActive: true, area: { isActive: true } },
      },
    },
    include: { user: { select: { email: true } } },
  });

  if (!technician) {
    return { error: "Selected technician is not available for this service and area." };
  }

  const slots = await technicianSlots(prisma, technician.id, data.preferredDate);
  if (!slots.includes(data.preferredTime)) {
    return { error: "That time is not available any more. Please pick another slot." };
  }

  const imageUrl = photo ? await saveUpload(photo, "bookings") : undefined;

  const booking = await prisma.$transaction(async (tx) => {
    // Re-check inside the transaction so two customers can't take the same slot.
    const clash = await tx.booking.count({
      where: {
        technicianId: technician.id,
        preferredDate: dateValue(data.preferredDate),
        preferredTime: data.preferredTime,
        status: { in: OPEN_BOOKING_STATUSES },
      },
    });
    if (clash > 0) return null;

    const created = await tx.booking.create({
      data: {
        bookingReference: createBookingReference(),
        customerId: user.id,
        technicianId: technician.id,
        categoryId: data.categoryId,
        serviceAreaId: data.serviceAreaId,
        preferredDate: dateValue(data.preferredDate),
        preferredTime: data.preferredTime,
        serviceAddress: data.serviceAddress,
        locality: data.locality,
        problemDescription: data.problemDescription,
        imageUrl,
        commissionRateSnapshot: config.commission.default,
        bookingEvents: {
          create: {
            actorId: user.id,
            newState: "REQUESTED",
            reason: "Customer submitted booking request",
          },
        },
      },
    });
    await notifyBooking(
      tx,
      technician.userId,
      created.id,
      "BOOKING_REQUEST",
      "New booking request",
      `A customer requested a visit on ${data.preferredDate} at ${data.preferredTime}.`
    );
    return created;
  });

  if (!booking) {
    return { error: "That time was just booked by someone else. Please pick another slot." };
  }

  emailBookingUpdate(
    technician.user.email,
    booking.bookingReference,
    `New booking request for ${data.preferredDate} at ${data.preferredTime}.`,
    `/technician/jobs/${booking.id}`
  );
  emailBookingUpdate(
    user.email,
    booking.bookingReference,
    `We received your booking request for ${data.preferredDate} at ${data.preferredTime}. The technician will respond soon.`,
    `/customer/bookings/${booking.id}`
  );

  revalidatePath("/technician");
  redirect(`/customer/bookings/${booking.id}`);
}

const TRANSITION_MESSAGES: Partial<Record<BookingStatus, string>> = {
  ACCEPTED: "The technician accepted your booking.",
  REJECTED: "The technician could not take your booking.",
  IN_PROGRESS: "The technician has started work.",
  AWAITING_CUSTOMER_CONFIRMATION: "Work is finished. Please confirm completion.",
  COMPLETED: "The job is complete.",
  CANCELLED: "The booking was cancelled.",
  DISPUTED: "The customer raised a dispute. Our team will review it.",
};

function revalidateBooking(bookingId: string) {
  revalidatePath(`/customer/bookings/${bookingId}`);
  revalidatePath(`/technician/jobs/${bookingId}`);
  revalidatePath("/customer");
  revalidatePath("/technician");
  revalidatePath("/technician/jobs");
  revalidatePath("/admin/disputes");
}

async function transitionBooking(
  bookingId: string,
  to: BookingStatus,
  reason?: string,
  extra?: (booking: Booking, tx: Prisma.TransactionClient) => Promise<Prisma.BookingUpdateManyMutationInput>
): Promise<ActionState> {
  const user = await requireUser();

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      customer: { select: { email: true } },
      technician: { select: { userId: true, user: { select: { email: true } } } },
    },
  });
  if (!booking) return { error: "Booking not found." };

  const isCustomer = user.role === "CUSTOMER" && booking.customerId === user.id;
  const isTechnician = user.role === "TECHNICIAN" && booking.technician.userId === user.id;
  const isAdmin = user.role === "ADMIN";
  if (!isCustomer && !isTechnician && !isAdmin) return { error: "Booking not found." };

  if (!canTransition(user.role, booking.status, to)) {
    return { error: "This action is no longer available for this booking. Refresh the page." };
  }

  const now = new Date();
  const updated = await prisma.$transaction(async (tx) => {
    // Only apply if nobody changed the status in the meantime.
    const result = await tx.booking.updateMany({
      where: { id: bookingId, status: booking.status },
      data: {
        status: to,
        ...(to === "IN_PROGRESS" ? { startedAt: now } : {}),
        ...(to === "COMPLETED" ? { completedAt: booking.completedAt ?? now } : {}),
        ...(to === "COMPLETED" && isCustomer ? { confirmedByCustomerAt: now } : {}),
        ...(to === "CANCELLED"
          ? { cancelledAt: now, cancelledBy: user.id, cancellationReason: reason }
          : {}),
        ...(to === "DISPUTED" ? { disputedAt: now, disputeReason: reason } : {}),
      },
    });
    if (result.count === 0) return false;

    if (extra) {
      await tx.booking.update({ where: { id: bookingId }, data: await extra(booking, tx) });
    }

    await tx.bookingEvent.create({
      data: { bookingId, actorId: user.id, previousState: booking.status, newState: to, reason },
    });

    const recipients = isAdmin
      ? [booking.customerId, booking.technician.userId]
      : [isCustomer ? booking.technician.userId : booking.customerId];
    for (const recipientId of recipients) {
      await notifyBooking(
        tx,
        recipientId,
        bookingId,
        "BOOKING_STATUS",
        `Booking ${booking.bookingReference}: ${to.replaceAll("_", " ").toLowerCase()}`,
        TRANSITION_MESSAGES[to] ?? "Booking status updated."
      );
    }
    return true;
  });

  if (!updated) {
    return { error: "This booking was just updated. Refresh the page." };
  }

  const message = `${TRANSITION_MESSAGES[to] ?? "Booking status updated."}${reason ? `\n\nNote: ${reason}` : ""}`;
  if (isAdmin || isTechnician) {
    emailBookingUpdate(booking.customer.email, booking.bookingReference, message, `/customer/bookings/${bookingId}`);
  }
  if (isAdmin || isCustomer) {
    emailBookingUpdate(
      booking.technician.user.email,
      booking.bookingReference,
      message,
      `/technician/jobs/${bookingId}`
    );
  }

  revalidateBooking(bookingId);
  return {};
}

// ---------- payments

async function payableBooking(bookingId: string, customerId: string) {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, customerId },
  });
  if (!booking) return { error: "Booking not found." } as const;
  if (!canPay(booking.status, booking.customerPaymentStatus, booking.finalServiceAmount)) {
    return { error: "Payment is only possible once a quote is accepted, and only once." } as const;
  }
  return { booking } as const;
}

async function recordPayment(
  booking: Booking,
  method: string,
  reference: string
): Promise<ActionState> {
  const amount = Number(booking.finalServiceAmount);
  const commissionAmount = calculateCommission(amount, Number(booking.commissionRateSnapshot));

  const paid = await prisma.$transaction(async (tx) => {
    const result = await tx.booking.updateMany({
      where: { id: booking.id, customerPaymentStatus: "UNPAID" },
      data: {
        customerPaymentStatus: "PAID",
        paymentMethod: method,
        paymentReference: reference,
        commissionAmount,
      },
    });
    if (result.count === 0) return false;

    await tx.commissionRecord.create({
      data: {
        bookingId: booking.id,
        technicianId: booking.technicianId,
        agreedRate: booking.commissionRateSnapshot,
        amountDue: commissionAmount,
      },
    });
    return true;
  });

  if (!paid) return { error: "This booking is already paid." };

  revalidatePath(`/customer/bookings/${booking.id}`);
  revalidatePath(`/technician/jobs/${booking.id}`);
  revalidatePath("/technician/earnings");
  revalidatePath("/admin/commission");
  return { success: "Payment received." };
}

// Demo payment, only available while Razorpay is not configured.
export async function markBookingPaid(bookingId: string): Promise<ActionState> {
  const user = await requireRole(["CUSTOMER"]);
  if (razorpayKeys()) return { error: "Please pay online." };

  const result = await payableBooking(bookingId, user.id);
  if ("error" in result) return { error: result.error };
  return recordPayment(result.booking, "UPI_SIMULATED", `PAY-${Date.now().toString(36).toUpperCase()}`);
}

export async function payBookingDemo(bookingId: string): Promise<ActionState> {
  return markBookingPaid(bookingId);
}

export type OnlinePaymentOrder = {
  error?: string;
  order?: {
    id: string;
    amount: number;
    currency: string;
    keyId: string;
    name: string;
    description: string;
    customer: { name: string; email: string; contact: string };
  };
};

export async function startOnlinePayment(bookingId: string): Promise<OnlinePaymentOrder> {
  const user = await requireRole(["CUSTOMER"]);
  const keys = razorpayKeys();
  if (!keys) return { error: "Online payment is not configured." };

  const result = await payableBooking(bookingId, user.id);
  if ("error" in result) return { error: result.error };
  const booking = result.booking;

  const customer = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  try {
    const order = await createRazorpayOrder(Number(booking.finalServiceAmount), booking.bookingReference);
    await prisma.booking.update({ where: { id: booking.id }, data: { paymentOrderId: order.id } });
    return {
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: keys.keyId,
        name: config.app.name,
        description: `Booking ${booking.bookingReference}`,
        customer: { name: customer.name, email: customer.email, contact: customer.phone ?? "" },
      },
    };
  } catch (error) {
    console.error("[payments] could not create order", error);
    return { error: "Could not start the payment. Please try again." };
  }
}

export async function confirmOnlinePayment(
  bookingId: string,
  payment: { orderId: string; paymentId: string; signature: string }
): Promise<ActionState> {
  const user = await requireRole(["CUSTOMER"]);
  const keys = razorpayKeys();
  if (!keys) return { error: "Online payment is not configured." };

  const result = await payableBooking(bookingId, user.id);
  if ("error" in result) return { error: result.error };
  const booking = result.booking;

  if (
    booking.paymentOrderId !== payment.orderId ||
    !verifyRazorpaySignature(payment.orderId, payment.paymentId, payment.signature, keys.keySecret)
  ) {
    return { error: "Payment could not be verified. If money was deducted, contact support." };
  }
  return recordPayment(booking, "RAZORPAY", payment.paymentId);
}

// ---------- status changes

export async function confirmJobCompleted(bookingId: string): Promise<ActionState> {
  return transitionBooking(bookingId, "COMPLETED");
}

export async function cancelBooking(bookingId: string): Promise<ActionState> {
  return transitionBooking(bookingId, "CANCELLED", "Cancelled by customer");
}

export async function acceptBookingRequest(bookingId: string): Promise<ActionState> {
  return transitionBooking(bookingId, "ACCEPTED");
}

export async function rejectBookingRequest(bookingId: string): Promise<ActionState> {
  return transitionBooking(bookingId, "REJECTED", "Technician unavailable");
}

export async function startBookingJob(bookingId: string): Promise<ActionState> {
  return transitionBooking(bookingId, "IN_PROGRESS");
}

export async function finishBookingJob(bookingId: string): Promise<ActionState> {
  return transitionBooking(bookingId, "AWAITING_CUSTOMER_CONFIRMATION");
}

const disputeSchema = z.object({
  bookingId: z.string().min(1),
  reason: z.string().trim().min(10).max(2000),
});

export async function raiseDispute(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole(["CUSTOMER"]);
  const parsed = disputeSchema.safeParse({
    bookingId: formData.get("bookingId"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) return { error: "Describe the problem in at least 10 characters." };

  const result = await transitionBooking(parsed.data.bookingId, "DISPUTED", parsed.data.reason);
  return result.error ? result : { success: "Dispute raised. Our team will review it." };
}

export async function resolveDisputeAsCompleted(bookingId: string): Promise<ActionState> {
  await requireRole(["ADMIN"]);
  return transitionBooking(bookingId, "COMPLETED", "Dispute resolved in the technician's favour");
}

// Cancels the job; a paid booking is marked refunded and its commission written off.
export async function resolveDisputeWithRefund(bookingId: string): Promise<ActionState> {
  await requireRole(["ADMIN"]);
  return transitionBooking(
    bookingId,
    "CANCELLED",
    "Dispute resolved in the customer's favour",
    async (booking, tx) => {
      if (booking.customerPaymentStatus !== "PAID") return {};
      await tx.commissionRecord.updateMany({
        where: { bookingId: booking.id },
        data: { reconciliationStatus: "DISPUTED", amountDue: 0, notes: "Refunded after dispute" },
      });
      return {
        customerPaymentStatus: "REFUNDED",
        commissionAmount: 0,
        commissionReconciliationStatus: "DISPUTED",
      };
    }
  );
}
