import { useEffect, useMemo, useState } from "react";
import { Alert, Badge, EmptyState, LoadingSpinner } from "../../components/ui";
import { api, type AuditLog } from "../../services/api";

function formatDate(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function displayValue(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "Not recorded yet";
  }

  return String(value);
}

function formatInputType(value: AuditLog["input_type"]) {
  if (value === "topic") return "Topic";
  if (value === "subtopic") return "Subtopic";
  if (value === "revision") return "Revision";

  return value;
}

function getInitial(username: string) {
  return username?.trim().charAt(0).toUpperCase() || "U";
}

export default function Security() {
  const [events, setEvents] = useState<AuditLog[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.admin
      .auditLogs()
      .then((data) => {
        setEvents(data);

        // Automatically select the first user when security events exist.
        if (data.length > 0) {
          setSelectedUserId(data[0].user_id);
        }
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Unable to load audit logs."),
      )
      .finally(() => setLoading(false));
  }, []);

  /*
   * Group the audit events by user.
   *
   * A user therefore appears only once in the selector even if
   * that user has triggered the guardrail many times.
   */
  const users = useMemo(() => {
    const grouped = new Map<
      number,
      {
        user_id: number;
        username: string;
        email: string;
        events: AuditLog[];
      }
    >();

    events.forEach((event) => {
      const existing = grouped.get(event.user_id);

      if (existing) {
        existing.events.push(event);
      } else {
        grouped.set(event.user_id, {
          user_id: event.user_id,
          username: event.username,
          email: event.email,
          events: [event],
        });
      }
    });

    return Array.from(grouped.values());
  }, [events]);

  const selectedUser = users.find((user) => user.user_id === selectedUserId);

  const selectedEvents = selectedUser?.events ?? [];

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

          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
            Select a user to review all of their recorded guardrail activity.
          </p>
        </header>

        {loading ? (
          <div className="grid min-h-64 place-items-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <div className="mt-6">
            <Alert variant="danger">{error}</Alert>
          </div>
        ) : events.length === 0 ? (
          <div className="mt-6 rounded-xl border border-slate-200 bg-white">
            <EmptyState
              title="No guardrail events"
              description="No recorded guardrail events are available yet."
            />
          </div>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
            {/* ============================================================
                USER SELECTOR
               ============================================================ */}
            <aside className="h-fit rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-bold text-slate-950">Users</h2>

                    <p className="mt-1 text-xs text-slate-500">
                      Users with guardrail activity
                    </p>
                  </div>

                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                    {users.length}
                  </span>
                </div>
              </div>

              <div className="max-h-[520px] overflow-y-auto p-2">
                {users.map((user) => {
                  const isSelected = user.user_id === selectedUserId;

                  return (
                    <button
                      key={user.user_id}
                      type="button"
                      onClick={() => setSelectedUserId(user.user_id)}
                      className={`mb-1 w-full rounded-xl border p-3 text-left transition-all ${
                        isSelected
                          ? "border-indigo-200 bg-indigo-50 shadow-sm"
                          : "border-transparent bg-white hover:border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-bold ${
                            isSelected
                              ? "bg-indigo-600 text-white"
                              : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {getInitial(user.username)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p
                              className={`truncate text-sm font-bold ${
                                isSelected
                                  ? "text-indigo-950"
                                  : "text-slate-900"
                              }`}
                            >
                              {user.username}
                            </p>

                            <span
                              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                isSelected
                                  ? "bg-indigo-100 text-indigo-700"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {user.events.length}
                            </span>
                          </div>

                          <p className="mt-0.5 truncate text-xs text-slate-500">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </aside>

            {/* ============================================================
                SELECTED USER DATA
               ============================================================ */}
            <main className="min-w-0">
              {selectedUser && (
                <>
                  {/* Selected user summary */}
                  <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-4 p-4 sm:p-5 md:flex-row md:items-center md:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-indigo-600 text-base font-bold text-white shadow-sm">
                          {getInitial(selectedUser.username)}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-lg font-bold text-slate-950">
                              {selectedUser.username}
                            </h2>

                            <Badge variant="warning">
                              {selectedEvents.length}{" "}
                              {selectedEvents.length === 1 ? "event" : "events"}
                            </Badge>
                          </div>

                          <p className="mt-1 break-all text-sm text-slate-600">
                            {selectedUser.email}
                          </p>

                          <p className="mt-1 font-mono text-xs text-slate-500">
                            User ID: {selectedUser.user_id}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-xl bg-slate-50 px-4 py-3 md:text-right">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          Guardrail activity
                        </p>

                        <p className="mt-1 text-xl font-bold text-slate-950">
                          {selectedEvents.length}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* User's events */}
                  <div className="mt-5 space-y-5">
                    {selectedEvents.map((event, index) => (
                      <article
                        key={`${event.id}-${event.timestamp}-${index}`}
                        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                      >
                        {/* ==================================================
                            EVENT HEADER
                           ================================================== */}
                        <div className="border-b border-slate-200 bg-slate-50 px-4 py-4 sm:px-6">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="warning">Blocked</Badge>

                              <Badge variant="info">
                                {formatInputType(event.input_type)}
                              </Badge>

                              {event.action && (
                                <Badge variant="info">{event.action}</Badge>
                              )}
                            </div>

                            <time className="text-xs text-slate-500">
                              {formatDate(event.timestamp)}
                            </time>
                          </div>
                        </div>

                        <div className="p-4 sm:p-6">
                          {/* ==================================================
                              WHAT WAS SUBMITTED
                             ================================================== */}
                          <section>
                            <div className="mb-3 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <div className="h-5 w-1 rounded-full bg-indigo-500" />

                                <h3 className="text-sm font-bold text-slate-950">
                                  What was submitted
                                </h3>
                              </div>

                              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                Request
                              </span>
                            </div>

                            <div className="grid gap-3 lg:grid-cols-2">
                              {/* Topic */}
                              <div className="rounded-xl border border-slate-200 bg-white p-4">
                                <div className="flex items-center justify-between gap-3">
                                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                    Topic
                                  </p>

                                  {event.input_type === "topic" && (
                                    <span className="rounded-full bg-indigo-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-indigo-700">
                                      Blocked input
                                    </span>
                                  )}
                                </div>

                                <p className="mt-2 break-words text-sm font-medium leading-6 text-slate-900">
                                  {displayValue(event.topic)}
                                </p>
                              </div>

                              {/* Subtopic */}
                              <div className="rounded-xl border border-slate-200 bg-white p-4">
                                <div className="flex items-center justify-between gap-3">
                                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                    Subtopic
                                  </p>

                                  {event.input_type === "subtopic" && (
                                    <span className="rounded-full bg-indigo-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-indigo-700">
                                      Blocked input
                                    </span>
                                  )}
                                </div>

                                <p className="mt-2 break-words text-sm font-medium leading-6 text-slate-900">
                                  {displayValue(event.subtopic)}
                                </p>
                              </div>
                            </div>
                          </section>

                          {/* ==================================================
                              WHY IT WAS BLOCKED
                             ================================================== */}
                          <section className="mt-6">
                            <div className="mb-3 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <div className="h-5 w-1 rounded-full bg-amber-500" />

                                <h3 className="text-sm font-bold text-slate-950">
                                  Why it was blocked
                                </h3>
                              </div>

                              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                Guardrail
                              </span>
                            </div>

                            <div className="grid gap-3 lg:grid-cols-[0.7fr_1.3fr]">
                              {/* Category */}
                              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                                  Detection category
                                </p>

                                <p className="mt-2 break-words text-sm font-bold leading-6 text-amber-950">
                                  {displayValue(event.guardrail_category)}
                                </p>

                                <div className="mt-3 border-t border-amber-200 pt-3">
                                  <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                                    Action
                                  </p>

                                  <p className="mt-1 text-sm font-semibold text-amber-950">
                                    {displayValue(event.action)}
                                  </p>
                                </div>
                              </div>

                              {/* Message */}
                              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                                  Guardrail message
                                </p>

                                <p className="mt-2 break-words text-sm leading-6 text-amber-950">
                                  {displayValue(event.guardrail_message)}
                                </p>
                              </div>
                            </div>
                          </section>

                          {/* ==================================================
                              EVENT INFORMATION
                             ================================================== */}
                          <section className="mt-6">
                            <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                              <div className="min-w-0">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                  Run ID
                                </p>

                                <p className="mt-1 break-all font-mono text-xs leading-5 text-slate-700">
                                  {displayValue(event.run_id)}
                                </p>
                              </div>

                              <div className="shrink-0 text-left sm:text-right">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                  Event ID
                                </p>

                                <p className="mt-1 font-mono text-xs text-slate-700">
                                  #{event.id}
                                </p>
                              </div>
                            </div>
                          </section>
                        </div>
                      </article>
                    ))}
                  </div>
                </>
              )}
            </main>
          </div>
        )}
      </div>
    </div>
  );
}
