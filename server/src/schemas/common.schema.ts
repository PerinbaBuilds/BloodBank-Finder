import { z } from "zod";
import { LABEL_TO_BLOOD_GROUP } from "@/utils/blood";

const bloodGroupLabels = Object.keys(LABEL_TO_BLOOD_GROUP) as [string, ...string[]];

export const bloodGroupLabelSchema = z.enum(bloodGroupLabels).transform((label) => LABEL_TO_BLOOD_GROUP[label]);

export const latitudeSchema = z.coerce.number().min(-90).max(90);
export const longitudeSchema = z.coerce.number().min(-180).max(180);

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
