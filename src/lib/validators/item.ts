import { z } from "zod/v4";

export const itemSchema = z.object({
  name: z.string().min(1, "Item name is required").max(200),
  description: z.string().max(1000).optional(),
  price: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
    z.number().min(0, "Price must be positive").optional()
  ),
  currency: z.string().default("USD"),
  url: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  priority: z.preprocess(
    (val) => (val ? Number(val) : 3),
    z.number().min(1).max(5)
  ),
  notes: z.string().max(500).optional(),
  quantityDesired: z.preprocess(
    (val) => (val ? Number(val) : 1),
    z.number().min(1).max(99)
  ),
});

export type ItemInput = z.infer<typeof itemSchema>;
