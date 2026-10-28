import { redirect } from "next/navigation";

import { auth } from "@/auth";
import type { Role } from "@prisma/client";

export async function getSessionUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(roles: Role[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    redirect(roleHomePath(user.role));
  }
  return user;
}

export function roleHomePath(role: Role) {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "TECHNICIAN":
      return "/technician";
    default:
      return "/customer";
  }
}
