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
    <>
      {/* Dashboard-only animations. */}
      <style>
        {`
          @keyframes dashboard-fade-up {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes dashboard-live-pulse {
            0%,
            100% {
              opacity: 1;
              transform: scale(1);
            }
            50% {
              opacity: 0.45;
              transform: scale(1.35);
            }
          }

          @keyframes dashboard-bar-fill {
            from {
              width: 0;
            }
          }

          @keyframes dashboard-value-pop {
            0% {
              opacity: 0;
              transform: translateY(4px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .dashboard-fade-up {
            animation: dashboard-fade-up 0.5s ease-out both;
          }

          .dashboard-delay-1 {
            animation-delay: 80ms;
          }

          .dashboard-delay-2 {
            animation-delay: 160ms;
          }

          .dashboard-delay-3 {
            animation-delay: 240ms;
          }

          .dashboard-delay-4 {
            animation-delay: 320ms;
          }

          .dashboard-delay-5 {
            animation-delay: 400ms;
          }

          .dashboard-live-dot {
            animation: dashboard-live-pulse 1.8s ease-in-out infinite;
          }

          .dashboard-status-bar {
            animation: dashboard-bar-fill 900ms cubic-bezier(0.22, 1, 0.36, 1) both;
          }

          .dashboard-status-value {
            animation: dashboard-value-pop 450ms ease-out both;
          }

          .dashboard-card {
            transition:
              transform 180ms ease,
              box-shadow 180ms ease,
              border-color 180ms ease;
          }

          .dashboard-card:hover {
            transform: translateY(-2px);
            box-shadow:
              0 12px 28px -12px rgba(15, 23, 42, 0.3);
          }

          @media (prefers-reduced-motion: reduce) {
            .dashboard-fade-up,
            .dashboard-live-dot,
            .dashboard-status-bar,
            .dashboard-status-value {
              animation: none !important;
            }

            .dashboard-card {
              transition: none !important;
            }

            .dashboard-card:hover {
              transform: none;
            }
          }
        `}
      </style>

      <div className="bg-slate-100 p-4 sm:p-8">
        <div className="mx-auto max-w-6xl">
          <header className="dashboard-fade-up">
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
              Administration
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
              System dashboard
            </h1>

            <p className="mt-1 text-sm text-slate-600">
              Monitor BlogForge usage, workflow status, and system health.
            </p>
          </header>

          {error && (
            <div className="dashboard-fade-up mt-6">
              <Alert variant="danger">{error}</Alert>
            </div>
          )}

          {metrics && (
            <>
              {/* Metric cards: explicit white surfaces and stronger borders
                  make each dashboard value clearly visible against the
                  light-grey dashboard background. */}
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="dashboard-fade-up dashboard-delay-1 rounded-xl border border-slate-300 bg-white shadow-sm">
                  <MetricCard label="Total users" value={metrics.total_users} />
                </div>

                <div className="dashboard-fade-up dashboard-delay-2 rounded-xl border border-indigo-200 bg-white shadow-sm">
                  <MetricCard
                    label="Total runs"
                    value={metrics.total_blogs_generated}
                    color="indigo"
                  />
                </div>

                <div className="dashboard-fade-up dashboard-delay-3 rounded-xl border border-emerald-200 bg-white shadow-sm">
                  <MetricCard
                    label="Completed"
                    value={metrics.status_breakdown.completed ?? 0}
                    color="success"
                  />
                </div>

                <div className="dashboard-fade-up dashboard-delay-4 rounded-xl border border-red-200 bg-white shadow-sm">
                  <MetricCard
                    label="Failed"
                    value={metrics.status_breakdown.failed ?? 0}
                    color="danger"
                  />
                </div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <Card className="dashboard-card dashboard-fade-up dashboard-delay-3 border border-slate-300 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-bold text-slate-950">
                        Run status
                      </h2>

                      <p className="mt-1 text-xs text-slate-600">
                        Current distribution across all runs.
                      </p>
                    </div>

                    {/* Animated live indicator. */}
                    <div className="flex shrink-0 items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1">
                      <span className="relative flex h-2 w-2">
                        <span className="dashboard-live-dot absolute inline-flex h-full w-full rounded-full bg-indigo-400" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-600" />
                      </span>

                      <Badge variant="info">Live data</Badge>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    {statusLabels.map((status, index) => (
                      <div
                        key={status}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-24 shrink-0 text-xs font-semibold capitalize text-slate-700">
                            {status === "interrupted" ? "Waiting" : status}
                          </span>

                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                            <div
                              className="dashboard-status-bar h-full rounded-full bg-indigo-500"
                              style={{
                                width: `${
                                  metrics.total_blogs_generated
                                    ? Math.min(
                                        100,
                                        ((metrics.status_breakdown[status] ??
                                          0) /
                                          metrics.total_blogs_generated) *
                                          100,
                                      )
                                    : 0
                                }%`,
                                animationDelay: `${index * 90}ms`,
                              }}
                            />
                          </div>

                          <span
                            className="dashboard-status-value w-8 text-right text-xs font-bold text-slate-950"
                            style={{
                              animationDelay: `${index * 90 + 250}ms`,
                            }}
                          >
                            {metrics.status_breakdown[status] ?? 0}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="dashboard-card dashboard-fade-up dashboard-delay-4 border border-slate-300 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-bold text-slate-950">
                        System health
                      </h2>

                      <p className="mt-1 text-xs text-slate-600">
                        Status reported by the backend.
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="dashboard-live-dot absolute inline-flex h-full w-full rounded-full bg-emerald-400" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      </span>

                      <Badge variant="success" dot>
                        Backend status
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-medium leading-6 text-slate-800">
                      {metrics.system_health}
                    </p>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() =>
                        navigate({ section: "admin", page: "runs" })
                      }
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
    </>
  );
}
