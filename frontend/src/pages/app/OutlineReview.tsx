import { useEffect, useState } from "react";
import type { NavFn } from "../../types";
import { Alert, Button, LoadingSpinner } from "../../components/ui";
import { api, type RunDetail } from "../../services/api";

export default function OutlineReviewPage({
  navigate,
  runId,
}: {
  navigate: NavFn;
  runId: string;
}) {
  const [run, setRun] = useState<RunDetail | null>(null);
  const [queries, setQueries] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  useEffect(() => {
    api
      .getRun(runId)
      .then((data) => {
        setRun(data);
        setQueries(
          Array.isArray(data.interrupt_data?.queries)
            ? data.interrupt_data.queries.slice(0, 4)
            : [],
        );
      })
      .catch((e) =>
        setError(
          e instanceof Error ? e.message : "Unable to load the outline.",
        ),
      );
  }, [runId]);

  if (!run)
    return (
      <div className="grid h-full place-items-center">
        <LoadingSpinner size="lg" />
      </div>
    );

  const cleanQueries = queries
    .map((query) => query.trim())
    .filter(Boolean)
    .slice(0, 4);
  const originalQueries = Array.isArray(run.interrupt_data?.queries)
    ? run.interrupt_data.queries
    : [];
  const changed =
    cleanQueries.length !== originalQueries.length ||
    cleanQueries.some((query, index) => query !== originalQueries[index]);

  const submit = async (action: "approve" | "edit" | "skip_research") => {
    setLoading(true);
    setError("");
    try {
      await api.resumeRun(
        runId,
        action === "skip_research"
          ? { action }
          : { action, queries: cleanQueries },
      );
      navigate({ section: "app", page: "workflow" });
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to continue the workflow.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-slate-100">
      <header className="border-b border-slate-300 bg-white px-4 py-5 shadow-sm sm:px-6">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
            Human review
          </p>
          <h1 className="mt-1 text-lg font-bold text-slate-950">
            Review research outline
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-600">
            Confirm or refine the research subtopics before BlogForge starts web
            research.
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 sm:p-8">
        <div className="mx-auto max-w-3xl">
          {error && (
            <Alert variant="danger" className="mb-5">
              {error}
            </Alert>
          )}
          {run.guardrail_msg && (
            <Alert variant="warning" className="mb-5">
              {run.guardrail_msg}
            </Alert>
          )}

          <div className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Topic
            </p>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-900">
              {run.topic}
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-950">
                Research subtopics
              </h2>
              <p className="mt-1 text-xs font-medium text-slate-600">
                Add up to four focused questions for the research stage.
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-600">
              {cleanQueries.length} / 4 active
            </span>
          </div>

          <div className="mt-3 space-y-3">
            {queries.map((query, index) => {
              const isEditing = editingIndex === index;

              return (
                <div
                  key={`${index}-${query}`}
                  className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    {/* Each numbered point now acts as the visual anchor for its own editing controls. */}
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-700 ring-1 ring-indigo-100">
                      {index + 1}
                    </span>

                    <div className="min-w-0 flex-1">
                      {isEditing ? (
                        <input
                          autoFocus
                          aria-label={`Research subtopic ${index + 1}`}
                          value={query}
                          onChange={(e) =>
                            setQueries((current) =>
                              current.map((item, i) =>
                                i === index ? e.target.value : item,
                              ),
                            )
                          }
                          className="w-full rounded-md border border-indigo-400 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      ) : (
                        <p className="min-h-9 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium leading-5 text-slate-800">
                          {query || "Empty research subtopic"}
                        </p>
                      )}
                    </div>

                    {/* Edit/Save is kept directly on the same node instead of being detached from it. */}
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          setEditingIndex(isEditing ? null : index)
                        }
                        className={`rounded-md px-2.5 py-2 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          isEditing
                            ? "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                            : "text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
                        }`}
                      >
                        {isEditing ? "Save" : "Edit"}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingIndex(null);
                          setQueries((current) =>
                            current.filter((_, i) => i !== index),
                          );
                        }}
                        className="rounded-md px-2.5 py-2 text-xs font-semibold text-slate-500 transition hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            <button
              type="button"
              disabled={queries.length >= 4}
              onClick={() => setQueries((current) => [...current, ""])}
              className="w-full rounded-xl border border-dashed border-slate-300 bg-white py-3 text-sm font-semibold text-slate-600 transition hover:border-indigo-300 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              + Add research subtopic
            </button>
          </div>

          <div className="mt-8 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              disabled={loading}
              onClick={() => navigate({ section: "app", page: "workflow" })}
            >
              Back
            </Button>

            <Button
              variant="outline"
              loading={loading}
              onClick={() => submit("skip_research")}
            >
              Skip research
            </Button>

            <Button
              loading={loading}
              disabled={cleanQueries.length === 0}
              onClick={() => submit(changed ? "edit" : "approve")}
            >
              {changed ? "Save & start research" : "Approve & start research"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
