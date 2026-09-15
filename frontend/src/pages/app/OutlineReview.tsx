import { useEffect, useState } from "react";
import type { NavFn } from "../../types";
import { Button, Alert, LoadingSpinner } from "../../components/ui";
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
  useEffect(() => {
    api
      .getRun(runId)
      .then((r) => {
        setRun(r);
        setQueries(Array.isArray(r.interrupt_data?.queries) ? r.interrupt_data.queries.slice(0, 4) : []);
      })
      .catch((e) => setError(e.message));
  }, [runId]);
  if (!run)
    return (
      <div className="h-full grid place-items-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  const submit = async (action: "approve" | "edit" | "skip_research") => {
    setLoading(true);
    setError("");
    try {
      await api.resumeRun(runId, action === "skip_research" ? { action } : { action, queries: queries.map((q) => q.trim()).filter(Boolean).slice(0, 4) });
      navigate({ section: "app", page: "workflow" });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="h-full flex flex-col">
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <h1 className="text-lg font-semibold">Review Research Outline</h1>
        <p className="text-sm text-slate-500 mt-1">
          Edit the research subtopics before BlogForge starts web research.
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 sm:p-8">
        <div className="max-w-3xl mx-auto">
          {error && (
            <div className="mb-4">
              <Alert variant="danger">{error}</Alert>
            </div>
          )}
          {run.guardrail_msg && (
            <div className="mb-4">
              <Alert variant="warning">{run.guardrail_msg}</Alert>
            </div>
          )}
          <div className="bg-white border border-slate-200 rounded-xl p-5 mb-5">
            <p className="text-xs uppercase tracking-wider text-slate-400">
              Topic
            </p>
            <p className="text-sm font-medium text-slate-800 mt-1">
              {run.topic}
            </p>
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-400">{queries.filter((q) => q.trim()).length} / 4 subtopics</span>
            <span className="text-xs text-slate-400">Empty entries are removed before submission</span>
          </div>
          <div className="space-y-3">
            {queries.map((q, i) => (
              <div
                key={i}
                className="bg-white border border-slate-200 rounded-xl p-4"
              >
                <div className="flex gap-3">
                  <span className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </span>
                  <input
                    value={q}
                    onChange={(e) =>
                      setQueries((a) =>
                        a.map((x, j) => (j === i ? e.target.value : x)),
                      )
                    }
                    className="flex-1 border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={() =>
                      setQueries((a) => a.filter((_, j) => j !== i))
                    }
                    className="text-xs text-slate-400 hover:text-red-500"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            <button
              disabled={queries.length >= 4}
              onClick={() => setQueries((a) => [...a, ""])}
              className="w-full py-3 border border-dashed border-slate-300 rounded-xl text-sm text-slate-500 hover:border-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              + Add research subtopic
            </button>
          </div>
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => navigate({ section: "app", page: "workflow" })}
            >
              Back
            </Button>
            <Button
              variant="outline"
              onClick={() => submit("skip_research")}
              loading={loading}
            >
              Skip Research
            </Button>
            <Button
              onClick={() =>
                submit(
                  queries.some((q, i) => q !== run.interrupt_data?.queries?.[i])
                    ? "edit"
                    : "approve",
                )
              }
              loading={loading}
              disabled={queries.filter((q) => q.trim()).length === 0 || queries.filter((q) => q.trim()).length > 4}
            >
              Approve & Start Research
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
