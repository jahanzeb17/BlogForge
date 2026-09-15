import { useEffect, useState } from "react";
import type { NavFn } from "../../types";
import { api, type RunSummary } from "../../services/api";
import { LoadingSpinner, StatusBadge } from "../../components/ui";
export default function ActivityPage({
  navigate: _navigate,
}: {
  navigate: NavFn;
}) {
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    api.getRuns().then(setRuns).catch((e) => setError(e.message || "Unable to load activity.")).finally(() => setLoading(false));
  }, []);
  if (loading) return <div className="h-full grid place-items-center"><LoadingSpinner /></div>;
  if (error) return <div className="p-8 text-sm text-red-600">{error}</div>;
  if (!runs.length) return <div className="h-full grid place-items-center"><p className="text-sm text-slate-500">No activity yet.</p></div>;
  return (
    <div className="p-4 sm:p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-lg font-semibold mb-5">Activity</h1>
        <div className="bg-white border border-slate-200 rounded-xl divide-y">
          {runs.map((r) => (
            <div key={r.id} className="p-4 flex items-center gap-4">
              <div className="w-2 h-2 rounded-full bg-indigo-500" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{r.topic}</p>
                <p className="text-xs text-slate-400 mt-1">
                  Updated{" "}
                  {r.updated_at ? new Date(r.updated_at).toLocaleString() : "—"}
                </p>
              </div>
              <StatusBadge
                status={
                  (r.status === "interrupted" ? "waiting" : r.status) as any
                }
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
