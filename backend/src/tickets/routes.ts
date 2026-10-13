import { Router } from "express";
import { createTicketSchema, listTicketsQuerySchema } from "./schemas";
import * as service from "./service";

export const ticketsRouter = Router();

ticketsRouter.post("/", async (req, res) => {
  const input = createTicketSchema.parse(req.body);
  const ticket = await service.createTicket(input);
  res.status(201).json(ticket);
});

ticketsRouter.get("/", async (req, res) => {
  const query = listTicketsQuerySchema.parse(req.query);
  res.json(await service.listTickets(query));
});

ticketsRouter.get("/stats", async (_req, res) => {
  res.json(await service.getStats());
});