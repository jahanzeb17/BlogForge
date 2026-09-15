import { useEffect, useState } from "react";
import { StatusBadge, LoadingSpinner } from "../../components/ui";
import { api, type AdminRun, type RunStatus } from "../../services/api";

export default function Runs() {
  const [runs, setRuns] = useState<AdminRun[]>([]);
  const [filter, setFilter] = useState<RunStatus | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    setLoading(true); setError("");
    api.admin.runs(filter || undefined).then(setRuns).catch((e) => setError(e.message || "Unable to load runs.")).finally(() => setLoading(false));
  }, [filter]);
  return (
    <div className="p-4 sm:p-8"><div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center gap-3"><div><h1 className="text-2xl font-bold">Blog Runs</h1><p className="text-sm text-slate-500 mt-1">Monitor runs across all users.</p></div>
        <select value={filter} onChange={(e) => setFilter(e.target.value as RunStatus | "")} className="border rounded-md px-3 py-2 text-sm"><option value="">All statuses</option><option value="completed">Completed</option><option value="running">Running</option><option value="interrupted">Interrupted</option><option value="failed">Failed</option><option value="pending">Pending</option></select>
      </div>
      {loading ? <div className="py-12 text-center"><LoadingSpinner /></div> : error ? <div className="mt-6 text-sm text-red-600">{error}</div> : runs.length === 0 ? <div className="mt-6 py-12 text-center text-sm text-slate-500">No runs found.</div> :
        <div className="mt-6 bg-white border rounded-xl overflow-auto"><table className="w-full text-sm"><thead className="bg-slate-50"><tr><th className="text-left p-3">Run</th><th className="text-left p-3">User</th><th className="text-left p-3">Topic</th><th className="text-left p-3">Status</th><th className="text-left p-3">Created</th><th className="text-left p-3">Error</th></tr></thead><tbody>
          {runs.map((r) => <tr key={r.run_id} className="border-t"><td className="p-3 font-mono text-xs">{r.run_id}</td><td className="p-3">{r.username}</td><td className="p-3 max-w-sm">{r.topic}</td><td className="p-3"><StatusBadge status={(r.status === "interrupted" ? "waiting" : r.status) as any} /></td><td className="p-3 text-xs text-slate-500">{r.created_at ? new Date(r.created_at).toLocaleString() : "—"}</td><td className="p-3 text-xs text-red-600">{r.error_message || "—"}</td></tr>)}
        </tbody></table></div>}
    </div></div>
  );
}
