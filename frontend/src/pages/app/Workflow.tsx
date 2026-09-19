import { useEffect, useMemo, useState } from "react";
import type { NavFn } from "../../types";
import { Alert, Badge, Button, LoadingSpinner } from "../../components/ui";
import { api, type RunDetail } from "../../services/api";

const STEPS = [
  [
    "guardrail",
    "Topic Guardrail",
    "Validate the topic and generation request.",
  ],
  [
    "outline",
    "Outline Generator",
    "Prepare the article structure and research direction.",
  ],
  [
    "outline-review",
    "Outline Review",
    "Pause for your approval of the research outline.",
  ],
  [
    "safety",
    "Safety Check",
    "Check the planned workflow before research continues.",
  ],
  [
    "research",
    "Web Research",
    "Gather evidence from relevant technical sources.",
  ],
  [
    "research-plan",
    "Blog Planning",
    "Turn research evidence into a structured writing plan.",
  ],
  [
    "writing",
    "Section Writing",
    "Generate article sections from the approved plan.",
  ],
  ["merge", "Content Merge", "Assemble the generated sections into one draft."],
  [
    "image-plan",
    "Image Planning",
    "Determine whether supporting visuals are needed.",
  ],
  [
    "image-gen",
    "Image Generation",
    "Generate planned visuals for the article.",
  ],
  [
    "final-review",
    "Final Review",
    "Pause for your review of the completed draft.",
  ],
  ["final-blog", "Final Blog", "Finalize the approved article."],
] as const;

type StepState = "completed" | "running" | "waiting" | "failed" | "pending";

function stepState(index: number, run: RunDetail): StepState {
  const current = run.workflow_step
    ? STEPS.findIndex(([id]) => id === run.workflow_step)
    : -1;

  if (run.status === "completed") return "completed";

  if (run.status === "failed") {
    return current < 0
      ? index === 0
        ? "failed"
        : "pending"
      : index < current
        ? "completed"
        : index === current
          ? "failed"
          : "pending";
  }

  if (run.status === "interrupted") {
    return current < 0
      ? "pending"
      : index < current
        ? "completed"
        : index === current
          ? "waiting"
          : "pending";
  }

  if (current < 0) return index === 0 ? "running" : "pending";

  return index < current
    ? "completed"
    : index === current
      ? "running"
      : "pending";
}

