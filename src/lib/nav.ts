import type { Role } from "@prisma/client";

export const customerNav = [
  { href: "/customer", label: "Dashboard" },
  { href: "/customer/book", label: "Book service" },
];

export const technicianNav = [
  { href: "/technician", label: "Dashboard" },
  { href: "/technician/jobs", label: "Jobs" },
  { href: "/technician/profile", label: "Profile" },
  { href: "/technician/availability", label: "Availability" },
  { href: "/technician/earnings", label: "Earnings" },
];

export const adminNav = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/verification", label: "Verification" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/catalog", label: "Services & areas" },
  { href: "/admin/disputes", label: "Disputes" },
  { href: "/admin/complaints", label: "Complaints" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/commission", label: "Commission" },
];

export function navForRole(role: Role) {
  if (role === "ADMIN") return adminNav;
  return role === "TECHNICIAN" ? technicianNav : customerNav;
}
