import { useState } from "react";
import { Button, Badge, BlogForgeLogo } from "../components/ui";

interface BlogsProps {
  onGetStarted?: () => void;
  onBackHome?: () => void;
}

const demoBlogs = [
  {
    category: "Artificial Intelligence",
    title: "Retrieval-Augmented Generation in Production",
    description:
      "A practical guide to designing reliable RAG systems, from document ingestion and retrieval strategies to grounding, evaluation, and production monitoring.",
    readTime: "8 min read",
    level: "Advanced",
    date: "September 2026",
    accent: "indigo",
    content:
      "Retrieval-Augmented Generation (RAG) connects a language model with a retrieval layer so responses can use external information. In production, quality depends on more than the model: document ingestion, chunking, retrieval strategy, source attribution, evaluation, and monitoring all matter. A reliable RAG pipeline therefore evaluates retrieval and generation separately and keeps important outputs grounded in traceable sources.",
  },
  {
    category: "Cloud & DevOps",
    title: "Designing Reliable Kubernetes Workloads",
    description:
      "Understand resilient Kubernetes deployments, including health checks, resource management, scaling, rollout strategies, and failure recovery.",
    readTime: "7 min read",
    level: "Intermediate",
    date: "September 2026",
    accent: "cyan",
    content:
      "Reliable Kubernetes workloads start with clear resource requests and limits, useful readiness and liveness probes, controlled rollouts, and sensible scaling. These mechanisms help a service survive failures without turning every deployment into a risky event. Observability is equally important because operators need to see whether a workload is healthy before deciding how to scale or recover it.",
  },
  {
    category: "Software Architecture",
    title: "Event-Driven Architecture: Concepts and Trade-offs",
    description:
      "Explore event-driven systems, message brokers, asynchronous communication, delivery guarantees, and architectural trade-offs.",
    readTime: "9 min read",
    level: "Advanced",
    date: "August 2026",
    accent: "violet",
    content:
      "Event-driven architecture allows services to communicate through events rather than depending on every operation being synchronous. This can reduce coupling and support scalable systems, but it introduces concerns such as retries, duplicate delivery, ordering, and eventual consistency. The right design depends on the business requirement and the delivery guarantees the system actually needs.",
  },
  {
    category: "Web Development",
    title: "Building Scalable APIs with FastAPI",
    description:
      "A technical walkthrough of validation, dependency injection, database sessions, authentication, and maintainable API boundaries.",
    readTime: "6 min read",
    level: "Intermediate",
    date: "August 2026",
    accent: "green",
    content:
      "FastAPI provides a clean foundation for typed Python APIs. Request validation keeps data contracts explicit, dependency injection helps share authentication and database logic, and clear route boundaries make services easier to maintain. As an API grows, consistent error handling, authentication, database session management, and observability become just as important as the endpoints themselves.",
  },
  {
    category: "Databases",
    title: "PostgreSQL Indexing: What Actually Matters",
    description:
      "Learn how PostgreSQL indexes work, when they improve query performance, common mistakes, and how to reason about index selection.",
    readTime: "8 min read",
    level: "Intermediate",
    date: "August 2026",
    accent: "orange",
    content:
      "PostgreSQL indexes can make frequently used queries much faster by avoiding unnecessary table scans, but indexes also consume storage and add write overhead. Good indexing starts with real query patterns rather than assumptions. Filtering, joining, and ordering behavior should be examined with query plans so that indexes solve measurable performance problems instead of becoming unused maintenance cost.",
  },
  {
    category: "AI Engineering",
    title: "Multi-Agent AI Workflows Explained",
    description:
      "Understand how specialized AI agents can divide planning, research, writing, review, and publishing into a transparent workflow.",
    readTime: "10 min read",
    level: "Advanced",
    date: "July 2026",
    accent: "indigo",
    content:
      "A multi-agent AI workflow divides a larger task into focused responsibilities such as planning, research, writing, and review. The value comes from clear roles and explicit handoffs, not simply from having more agents. This structure can make an AI process easier to inspect and introduce useful human checkpoints while still requiring careful state management, error handling, and evaluation.",
  },
];

const accentStyles = {
  indigo: {
    badge: "info" as const,
    icon: "bg-indigo-50 text-indigo-600 border-indigo-200",
    line: "bg-indigo-500",
  },
  cyan: {
    badge: "cyan" as const,
    icon: "bg-cyan-50 text-cyan-600 border-cyan-200",
    line: "bg-cyan-500",
  },
  violet: {
    badge: "purple" as const,
    icon: "bg-violet-50 text-violet-600 border-violet-200",
    line: "bg-violet-500",
  },
  green: {
    badge: "success" as const,
    icon: "bg-green-50 text-green-600 border-green-200",
    line: "bg-green-500",
  },
  orange: {
    badge: "warning" as const,
    icon: "bg-orange-50 text-orange-600 border-orange-200",
    line: "bg-orange-500",
  },
};

