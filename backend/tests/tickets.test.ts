import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { prisma } from "../src/db";

const app = createApp();

beforeEach(async () => {
  await prisma.$executeRawUnsafe("TRUNCATE TABLE tickets RESTART IDENTITY");
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("POST /tickets", () => {
  it("creates a ticket and applies defaults", async () => {
    const res = await request(app)
      .post("/tickets")
      .send({ title: "Printer is down" });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      id: 1,
      title: "Printer is down",
      description: null,
      status: "open",
      priority: "medium",
    });
    expect(res.body.createdAt).toBeTruthy();
  });

  it("rejects a blank title with a validation error", async () => {
    const res = await request(app).post("/tickets").send({ title: "   " });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.details[0].field).toBe("title");
  });
});

describe("GET /tickets/stats", () => {
  it("returns zero for every status when there are no tickets", async () => {
    const res = await request(app).get("/tickets/stats");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ open: 0, in_progress: 0, closed: 0 });
  });

  it("counts tickets grouped by status", async () => {
    await prisma.ticket.createMany({
      data: [
        { title: "a", status: "open" },
        { title: "b", status: "open" },
        { title: "c", status: "in_progress" },
      ],
    });

    const res = await request(app).get("/tickets/stats");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ open: 2, in_progress: 1, closed: 0 });
  });
});

describe("GET /tickets", () => {
  it("filters by status and paginates with a total", async () => {
    await prisma.ticket.createMany({
      data: [
        { title: "a", status: "open" },
        { title: "b", status: "open" },
        { title: "c", status: "open" },
        { title: "d", status: "closed" },
      ],
    });

    const filtered = await request(app).get("/tickets?status=closed");
    expect(filtered.body.total).toBe(1);
    expect(filtered.body.data[0].title).toBe("d");

    const page2 = await request(app).get("/tickets?status=open&limit=2&page=2");
    expect(page2.status).toBe(200);
    expect(page2.body).toMatchObject({ page: 2, limit: 2, total: 3 });
    expect(page2.body.data).toHaveLength(1);
  });
});

describe("PATCH /tickets/:id", () => {
  it("updates status and priority", async () => {
    const ticket = await prisma.ticket.create({ data: { title: "Login bug" } });

    const res = await request(app)
      .patch(`/tickets/${ticket.id}`)
      .send({ status: "in_progress", priority: "high" });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: "in_progress", priority: "high" });
  });

  it("returns 404 for an unknown id", async () => {
    const res = await request(app).patch("/tickets/9999").send({ status: "closed" });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("TICKET_NOT_FOUND");
  });

  it("rejects fields other than status and priority", async () => {
    const ticket = await prisma.ticket.create({ data: { title: "Keep me" } });

    const res = await request(app)
      .patch(`/tickets/${ticket.id}`)
      .send({ title: "changed" });

    expect(res.status).toBe(400);
    expect(res.body.error.details[0].field).toBe("title");
  });
});