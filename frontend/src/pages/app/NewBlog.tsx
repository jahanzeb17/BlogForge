import { useState } from "react";
import { type NavFn } from "../../types";
import { Button, Select, Alert } from "../../components/ui";
import { api } from "../../services/api";

interface NewBlogPageProps {
  navigate: NavFn;
  startRun: (id: string) => void;
}
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
  const [asOfDate, setAsOfDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [showConfig, setShowConfig] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setError("");
    try {
      const r = await api.createRun({
        topic: topic.trim(),
        audience_pref: audience || undefined,
        tone_pref: tone || undefined,
        blog_kind_pref: blogType,
        as_of: asOfDate,
      });
      startRun(r.run_id);
    } catch (e: any) {
      setError(e.message || "Unable to start blog generation.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="h-full flex flex-col">
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <h1 className="text-lg font-semibold text-slate-900">
          Create a New Technical Blog
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Enter a topic and let BlogForge handle the research, writing, and
          review.
        </p>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-8 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {error && (
            <div className="mb-4">
              <Alert variant="danger">{error}</Alert>
            </div>
          )}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                What technical topic do you want to write about?
              </label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value.slice(0, 500))}
                placeholder="e.g. How does Retrieval-Augmented Generation work in production environments? Include architecture patterns, vector databases, and monitoring best practices."
                rows={5}
                autoFocus
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-slate-400">
                  {topic.length} / 500
                </span>
                <button
                  onClick={() => setShowConfig(!showConfig)}
                  className="text-xs text-slate-500 hover:text-slate-700"
                >
                  {showConfig ? "Hide options" : "Generation options"}
                </button>
              </div>
            </div>
            {showConfig && (
              <div className="border-t border-slate-200 bg-slate-50 px-6 py-5">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <Select
                    label="Audience"
                    value={audience}
                    onChange={setAudience}
                    options={audienceOptions}
                  />
                  <Select
                    label="Tone"
                    value={tone}
                    onChange={setTone}
                    options={toneOptions}
                  />
                  <Select
                    label="Blog Type"
                    value={blogType}
                    onChange={setBlogType}
                    options={typeOptions}
                  />
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-slate-700">
                      As-of Date
                    </label>
                    <input
                      type="date"
                      value={asOfDate}
                      onChange={(e) => setAsOfDate(e.target.value)}
                      className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}
            <div className="px-6 pb-6 mt-2">
              <Button
                size="lg"
                fullWidth
                onClick={handleGenerate}
                loading={loading}
                disabled={!topic.trim()}
              >
                Generate Blog
              </Button>
            </div>
          </div>
          <div className="mt-6">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
              Topic suggestions
            </p>
            <div className="flex flex-col gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => setTopic(s)}
                  className="text-left px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:border-indigo-300 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-6 bg-indigo-50 border border-indigo-100 rounded-lg p-4 text-sm text-indigo-700">
            BlogForge will validate the topic, generate an outline for your
            approval, research live sources, write the sections in parallel, and
            pause again for final review.
          </div>
        </div>
      </div>
    </div>
  );
}
