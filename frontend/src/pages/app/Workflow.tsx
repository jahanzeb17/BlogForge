import { useEffect, useMemo, useState } from "react";
import { type NavFn } from "../../types";
import { Button, Badge, Alert, LoadingSpinner } from "../../components/ui";
import { api, type RunDetail } from "../../services/api";

const STEPS = [
  ["guardrail", "Topic Guardrail"],
  ["outline", "Outline Generator"],
  ["outline-review", "Outline Review"],
  ["safety", "Safety Check"],
  ["research", "Web Research"],
  ["research-plan", "Blog Planning"],
  ["writing", "Section Writing"],
  ["merge", "Content Merge"],
  ["image-plan", "Image Planning"],
  ["image-gen", "Image Generation"],
  ["final-review", "Final Review"],
  ["final-blog", "Final Blog"],
];

function stepState(i: number, run: RunDetail) {
  const current = run.workflow_step
    ? STEPS.findIndex(([id]) => id === run.workflow_step)
    : -1;

  if (run.status === "pending") {
    return i === 0 ? "running" : "pending";
  }

  if (run.status === "completed") {
    return "completed";
  }

  if (run.status === "failed") {
    return current < 0
      ? i === 0
        ? "failed"
        : "pending"
      : i < current
        ? "completed"
        : i === current
          ? "failed"
          : "pending";
  }

  if (run.status === "interrupted") {
    return current < 0
      ? "pending"
      : i < current
        ? "completed"
        : i === current
          ? "waiting"
          : "pending";
  }

  if (current < 0) {
    return "pending";
  }

  return i < current ? "completed" : i === current ? "running" : "pending";
}

function getHeaderStatus(status: RunDetail["status"]) {
  switch (status) {
    case "running":
      return {
        label: "Running",
        icon: "●",
        className: "bg-indigo-50 text-indigo-600 border-indigo-200",
      };

    case "completed":
      return {
        label: "Completed",
        icon: "✓",
        className: "bg-green-50 text-green-600 border-green-200",
      };

    case "interrupted":
      return {
        label: "Waiting for review",
        icon: "Ⅱ",
        className: "bg-amber-50 text-amber-600 border-amber-200",
      };

    case "failed":
      return {
        label: "Failed",
        icon: "×",
        className: "bg-red-50 text-red-600 border-red-200",
      };

    case "pending":
    default:
      return {
        label: "Pending",
        icon: "○",
        className: "bg-slate-50 text-slate-500 border-slate-200",
      };
  }
}

export default function WorkflowPage({
  navigate,
  runId,
}: {
  navigate: NavFn;
  runId: string;
}) {
  const [run, setRun] = useState<RunDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    const poll = () =>
      api
        .getRun(runId)
        .then((r) => {
          if (alive) {
            setRun(r);
          }
        })
        .catch((e) => setError(e.message));

    poll();

    const t = setInterval(poll, 1500);

    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [runId]);

  const statuses = useMemo(
    () => (run ? STEPS.map((_, i) => stepState(i, run)) : []),
    [run],
  );

  if (!run) {
    return (
      <div className="h-full grid place-items-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const done =
    run.status === "completed"
      ? STEPS.length
      : statuses.filter((s) => s === "completed").length;

  const headerStatus = getHeaderStatus(run.status);

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-sm font-semibold">
              {run.status === "completed"
                ? "Blog generation complete"
                : run.status === "failed"
                  ? "Generation failed"
                  : "Generating Blog"}
            </h1>

            <p className="text-xs text-slate-500 truncate">{run.topic}</p>
          </div>

          <div
            className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium ${headerStatus.className}`}
          >
            <span className="text-[10px]">{headerStatus.icon}</span>

            <span>{headerStatus.label}</span>
          </div>
        </div>

        <div className="mt-3 h-1 bg-slate-100 rounded">
          <div
            className="h-full bg-indigo-600 rounded transition-all"
            style={{
              width: `${Math.round((done / STEPS.length) * 100)}%`,
            }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-3xl mx-auto">
          {error && <Alert variant="danger">{error}</Alert>}

          {run.error_message && (
            <Alert variant="danger">{run.error_message}</Alert>
          )}

          {run.guardrail_msg && (
            <div className="mb-4">
              <Alert variant="warning">{run.guardrail_msg}</Alert>
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-xl divide-y">
            {STEPS.map(([id, label], i) => {
              const s = statuses[i];

              return (
                <div key={id} className="p-4 flex items-center gap-4">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      s === "completed"
                        ? "bg-green-50 text-green-600"
                        : s === "running"
                          ? "bg-indigo-50 text-indigo-600"
                          : s === "waiting"
                            ? "bg-amber-50 text-amber-600"
                            : s === "failed"
                              ? "bg-red-50 text-red-600"
                              : "bg-slate-50 text-slate-400"
                    }`}
                  >
                    {s === "completed"
                      ? "✓"
                      : s === "failed"
                        ? "×"
                        : s === "running"
                          ? "•"
                          : s === "waiting"
                            ? "Ⅱ"
                            : "○"}
                  </div>

                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800">
                      {label}
                    </p>

                    <p className="text-xs text-slate-500 mt-0.5">
                      {s === "running"
                        ? "Running now"
                        : s === "waiting"
                          ? "Waiting for your review"
                          : s === "completed"
                            ? "Completed"
                            : s === "failed"
                              ? "Failed"
                              : "Pending"}
                    </p>
                  </div>

                  {s === "waiting" && (
                    <Badge variant="warning">Review required</Badge>
                  )}
                </div>
              );
            })}
          </div>

          {run.interrupt_type === "research_plan_review" && (
            <div className="mt-5 flex justify-end">
              <Button
                onClick={() =>
                  navigate({
                    section: "app",
                    page: "outline-review",
                  })
                }
              >
                Review Outline
              </Button>
            </div>
          )}

          {run.interrupt_type === "final_draft_review" && (
            <div className="mt-5 flex justify-end">
              <Button
                onClick={() =>
                  navigate({
                    section: "app",
                    page: "blog-workspace",
                  })
                }
              >
                Review Draft
              </Button>
            </div>
          )}

          {run.status === "completed" && (
            <div className="mt-5 flex justify-end">
              <Button
                onClick={() =>
                  navigate({
                    section: "app",
                    page: "blog-workspace",
                  })
                }
              >
                Open Blog
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
