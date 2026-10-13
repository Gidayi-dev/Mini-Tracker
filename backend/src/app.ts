import e from "express"

export function createApp() {
  const app = e();

  app.use(e.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  })

  return app;
}