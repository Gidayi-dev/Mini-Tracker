import { Prisma } from "@prisma/client";
import type { TicketStatus } from "@prisma/client";
import { prisma } from "../db.js";
import { AppError } from "../errors.js";
import type { CreateTicketInput, ListTicketsQuery, UpdateTicketInput } from "./schemas.js";

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

export async function updateTicket(id: number, input: UpdateTicketInput) {
  try {
    return await prisma.ticket.update({ where: { id }, data: input });
  } catch (err) {
   
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      throw new AppError(404, "TICKET_NOT_FOUND", `Ticket ${id} not found`);
    }
    throw err;
  }
}