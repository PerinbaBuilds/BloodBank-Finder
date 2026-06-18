import { describe, expect, it } from "vitest";
import { BloodGroup } from "@prisma/client";
import {
  ALL_BLOOD_GROUPS,
  BLOOD_GROUP_LABELS,
  LABEL_TO_BLOOD_GROUP,
  compatibleDonorGroupsFor,
  compatibleRecipientGroupsFor,
  isDonorCompatible,
} from "@/utils/blood";

function sorted(groups: BloodGroup[]): BloodGroup[] {
  return [...groups].sort();
}

describe("blood compatibility", () => {
  it("treats O_NEG as the universal donor", () => {
    expect(sorted(compatibleRecipientGroupsFor("O_NEG"))).toEqual(sorted(ALL_BLOOD_GROUPS));
  });

  it("treats AB_POS as the universal recipient", () => {
    expect(sorted(compatibleDonorGroupsFor("AB_POS"))).toEqual(sorted(ALL_BLOOD_GROUPS));
  });

  it("only allows AB_POS donors to give to AB_POS recipients", () => {
    expect(compatibleRecipientGroupsFor("AB_POS")).toEqual(["AB_POS"]);
  });

  it("allows every group to donate to itself", () => {
    for (const group of ALL_BLOOD_GROUPS) {
      expect(isDonorCompatible(group, group)).toBe(true);
    }
  });

  it("rejects an incompatible donor/recipient pair", () => {
    expect(isDonorCompatible("A_POS", "B_POS")).toBe(false);
    expect(isDonorCompatible("AB_POS", "O_NEG")).toBe(false);
  });

  it("accepts a known compatible cross-type pair", () => {
    expect(isDonorCompatible("A_NEG", "AB_POS")).toBe(true);
    expect(isDonorCompatible("O_NEG", "B_POS")).toBe(true);
  });

  it("keeps label maps in sync and reversible", () => {
    for (const group of ALL_BLOOD_GROUPS) {
      const label = BLOOD_GROUP_LABELS[group];
      expect(LABEL_TO_BLOOD_GROUP[label]).toBe(group);
    }
  });
});
