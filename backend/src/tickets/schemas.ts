import { z } from "zod";

export const STATUSES = ["open", "in_progress", "closed"] as const;
export const PRIORITIES = ["low", "medium", "high"] as const;

export const createTicketSchema = z
  .object({
    title: z.string().trim().min(1, "title is required").max(200),
    description: z.string().trim().max(5000).optional(),
    status: z.enum(STATUSES).optional(),
    priority: z.enum(PRIORITIES).optional(),
  })
  .strict();

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
