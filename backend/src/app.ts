import e from "express"
import { ticketsRouter } from "./tickets/routes.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

export function createApp() {
  const app = e();

  app.use(e.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  })

  app.use("/tickets", ticketsRouter);

  app.use(notFound);
  app.use(errorHandler)

  return app;
}