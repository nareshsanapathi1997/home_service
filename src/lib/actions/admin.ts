"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionState } from "@/lib/action-state";
import { prisma } from "@/lib/prisma";
import { recalculateRating } from "@/lib/ratings";
import { requireRole } from "@/lib/auth/session";
import { appUrl, sendEmailInBackground } from "@/lib/email";

export type { ActionState };

async function audit(
  tx: Prisma.TransactionClient,
  actorId: string,
  action: string,
  recordType: string,
  recordId: string
) {
  await tx.adminAuditLog.create({
    data: { actorId, action, recordType, recordId },
  });
}

async function verifyTechnician(
  profileId: string,
  approve: boolean,
  notes?: string
): Promise<ActionState> {
  const admin = await requireRole(["ADMIN"]);

  const profile = await prisma.technicianProfile.findUnique({
    where: { id: profileId },
    include: { user: { select: { email: true } } },
  });
  if (!profile) return { error: "Technician profile not found." };

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.technicianProfile.update({
      where: { id: profileId },
      data: {
        verificationStatus: approve ? "APPROVED" : "REJECTED",
        applicationStatus: approve ? "APPROVED" : "REJECTED",
        isVerified: approve,
        approvedAt: approve ? now : null,
        approvedById: approve ? admin.id : null,
        rejectionReason: approve ? null : notes,
        rejectedAt: approve ? null : now,
        adminNotes: notes,
      },
    });

    await tx.user.update({
      where: { id: profile.userId },
      data: { accountStatus: approve ? "ACTIVE" : "REJECTED" },
    });

    await tx.notification.create({
      data: {
        recipientId: profile.userId,
        type: "VERIFICATION",
        title: approve ? "Profile approved" : "Profile rejected",
        message: approve
          ? "You can now receive bookings on FixNear. Make sure your services and areas are set."
          : notes ?? "Your verification was rejected.",
      },
    });

    await audit(
      tx,
      admin.id,
      approve ? "APPROVE_TECHNICIAN" : "REJECT_TECHNICIAN",
      "TechnicianProfile",
      profileId
    );
  });

  sendEmailInBackground({
    to: profile.user.email,
    subject: approve ? "Your FixNear profile is approved" : "Your FixNear application was not approved",
    text: approve
      ? `You can now receive bookings. Make sure your services, areas and hours are set:\n${appUrl("/technician/profile")}`
      : `Reason: ${notes ?? "not specified"}. Contact support if you have questions.`,
  });

  revalidatePath("/admin/verification");
  revalidatePath("/admin");
  return {};
}

async function updateComplaint(
  complaintId: string,
  status: "IN_PROGRESS" | "RESOLVED" | "CLOSED" | "DISMISSED",
  resolution?: string
): Promise<ActionState> {
  const admin = await requireRole(["ADMIN"]);

  const complaint = await prisma.complaint.findUnique({ where: { id: complaintId } });
  if (!complaint) return { error: "Complaint not found." };
  if (complaint.status !== "OPEN" && complaint.status !== "IN_PROGRESS") {
    return { error: "This complaint is already closed." };
  }

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.complaint.update({
      where: { id: complaintId },
      data: {
        status,
        assignedToId: admin.id,
        assignedAt: complaint.assignedAt ?? now,
        resolution,
        ...(status === "RESOLVED" ? { resolvedAt: now, resolvedBy: admin.id } : {}),
        ...(status === "CLOSED" || status === "DISMISSED" ? { closedAt: now, closedBy: admin.id } : {}),
      },
    });

    await tx.notification.create({
      data: {
        recipientId: complaint.reporterId,
        type: "COMPLAINT",
        title: `Complaint ${status.replaceAll("_", " ").toLowerCase()}`,
        message: resolution ?? "Our team is looking into your complaint.",
        relatedType: "COMPLAINT",
        relatedId: complaintId,
      },
    });

    await audit(tx, admin.id, `COMPLAINT_${status}`, "Complaint", complaintId);
  });

  revalidatePath("/admin/complaints");
  revalidatePath("/admin");
  return {};
}

