import type {
  Stats,
  Ticket,
  TicketList,
  TicketPriority,
  TicketStatus,
} from "./types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
  
    const detail = body?.error?.details?.[0];
    const message = detail
      ? `${detail.field}: ${detail.message}`
      : (body?.error?.message ?? `Request failed (${res.status})`);
    throw new Error(message);
  }

  return body as T;
}

export function listTickets(params: {
  status?: TicketStatus;
  page: number;
  limit: number;
}) {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  });
  if (params.status) query.set("status", params.status);
  return request<TicketList>(`/tickets?${query}`);
}

export function getStats() {
  return request<Stats>("/tickets/stats");
}

export function createTicket(input: {
  title: string;
  description?: string;
  priority?: TicketPriority;
}) {
  return request<Ticket>("/tickets", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateTicket(
  id: number,
  input: { status?: TicketStatus; priority?: TicketPriority },
) {
  return request<Ticket>(`/tickets/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}