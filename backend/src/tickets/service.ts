import type { TicketStatus } from "@prisma/client";
import { prisma } from "../db";
import type { CreateTicketInput, ListTicketsQuery } from "./schemas";

export function createTicket(input: CreateTicketInput) {
  return prisma.ticket.create({ data: input });
}

export async function listTickets({ status, page, limit }: ListTicketsQuery) {
  const where = status ? { status } : {};

  const [data, total] = await prisma.$transaction([
    prisma.ticket.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.ticket.count({ where }),
  ]);

  return { data, page, limit, total };
}

export async function getStats() {
  const groups = await prisma.ticket.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  const stats: Record<TicketStatus, number> = {
    open: 0,
    in_progress: 0,
    closed: 0,
  };

  for (const group of groups) {
    stats[group.status] = group._count._all;
  }

  return stats;
}