import { env } from "@/config/env";

export interface EligibilityResult {
  isEligible: boolean;
  reason?: string;
  nextEligibleDate?: Date;
}

/** Whole-blood donors must wait MIN_DONATION_INTERVAL_DAYS between donations. */
export function checkDonationEligibility(lastDonationDate: Date | null): EligibilityResult {
  if (!lastDonationDate) {
    return { isEligible: true };
  }

  const msSinceLastDonation = Date.now() - lastDonationDate.getTime();
  const daysSinceLastDonation = msSinceLastDonation / (1000 * 60 * 60 * 24);

  if (daysSinceLastDonation >= env.MIN_DONATION_INTERVAL_DAYS) {
    return { isEligible: true };
  }

  const nextEligibleDate = new Date(lastDonationDate);
  nextEligibleDate.setDate(nextEligibleDate.getDate() + env.MIN_DONATION_INTERVAL_DAYS);

  return {
    isEligible: false,
    reason: `Must wait ${env.MIN_DONATION_INTERVAL_DAYS} days between donations`,
    nextEligibleDate,
  };
}

export function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
    age--;
  }
  return age;
}

export const MIN_DONOR_AGE = 18;
export const MAX_DONOR_AGE = 65;
export const MIN_DONOR_WEIGHT_KG = 50;
