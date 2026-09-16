import { useEffect, useState } from "react";
import type { NavFn } from "../../types";
import {
  Button,
  StatusBadge,
  EmptyState,
  LoadingSpinner,
} from "../../components/ui";
import {
  api,
  type RunSummary,
} from "../../services/api";

export default function MyBlogsPage({
  navigate,
  setRunId,
}: {
  navigate: NavFn;
  setRunId: (id: string) => void;
}) {
  const [runs, setRuns] =
    useState<RunSummary[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [deleteId, setDeleteId] =
    useState<string | null>(null);

  const [deleting, setDeleting] =
    useState(false);

  useEffect(() => {
    api
      .getRuns()
      .then(setRuns)
      .catch((e) =>
        setError(
          e.message ||
            "Unable to load your blogs."
        )
      )
      .finally(() =>
        setLoading(false)
      );
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      setDeleting(true);
      setError("");

      await api.deleteRun(deleteId);

      setRuns((currentRuns) =>
        currentRuns.filter(
          (run) => run.id !== deleteId
        )
      );

      setDeleteId(null);
    } catch (e: any) {
      setError(
        e.message ||
          "Unable to delete the blog."
      );
    } finally {
      setDeleting(false);
    }
  };

  const getRunDescription = (
    status: RunSummary["status"]
  ) => {
    switch (status) {
      case "completed":
        return "Blog generation completed";

      case "interrupted":
        return "Waiting for your review";

      case "failed":
        return "Blog generation failed";

      case "running":
        return "Blog is being generated";

      case "pending":
      default:
        return "Waiting to start";
    }
  };

  if (loading) {
    return (
      <div className="h-full grid place-items-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <h1 className="text-lg font-semibold">
          My Blogs
        </h1>

        <p className="text-sm text-slate-500">
          Your real BlogForge runs and generated content.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-8">
        <div className="max-w-4xl mx-auto space-y-3">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
              {error}
            </div>
          )}

          {runs.length === 0 ? (
            <EmptyState
              title="No blogs yet"
              description="Create your first research-backed technical blog."
              action={
                <Button
                  onClick={() =>
                    navigate({
                      section: "app",
                      page: "new-blog",
                    })
                  }
                >
                  Create Blog
                </Button>
              }
            />
          ) : (
            runs.map((r) => (
              <div
                key={r.id}
                className="w-full bg-white border border-slate-200 rounded-xl p-5 hover:border-indigo-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <button
                    onClick={() => {
                      setRunId(r.id);

                      navigate({
                        section: "app",
                        page:
                          r.interrupt_type ===
                          "research_plan_review"
                            ? "outline-review"
                            : r.interrupt_type ===
                                "final_draft_review" ||
                              r.status === "completed"
                              ? "blog-workspace"
                              : "workflow",
                      });
                    }}
                    className="flex-1 min-w-0 text-left"
                  >
                    <h2 className="text-sm font-semibold text-slate-800">
                      {r.topic}
                    </h2>

                    <p className="text-xs text-slate-500 mt-2">
                      {getRunDescription(
                        r.status
                      )}
                    </p>
                  </button>

                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge
                      status={
                        (r.status ===
                        "interrupted"
                          ? "waiting"
                          : r.status) as any
                      }
                    />

                    <Button
                      variant="secondary"
                      onClick={() =>
                        setDeleteId(r.id)
                      }
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {deleteId && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-800">
              Delete blog?
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Are you sure you want to delete this blog?
              This action cannot be undone.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() =>
                  setDeleteId(null)
                }
                disabled={deleting}
              >
                Cancel
              </Button>

              <Button
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting
                  ? "Deleting..."
                  : "Delete Blog"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
