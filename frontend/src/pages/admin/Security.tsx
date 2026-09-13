import { useEffect, useState } from "react";
import type { NavFn } from "../../types";
import { api } from "../../services/api";
export default function Security({
  _navigate,
}: {
  navigate: NavFn;
  _navigate?: NavFn;
}) {
  const [events, setEvents] = useState<any[]>([]);
  useEffect(() => {
    api.admin.auditLogs().then(setEvents);
  }, []);
  return (
    <div className="p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold">Security & Guardrails</h1>
        <p className="text-sm text-slate-500 mt-1">
          Recorded runs where the backend stored a guardrail message.
        </p>
        <div className="mt-6 space-y-3">
          {events.length === 0 ? (
            <div className="bg-white border rounded-xl p-8 text-center text-sm text-slate-500">
              No guardrail events recorded.
            </div>
          ) : (
            events.map((e, i) => (
              <div key={i} className="bg-white border rounded-xl p-5">
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="font-mono text-xs">{e.run_id}</span>
                  <span className="text-xs text-slate-400">
                    {e.timestamp ? new Date(e.timestamp).toLocaleString() : "—"}
                  </span>
                </div>
                <p className="text-sm font-medium mt-3">{e.username}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {e.guardrail_message}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