async function reconcileCommission(recordId: string): Promise<ActionState> {
  const admin = await requireRole(["ADMIN"]);

  const record = await prisma.commissionRecord.findUnique({
    where: { id: recordId },
  });
  if (!record) return { error: "Commission record not found." };
  if (record.reconciliationStatus === "RECONCILED") {
    return { error: "Already reconciled." };
  }

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.commissionRecord.update({
      where: { id: recordId },
      data: {
        reconciliationStatus: "RECONCILED",
        reconciledAt: now,
        reconciledBy: admin.id,
        amountPaid: record.amountDue,
      },
    });

    await tx.booking.update({
      where: { id: record.bookingId },
      data: {
        commissionReconciliationStatus: "RECONCILED",
        commissionReconciledAt: now,
        commissionReconciledBy: admin.id,
      },
    });

    await audit(tx, admin.id, "RECONCILE_COMMISSION", "CommissionRecord", recordId);
  });

  revalidatePath("/admin/commission");
  revalidatePath("/admin");
  return {};
}

export async function approveTechnicianProfile(profileId: string): Promise<ActionState> {
  return verifyTechnician(profileId, true);
}

export async function rejectTechnicianProfile(profileId: string): Promise<ActionState> {
  return verifyTechnician(profileId, false, "Documents incomplete");
}

export async function markComplaintInProgress(complaintId: string): Promise<ActionState> {
  return updateComplaint(complaintId, "IN_PROGRESS");
}

export async function resolveComplaint(complaintId: string): Promise<ActionState> {
  return updateComplaint(complaintId, "RESOLVED", "Resolved by admin");
}

export async function dismissComplaint(complaintId: string): Promise<ActionState> {
  return updateComplaint(complaintId, "DISMISSED", "Dismissed");
}

export async function reconcileCommissionRecord(recordId: string): Promise<ActionState> {
  return reconcileCommission(recordId);
}

// ---------- users

async function setAccountSuspended(userId: string, suspend: boolean): Promise<ActionState> {
  const admin = await requireRole(["ADMIN"]);
  if (userId === admin.id) return { error: "You can't change your own account." };

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "User not found." };
  if (user.role === "ADMIN") return { error: "Admin accounts can't be suspended here." };
  if (suspend ? user.accountStatus === "SUSPENDED" : user.accountStatus !== "SUSPENDED") {
    return { error: suspend ? "Already suspended." : "This account is not suspended." };
  }

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { accountStatus: suspend ? "SUSPENDED" : "ACTIVE" },
    });
    await tx.technicianProfile.updateMany({
      where: { userId },
      data: suspend
        ? { suspendedAt: now, suspensionReason: "Suspended by admin" }
        : { suspendedAt: null, suspensionReason: null },
    });
    await audit(tx, admin.id, suspend ? "SUSPEND_USER" : "REACTIVATE_USER", "User", userId);
  });

  revalidatePath("/admin/users");
  return {};
}

export async function suspendUser(userId: string): Promise<ActionState> {
  return setAccountSuspended(userId, true);
}

export async function reactivateUser(userId: string): Promise<ActionState> {
  return setAccountSuspended(userId, false);
}

// ---------- service categories and areas

const categorySchema = z.object({
  name: z.string().trim().min(2).max(60),
  description: z.string().trim().max(200).optional(),
  indicativeMin: z.coerce.number().min(0).max(1_000_000).optional(),
  indicativeMax: z.coerce.number().min(0).max(1_000_000).optional(),
});

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function createCategory(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireRole(["ADMIN"]);
  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    indicativeMin: formData.get("indicativeMin") || undefined,
    indicativeMax: formData.get("indicativeMax") || undefined,
  });
  if (!parsed.success) return { error: "Enter a name (2–60 characters) and valid prices." };
  const data = parsed.data;
  if (data.indicativeMin != null && data.indicativeMax != null && data.indicativeMin > data.indicativeMax) {
    return { error: "Minimum price can't be more than the maximum." };
  }

  const slug = slugify(data.name);
  if (!slug) return { error: "Enter a name with letters or numbers." };
  if (await prisma.serviceCategory.findUnique({ where: { slug } })) {
    return { error: "A service with this name already exists." };
  }

  const last = await prisma.serviceCategory.findFirst({ orderBy: { sortOrder: "desc" } });
  await prisma.$transaction(async (tx) => {
    const category = await tx.serviceCategory.create({
      data: { ...data, slug, sortOrder: (last?.sortOrder ?? 0) + 1 },
    });
    await audit(tx, admin.id, "CREATE_CATEGORY", "ServiceCategory", category.id);
  });

  revalidatePath("/admin/catalog");
  return { success: `Added ${data.name}.` };
}

