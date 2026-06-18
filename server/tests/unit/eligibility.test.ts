import { describe, expect, it } from "vitest";
import { calculateAge, checkDonationEligibility } from "@/utils/eligibility";

const DAY_MS = 24 * 60 * 60 * 1000;
const MIN_INTERVAL_DAYS = 90; // matches MIN_DONATION_INTERVAL_DAYS in .env.test

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * DAY_MS);
}

describe("checkDonationEligibility", () => {
  it("is eligible when the donor has never donated", () => {
    const result = checkDonationEligibility(null);
    expect(result.isEligible).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it("is eligible once the minimum interval has fully elapsed", () => {
    const result = checkDonationEligibility(daysAgo(MIN_INTERVAL_DAYS + 5));
    expect(result.isEligible).toBe(true);
  });

  it("is ineligible the day after donating", () => {
    const result = checkDonationEligibility(daysAgo(1));
    expect(result.isEligible).toBe(false);
    expect(result.reason).toMatch(/90 days/);
    expect(result.nextEligibleDate).toBeInstanceOf(Date);
  });

  it("computes nextEligibleDate as lastDonationDate + interval", () => {
    const last = daysAgo(10);
    const result = checkDonationEligibility(last);
    const expected = new Date(last);
    expected.setDate(expected.getDate() + MIN_INTERVAL_DAYS);
    expect(result.nextEligibleDate?.toDateString()).toBe(expected.toDateString());
  });
});

describe("calculateAge", () => {
  it("computes a whole number of years for a birthday already passed this year", () => {
    const today = new Date();
    const dob = new Date(today.getFullYear() - 30, 0, 1); // Jan 1, well in the past this year
    expect(calculateAge(dob)).toBe(30);
  });

  it("does not count this year's birthday if it has not happened yet", () => {
    const today = new Date();
    const future = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
    const dob = new Date(future.getFullYear() - 25, future.getMonth(), future.getDate());
    expect(calculateAge(dob)).toBe(24);
  });
});