function headerStatus(status: RunDetail["status"]) {
  if (status === "completed") {
    return [
      "Completed",
      "✓",
      "border-green-200 bg-green-50 text-green-700",
    ] as const;
  }

  if (status === "failed") {
    return ["Failed", "×", "border-red-200 bg-red-50 text-red-700"] as const;
  }

  if (status === "interrupted") {
    return [
      "Waiting for review",
      "Ⅱ",
      "border-amber-200 bg-amber-50 text-amber-700",
    ] as const;
  }

  if (status === "running") {
    return [
      "Running",
      "●",
      "border-indigo-200 bg-indigo-50 text-indigo-700",
    ] as const;
  }

  return [
    "Pending",
    "○",
    "border-slate-200 bg-slate-50 text-slate-600",
  ] as const;
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
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    let alive = true;

    const poll = () =>
      api
        .getRun(runId)
        .then((data) => alive && setRun(data))
        .catch(
          (e) =>
            alive &&
            setError(
              e instanceof Error ? e.message : "Unable to load workflow.",
            ),
        );

    poll();

    const timer = window.setInterval(poll, 1500);

    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [runId]);

  // Resume a failed workflow from its persisted LangGraph checkpoint.
  const handleRetry = async () => {
    if (!run || retrying) return;

    setRetrying(true);
    setError("");

    try {
      await api.retryRun(run.id);

      // Immediately reflect the resumed state in the UI while
      // the existing polling continues to fetch the real backend state.
      setRun((current) =>
        current
          ? {
              ...current,
              status: "running",
              error_message: null,
            }
          : current,
      );
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to resume the generation.",
      );
    } finally {
      setRetrying(false);
    }
  };

  const statuses = useMemo(
    () => (run ? STEPS.map((_, index) => stepState(index, run)) : []),
    [run],
  );

  if (!run) {
    return (
      <div className="grid h-full place-items-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const completed =
    run.status === "completed"
      ? STEPS.length
      : statuses.filter((status) => status === "completed").length;

  const activeIndex = statuses.findIndex(
    (status) =>
      status === "running" || status === "waiting" || status === "failed",
  );

  const progress = Math.round((completed / STEPS.length) * 100);
  const [label, icon, className] = headerStatus(run.status);

  return (
    <div className="flex h-full flex-col bg-slate-100">
      <header className="border-b border-slate-300 bg-white px-4 py-4 shadow-sm sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Generation workflow
            </p>

            <h1 className="mt-1 text-sm font-bold text-slate-950">
              {run.status === "completed"
                ? "Blog generation complete"
                : run.status === "failed"
                  ? "Generation failed"
                  : "Generating your blog"}
            </h1>

            <p className="mt-1 truncate text-xs font-medium text-slate-600">
              {run.topic}
            </p>
          </div>

          <span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold ${className}`}
          >
            <span>{icon}</span>
            {label}
          </span>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          <span className="text-xs font-semibold text-slate-600">
            {progress}%
          </span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto max-w-3xl">
          {error && (
            <Alert variant="danger" className="mb-4">
              {error}
            </Alert>
          )}

          {run.error_message && (
            <Alert variant="danger" className="mb-4" title="Generation error">
              {run.error_message}
            </Alert>
          )}

          {run.guardrail_msg && (
            <Alert variant="warning" className="mb-4" title="Guardrail notice">
              {run.guardrail_msg}
            </Alert>
          )}

          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-950">
                Pipeline progress
              </h2>

              <p className="mt-1 text-xs font-medium text-slate-600">
                {activeIndex >= 0
                  ? `Step ${activeIndex + 1} of ${STEPS.length}`
                  : run.status === "completed"
                    ? "All workflow steps completed"
                    : "Preparing workflow"}
              </p>
            </div>

            <span className="text-xs font-semibold text-slate-500">
              {completed} / {STEPS.length} complete
            </span>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
            {STEPS.map(([id, stepLabel, description], index) => {
              const state = statuses[index];
              const isOutlineReview = id === "outline-review";
              const isFinalReview = id === "final-review";

              return (
                <div
                  key={id}
                  className={`flex items-start gap-4 border-b border-slate-200 p-4 last:border-b-0 sm:p-5 ${
                    state === "running"
                      ? "bg-indigo-50/60"
                      : state === "waiting"
                        ? "bg-amber-50/60"
                        : ""
                  }`}
                >
                  {/* Step icon */}
                  <div
                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                      state === "completed"
                        ? "bg-green-50 text-green-600"
                        : state === "running"
                          ? "bg-indigo-50 text-indigo-600"
                          : state === "waiting"
                            ? "bg-amber-50 text-amber-600"
                            : state === "failed"
                              ? "bg-red-50 text-red-600"
                              : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {state === "completed"
                      ? "✓"
                      : state === "failed"
                        ? "×"
                        : state === "running"
                          ? "•"
                          : state === "waiting"
                            ? "Ⅱ"
                            : "○"}
                  </div>

                  {/* Node content */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900">
                      {stepLabel}
                    </p>

                    <p className="mt-1 text-xs font-medium leading-5 text-slate-600">
                      {description}
                    </p>

                    {/* Desktop: action stays underneath the description. */}
                    {state === "waiting" && isOutlineReview && (
                      <div className="mt-3 hidden sm:block">
                        <Button
                          size="sm"
                          onClick={() =>
                            navigate({
                              section: "app",
                              page: "outline-review",
                            })
                          }
                        >
                          Review outline
                        </Button>
                      </div>
                    )}

                    {state === "waiting" &&
                      isFinalReview &&
                      run.interrupt_type === "final_draft_review" && (
                        <div className="mt-3 hidden sm:block">
                          <Button
                            size="sm"
                            onClick={() =>
                              navigate({
                                section: "app",
                                page: "blog-workspace",
                              })
                            }
                          >
                            Review draft
                          </Button>
                        </div>
                      )}

                    {!(
                      state === "waiting" &&
                      (isOutlineReview || isFinalReview)
                    ) && (
                      <p className="mt-1.5 text-xs font-semibold text-slate-500">
                        {state === "running"
                          ? "Running now"
                          : state === "waiting"
                            ? "Waiting for your review"
                            : state === "completed"
                              ? "Completed"
                              : state === "failed"
                                ? "Failed"
                                : "Pending"}
                      </p>
                    )}
                  </div>

                  {/* Right-side review controls.
                      On mobile the button sits directly underneath the badge.
                      On desktop only the badge remains here because the button
                      is displayed underneath the description above. */}
                  {state === "waiting" && (
                    <div className="flex shrink-0 flex-col items-end gap-2 self-start">
                      <Badge variant="warning">Review required</Badge>

                      {/* Mobile-only action */}
                      {isOutlineReview && (
                        <div className="sm:hidden">
                          <Button
                            size="sm"
                            onClick={() =>
                              navigate({
                                section: "app",
                                page: "outline-review",
                              })
                            }
                          >
                            Review outline
                          </Button>
                        </div>
                      )}

                      {isFinalReview &&
                        run.interrupt_type === "final_draft_review" && (
                          <div className="sm:hidden">
                            <Button
                              size="sm"
                              onClick={() =>
                                navigate({
                                  section: "app",
                                  page: "blog-workspace",
                                })
                              }
                            >
                              Review draft
                            </Button>
                          </div>
                        )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex justify-end gap-3">
            {/* Failure recovery action.
                This uses the persisted LangGraph checkpoint instead of
                creating a new blog run. */}
            {run.status === "failed" && (
              <Button
                loading={retrying}
                disabled={retrying}
                onClick={handleRetry}
              >
                Resume generation
              </Button>
            )}

            {run.status === "completed" && (
              <Button
                onClick={() =>
                  navigate({
                    section: "app",
                    page: "blog-workspace",
                  })
                }
              >
                Open blog
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
