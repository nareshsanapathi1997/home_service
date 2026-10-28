"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionState } from "@/lib/action-state";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { DOCUMENT_KINDS, DOCUMENT_TYPES, saveUpload, uploadedFile, validateUpload } from "@/lib/uploads";

export type { ActionState };

const profileSchema = z.object({
  bio: z.string().trim().max(2000).optional(),
  experienceYears: z.coerce.number().int().min(0).max(50),
});

const timeOfDay = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

const availabilitySchema = z
  .object({
    dayOfWeek: z.coerce.number().int().min(0).max(6),
    startTime: timeOfDay,
    endTime: timeOfDay,
  })
  .refine((v) => v.startTime < v.endTime, { message: "End time must be after start time." });

async function requireTechnicianProfile() {
  const user = await requireRole(["TECHNICIAN"]);
  const profile = await prisma.technicianProfile.findUnique({
    where: { userId: user.id },
  });
  return profile;
}

export async function updateTechnicianProfile(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireRole(["TECHNICIAN"]);
  const parsed = profileSchema.safeParse({
    bio: formData.get("bio") || undefined,
    experienceYears: formData.get("experienceYears"),
  });
  if (!parsed.success) return { error: "Experience must be a whole number from 0 to 50." };

  await prisma.technicianProfile.update({
    where: { userId: user.id },
    data: {
      bio: parsed.data.bio ?? "",
      experienceYears: parsed.data.experienceYears,
    },
  });

  revalidatePath("/technician/profile");
  return { success: "Profile updated." };
}

export async function setAvailability(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const profile = await requireTechnicianProfile();
  if (!profile) return { error: "Profile not found." };

  const parsed = availabilitySchema.safeParse({
    dayOfWeek: formData.get("dayOfWeek"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
  });
  if (!parsed.success) {
    // The start/end refinement has no path; field errors do.
    const issue = parsed.error.issues[0];
    return {
      error: issue && issue.path.length === 0 ? issue.message : "Choose a day and valid start and end times.",
    };
  }
  const { dayOfWeek, startTime, endTime } = parsed.data;

  const existing = await prisma.technicianAvailability.findFirst({
    where: { technicianId: profile.id, dayOfWeek },
  });

  if (existing) {
    await prisma.technicianAvailability.update({
      where: { id: existing.id },
      data: { startTime, endTime, isActive: true },
    });
  } else {
    await prisma.technicianAvailability.create({
      data: { technicianId: profile.id, dayOfWeek, startTime, endTime },
    });
  }

  revalidatePath("/technician/availability");
  return { success: "Availability saved." };
}

export async function removeAvailability(slotId: string): Promise<ActionState> {
  const profile = await requireTechnicianProfile();
  if (!profile) return { error: "Profile not found." };

  await prisma.technicianAvailability.deleteMany({
    where: { id: slotId, technicianId: profile.id },
  });

  revalidatePath("/technician/availability");
  return {};
}

async function toggleTechnicianService(categoryId: string, enabled: boolean): Promise<ActionState> {
  const profile = await requireTechnicianProfile();
  if (!profile) return { error: "Profile not found." };

  const category = await prisma.serviceCategory.findFirst({
    where: { id: categoryId, isActive: true },
  });
  if (!category) return { error: "Service not found." };

  await prisma.technicianService.upsert({
    where: { technicianId_categoryId: { technicianId: profile.id, categoryId } },
    create: { technicianId: profile.id, categoryId, isActive: enabled },
    update: { isActive: enabled },
  });

  revalidatePath("/technician/profile");
  return {};
}

async function toggleTechnicianServiceArea(areaId: string, enabled: boolean): Promise<ActionState> {
  const profile = await requireTechnicianProfile();
  if (!profile) return { error: "Profile not found." };

  const area = await prisma.serviceArea.findFirst({
    where: { id: areaId, isActive: true },
  });
  if (!area) return { error: "Area not found." };

  await prisma.technicianServiceArea.upsert({
    where: { technicianId_areaId: { technicianId: profile.id, areaId } },
    create: { technicianId: profile.id, areaId, isActive: enabled },
    update: { isActive: enabled },
  });

  revalidatePath("/technician/profile");
  return {};
}

export async function enableTechnicianService(categoryId: string): Promise<ActionState> {
  return toggleTechnicianService(categoryId, true);
}

export async function disableTechnicianService(categoryId: string): Promise<ActionState> {
  return toggleTechnicianService(categoryId, false);
}

export async function enableTechnicianServiceArea(areaId: string): Promise<ActionState> {
  return toggleTechnicianServiceArea(areaId, true);
}

export async function disableTechnicianServiceArea(areaId: string): Promise<ActionState> {
  return toggleTechnicianServiceArea(areaId, false);
}

export async function uploadVerificationDocument(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const profile = await requireTechnicianProfile();
  if (!profile) return { error: "Profile not found." };

  const documentType = String(formData.get("documentType") ?? "");
  if (!DOCUMENT_KINDS.includes(documentType)) return { error: "Choose a document type." };

  const file = uploadedFile(formData.get("document"));
  if (!file) return { error: "Choose a file to upload." };
  const problem = validateUpload(file, DOCUMENT_TYPES);
  if (problem) return { error: problem };

  const count = await prisma.technicianVerificationDocument.count({
    where: { technicianId: profile.id },
  });
  if (count >= 10) return { error: "You can upload up to 10 documents." };

  const key = await saveUpload(file, "documents");
  await prisma.technicianVerificationDocument.create({
    data: {
      technicianId: profile.id,
      documentType,
      documentUrl: key,
      fileName: file.name.slice(0, 180),
      fileSize: file.size,
      mimeType: file.type,
    },
  });

  revalidatePath("/technician/profile");
  revalidatePath("/admin/verification");
  return { success: "Document uploaded." };
}

export async function deleteVerificationDocument(documentId: string): Promise<ActionState> {
  const profile = await requireTechnicianProfile();
  if (!profile) return { error: "Profile not found." };
  if (profile.verificationStatus === "APPROVED") {
    return { error: "Documents can't be removed after approval. Contact support to update them." };
  }

  await prisma.technicianVerificationDocument.deleteMany({
    where: { id: documentId, technicianId: profile.id },
  });
  revalidatePath("/technician/profile");
  revalidatePath("/admin/verification");
  return {};
}