const areaSchema = z.object({
  city: z.string().trim().min(2).max(60),
  locality: z.string().trim().min(2).max(80),
  pincode: z
    .string()
    .trim()
    .regex(/^\d{6}$/)
    .optional(),
});

export async function createArea(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireRole(["ADMIN"]);
  const parsed = areaSchema.safeParse({
    city: formData.get("city") || "Hyderabad",
    locality: formData.get("locality"),
    pincode: formData.get("pincode") || undefined,
  });
  if (!parsed.success) return { error: "Enter a locality and a 6-digit pincode (optional)." };

  const exists = await prisma.serviceArea.findUnique({
    where: { city_locality: { city: parsed.data.city, locality: parsed.data.locality } },
  });
  if (exists) return { error: "This area already exists." };

  await prisma.$transaction(async (tx) => {
    const area = await tx.serviceArea.create({ data: parsed.data });
    await audit(tx, admin.id, "CREATE_AREA", "ServiceArea", area.id);
  });

  revalidatePath("/admin/catalog");
  return { success: `Added ${parsed.data.locality}.` };
}

async function setCatalogActive(kind: "category" | "area", id: string, isActive: boolean): Promise<ActionState> {
  const admin = await requireRole(["ADMIN"]);
  await prisma.$transaction(async (tx) => {
    if (kind === "category") {
      await tx.serviceCategory.update({ where: { id }, data: { isActive } });
    } else {
      await tx.serviceArea.update({ where: { id }, data: { isActive } });
    }
    await audit(
      tx,
      admin.id,
      `${isActive ? "ENABLE" : "DISABLE"}_${kind.toUpperCase()}`,
      kind === "category" ? "ServiceCategory" : "ServiceArea",
      id
    );
  });
  revalidatePath("/admin/catalog");
  return {};
}

export async function enableCategory(id: string): Promise<ActionState> {
  return setCatalogActive("category", id, true);
}

export async function disableCategory(id: string): Promise<ActionState> {
  return setCatalogActive("category", id, false);
}

export async function enableArea(id: string): Promise<ActionState> {
  return setCatalogActive("area", id, true);
}

export async function disableArea(id: string): Promise<ActionState> {
  return setCatalogActive("area", id, false);
}

// ---------- review moderation

async function setReviewHidden(reviewId: string, hidden: boolean): Promise<ActionState> {
  const admin = await requireRole(["ADMIN"]);
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) return { error: "Review not found." };

  await prisma.$transaction(async (tx) => {
    await tx.review.update({
      where: { id: reviewId },
      data: {
        isHidden: hidden,
        isModerated: true,
        moderatedBy: admin.id,
        moderatedAt: new Date(),
        moderationNotes: hidden ? "Hidden by admin" : "Restored by admin",
      },
    });
    await recalculateRating(tx, review.technicianId);
    await audit(tx, admin.id, hidden ? "HIDE_REVIEW" : "RESTORE_REVIEW", "Review", reviewId);
  });

  revalidatePath("/admin/reviews");
  revalidatePath(`/technicians/${review.technicianId}`);
  return {};
}

export async function hideReview(reviewId: string): Promise<ActionState> {
  return setReviewHidden(reviewId, true);
}

export async function restoreReview(reviewId: string): Promise<ActionState> {
  return setReviewHidden(reviewId, false);
}
