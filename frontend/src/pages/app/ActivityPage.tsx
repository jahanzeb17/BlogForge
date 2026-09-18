import { useEffect, useState } from "react";
import type { NavFn } from "../../types";
import { routeForRun, toUiStatus } from "../../types";
import { Alert, EmptyState, LoadingSpinner, StatusBadge } from "../../components/ui";
import { api, type RunSummary } from "../../services/api";

export default function ActivityPage({ navigate, setRunId }: { navigate: NavFn; setRunId: (id: string) => void }) {
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getRuns().then(setRuns).catch((e) => setError(e instanceof Error ? e.message : "Unable to load activity.")).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="grid h-full place-items-center"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="p-4 sm:p-8">
      <div className="mx-auto max-w-4xl">
        <header>
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Workspace history</p>
          <h1 className="mt-1 text-xl font-bold text-slate-950">Activity</h1>
          <p className="mt-1 text-sm text-slate-500">A timeline of your recent BlogForge generation runs.</p>
        </header>

        {error && <Alert variant="danger" className="mt-5">{error}</Alert>}

        {!error && runs.length === 0 ? (
          <div className="mt-6 rounded-xl border border-slate-200 bg-white"><EmptyState title="No activity yet" description="Your generation activity will appear here after you create a blog." /></div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
            {runs.map((run) => (
              <button key={run.id} type="button" onClick={() => { setRunId(run.id); navigate(routeForRun(run)); }} className="flex w-full items-start gap-4 border-b border-slate-100 p-4 text-left transition last:border-b-0 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:p-5">
                <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${run.status === "completed" ? "bg-emerald-500" : run.status === "failed" ? "bg-red-500" : run.status === "interrupted" ? "bg-amber-500" : "bg-indigo-500"}`} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-slate-800">{run.topic}</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-500">{run.interrupt_type === "research_plan_review" ? "Research outline is ready for review" : run.interrupt_type === "final_draft_review" ? "Final draft is ready for review" : run.status === "completed" ? "Blog generation completed" : run.status === "failed" ? "Blog generation failed" : run.status === "running" ? "Blog generation is in progress" : "Waiting to start"}</span>
                  <span className="mt-1 block text-xs text-slate-400">Updated {run.updated_at ? new Date(run.updated_at).toLocaleString() : "—"}</span>
                </span>
                <StatusBadge status={toUiStatus(run.status)} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
