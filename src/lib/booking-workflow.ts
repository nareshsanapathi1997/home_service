import type { BookingStatus, Role } from "@prisma/client";

// Every status change a user may make, keyed by role. Anything not listed is rejected.
const TRANSITIONS: Record<Role, Partial<Record<BookingStatus, BookingStatus[]>>> = {
  TECHNICIAN: {
    REQUESTED: ["ACCEPTED", "REJECTED"],
    QUOTE_ACCEPTED: ["IN_PROGRESS"],
    IN_PROGRESS: ["AWAITING_CUSTOMER_CONFIRMATION"],
  },
  CUSTOMER: {
    REQUESTED: ["CANCELLED"],
    ACCEPTED: ["CANCELLED"],
    QUOTE_PENDING: ["CANCELLED"],
    QUOTE_ACCEPTED: ["CANCELLED"],
    AWAITING_CUSTOMER_CONFIRMATION: ["COMPLETED", "DISPUTED"],
    COMPLETED: ["DISPUTED"],
  },
  ADMIN: {
    DISPUTED: ["COMPLETED", "CANCELLED"],
  },
};

export const QUOTABLE_STATUSES: BookingStatus[] = ["REQUESTED", "ACCEPTED", "QUOTE_PENDING"];

export const PAYABLE_STATUSES: BookingStatus[] = [
  "QUOTE_ACCEPTED",
  "IN_PROGRESS",
  "AWAITING_CUSTOMER_CONFIRMATION",
  "COMPLETED",
];

export const CLOSED_STATUSES: BookingStatus[] = ["COMPLETED", "CANCELLED", "REJECTED"];

export function canTransition(role: Role, from: BookingStatus, to: BookingStatus) {
  return TRANSITIONS[role][from]?.includes(to) ?? false;
}

export function canCancel(status: BookingStatus) {
  return canTransition("CUSTOMER", status, "CANCELLED");
}

export function canQuote(status: BookingStatus) {
  return QUOTABLE_STATUSES.includes(status);
}

export function canDispute(status: BookingStatus) {
  return canTransition("CUSTOMER", status, "DISPUTED");
}

export function canPay(status: BookingStatus, paymentStatus: string, amount: unknown) {
  return PAYABLE_STATUSES.includes(status) && paymentStatus === "UNPAID" && amount != null;
}

export function calculateCommission(amount: number, rate: number) {
  return Math.round(amount * rate * 100) / 100;
}

// "YYYY-MM-DD" for today in India, used to reject bookings in the past.
export function todayInIndia(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(now);
}
