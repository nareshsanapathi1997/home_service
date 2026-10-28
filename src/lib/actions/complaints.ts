"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionState } from "@/lib/action-state";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";

const schema = z.object({
  bookingId: z.string().optional(),
  complaintType: z.string().trim().min(2).max(120),
  description: z.string().trim().min(10).max(2000),
});

export type { ActionState };

export async function fileComplaint(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireRole(["CUSTOMER"]);
  const parsed = schema.safeParse({
    bookingId: formData.get("bookingId") || undefined,
    complaintType: formData.get("complaintType"),
    description: formData.get("description"),
  });
  if (!parsed.success) return { error: "Add an issue type and a description of at least 10 characters." };

  if (parsed.data.bookingId) {
    const booking = await prisma.booking.findFirst({
      where: { id: parsed.data.bookingId, customerId: user.id },
    });
    if (!booking) return { error: "Booking not found." };
  }

  await prisma.complaint.create({
    data: {
      reporterId: user.id,
      bookingId: parsed.data.bookingId,
      complaintType: parsed.data.complaintType,
      description: parsed.data.description,
    },
  });

  revalidatePath("/admin/complaints");
  if (parsed.data.bookingId) {
    revalidatePath(`/customer/bookings/${parsed.data.bookingId}`);
  }
  return { success: "Complaint submitted. Our team will review it." };
}
