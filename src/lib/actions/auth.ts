"use server";

import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { z } from "zod";

import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import { roleHomePath } from "@/lib/auth/session";

const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email(),
  phone: z.string().trim().regex(/^\+?[0-9 -]{10,16}$/).optional(),
  password: z.string().min(6).max(100),
  role: z.enum(["CUSTOMER", "TECHNICIAN"]),
});

export type AuthFormState = {
  error?: string;
};

export async function registerUser(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    password: formData.get("password"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return {
      error:
        "Please check your details: name, a valid email, a 10-digit phone (optional) and a password of at least 6 characters.",
    };
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with this email already exists." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  let user;
  try {
    user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email,
        phone: parsed.data.phone,
        passwordHash,
        role: parsed.data.role,
        accountStatus: "ACTIVE",
        technicianProfile:
          parsed.data.role === "TECHNICIAN"
            ? {
                create: {
                  bio: "",
                  experienceYears: 0,
                  applicationStatus: "PENDING",
                  verificationStatus: "PENDING",
                },
              }
            : undefined,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: "An account with this email already exists." };
    }
    throw error;
  }

  try {
    await signIn("credentials", {
      email: user.email,
      password: parsed.data.password,
      redirectTo: roleHomePath(user.role),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        error:
          "Account created. Sign in with your email and password (admin must approve technicians before bookings).",
      };
    }
    throw error;
  }

  return {};
}

export async function loginUser(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const callbackUrl = String(formData.get("callbackUrl") ?? "");

  // Only same-site paths are allowed as a post-login destination.
  const safeCallback =
    callbackUrl.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : null;
  const account = await prisma.user.findUnique({
    where: { email },
    select: { role: true },
  });

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: safeCallback ?? (account ? roleHomePath(account.role) : "/"),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    throw error;
  }

  return {};
}
