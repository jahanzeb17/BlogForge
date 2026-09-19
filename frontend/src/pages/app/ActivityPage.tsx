import { useEffect, useState } from "react";
import type { NavFn } from "../../types";
import { routeForRun, toUiStatus } from "../../types";
import {
  Alert,
  EmptyState,
  LoadingSpinner,
  StatusBadge,
} from "../../components/ui";
import { api, type RunSummary } from "../../services/api";

export default function ActivityPage({
  navigate,
  setRunId,
}: {
  navigate: NavFn;
  setRunId: (id: string) => void;
}) {
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getRuns()
      .then(setRuns)
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Unable to load activity."),
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid h-full place-items-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="mx-auto max-w-4xl">
        <header>
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
            Workspace history
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
            Activity
          </h1>

          <p className="mt-1 text-sm leading-6 text-slate-600">
            A timeline of your recent BlogForge generation runs.
          </p>
        </header>

        {error && (
          <Alert variant="danger" className="mt-5">
            {error}
          </Alert>
        )}

        {!error && runs.length === 0 ? (
          <div className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
            <EmptyState
              title="No activity yet"
              description="Your generation activity will appear here after you create a blog."
            />
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* Activity list header */}
            <div className="border-b border-slate-700 bg-slate-800 px-4 py-3 sm:px-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-white">
                    Generation activity
                  </h2>

                  <p className="mt-0.5 text-xs text-slate-300">
                    {runs.length} {runs.length === 1 ? "run" : "runs"} in your
                    workspace
                  </p>
                </div>

                <span className="rounded-full bg-slate-700 px-2.5 py-1 text-[11px] font-semibold text-slate-200">
                  Recent
                </span>
              </div>
            </div>

            {/* Activity rows */}
            <div className="space-y-2 bg-slate-100 p-2 sm:p-3">
              {runs.map((run) => (
                <button
                  key={run.id}
                  type="button"
                  onClick={() => {
                    setRunId(run.id);
                    navigate(routeForRun(run));
                  }}
                  className="group flex w-full items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-slate-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:gap-4 sm:p-5"
                >
                  {/* Status indicator */}
                  <span
                    className={`mt-1.5 h-3 w-3 shrink-0 rounded-full ring-4 ring-white ${
                      run.status === "completed"
                        ? "bg-emerald-500"
                        : run.status === "failed"
                          ? "bg-red-500"
                          : run.status === "interrupted"
                            ? "bg-amber-500"
                            : "bg-indigo-500"
                    }`}
                  />

                  <span className="min-w-0 flex-1">
                    {/* Topic */}
                    <span className="block break-words text-sm font-bold leading-6 text-slate-950 group-hover:text-indigo-700">
                      {run.topic}
                    </span>

                    {/* Activity description */}
                    <span className="mt-1 block text-xs leading-5 text-slate-600">
                      {run.interrupt_type === "research_plan_review"
                        ? "Research outline is ready for review"
                        : run.interrupt_type === "final_draft_review"
                          ? "Final draft is ready for review"
                          : run.status === "completed"
                            ? "Blog generation completed"
                            : run.status === "failed"
                              ? "Blog generation failed"
                              : run.status === "running"
                                ? "Blog generation is in progress"
                                : "Waiting to start"}
                    </span>

                    {/* Updated time */}
                    <span className="mt-2 block text-[11px] font-medium text-slate-500">
                      Updated{" "}
                      {run.updated_at
                        ? new Date(run.updated_at).toLocaleString()
                        : "—"}
                    </span>
                  </span>

                  {/* Status */}
                  <span className="shrink-0 pt-0.5">
                    <StatusBadge status={toUiStatus(run.status)} />
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
