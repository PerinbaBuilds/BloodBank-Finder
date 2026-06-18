import { BloodGroup } from "@prisma/client";

export const ALL_BLOOD_GROUPS: BloodGroup[] = [
  "A_POS",
  "A_NEG",
  "B_POS",
  "B_NEG",
  "AB_POS",
  "AB_NEG",
  "O_POS",
  "O_NEG",
];

export const BLOOD_GROUP_LABELS: Record<BloodGroup, string> = {
  A_POS: "A+",
  A_NEG: "A-",
  B_POS: "B+",
  B_NEG: "B-",
  AB_POS: "AB+",
  AB_NEG: "AB-",
  O_POS: "O+",
  O_NEG: "O-",
};

export const LABEL_TO_BLOOD_GROUP: Record<string, BloodGroup> = Object.fromEntries(
  Object.entries(BLOOD_GROUP_LABELS).map(([key, label]) => [label, key as BloodGroup])
);

/**
 * Standard red-cell donor -> recipient compatibility chart.
 * Key = donor group, value = recipient groups that donor can safely give to.
 */
export const DONOR_CAN_GIVE_TO: Record<BloodGroup, BloodGroup[]> = {
  O_NEG: ["O_NEG", "O_POS", "A_NEG", "A_POS", "B_NEG", "B_POS", "AB_NEG", "AB_POS"],
  O_POS: ["O_POS", "A_POS", "B_POS", "AB_POS"],
  A_NEG: ["A_NEG", "A_POS", "AB_NEG", "AB_POS"],
  A_POS: ["A_POS", "AB_POS"],
  B_NEG: ["B_NEG", "B_POS", "AB_NEG", "AB_POS"],
  B_POS: ["B_POS", "AB_POS"],
  AB_NEG: ["AB_NEG", "AB_POS"],
  AB_POS: ["AB_POS"],
};

/** For a patient who needs `recipientGroup`, returns every donor blood group that may donate to them. */
export function compatibleDonorGroupsFor(recipientGroup: BloodGroup): BloodGroup[] {
  return ALL_BLOOD_GROUPS.filter((donorGroup) =>
    DONOR_CAN_GIVE_TO[donorGroup].includes(recipientGroup)
  );
}

/** For a donor with `donorGroup`, returns every recipient blood group they may donate to. */
export function compatibleRecipientGroupsFor(donorGroup: BloodGroup): BloodGroup[] {
  return DONOR_CAN_GIVE_TO[donorGroup];
}

export function isDonorCompatible(donorGroup: BloodGroup, recipientGroup: BloodGroup): boolean {
  return DONOR_CAN_GIVE_TO[donorGroup].includes(recipientGroup);
}
