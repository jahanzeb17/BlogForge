import { useEffect, useState } from "react";
import type { NavFn } from "../../types";
import { MetricCard, StatusBadge, LoadingSpinner } from "../../components/ui";
import { api } from "../../services/api";
export default function Dashboard({ navigate }: { navigate: NavFn }) {
  const [m, setM] = useState<any>(null);
  useEffect(() => {
    api.admin.metrics().then(setM);
  }, []);
  if (!m)
    return (
      <div className="h-full grid place-items-center">
        <LoadingSpinner />
      </div>
    );
  return (
    <div className="p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold">System Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">
          Platform-wide BlogForge monitoring.
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <MetricCard label="Total Users" value={m.total_users} />
          <MetricCard
            label="Total Runs"
            value={m.total_blogs_generated}
            color="indigo"
          />
          <MetricCard
            label="Completed"
            value={m.status_breakdown.completed}
            color="success"
          />
          <MetricCard
            label="Failed"
            value={m.status_breakdown.failed}
            color="danger"
          />
        </div>
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <div className="bg-white border rounded-xl p-5">
            <h2 className="text-sm font-semibold">Run Status</h2>
            <div className="mt-4 space-y-3">
              {Object.entries(m.status_breakdown).map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span className="capitalize text-slate-500">{k}</span>
                  <span className="font-semibold">{String(v)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white border rounded-xl p-5">
            <h2 className="text-sm font-semibold">System Health</h2>
            <p className="mt-4 text-sm text-green-700">{m.system_health}</p>
            <button
              onClick={() => navigate({ section: "admin", page: "runs" })}
              className="mt-6 text-sm text-indigo-600"
            >
              View all runs →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
