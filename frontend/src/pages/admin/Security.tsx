import { useEffect, useState } from "react";
import { Alert, Badge, EmptyState, LoadingSpinner } from "../../components/ui";
import { api, type AuditLog } from "../../services/api";

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export default function Security() {
  const [events, setEvents] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    api.admin
      .auditLogs()
      .then(setEvents)
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Unable to load audit logs."),
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 sm:p-8">
      <div className="mx-auto max-w-6xl">
        <header>
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
            Administration
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
            Security & guardrails
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Review recorded runs where a topic guardrail produced a message.
          </p>
        </header>
        {loading ? (
          <div className="grid min-h-64 place-items-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <Alert variant="danger" className="mt-6">
            {error}
          </Alert>
        ) : events.length === 0 ? (
          <div className="mt-6 rounded-xl border border-slate-200 bg-white">
            <EmptyState
              title="No guardrail events"
              description="No recorded guardrail events are available yet."
            />
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {events.map((event, index) => (
              <article
                key={`${event.run_id}-${event.timestamp}-${index}`}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="warning">Guardrail event</Badge>
                    <span className="text-sm font-semibold text-slate-800">
                      {event.username}
                    </span>
                  </div>
                  <time className="text-xs text-slate-400">
                    {formatDate(event.timestamp)}
                  </time>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Topic attempted
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-700">
                      {event.topic_attempted}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Run
                    </p>
                    <p className="mt-1 break-all font-mono text-xs text-slate-500">
                      {event.run_id}
                    </p>
                  </div>
                </div>
                <div className="mt-4 rounded-lg bg-amber-50 p-3">
                  <p className="text-xs font-semibold text-amber-800">
                    Guardrail message
                  </p>
                  <p className="mt-1 text-sm leading-6 text-amber-900">
                    {event.guardrail_message}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
