import { useEffect, useState } from "react";
import { getStats, listTickets } from "./api";
import TicketCard from "./components/TicketCard";
import TicketForm from "./components/TicketForm";
import {
  STATUSES,
  STATUS_LABELS,
  type Stats,
  type TicketList,
  type TicketStatus,
} from "./types";

const PAGE_SIZE = 10;

export default function App() {
  const [list, setList] = useState<TicketList | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [filter, setFilter] = useState<TicketStatus | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [tickets, counts] = await Promise.all([
          listTickets({ status: filter, page, limit: PAGE_SIZE }),
          getStats(),
        ]);
        if (cancelled) return;

        const lastPage = Math.max(1, Math.ceil(tickets.total / PAGE_SIZE));
        if (page > lastPage) {
          setPage(lastPage);
          return;
        }

        setList(tickets);
        setStats(counts);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load tickets");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [filter, page, refreshKey]);

  const refresh = () => setRefreshKey((k) => k + 1);

  function selectFilter(next: TicketStatus | undefined) {
    setFilter(next);
    setPage(1);
  }

  function handleCreated() {
    setFilter(undefined);
    setPage(1);
    refresh();
  }

  const total = stats ? stats.open + stats.in_progress + stats.closed : 0;
  const totalPages = list ? Math.max(1, Math.ceil(list.total / PAGE_SIZE)) : 1;

  return (
    <div className="app">
      <header className="app-header">
        <h1>Mini Ticket Tracker</h1>
        {stats && <span className="muted">{total} tickets</span>}
      </header>

      <TicketForm onCreated={handleCreated} />

      {stats && (
        <nav className="chips" aria-label="Filter by status">
          <button
            className="chip"
            aria-pressed={filter === undefined}
            onClick={() => selectFilter(undefined)}
          >
            All <span className="chip-count">{total}</span>
          </button>
          {STATUSES.map((s) => (
            <button
              key={s}
              className="chip"
              aria-pressed={filter === s}
              onClick={() => selectFilter(s)}
            >
              {STATUS_LABELS[s]} <span className="chip-count">{stats[s]}</span>
            </button>
          ))}
        </nav>
      )}

      {error && (
        <div className="error" role="alert">
          <span>{error}</span>
          <button className="btn btn-secondary" onClick={refresh}>
            Retry
          </button>
        </div>
      )}

      {!list && !error && <p className="muted">Loading...</p>}

      {list && list.data.length === 0 && (
        <p className="empty">
          {filter
            ? "No tickets with this status."
            : "No tickets yet. Create the first one above."}
        </p>
      )}

      {list && list.data.length > 0 && (
        <ul className="tickets">
          {list.data.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} onChanged={refresh} />
          ))}
        </ul>
      )}

      {list && totalPages > 1 && (
        <div className="pager">
          <button
            className="btn btn-secondary"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </button>
          <span className="muted">
            Page {page} of {totalPages}
          </span>
          <button
            className="btn btn-secondary"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}