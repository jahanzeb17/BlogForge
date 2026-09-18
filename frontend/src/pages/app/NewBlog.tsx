import { useState } from "react";
import type { NavFn } from "../../types";
import { Alert, Button, Select } from "../../components/ui";
import { api } from "../../services/api";

interface NewBlogPageProps { navigate?: NavFn; startRun: (id: string) => void; }

const audienceOptions = [
  { value: "", label: "Let AI decide" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];
const toneOptions = [
  { value: "", label: "Let AI decide" },
  { value: "professional", label: "Professional" },
  { value: "educational", label: "Educational" },
  { value: "technical", label: "Technical" },
  { value: "conversational", label: "Conversational" },
];
const typeOptions = [
  { value: "explainer", label: "Explainer" },
  { value: "tutorial", label: "Tutorial" },
  { value: "comparison", label: "Comparison" },
  { value: "system_design", label: "System Design" },
  { value: "news_roundup", label: "News Roundup" },
];
const suggestions = [
  "How does Retrieval-Augmented Generation work in production?",
  "Kubernetes observability with OpenTelemetry: a complete guide",
  "Building type-safe REST APIs with TypeScript and Zod",
  "Service mesh architecture: when to use Istio vs Linkerd",
  "Zero-trust security for cloud-native Kubernetes workloads",
];

export default function NewBlogPage({ startRun }: NewBlogPageProps) {
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState("");
  const [blogType, setBlogType] = useState("explainer");
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().slice(0, 10));
  const [showConfig, setShowConfig] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setError("");
    try {
      const run = await api.createRun({
        topic: topic.trim(),
        audience_pref: audience || undefined,
        tone_pref: tone || undefined,
        blog_kind_pref: blogType,
        as_of: asOfDate,
      });
      startRun(run.run_id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to start blog generation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-slate-200 bg-white px-4 py-5 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">New generation</p>
          <h1 className="mt-1 text-lg font-semibold text-slate-950">Create a new technical blog</h1>
          <p className="mt-1 text-sm text-slate-500">Start with a topic. BlogForge will guide it through guardrails, research, writing, and review.</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          {error && <Alert variant="danger" className="mb-5">{error}</Alert>}

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="p-5 sm:p-6">
              <label htmlFor="blog-topic" className="block text-sm font-semibold text-slate-800">What should the blog cover?</label>
              <p className="mt-1 text-xs text-slate-500">Be specific about the technical problem, technology, or comparison you want researched.</p>
              <textarea
                id="blog-topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value.slice(0, 500))}
                placeholder="e.g. How does Retrieval-Augmented Generation work in production environments? Include architecture patterns, vector databases, and monitoring best practices."
                rows={6}
                autoFocus
                maxLength={500}
                className="mt-4 w-full resize-none rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <div className="mt-2 flex items-center justify-between gap-3">
                <span className="text-xs text-slate-400">{topic.length} / 500 characters</span>
                <button type="button" onClick={() => setShowConfig((value) => !value)} className="rounded text-xs font-medium text-slate-500 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  {showConfig ? "Hide generation options" : "Show generation options"}
                </button>
              </div>
            </div>

            {showConfig && (
              <div className="border-t border-slate-200 bg-slate-50 px-5 py-5 sm:px-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Select id="audience" label="Audience" value={audience} onChange={setAudience} options={audienceOptions} />
                  <Select id="tone" label="Tone" value={tone} onChange={setTone} options={toneOptions} />
                  <Select id="blog-type" label="Blog type" value={blogType} onChange={setBlogType} options={typeOptions} />
                  <div className="flex flex-col gap-1">
                    <label htmlFor="as-of-date" className="text-sm font-medium text-slate-700">As-of date</label>
                    <input id="as-of-date" type="date" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                    <p className="text-xs text-slate-500">Use this when the article should reflect information up to a specific date.</p>
                  </div>
                </div>
              </div>
            )}

            <div className="border-t border-slate-200 p-5 sm:p-6">
              <Button size="lg" fullWidth loading={loading} disabled={!topic.trim()} onClick={handleGenerate}>Generate blog</Button>
            </div>
          </section>

          <section className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Topic suggestions</p>
            <div className="mt-3 grid gap-2">
              {suggestions.map((suggestion) => (
                <button key={suggestion} type="button" onClick={() => setTopic(suggestion)} className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-600 shadow-sm transition hover:border-indigo-300 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  {suggestion}
                </button>
              ))}
            </div>
          </section>

          <div className="mt-6 rounded-xl border border-indigo-100 bg-indigo-50 p-4">
            <p className="text-sm font-semibold text-indigo-900">What happens next?</p>
            <p className="mt-1 text-sm leading-6 text-indigo-700">BlogForge validates the topic, prepares a research outline for your approval, gathers evidence, writes the article, and pauses for final review before completion.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
