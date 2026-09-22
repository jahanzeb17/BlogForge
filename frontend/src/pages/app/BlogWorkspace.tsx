import { useEffect, useState } from "react";
import type { NavFn } from "../../types";
import {
  Alert,
  Badge,
  Button,
  LoadingSpinner,
  Modal,
  Tabs,
} from "../../components/ui";
import MarkdownRenderer from "../../components/MarkdownRenderer";
import {
  api,
  type EvidenceItem,
  type PlanTask,
  type RunDetail,
} from "../../services/api";

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export default function BlogWorkspacePage({
  navigate,
  runId,
}: {
  navigate: NavFn;
  runId: string;
}) {
  const [run, setRun] = useState<RunDetail | null>(null);
  const [tab, setTab] = useState("draft");
  const [revision, setRevision] = useState(false);
  const [instructions, setInstructions] = useState("");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState<"pdf" | "docx" | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getRun(runId)
      .then(setRun)
      .catch((e) =>
        setError(
          e instanceof Error ? e.message : "Unable to load the blog workspace.",
        ),
      );
  }, [runId]);

  if (!run)
    return (
      <div className="grid h-full place-items-center">
        <LoadingSpinner size="lg" />
      </div>
    );

  const markdown = run.final_markdown || "";
  const plan = run.plan ?? {};
  const evidence = run.evidence ?? [];

  const approve = async (action: "approve" | "revise") => {
    setLoading(true);
    setError("");
    try {
      await api.resumeRun(runId, {
        action,
        instructions: action === "revise" ? instructions.trim() : undefined,
      });
      setRevision(false);
      setInstructions("");
      navigate({ section: "app", page: "workflow" });
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to continue the workflow.",
      );
    } finally {
      setLoading(false);
    }
  };

  const exportBlog = async (format: "pdf" | "docx") => {
    setExporting(format);
    setError("");
    try {
      await api.export(format, markdown, plan.blog_title || run.topic);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : `Unable to export the blog as ${format.toUpperCase()}.`,
      );
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="flex h-full flex-col bg-slate-100">
      <div className="flex-1 overflow-y-auto">
        {error && (
          <div className="border-b border-slate-300 bg-slate-100 p-4">
            <div className="mx-auto max-w-5xl">
              <Alert variant="danger">{error}</Alert>
            </div>
          </div>
        )}

        <header className="border-b border-slate-300 bg-white px-4 py-4 shadow-sm sm:px-6">
          <div className="mx-auto flex max-w-5xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Blog workspace
              </p>
              <h1 className="mt-1 truncate text-base font-bold text-slate-950">
                {plan.blog_title || run.topic}
              </h1>
              <p className="mt-1 text-xs font-medium text-slate-600">
                Review the draft, inspect the plan and evidence, then approve or
                request a revision.
              </p>
            </div>

            {run.interrupt_type === "final_draft_review" && (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRevision(true)}
                  disabled={loading}
                >
                  Request revision
                </Button>
                <Button
                  size="sm"
                  loading={loading}
                  onClick={() => approve("approve")}
                >
                  Approve blog
                </Button>
              </div>
            )}

            {run.status === "completed" && (
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  loading={exporting === "pdf"}
                  disabled={Boolean(exporting)}
                  onClick={() => exportBlog("pdf")}
                >
                  Export PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  loading={exporting === "docx"}
                  disabled={Boolean(exporting)}
                  onClick={() => exportBlog("docx")}
                >
                  Export DOCX
                </Button>
              </div>
            )}
          </div>
        </header>

        {/* UI visibility: stronger tab container separation from the workspace background. */}
        <div className="border-b border-slate-300 bg-white px-4 shadow-sm sm:px-6">
          <div className="mx-auto max-w-5xl overflow-x-auto">
            <Tabs
              tabs={[
                { id: "draft", label: "Draft" },
                { id: "plan", label: "Plan", count: plan.tasks?.length ?? 0 },
                { id: "evidence", label: "Evidence", count: evidence.length },
              ]}
              active={tab}
              onChange={setTab}
            />
          </div>
        </div>

        <div>
          <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
            {tab === "draft" && (
              <article className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm sm:p-10">
                <div className="mb-7 border-b border-slate-200 pb-5">
                  <Badge variant="success" dot>
                    {run.status === "completed"
                      ? "Approved blog"
                      : "Draft for review"}
                  </Badge>
                </div>

                {markdown ? (
                  <MarkdownRenderer markdown={markdown} runId={run.id} />
                ) : (
                  <p className="text-sm font-medium text-slate-600">
                    Draft is not available yet.
                  </p>
                )}
              </article>
            )}

            {tab === "plan" && (
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm">
                  <h2 className="text-sm font-bold text-slate-950">Blog plan</h2>

                  <div className="mt-4 grid gap-4 sm:grid-cols-4">
                    {[
                      ["Audience", plan.audience],
                      ["Tone", plan.tone],
                      ["Type", plan.blog_kind],
                      ["Sections", plan.tasks?.length ?? 0],
                    ].map(([label, value]) => (
                      <div
                        key={String(label)}
                        className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                      >
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          {label}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {String(value || "—")}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {(plan.tasks ?? []).map((task: PlanTask, index) => (
                  <div
                    key={`${task.title ?? "section"}-${index}`}
                    className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <Badge variant="purple">{index + 1}</Badge>

                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-slate-950">
                          {task.title || `Section ${index + 1}`}
                        </h3>

                        {task.goal && (
                          <p className="mt-2 text-sm leading-6 text-slate-700">
                            {task.goal}
                          </p>
                        )}

                        {Array.isArray(task.bullets) &&
                          task.bullets.length > 0 && (
                            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-600">
                              {task.bullets.map((bullet, bulletIndex) => (
                                <li key={bulletIndex}>{bullet}</li>
                              ))}
                            </ul>
                          )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === "evidence" && (
              <div className="space-y-3">
                {evidence.length === 0 ? (
                  <div className="rounded-xl border border-slate-300 bg-white p-8 text-center text-sm font-medium text-slate-600 shadow-sm">
                    No evidence has been stored yet.
                  </div>
                ) : (
                  evidence.map((item: EvidenceItem, index) => (
                    <div
                      key={`${item.url ?? item.title ?? "source"}-${index}`}
                      className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="cyan">Source</Badge>

                        {item.published_at && (
                          <span className="text-xs font-medium text-slate-500">
                            {formatDate(item.published_at)}
                          </span>
                        )}
                      </div>

                      <h3 className="mt-3 text-sm font-bold text-slate-950">
                        {item.title || item.url || "Technical source"}
                      </h3>

                      <p className="mt-1 text-xs font-semibold text-slate-600">
                        {item.source || "Technical source"}
                      </p>

                      {item.snippet && (
                        <p className="mt-3 text-sm leading-6 text-slate-700">
                          {item.snippet}
                        </p>
                      )}

                      {item.url && (
                        <a
                          className="mt-3 inline-flex max-w-full break-all text-xs font-semibold text-indigo-600 hover:underline focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View source →
                        </a>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        open={revision}
        onClose={() => !loading && setRevision(false)}
        title="Request a targeted revision"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              disabled={loading}
              onClick={() => setRevision(false)}
            >
              Cancel
            </Button>
            <Button
              loading={loading}
              disabled={!instructions.trim()}
              onClick={() => approve("revise")}
            >
              Submit revision
            </Button>
          </div>
        }
      >
        <label
          htmlFor="revision-instructions"
          className="text-sm font-semibold text-slate-800"
        >
          Revision instructions
        </label>

        <textarea
          id="revision-instructions"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value.slice(0, 2000))}
          rows={6}
          maxLength={2000}
          placeholder="Describe the specific section or change you want..."
          className="mt-2 w-full resize-none rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />

        <p className="mt-1 text-right text-xs font-medium text-slate-500">
          {instructions.length} / 2000
        </p>
      </Modal>
    </div>
  );
}
