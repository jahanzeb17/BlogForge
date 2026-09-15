import { useEffect, useState } from "react";
import { api, type AuditLog } from "../../services/api";
export default function Security() {
  const [events, setEvents] = useState<AuditLog[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  useEffect(() => { api.admin.auditLogs().then(setEvents).catch((e) => setError(e.message || "Unable to load audit logs.")).finally(() => setLoading(false)); }, []);
  return <div className="p-4 sm:p-8"><div className="max-w-6xl mx-auto"><h1 className="text-2xl font-bold">Security & Guardrails</h1><p className="text-sm text-slate-500 mt-1">Recorded runs where the backend stored a guardrail message.</p>
    {loading ? <div className="mt-8 text-center"><span className="inline-block"><div className="w-6 h-6 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin" /></span></div> : error ? <div className="mt-6 text-sm text-red-600">{error}</div> : events.length === 0 ? <div className="mt-6 bg-white border rounded-xl p-8 text-center text-sm text-slate-500">No guardrail events recorded.</div> : <div className="mt-6 space-y-3">{events.map((e) => <div key={`${e.run_id}-${e.timestamp}`} className="bg-white border rounded-xl p-5"><div className="flex flex-wrap justify-between gap-2"><span className="font-mono text-xs">{e.run_id}</span><span className="text-xs text-slate-400">{e.timestamp ? new Date(e.timestamp).toLocaleString() : "—"}</span></div><p className="text-sm font-medium mt-3">{e.username}</p><p className="text-xs text-slate-500 mt-1">{e.guardrail_message}</p></div>)}</div>}
  </div></div>;
}
