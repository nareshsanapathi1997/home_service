import type { Role } from "@prisma/client";

// Where a notification should take its recipient.
export function notificationHref(
  role: Role,
  n: { relatedType: string | null; relatedId: string | null; type: string }
) {
  if (n.relatedType === "BOOKING" && n.relatedId) {
    if (role === "TECHNICIAN") return `/technician/jobs/${n.relatedId}`;
    if (role === "CUSTOMER") return `/customer/bookings/${n.relatedId}`;
    return "/admin/disputes";
  }
  if (n.type === "VERIFICATION") return "/technician/profile";
  if (role === "ADMIN") return "/admin";
  return role === "TECHNICIAN" ? "/technician" : "/customer";
}