export default function Blogs({ onGetStarted, onBackHome }: BlogsProps) {
  const [selectedBlog, setSelectedBlog] = useState<
    (typeof demoBlogs)[number] | null
  >(null);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={onBackHome}
            className="cursor-pointer"
            aria-label="Back to BlogForge home"
          >
            <BlogForgeLogo />
          </button>
          <div className="flex items-center gap-2">
            {onBackHome && (
              <Button variant="ghost" size="sm" onClick={onBackHome}>
                Home
              </Button>
            )}
            {onGetStarted && (
              <Button size="sm" onClick={onGetStarted}>
                Get Started
              </Button>
            )}
          </div>
        </div>
      </header>
      <main>
        <section className="border-b border-slate-200 bg-slate-50 px-4 py-16">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
                BlogForge Library
              </p>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Technical content worth reading
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">
                Explore examples of the structured, research-backed technical
                content BlogForge is designed to produce.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSelectedBlog(demoBlogs[0])}
              className="mb-6 block w-full overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
            >
              <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
                <div className="relative overflow-hidden bg-[#080D1A] p-7 sm:p-9">
                  <div className="pointer-events-none absolute inset-0 opacity-60">
                    <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-indigo-600/10 blur-3xl" />
                    <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
                    <div className="absolute inset-0 bg-[radial-gradient(#4F46E5_0.8px,transparent_0.8px)] [background-size:28px_28px] opacity-20" />
                  </div>

                  <div className="relative">
                    <Badge variant="info">Featured technical guide</Badge>
                    <h3 className="mt-5 max-w-xl text-2xl font-bold leading-tight text-white sm:text-3xl">
                      Retrieval-Augmented Generation in Production
                    </h3>
                    <p className="mt-4 max-w-xl text-sm leading-6 text-slate-400">
                      How engineering teams can combine retrieval, generation,
                      source grounding, evaluation, and human review to build
                      RAG systems that are useful beyond a prototype.
                    </p>
                    <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="rounded-full border border-slate-700 px-3 py-1.5">
                        AI Engineering
                      </span>
                      <span>•</span>
                      <span>8 min read</span>
                      <span>•</span>
                      <span>Advanced</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-center p-7 sm:p-9">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    What you'll learn
                  </p>
                  <div className="mt-4 space-y-4">
                    {[
                      "How retrieval affects answer quality",
                      "Designing grounded generation pipelines",
                      "Evaluating retrieval and generation separately",
                      "Monitoring RAG systems after deployment",
                    ].map((item, index) => (
                      <div key={item} className="flex items-start gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-600">
                          {index + 1}
                        </span>
                        <p className="pt-0.5 text-sm leading-5 text-slate-600">
                          {item}
                        </p>
                      </div>
                    ))}
                  </div>

                  {onGetStarted && (
                    <div className="mt-7">
                      <Button onClick={onGetStarted} variant="outline">
                        Create your own blog
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </button>

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {demoBlogs.slice(1).map((blog) => {
                const style =
                  accentStyles[blog.accent as keyof typeof accentStyles];

                return (
                  <button
                    type="button"
                    onClick={() => setSelectedBlog(blog)}
                    className="group flex h-full w-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
                  >
                    <div className={`h-1.5 w-full ${style.line}`} />

                    <div className="flex flex-1 flex-col p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${style.icon}`}
                        >
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.8}
                              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5s3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18s-3.332.477-4.5 1.253"
                            />
                          </svg>
                        </div>
                        <Badge variant={style.badge}>{blog.level}</Badge>
                      </div>

                      <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-indigo-600">
                        {blog.category}
                      </p>
                      <h3 className="mt-2 text-lg font-semibold leading-6 text-slate-900 transition-colors group-hover:text-indigo-700">
                        {blog.title}
                      </h3>
                      <p className="mt-3 flex-1 text-sm leading-6 text-slate-500">
                        {blog.description}
                      </p>

                      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs">
                        <span className="text-slate-400">{blog.date}</span>
                        <span className="font-semibold text-indigo-600">
                          Read article →
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedBlog && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
                role="dialog"
                aria-modal="true"
                aria-labelledby="blog-preview-title"
                onClick={() => setSelectedBlog(null)}
              >
                <div
                  className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="border-b border-slate-200 bg-slate-50 px-6 py-5 sm:px-8">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                          {selectedBlog.category}
                        </p>
                        <h3
                          id="blog-preview-title"
                          className="mt-2 text-2xl font-bold leading-tight text-slate-900"
                        >
                          {selectedBlog.title}
                        </h3>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedBlog(null)}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-lg text-slate-500 transition-colors hover:bg-white hover:text-slate-900"
                        aria-label="Close article"
                      >
                        ×
                      </button>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
                      <span>{selectedBlog.readTime}</span>
                      <span>•</span>
                      <span>{selectedBlog.level}</span>
                      <span>•</span>
                      <span>{selectedBlog.date}</span>
                    </div>
                  </div>

                  <div className="px-6 py-7 sm:px-8">
                    <p className="text-base leading-8 text-slate-600">
                      {selectedBlog.content}
                    </p>

                    <div className="mt-7 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
                      <p className="text-sm font-semibold text-slate-900">
                        Why this matters
                      </p>
                      <p className="mt-1.5 text-sm leading-6 text-slate-600">
                        BlogForge is designed to turn topics like this into
                        structured, research-backed technical articles with
                        transparent workflow stages and human review.
                      </p>
                    </div>

                    {onGetStarted && (
                      <div className="mt-6">
                        <Button onClick={onGetStarted}>
                          Create a blog with BlogForge
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-10 rounded-xl border border-indigo-100 bg-indigo-50/50 p-5 text-center">
              <p className="text-sm leading-6 text-slate-600">
                These demonstration articles show the depth and structure
                BlogForge is designed to target. Generated content is grounded
                in research sources and passes through review checkpoints before
                completion.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
