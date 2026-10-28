import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { contentTypeFor, isUploadKey, readUpload } from "@/lib/uploads";

// Serves uploaded files only to people allowed to see them.
export async function GET(_request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });
  const user = session.user;

  const key = (await params).key.join("/");
  if (!isUploadKey(key)) return new Response("Not found", { status: 404 });

  const isAdmin = user.role === "ADMIN";
  let allowed = false;

  if (key.startsWith("bookings/")) {
    const booking = await prisma.booking.findFirst({
      where: { imageUrl: key },
      select: { customerId: true, technician: { select: { userId: true } } },
    });
    allowed =
      booking != null &&
      (isAdmin || booking.customerId === user.id || booking.technician.userId === user.id);
  } else {
    const document = await prisma.technicianVerificationDocument.findFirst({
      where: { documentUrl: key },
      select: { technician: { select: { userId: true } } },
    });
    allowed = document != null && (isAdmin || document.technician.userId === user.id);
  }

  if (!allowed) return new Response("Not found", { status: 404 });

  try {
    const file = await readUpload(key);
    return new Response(new Uint8Array(file), {
      headers: {
        "Content-Type": contentTypeFor(key),
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
