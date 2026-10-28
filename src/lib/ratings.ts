import type { Prisma } from "@prisma/client";

// Recomputes a technician's public rating from their visible reviews.
export async function recalculateRating(tx: Prisma.TransactionClient, technicianId: string) {
  const stats = await tx.review.aggregate({
    where: { technicianId, isHidden: false },
    _avg: { rating: true },
    _count: true,
  });
  await tx.technicianProfile.update({
    where: { id: technicianId },
    data: { ratingAverage: stats._avg.rating, ratingCount: stats._count },
  });
}
