import { useEffect, useState } from "react";
import type { NavFn } from "../../types";
import {
  Button,
  StatusBadge,
  EmptyState,
  LoadingSpinner,
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
  useEffect(() => {
    api
      .getRuns()
      .then(setRuns)
      .finally(() => setLoading(false));
  }, []);
  if (loading)
    return (
      <div className="h-full grid place-items-center">
        <LoadingSpinner />
      </div>
    );
  return (
    <div className="h-full flex flex-col">
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <h1 className="text-lg font-semibold">My Blogs</h1>
        <p className="text-sm text-slate-500">
          Your real BlogForge runs and generated content.
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 sm:p-8">
        <div className="max-w-4xl mx-auto space-y-3">
          {runs.length === 0 ? (
            <EmptyState
              title="No blogs yet"
              description="Create your first research-backed technical blog."
              action={
                <Button
                  onClick={() => navigate({ section: "app", page: "new-blog" })}
                >
                  Create Blog
                </Button>
              }
            />
          ) : (
            runs.map((r) => (
              <button
                key={r.id}
                onClick={() => {
                  setRunId(r.id);
                  navigate({
                    section: "app",
                    page:
                      r.status === "interrupted"
                        ? "outline-review"
                        : r.status === "completed"
                          ? "blog-workspace"
                          : "workflow",
                  });
                }}
                className="w-full text-left bg-white border border-slate-200 rounded-xl p-5 hover:border-indigo-300"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="text-sm font-semibold text-slate-800">
                      {r.topic}
                    </h2>
                    <p className="font-mono text-xs text-slate-400 mt-2">
                      {r.id}
                    </p>
                  </div>
                  <StatusBadge
                    status={
                      (r.status === "interrupted" ? "waiting" : r.status) as any
                    }
                  />
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
