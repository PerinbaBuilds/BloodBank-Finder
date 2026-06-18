import { z } from "zod";
import { bloodGroupLabelSchema } from "@/schemas/common.schema";

export const upsertInventorySchema = z.object({
  items: z
    .array(
      z.object({
        bloodGroup: bloodGroupLabelSchema,
        units: z.coerce.number().int().min(0).max(100000),
      })
    )
    .min(1)
    .max(8),
});
export type UpsertInventoryInput = z.infer<typeof upsertInventorySchema>;
