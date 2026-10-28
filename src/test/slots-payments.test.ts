import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";

import { verifyRazorpaySignature } from "@/lib/razorpay";
import { availableSlots, dayOfWeek, nowInIndia } from "@/lib/slots";
import { isUploadKey } from "@/lib/uploads";

const weekdays = [1, 2, 3, 4, 5].map((d) => ({ dayOfWeek: d, startTime: "09:00", endTime: "13:00" }));

describe("availableSlots", () => {
  it("offers hourly slots inside working hours", () => {
    // 2026-11-03 is a Tuesday.
    expect(dayOfWeek("2026-11-03")).toBe(2);
    expect(availableSlots(weekdays, "2026-11-03", [])).toEqual(["09:00", "10:00", "11:00", "12:00"]);
  });

  it("offers nothing on days off", () => {
    expect(availableSlots(weekdays, "2026-11-01", [])).toEqual([]); // Sunday
  });

  it("leaves out taken slots", () => {
    expect(availableSlots(weekdays, "2026-11-03", ["10:00", "12:00"])).toEqual(["09:00", "11:00"]);
  });

  it("leaves out slots that already started today", () => {
    expect(
      availableSlots(weekdays, "2026-11-03", [], { date: "2026-11-03", time: "10:15" })
    ).toEqual(["11:00", "12:00"]);
    expect(
      availableSlots(weekdays, "2026-11-03", [], { date: "2026-11-02", time: "23:00" })
    ).toHaveLength(4);
  });

  it("drops a slot that would run past closing", () => {
    expect(
      availableSlots([{ dayOfWeek: 2, startTime: "09:30", endTime: "11:00" }], "2026-11-03", [])
    ).toEqual(["09:30"]);
  });

  it("reads the clock in India", () => {
    expect(nowInIndia(new Date("2026-01-01T20:00:00Z"))).toEqual({ date: "2026-01-02", time: "01:30" });
  });
});

describe("verifyRazorpaySignature", () => {
  const secret = "test_secret";
  const sign = (order: string, payment: string) =>
    createHmac("sha256", secret).update(`${order}|${payment}`).digest("hex");

  it("accepts Razorpay's signature", () => {
    expect(verifyRazorpaySignature("order_1", "pay_1", sign("order_1", "pay_1"), secret)).toBe(true);
  });

  it("rejects a signature for another payment or a forged one", () => {
    expect(verifyRazorpaySignature("order_1", "pay_2", sign("order_1", "pay_1"), secret)).toBe(false);
    expect(verifyRazorpaySignature("order_1", "pay_1", "deadbeef", secret)).toBe(false);
  });
});

describe("isUploadKey", () => {
  it("accepts generated keys only", () => {
    expect(isUploadKey(`bookings/${"a".repeat(32)}.png`)).toBe(true);
    expect(isUploadKey(`documents/${"0".repeat(32)}.pdf`)).toBe(true);
    expect(isUploadKey("../.env")).toBe(false);
    expect(isUploadKey(`bookings/../../${"a".repeat(32)}.png`)).toBe(false);
    expect(isUploadKey(`other/${"a".repeat(32)}.png`)).toBe(false);
  });
});
