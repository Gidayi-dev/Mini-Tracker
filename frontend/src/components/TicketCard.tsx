import { useState } from "react";
import { updateTicket } from "../api";
import {
  PRIORITY_LABELS,
  STATUSES,
  STATUS_LABELS,
  type Ticket,
  type TicketStatus,
} from "../types";

interface Props {
  ticket: Ticket;
  onChanged: () => void;
}

export default function TicketCard({ ticket, onChanged }: Props) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStatusChange(status: TicketStatus) {
    setSaving(true);
    setError(null);
    try {
      await updateTicket(ticket.id, { status });
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update ticket");
    } finally {
      setSaving(false);
    }
  }

  const created = new Date(ticket.createdAt).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <li className={`card ticket status-${ticket.status}`}>
      <div className="ticket-head">
        <h2 className="ticket-title">{ticket.title}</h2>
        <span className="muted">#{ticket.id}</span>
      </div>

      {ticket.description && <p className="ticket-desc">{ticket.description}</p>}

      <div className="ticket-foot">
        <span className={`badge badge-${ticket.priority}`}>
          {PRIORITY_LABELS[ticket.priority]} priority
        </span>
        <span className="muted">{created}</span>
        <select
          className="status-select"
          aria-label={`Status of ticket ${ticket.id}`}
          value={ticket.status}
          disabled={saving}
          onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="error-text" role="alert">
          {error}
        </p>
      )}
    </li>
  );
}