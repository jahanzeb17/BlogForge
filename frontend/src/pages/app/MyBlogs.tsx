import { useEffect, useState } from "react";
import type { NavFn } from "../../types";
import { routeForRun, toUiStatus } from "../../types";
import {
  Alert,
  Button,
  EmptyState,
  LoadingSpinner,
  Modal,
  StatusBadge,
} from "../../components/ui";
import { api, type RunSummary } from "../../services/api";

export default function MyBlogsPage({
  navigate,
  setRunId,
}: {
  navigate: NavFn;
  setRunId: (id: string) => void;
}) {
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  useEffect(() => {
    api
      .getRuns()
      .then(setRuns)
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Unable to load your blogs."),
      )
      .finally(() => setLoading(false));
  }, []);

  const selectedRun = runs.find((run) => run.id === deleteId);

  const handleDelete = async () => {
    if (!deleteId) return;

    setDeleting(true);
    setError("");

    try {
      await api.deleteRun(deleteId);
      setRuns((current) => current.filter((run) => run.id !== deleteId));
      setDeleteId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to delete the blog.");
    } finally {
      setDeleting(false);
    }
  };

  const handleRetry = async (run: RunSummary) => {
    setRetryingId(run.id);
    setError("");

    try {
      await api.retryRun(run.id);

      // Keep the selected run in the workflow page so its existing
      // polling can show the recovered generation progress.
      setRunId(run.id);
      navigate({ section: "app", page: "workflow" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to resume the blog.");
    } finally {
      setRetryingId(null);
    }
  };

  if (loading)
    return (
      <div className="grid h-full place-items-center">
        <LoadingSpinner size="lg" />
      </div>
    );

  return (
    <div className="flex h-full flex-col bg-slate-100">
      {/* UI visibility: stronger header contrast and clearer separation from the content area. */}
      <header className="border-b border-slate-300 bg-white px-4 py-5 shadow-sm sm:px-6">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
            Your workspace
          </p>
          <h1 className="mt-1 text-lg font-bold text-slate-950">My Blogs</h1>
          <p className="mt-1 text-sm font-medium text-slate-600">
            Open previous runs, continue reviews, or remove a blog from your
            workspace.
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 sm:p-8">
        <div className="mx-auto max-w-4xl">
          {error && (
            <Alert variant="danger" className="mb-5">
              {error}
            </Alert>
          )}

          {runs.length === 0 ? (
            <div className="rounded-xl border border-slate-300 bg-white shadow-sm">
              <EmptyState
                title="No blogs yet"
                description="Create your first research-backed technical blog to see it here."
                action={
                  <Button
                    onClick={() =>
                      navigate({ section: "app", page: "new-blog" })
                    }
                  >
                    Create blog
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="space-y-3">
              {runs.map((run) => (
                <div
                  key={run.id}
                  className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm transition hover:border-indigo-300 hover:shadow-md sm:p-5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <button
                      type="button"
                      onClick={() => {
                        setRunId(run.id);
                        navigate(routeForRun(run));
                      }}
                      className="min-w-0 flex-1 rounded text-left focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <h2 className="truncate text-sm font-bold text-slate-950">
                        {run.topic}
                      </h2>

                      <p className="mt-1 text-xs font-medium text-slate-600">
                        {run.interrupt_type === "research_plan_review"
                          ? "Research outline is ready for your review"
                          : run.interrupt_type === "final_draft_review"
                            ? "Final draft is ready for your review"
                            : run.status === "completed"
                              ? "Blog generation completed"
                              : run.status === "failed"
                                ? "Blog generation failed"
                                : run.status === "running"
                                  ? "Blog is being generated"
                                  : "Waiting to start"}
                      </p>

                      <p className="mt-1 text-xs font-medium text-slate-500">
                        Updated{" "}
                        {run.updated_at
                          ? new Date(run.updated_at).toLocaleString()
                          : "—"}
                      </p>
                    </button>

                    <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
                      <StatusBadge status={toUiStatus(run.status)} />

                      {/* Failed runs can be retried from the existing
                          LangGraph checkpoint instead of starting a new run. */}
                      {run.status === "failed" && (
                        <Button
                          size="sm"
                          loading={retryingId === run.id}
                          disabled={retryingId !== null}
                          onClick={() => handleRetry(run)}
                        >
                          Resume
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        disabled={retryingId === run.id}
                        onClick={() => setDeleteId(run.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal
        open={Boolean(deleteId)}
        onClose={() => !deleting && setDeleteId(null)}
        title="Delete blog?"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              disabled={deleting}
              onClick={() => setDeleteId(null)}
            >
              Cancel
            </Button>
            <Button variant="danger" loading={deleting} onClick={handleDelete}>
              Delete blog
            </Button>
          </div>
        }
      >
        <p className="text-sm leading-6 text-slate-700">
          This will permanently remove{" "}
          {selectedRun ? (
            <strong className="text-slate-950">“{selectedRun.topic}”</strong>
          ) : (
            "this blog"
          )}{" "}
          and its stored run data. This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
