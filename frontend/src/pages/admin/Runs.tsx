import { useEffect, useState } from "react";
import {
  Alert,
  EmptyState,
  LoadingSpinner,
  StatusBadge,
} from "../../components/ui";
import { api, type AdminRun, type RunStatus } from "../../services/api";

function formatDate(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function uiStatus(
  status: RunStatus,
): "pending" | "running" | "waiting" | "completed" | "failed" {
  if (status === "interrupted") {
    return "waiting";
  }

  return status;
}

export default function Runs() {
  const [runs, setRuns] = useState<AdminRun[]>([]);
  const [filter, setFilter] = useState<RunStatus | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    setLoading(true);
    setError("");

    api.admin
      .runs(filter || undefined)
      .then((data) => {
        if (alive) {
          setRuns(data);
        }
      })
      .catch((e) => {
        if (alive) {
          setError(e instanceof Error ? e.message : "Unable to load runs.");
        }
      })
      .finally(() => {
        if (alive) {
          setLoading(false);
        }
      });

    return () => {
      alive = false;
    };
  }, [filter]);

  return (
    <div className="p-4 sm:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
              Administration
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
              Blog runs
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Monitor generation runs across all users.
            </p>
          </div>

          <label className="text-xs font-medium text-slate-500">
            Filter status
            <select
              aria-label="Filter runs by status"
              value={filter}
              onChange={(e) => setFilter(e.target.value as RunStatus | "")}
              className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:w-48"
            >
              <option value="">All statuses</option>
              <option value="completed">Completed</option>
              <option value="running">Running</option>
              <option value="interrupted">Waiting</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
            </select>
          </label>
        </header>

        {loading ? (
          <div className="grid min-h-64 place-items-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <div className="mt-6">
            {/* Wrapped Alert because the shared Alert component does
                not accept a className prop. */}
            <Alert variant="danger">{error}</Alert>
          </div>
        ) : runs.length === 0 ? (
          <div className="mt-6 rounded-xl border border-slate-200 bg-white">
            <EmptyState
              title="No runs found"
              description="There are no runs matching the selected status."
            />
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-[900px] w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Run
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      User
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Topic
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Status
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Created
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Error
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {runs.map((run) => (
                    <tr
                      key={run.run_id}
                      className="border-t border-slate-100 align-top transition-colors hover:bg-slate-50/70"
                    >
                      <td className="whitespace-nowrap px-4 py-4">
                        <span
                          className="font-mono text-xs text-slate-400"
                          title={run.run_id}
                        >
                          {run.run_id.slice(0, 12)}…
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <span className="font-medium text-slate-800">
                          {run.username}
                        </span>
                      </td>

                      <td className="max-w-sm px-4 py-4">
                        <p className="break-words leading-5 text-slate-700">
                          {run.topic}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        <StatusBadge status={uiStatus(run.status)} />
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-xs text-slate-500">
                        {formatDate(run.created_at)}
                      </td>

                      <td className="max-w-xs px-4 py-4">
                        <p
                          className={`break-words text-xs leading-5 ${
                            run.error_message
                              ? "text-red-600"
                              : "text-slate-400"
                          }`}
                        >
                          {run.error_message || "—"}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Keeps the table usable on mobile by clearly indicating
                that additional columns can be horizontally scrolled. */}
            <div className="border-t border-slate-100 bg-slate-50 px-4 py-2 text-center text-[11px] text-slate-400 sm:hidden">
              Swipe horizontally to view all columns.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
