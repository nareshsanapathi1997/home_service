import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

type Db = Prisma.TransactionClient | typeof prisma;

export async function notifyBooking(
  db: Db,
  recipientId: string,
  bookingId: string,
  type: string,
  title: string,
  message: string
) {
  await db.notification.create({
    data: { recipientId, type, title, message, relatedType: "BOOKING", relatedId: bookingId },
  });
}
