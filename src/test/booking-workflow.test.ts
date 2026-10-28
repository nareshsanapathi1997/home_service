import { describe, expect, it } from "vitest";

import {
  calculateCommission,
  canCancel,
  canDispute,
  canPay,
  canQuote,
  canTransition,
  todayInIndia,
} from "@/lib/booking-workflow";

describe("canTransition", () => {
  it("lets the technician drive the job forward", () => {
    expect(canTransition("TECHNICIAN", "REQUESTED", "ACCEPTED")).toBe(true);
    expect(canTransition("TECHNICIAN", "REQUESTED", "REJECTED")).toBe(true);
    expect(canTransition("TECHNICIAN", "QUOTE_ACCEPTED", "IN_PROGRESS")).toBe(true);
    expect(canTransition("TECHNICIAN", "IN_PROGRESS", "AWAITING_CUSTOMER_CONFIRMATION")).toBe(true);
  });

  it("only lets the customer confirm completion", () => {
    expect(canTransition("CUSTOMER", "AWAITING_CUSTOMER_CONFIRMATION", "COMPLETED")).toBe(true);
    expect(canTransition("TECHNICIAN", "AWAITING_CUSTOMER_CONFIRMATION", "COMPLETED")).toBe(false);
    expect(canTransition("TECHNICIAN", "IN_PROGRESS", "COMPLETED")).toBe(false);
  });

  it("blocks skipping steps", () => {
    expect(canTransition("CUSTOMER", "REQUESTED", "COMPLETED")).toBe(false);
    expect(canTransition("TECHNICIAN", "REQUESTED", "IN_PROGRESS")).toBe(false);
    expect(canTransition("TECHNICIAN", "QUOTE_PENDING", "IN_PROGRESS")).toBe(false);
  });

  it("blocks customers from technician actions", () => {
    expect(canTransition("CUSTOMER", "REQUESTED", "ACCEPTED")).toBe(false);
    expect(canTransition("CUSTOMER", "QUOTE_ACCEPTED", "IN_PROGRESS")).toBe(false);
  });

  it("does not reopen closed bookings", () => {
    for (const to of ["REQUESTED", "ACCEPTED", "IN_PROGRESS", "COMPLETED"] as const) {
      expect(canTransition("CUSTOMER", "COMPLETED", to)).toBe(false);
      expect(canTransition("TECHNICIAN", "CANCELLED", to)).toBe(false);
    }
  });

  it("lets admins only settle disputes", () => {
    expect(canTransition("ADMIN", "REQUESTED", "ACCEPTED")).toBe(false);
    expect(canTransition("ADMIN", "DISPUTED", "COMPLETED")).toBe(true);
    expect(canTransition("ADMIN", "DISPUTED", "CANCELLED")).toBe(true);
  });

  it("lets customers dispute only finished work", () => {
    expect(canDispute("AWAITING_CUSTOMER_CONFIRMATION")).toBe(true);
    expect(canDispute("COMPLETED")).toBe(true);
    expect(canDispute("IN_PROGRESS")).toBe(false);
    expect(canDispute("DISPUTED")).toBe(false);
    expect(canTransition("TECHNICIAN", "COMPLETED", "DISPUTED")).toBe(false);
  });
});

describe("cancel, quote and pay rules", () => {
  it("allows cancelling only before work starts", () => {
    expect(canCancel("REQUESTED")).toBe(true);
    expect(canCancel("QUOTE_ACCEPTED")).toBe(true);
    expect(canCancel("IN_PROGRESS")).toBe(false);
    expect(canCancel("COMPLETED")).toBe(false);
  });

  it("allows quoting only before a quote is accepted", () => {
    expect(canQuote("REQUESTED")).toBe(true);
    expect(canQuote("QUOTE_PENDING")).toBe(true);
    expect(canQuote("QUOTE_ACCEPTED")).toBe(false);
    expect(canQuote("COMPLETED")).toBe(false);
  });

  it("allows paying once, after an agreed amount exists", () => {
    expect(canPay("QUOTE_ACCEPTED", "UNPAID", 699)).toBe(true);
    expect(canPay("COMPLETED", "UNPAID", 699)).toBe(true);
    expect(canPay("QUOTE_PENDING", "UNPAID", 699)).toBe(false);
    expect(canPay("QUOTE_ACCEPTED", "PAID", 699)).toBe(false);
    expect(canPay("QUOTE_ACCEPTED", "UNPAID", null)).toBe(false);
  });
});

describe("helpers", () => {
  it("rounds commission to paise", () => {
    expect(calculateCommission(699, 0.12)).toBe(83.88);
    expect(calculateCommission(333.33, 0.12)).toBe(40);
  });

  it("uses India's date, not UTC", () => {
    // 20:00 UTC on 1 Jan is already 2 Jan in India.
    expect(todayInIndia(new Date("2026-01-01T20:00:00Z"))).toBe("2026-01-02");
  });
});
