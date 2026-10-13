import { z } from "zod";

export const STATUSES = ["open", "in_progress", "closed"] as const;
export const PRIORITIES = ["low", "medium", "high"] as const;

const MAX_INT4 = 2147483647;

export const createTicketSchema = z
  .object({
    title: z.string().trim().min(1, "title is required").max(200),
    description: z.string().trim().max(5000).optional(),
    status: z.enum(STATUSES).optional(),
    priority: z.enum(PRIORITIES).optional(),
  })
  .strict();

export type CreateTicketInput = z.infer<typeof createTicketSchema>;

export const listTicketsQuerySchema = z.object({
  status: z.enum(STATUSES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListTicketsQuery = z.infer<typeof listTicketsQuerySchema>;

export const ticketIdParamSchema = z.object({
  id: z.coerce.number().int().min(1).max(MAX_INT4),
});

export const updateTicketSchema = z
  .object({
    status: z.enum(STATUSES).optional(),
    priority: z.enum(PRIORITIES).optional(),
  })
  .strict()
  .refine((body) => Object.keys(body).length > 0, {
    message: "provide at least one of: status, priority",
  });

export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;