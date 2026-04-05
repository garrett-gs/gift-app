import { z } from "zod/v4";

export const registrySchema = z.object({
  title: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  occasion: z.string().min(1, "Please select an occasion"),
  occasionDate: z.string().optional(),
  isPublic: z.preprocess((val) => val === "on" || val === true, z.boolean()).optional(),
});

export type RegistryInput = z.infer<typeof registrySchema>;
