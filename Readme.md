# Mini Ticket Tracker

A small support-ticket tracker: a REST API, a PostgreSQL database and a single-page UI. Built as a take-home assignment for the Mid-Level Full-Stack Developer role at Lodwar Services.

## Stack

- **Backend:** Node.js, Express, TypeScript, Prisma 6, zod
- **Database:** PostgreSQL
- **Frontend:** React, Vite, TypeScript, plain CSS (no UI or state library)
- **Tests:** Vitest and Supertest, run against a real separate test database

## Project structure

```
backend/
  prisma/             schema and migrations
  src/
    app.ts            builds the Express app (does not listen, so tests can import it)
    server.ts         starts the server
    db.ts             shared Prisma client
    errors.ts         AppError for deliberate HTTP errors
    middleware/       404 and centralized error handling
    tickets/          routes, service (data access), zod schemas
  tests/              integration tests
frontend/
  src/
    api.ts            the only place that calls fetch
    types.ts          shared types, enum values and display labels
    App.tsx           page state: filter, pagination, refresh
    components/       TicketForm, TicketCard
```

## Setup

### Prerequisites

- Node.js 20 or newer
- A running PostgreSQL server and a user that can create databases

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` and set `DATABASE_URL` to your own credentials:

```
PORT=3000
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/tickets?schema=public"
```

Apply the migrations and start the API:

```bash
npx prisma migrate deploy
npm run dev
```

Prisma creates the `tickets` database on the first migration if it does not exist. If your user lacks permission to do that, create an empty database named `tickets` yourself and run the command again. The API listens on http://localhost:3000. Check it with `curl localhost:3000/health`.

### 2. Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The dev server proxies `/tickets` to the API on port 3000, so the backend must be running.

### 3. Tests

The tests truncate the `tickets` table, so they use their own database:

```bash
cd backend
cp .env.test.example .env.test
```

Edit `.env.test` so `DATABASE_URL` points at a database named `tickets_test` (same credentials as above), then:

```bash
npm run migrate:test
npm test
```

The test setup refuses to run unless the database name ends in `_test`, so a wrong URL cannot wipe your development data.

There are 8 integration tests covering create (defaults and validation), list (status filter and pagination), stats (empty and populated) and update (success, 404, rejected fields).

### Notes

- On Windows, stop the dev server before running `npx prisma generate` or a migration. A running server keeps Prisma's query engine file open and the generate step fails with `EPERM`.

## API

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/tickets` | Create a ticket |
| GET | `/tickets` | List tickets (`?status=`, `?page=`, `?limit=`) |
| PATCH | `/tickets/:id` | Update a ticket's status and/or priority |
| GET | `/tickets/stats` | Count of tickets grouped by status |
| GET | `/health` | Liveness check |

### Examples

Create:

```bash
curl -X POST localhost:3000/tickets \
  -H "Content-Type: application/json" \
  -d '{"title":"Printer is down","priority":"high"}'
```

```json
{
  "id": 1,
  "title": "Printer is down",
  "description": null,
  "status": "open",
  "priority": "high",
  "createdAt": "2026-10-13T07:41:28.978Z"
}
```

List:

```bash
curl "localhost:3000/tickets?status=open&page=1&limit=20"
```

```json
{ "data": [], "page": 1, "limit": 20, "total": 0 }
```

Update:

```bash
curl -X PATCH localhost:3000/tickets/1 \
  -H "Content-Type: application/json" \
  -d '{"status":"in_progress"}'
```

Stats:

```bash
curl localhost:3000/tickets/stats
```

```json
{ "open": 2, "in_progress": 1, "closed": 0 }
```

### Errors

Every error uses one shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request",
    "details": [{ "field": "title", "message": "title is required" }]
  }
}
```

Codes: `VALIDATION_ERROR` (400), `INVALID_JSON` (400), `TICKET_NOT_FOUND` (404), `NOT_FOUND` (404, unknown route), `INTERNAL_ERROR` (500). The 500 response never exposes internals; the real error is logged on the server.

## Decisions & Tradeoffs

I kept the stack small on purpose: Express with a thin routes and service split, Prisma for typed queries and migrations, and zod to validate every request at the edge, because four endpoints and one table do not justify more layers. Status and priority are Postgres enums, so the database rejects invalid values even if API validation is bypassed. Pagination is offset-based with a capped limit and a stable newest-first order, and stats use a single `GROUP BY` backed by an index on status, so queries stay cheap as the table grows; the API is also stateless, so running more copies behind a load balancer would work. Tests run against a real separate database instead of mocks, because the risks are in the actual SQL behavior, and a guard prevents them from touching development data. The shortcuts I took: no authentication, no rate limiting, no Docker setup, no frontend tests, and the enum values and response types are duplicated between backend and frontend instead of shared. The frontend reaches the API through a Vite dev proxy, which avoids CORS in development but is not a production setup. With more time I would add keyset pagination for large tables, generate shared types from an OpenAPI spec, add frontend and end-to-end tests, a CI pipeline, a Docker Compose setup, and an edit flow for title and description.

### Assumptions

- `title` is required (1 to 200 characters after trimming). New tickets default to status `open` and priority `medium`.
- `PATCH /tickets/:id` accepts only `status` and `priority`, as in the brief. Unknown fields and empty bodies return 400.
- Invalid pagination values (such as `limit=500`) and unknown statuses return 400 instead of being silently corrected, so clients learn about their mistake.
- `GET /tickets` is ordered newest first, and `GET /tickets/stats` always returns all three statuses, including zeros.
- No authentication or multi-user support, since the brief did not ask for it.