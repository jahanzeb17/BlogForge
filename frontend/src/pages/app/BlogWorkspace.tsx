import { useEffect, useState } from "react";
import type { NavFn } from "../../types";
import { api, type RunDetail } from "../../services/api";
import {
  Tabs,
  Badge,
  Button,
  Modal,
  LoadingSpinner,
  Alert,
} from "../../components/ui";
import MarkdownRenderer from "../../components/MarkdownRenderer";
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
  const [error, setError] = useState("");
  useEffect(() => {
    api
      .getRun(runId)
      .then(setRun)
      .catch((e) => setError(e.message));
  }, [runId]);
  if (!run)
    return (
      <div className="h-full grid place-items-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  const md = run.final_markdown || "";
  const plan = run.plan || {};
  const evidence = run.evidence || [];
  const approve = async (action: "approve" | "revise") => {
    setLoading(true);
    try {
      await api.resumeRun(runId, {
        action,
        instructions: action === "revise" ? instructions.trim() : undefined,
      });
      setRevision(false);
      navigate({ section: "app", page: "workflow" });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="h-full flex flex-col">
      {error && (
        <div className="p-4">
          <Alert variant="danger">{error}</Alert>
        </div>
      )}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-base font-semibold truncate">
              {plan.blog_title || run.topic}
            </h1>
            <p className="font-mono text-xs text-slate-400 mt-1">{run.id}</p>
          </div>
          {run.interrupt_type === "final_draft_review" && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRevision(true)}
              >
                Request Revision
              </Button>
              <Button
                size="sm"
                loading={loading}
                onClick={() => approve("approve")}
              >
                Approve Blog
              </Button>
            </div>
          )}
          {run.status === "completed" && (
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => api.export("pdf", md, plan.blog_title || "Blog")}
              >
                Export PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  api.export("docx", md, plan.blog_title || "Blog")
                }
              >
                Export DOCX
              </Button>
            </div>
          )}
        </div>
      </div>
      <div className="bg-white border-b border-slate-200 px-6">
        <Tabs
          tabs={[
            { id: "draft", label: "Draft" },
            { id: "plan", label: "Plan" },
            { id: "evidence", label: "Evidence", count: evidence.length },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8">
          {tab === "draft" && (
            <article className="bg-white border border-slate-200 rounded-xl p-6 sm:p-10">
              {md ? (
                <MarkdownRenderer markdown={md} runId={run.id} />
              ) : (
                <p className="text-sm text-slate-500">
                  Draft is not available yet.
                </p>
              )}
            </article>
          )}
          {tab === "plan" && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <h2 className="font-semibold text-sm">Blog Plan</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                  {[
                    ["Audience", plan.audience],
                    ["Tone", plan.tone],
                    ["Type", plan.blog_kind],
                    ["Sections", plan.tasks?.length || 0],
                  ].map(([a, b]) => (
                    <div key={String(a)}>
                      <p className="text-xs text-slate-400 uppercase">{a}</p>
                      <p className="text-sm mt-1">{String(b || "—")}</p>
                    </div>
                  ))}
                </div>
              </div>
              {(plan.tasks || []).map((t: any, i: number) => (
                <div
                  key={i}
                  className="bg-white border border-slate-200 rounded-xl p-5"
                >
                  <div className="flex gap-3">
                    <Badge variant="purple">{i + 1}</Badge>
                    <div>
                      <h3 className="text-sm font-semibold">{t.title}</h3>
                      <p className="text-xs text-slate-600 mt-2">{t.goal}</p>
                      {t.bullets?.length && (
                        <ul className="mt-2 text-xs text-slate-500 list-disc ml-4">
                          {t.bullets.map((b: string, j: number) => (
                            <li key={j}>{b}</li>
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
                <p className="text-sm text-slate-500">
                  No evidence has been stored yet.
                </p>
              ) : (
                evidence.map((e: any, i) => (
                  <div
                    key={i}
                    className="bg-white border border-slate-200 rounded-xl p-5"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="cyan">Source</Badge>
                      {e.published_at && (
                        <span className="text-xs text-slate-400">
                          {e.published_at}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold">
                      {e.title || e.url}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {e.source || "Technical source"}
                    </p>
                    {e.snippet && (
                      <p className="text-xs text-slate-600 mt-3">{e.snippet}</p>
                    )}
                    <a
                      className="text-xs font-mono text-indigo-600 break-all block mt-3"
                      href={e.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {e.url}
                    </a>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
      <Modal
        open={revision}
        onClose={() => setRevision(false)}
        title="Request a targeted revision"
      >
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={5}
          placeholder="Describe the specific section or change you want..."
          className="w-full border border-slate-300 rounded-lg p-3 text-sm"
        />
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setRevision(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => approve("revise")}
            loading={loading}
            disabled={!instructions.trim()}
          >
            Submit Revision
          </Button>
        </div>
      </Modal>
    </div>
  );
}
