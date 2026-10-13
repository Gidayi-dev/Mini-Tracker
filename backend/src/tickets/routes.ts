import { Router } from "express";
import { createTicketSchema, listTicketsQuerySchema, ticketIdParamSchema, updateTicketSchema } from "./schemas.js";
import * as service from './service.js'

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

// Must be registered before any "/:id" route
ticketsRouter.get("/stats", async (_req, res) => {
  res.json(await service.getStats());
});

ticketsRouter.patch("/:id", async (req, res) => {
  const { id } = ticketIdParamSchema.parse(req.params);
  const input = updateTicketSchema.parse(req.body);
  res.json(await service.updateTicket(id, input));
});