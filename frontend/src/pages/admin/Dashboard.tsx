import { useEffect, useState } from "react";
import type { NavFn } from "../../types";
import {
  Alert,
  Badge,
  Button,
  Card,
  LoadingSpinner,
  MetricCard,
} from "../../components/ui";
import { api, type AdminMetrics, type RunStatus } from "../../services/api";

const statusLabels: RunStatus[] = [
  "pending",
  "running",
  "interrupted",
  "completed",
  "failed",
];

export default function Dashboard({ navigate }: { navigate: NavFn }) {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.admin
      .metrics()
      .then(setMetrics)
      .catch((e) =>
        setError(
          e instanceof Error ? e.message : "Unable to load dashboard metrics.",
        ),
      );
  }, []);

  if (!metrics && !error)
    return (
      <div className="grid h-full place-items-center">
        <LoadingSpinner size="lg" />
      </div>
    );

  return (
    <div className="p-4 sm:p-8">
      <div className="mx-auto max-w-6xl">
        <header>
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
            Administration
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
            System dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Monitor BlogForge usage, workflow status, and system health.
          </p>
        </header>
        {error && (
          <Alert variant="danger" className="mt-6">
            {error}
          </Alert>
        )}
        {metrics && (
          <>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard label="Total users" value={metrics.total_users} />
              <MetricCard
                label="Total runs"
                value={metrics.total_blogs_generated}
                color="indigo"
              />
              <MetricCard
                label="Completed"
                value={metrics.status_breakdown.completed ?? 0}
                color="success"
              />
              <MetricCard
                label="Failed"
                value={metrics.status_breakdown.failed ?? 0}
                color="danger"
              />
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <Card className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">
                      Run status
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Current distribution across all runs.
                    </p>
                  </div>
                  <Badge variant="info">Live data</Badge>
                </div>
                <div className="mt-5 space-y-3">
                  {statusLabels.map((status) => (
                    <div key={status} className="flex items-center gap-3">
                      <span className="w-24 text-xs font-medium capitalize text-slate-500">
                        {status === "interrupted" ? "Waiting" : status}
                      </span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-indigo-500"
                          style={{
                            width: `${metrics.total_blogs_generated ? Math.min(100, ((metrics.status_breakdown[status] ?? 0) / metrics.total_blogs_generated) * 100) : 0}%`,
                          }}
                        />
                      </div>
                      <span className="w-8 text-right text-xs font-semibold text-slate-700">
                        {metrics.status_breakdown[status] ?? 0}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
              <Card className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">
                      System health
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Status reported by the backend.
                    </p>
                  </div>
                  <Badge variant="success" dot>
                    Backend status
                  </Badge>
                </div>
                <p className="mt-6 text-sm leading-6 text-slate-700">
                  {metrics.system_health}
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() => navigate({ section: "admin", page: "runs" })}
                  >
                    View runs
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      navigate({ section: "admin", page: "users" })
                    }
                  >
                    Manage users
                  </Button>
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
