import { Router } from "express";
import { createTicketSchema } from "./schemas";
import * as service from "./service";

export const ticketsRouter = Router();

ticketsRouter.post("/", async (req, res) => {
  const input = createTicketSchema.parse(req.body);
  const ticket = await service.createTicket(input);
  res.status(201).json(ticket);
});