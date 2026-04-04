import { z } from "zod/v4";

export const registrySchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().max(500).optional(),
  occasion: z.string().optional(),
  occasionDate: z.string().optional(),
  isPublic: z.preprocess((val) => val === "on" || val === true, z.boolean()).optional(),
});

export type RegistryInput = z.infer<typeof registrySchema>;
