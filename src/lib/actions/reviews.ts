"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionState } from "@/lib/action-state";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { recalculateRating } from "@/lib/ratings";

const reviewSchema = z.object({
  bookingId: z.string(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(2000).optional(),
});

export type { ActionState };

export async function submitReview(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireRole(["CUSTOMER"]);
  const parsed = reviewSchema.safeParse({
    bookingId: formData.get("bookingId"),
    rating: formData.get("rating"),
    comment: formData.get("comment") || undefined,
  });

  if (!parsed.success) return { error: "Please provide a rating from 1 to 5." };

  const booking = await prisma.booking.findFirst({
    where: {
      id: parsed.data.bookingId,
      customerId: user.id,
      status: "COMPLETED",
    },
  });
  if (!booking) return { error: "Only completed bookings can be reviewed." };

  const existing = await prisma.review.findUnique({
    where: { bookingId: booking.id },
  });
  if (existing) return { error: "You already reviewed this booking." };

  try {
    await prisma.$transaction(async (tx) => {
      await tx.review.create({
        data: {
          bookingId: booking.id,
          customerId: user.id,
          technicianId: booking.technicianId,
          rating: parsed.data.rating,
          comment: parsed.data.comment,
        },
      });

      await recalculateRating(tx, booking.technicianId);
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: "You already reviewed this booking." };
    }
    throw error;
  }

  revalidatePath(`/customer/bookings/${booking.id}`);
  return { success: "Thank you for your review." };
}
