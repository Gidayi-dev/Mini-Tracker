import { prisma } from "../db";
import type { CreateTicketInput } from "./schemas";

export function createTicket(input: CreateTicketInput) {
  return prisma.ticket.create({ data: input });
}