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
  const [filterOpen, setFilterOpen] = useState(false);
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

  useEffect(() => {
    if (!filterOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      if (!target.closest("[data-status-filter]")) {
        setFilterOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setFilterOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [filterOpen]);

  const filterOptions: Array<{
    value: RunStatus | "";
    label: string;
  }> = [
    { value: "", label: "All statuses" },
    { value: "completed", label: "Completed" },
    { value: "running", label: "Running" },
    { value: "interrupted", label: "Waiting" },
    { value: "failed", label: "Failed" },
    { value: "pending", label: "Pending" },
  ];

  const selectedFilterLabel =
    filterOptions.find((option) => option.value === filter)?.label ??
    "All statuses";

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

          <label
            className="text-xs font-medium text-slate-500"
            data-status-filter
          >
            Filter status
            {/* Custom dropdown keeps the options inside the viewport on phones. */}
            <div className="relative mt-1 w-full sm:w-48">
              <button
                type="button"
                aria-label="Filter runs by status"
                aria-haspopup="listbox"
                aria-expanded={filterOpen}
                onClick={() => setFilterOpen((open) => !open)}
                className="flex w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2 text-left text-sm text-slate-800 outline-none transition hover:border-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              >
                <span>{selectedFilterLabel}</span>

                <svg
                  className={`ml-2 h-4 w-4 shrink-0 text-slate-500 transition-transform ${
                    filterOpen ? "rotate-180" : ""
                  }`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {filterOpen && (
                <div
                  role="listbox"
                  aria-label="Filter runs by status"
                  className="absolute left-0 right-0 z-50 mt-1 overflow-hidden rounded-md border border-slate-300 bg-white shadow-lg"
                >
                  {filterOptions.map((option) => (
                    <button
                      key={option.value || "all"}
                      type="button"
                      role="option"
                      aria-selected={filter === option.value}
                      onClick={() => {
                        setFilter(option.value);
                        setFilterOpen(false);
                      }}
                      className={`block w-full px-3 py-2 text-left text-sm transition ${
                        filter === option.value
                          ? "bg-indigo-50 font-medium text-indigo-700"
                          : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
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
                {/* Dark table header for stronger separation and readability. */}
                <thead className="bg-slate-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-100">
                      Run
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-100">
                      User
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-100">
                      Topic
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-100">
                      Status
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-100">
                      Created
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-100">
                      Error
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {runs.map((run) => (
                    <tr
                      key={run.run_id}
                      className="border-t border-slate-200 bg-slate-50 align-top transition-colors hover:bg-slate-100"
                    >
                      <td className="whitespace-nowrap px-4 py-4">
                        <span
                          className="font-mono text-xs text-slate-500"
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

                      <td className="whitespace-nowrap px-4 py-4 text-xs text-slate-600">
                        {formatDate(run.created_at)}
                      </td>

                      <td className="max-w-xs px-4 py-4">
                        <p
                          className={`break-words text-xs leading-5 ${
                            run.error_message
                              ? "text-red-600"
                              : "text-slate-500"
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
            <div className="border-t border-slate-200 bg-slate-100 px-4 py-2 text-center text-[11px] text-slate-500 sm:hidden">
              Swipe horizontally to view all columns.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
