import { useState } from "react";
import { type NavFn } from "../types";
import { Button, BlogForgeLogo, Badge } from "../components/ui";

// ─── Hero visual (SVG workflow diagram) ──────────────────────────────────────

const HeroWorkflowVisual = () => (
  <div className="relative w-full rounded-2xl overflow-hidden bg-[#080D1A] border border-slate-800 shadow-2xl">
    <svg
      viewBox="0 0 560 380"
      className="w-full h-full"
      style={{ minHeight: 280 }}
    >
      <style>
        {`
          @keyframes pulse-ring {
            0%, 100% {
              transform: scale(1);
              opacity: 0.25;
            }

            50% {
              transform: scale(1.12);
              opacity: 0.55;
            }
          }

          .animate-pulse-ring {
            transform-box: fill-box;
            transform-origin: center;
            animation: pulse-ring 2s ease-in-out infinite;
          }
        `}
      </style>

      <defs>
        <pattern
          id="hero-dots"
          x="0"
          y="0"
          width="28"
          height="28"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="1" cy="1" r="0.9" fill="#4F46E5" opacity="0.15" />
        </pattern>

        <filter id="hero-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="7" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="soft-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <linearGradient id="line-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#4F46E5" stopOpacity="0" />
          <stop offset="50%" stopColor="#4F46E5" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
        </linearGradient>

        <linearGradient id="cyan-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#06B6D4" stopOpacity="0" />
          <stop offset="50%" stopColor="#06B6D4" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Background */}
      <rect width="560" height="380" fill="#080D1A" />
      <rect width="560" height="380" fill="url(#hero-dots)" />

      {/* Ambient glow blobs */}
      <ellipse
        cx="140"
        cy="180"
        rx="90"
        ry="70"
        fill="#4F46E5"
        opacity="0.05"
      />
      <ellipse
        cx="430"
        cy="180"
        rx="110"
        ry="80"
        fill="#06B6D4"
        opacity="0.05"
      />

      {/* Top: code snippet panel */}
      <rect
        x="20"
        y="20"
        width="200"
        height="70"
        rx="8"
        fill="#0D1627"
        stroke="#1E2D4A"
        strokeWidth="1"
      />
      <circle cx="36" cy="35" r="4" fill="#FF5F57" />
      <circle cx="50" cy="35" r="4" fill="#FFBD2E" />
      <circle cx="64" cy="35" r="4" fill="#28CA41" />

      <text
        x="28"
        y="56"
        fill="#4B7BEC"
        fontSize="8.5"
        fontFamily="JetBrains Mono, monospace"
      >
        from langchain import RAGPipeline
      </text>

      <text
        x="28"
        y="68"
        fill="#34D399"
        fontSize="8.5"
        fontFamily="JetBrains Mono, monospace"
      >
        class BlogAgent(RAGPipeline):
      </text>

      <text
        x="28"
        y="80"
        fill="#94A3B8"
        fontSize="8.5"
        fontFamily="JetBrains Mono, monospace"
      >
        {" "}
        def research(self, topic):
      </text>

      {/* Top right: sources panel */}
      <rect
        x="340"
        y="20"
        width="200"
        height="70"
        rx="8"
        fill="#0D1627"
        stroke="#1E2D4A"
        strokeWidth="1"
      />

      <text
        x="356"
        y="40"
        fill="#64748B"
        fontSize="8"
        fontFamily="Inter, sans-serif"
        fontWeight="500"
      >
        Sources collected
      </text>

      <text
        x="356"
        y="62"
        fill="#F8FAFC"
        fontSize="20"
        fontWeight="bold"
        fontFamily="Inter, sans-serif"
      >
        24
      </text>

      <text
        x="392"
        y="62"
        fill="#64748B"
        fontSize="8.5"
        fontFamily="Inter, sans-serif"
      >
        trusted technical sources
      </text>

      <rect x="356" y="72" width="55" height="10" rx="3" fill="#0F3460" />

      <text
        x="361"
        y="80"
        fill="#60A5FA"
        fontSize="6.5"
        fontFamily="JetBrains Mono, monospace"
      >
        docs.langchain.com
      </text>

      <rect x="416" y="72" width="40" height="10" rx="3" fill="#0F3460" />

      <text
        x="421"
        y="80"
        fill="#60A5FA"
        fontSize="6.5"
        fontFamily="JetBrains Mono, monospace"
      >
        arxiv.org
      </text>

      {/* Horizontal flow line */}
      <line
        x1="60"
        y1="190"
        x2="500"
        y2="190"
        stroke="url(#line-grad)"
        strokeWidth="1"
      />

      {/* Node 1: Topic (completed) */}
      <circle
        cx="75"
        cy="190"
        r="36"
        fill="#0D1627"
        stroke="#22C55E"
        strokeWidth="1.5"
        filter="url(#soft-glow)"
      />

      <text
        x="75"
        y="183"
        textAnchor="middle"
        fill="#22C55E"
        fontSize="8"
        fontFamily="JetBrains Mono, monospace"
      >
        ✓ TOPIC
      </text>

      <text
        x="75"
        y="196"
        textAnchor="middle"
        fill="#4ADE80"
        fontSize="7.5"
        fontFamily="Inter, sans-serif"
        fontWeight="500"
      >
        Guardrail
      </text>

      <text
        x="75"
        y="207"
        textAnchor="middle"
        fill="#16A34A"
        fontSize="7"
        fontFamily="Inter, sans-serif"
      >
        passed
      </text>

      {/* Node 2: Plan (active, glowing) */}
      <circle
        cx="210"
        cy="190"
        r="40"
        fill="#1E1B4B"
        stroke="#6366F1"
        strokeWidth="2"
        filter="url(#hero-glow)"
      />

      {/* This is the only restored animation */}
      <circle
        cx="210"
        cy="190"
        r="48"
        fill="none"
        stroke="#4F46E5"
        strokeWidth="0.8"
        opacity="0.25"
        className="animate-pulse-ring"
      />

      <text
        x="210"
        y="183"
        textAnchor="middle"
        fill="#A5B4FC"
        fontSize="8.5"
        fontFamily="JetBrains Mono, monospace"
      >
        ● PLAN
      </text>

      <text
        x="210"
        y="196"
        textAnchor="middle"
        fill="#C7D2FE"
        fontSize="8"
        fontFamily="Inter, sans-serif"
        fontWeight="600"
      >
        Outline Gen
      </text>

      <text
        x="210"
        y="208"
        textAnchor="middle"
        fill="#818CF8"
        fontSize="7"
        fontFamily="JetBrains Mono, monospace"
      >
        running...
      </text>

      {/* Node 3: Research (pending) */}
      <circle
        cx="350"
        cy="190"
        r="36"
        fill="#0D1627"
        stroke="#334155"
        strokeWidth="1"
      />

      <text
        x="350"
        y="183"
        textAnchor="middle"
        fill="#475569"
        fontSize="8"
        fontFamily="JetBrains Mono, monospace"
      >
        ○ RESEARCH
      </text>

      <text
        x="350"
        y="196"
        textAnchor="middle"
        fill="#475569"
        fontSize="7.5"
        fontFamily="Inter, sans-serif"
      >
        Web Search
      </text>

      <text
        x="350"
        y="207"
        textAnchor="middle"
        fill="#334155"
        fontSize="7"
        fontFamily="Inter, sans-serif"
      >
        pending
      </text>

      {/* Node 4: Publish (pending) */}
      <circle
        cx="490"
        cy="190"
        r="36"
        fill="#0D1627"
        stroke="#334155"
        strokeWidth="1"
      />

      <text
        x="490"
        y="183"
        textAnchor="middle"
        fill="#475569"
        fontSize="8"
        fontFamily="JetBrains Mono, monospace"
      >
        ○ PUBLISH
      </text>

      <text
        x="490"
        y="196"
        textAnchor="middle"
        fill="#475569"
        fontSize="7.5"
        fontFamily="Inter, sans-serif"
      >
        Export
      </text>

      <text
        x="490"
        y="207"
        textAnchor="middle"
        fill="#334155"
        fontSize="7"
        fontFamily="Inter, sans-serif"
      >
        pending
      </text>

      {/* Labels below nodes */}
      <text
        x="75"
        y="242"
        textAnchor="middle"
        fill="#4B5563"
        fontSize="7.5"
        fontFamily="Inter, sans-serif"
      >
        Step 1
      </text>

      <text
        x="210"
        y="248"
        textAnchor="middle"
        fill="#818CF8"
        fontSize="7.5"
        fontFamily="Inter, sans-serif"
      >
        Step 2 — Active
      </text>

      <text
        x="350"
        y="242"
        textAnchor="middle"
        fill="#4B5563"
        fontSize="7.5"
        fontFamily="Inter, sans-serif"
      >
        Step 5
      </text>

      <text
        x="490"
        y="242"
        textAnchor="middle"
        fill="#4B5563"
        fontSize="7.5"
        fontFamily="Inter, sans-serif"
      >
        Step 12
      </text>

      {/* Bottom: multi-agent writing panel */}
      <rect
        x="90"
        y="285"
        width="380"
        height="72"
        rx="8"
        fill="#0D1627"
        stroke="#1E2D4A"
        strokeWidth="1"
      />

      <text
        x="106"
        y="305"
        fill="#64748B"
        fontSize="8"
        fontFamily="Inter, sans-serif"
        fontWeight="500"
      >
        Multi-agent section writing
      </text>

      {[
        { label: "section-1", w: 65, c: "#4F46E5" },
        { label: "section-2", w: 52, c: "#6366F1" },
        { label: "section-3", w: 78, c: "#4F46E5" },
        { label: "section-4", w: 41, c: "#6366F1" },
      ].map((s, i) => (
        <g key={s.label}>
          <text
            x={106}
            y={323 + i * 11}
            fill="#475569"
            fontSize="7"
            fontFamily="JetBrains Mono, monospace"
          >
            {s.label}
          </text>

          <rect
            x={175}
            y={315 + i * 11}
            width={200}
            height={7}
            rx={3}
            fill="#1E293B"
          />

          <rect
            x={175}
            y={315 + i * 11}
            width={s.w * 2}
            height={7}
            rx={3}
            fill={s.c}
            opacity={0.7}
          />

          <text
            x={385}
            y={321 + i * 11}
            fill="#64748B"
            fontSize="7"
            fontFamily="Inter, sans-serif"
          >
            {s.w}%
          </text>
        </g>
      ))}

      {/* Top right cyan trace */}
      <line
        x1="210"
        y1="100"
        x2="210"
        y2="150"
        stroke="#4F46E5"
        strokeWidth="1"
        strokeDasharray="3 3"
        opacity="0.4"
      />
    </svg>

    {/* Running label overlay */}
    <div className="absolute top-3 right-3">
      <div className="flex items-center gap-1.5 bg-indigo-950/80 border border-indigo-800/60 rounded-full px-2.5 py-1">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />

        <span className="text-xs text-indigo-300 font-medium">
          Live preview
        </span>
      </div>
    </div>
  </div>
);

// ─── Capabilities ─────────────────────────────────────────────────────────────

const capabilities = [
  {
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
        />
      </svg>
    ),
    title: "AI Planning",
    desc: "Intelligent outline generation with audience-aware section planning and research scoping for each section.",
    accent: "bg-indigo-50 text-indigo-600 border-indigo-200",
  },
  {
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    ),
    title: "Live Web Research",
    desc: "Real-time source gathering from official documentation, research papers, and trusted technical publications.",
    accent: "bg-cyan-50 text-cyan-600 border-cyan-200",
  },
  {
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
    title: "Multi-Agent Writing",
    desc: "Parallel specialized AI agents write each section simultaneously, grounded in gathered evidence.",
    accent: "bg-violet-50 text-violet-600 border-violet-200",
  },
  {
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    title: "Human Review",
    desc: "Built-in review checkpoints for outline approval and final blog sign-off before research and publishing.",
    accent: "bg-green-50 text-green-600 border-green-200",
  },
];

const workflowSteps = [
  { label: "Topic", active: true },
  { label: "Plan", active: false },
  { label: "Research", active: false },
  { label: "Write", active: false },
  { label: "Review", active: false },
  { label: "Publish", active: false },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function Landing({ navigate }: { navigate: NavFn }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const goToRegister = () => {
    navigate({
      section: "public",
      page: "register",
    });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          <BlogForgeLogo />

          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <button
              type="button"
              onClick={() => navigate({ section: "public", page: "blogs" })}
              className="text-sm text-slate-600 transition-colors hover:text-indigo-600"
            >
              Blogs
            </button>

            <button
              type="button"
              onClick={() => navigate({ section: "public", page: "about" })}
              className="text-sm text-slate-600 transition-colors hover:text-indigo-600"
            >
              About Us
            </button>
          </nav>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate({ section: "public", page: "login" })}
            >
              Login
            </Button>

            <Button size="sm" onClick={goToRegister}>
              Get Started
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="flex md:hidden h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition-colors hover:bg-slate-100 hover:text-indigo-600"
            aria-label="Open navigation menu"
            aria-expanded={mobileMenuOpen}
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
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>

        {/* Mobile right-side drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-[100] md:hidden">
            {/* Overlay */}
            <button
              type="button"
              aria-label="Close navigation menu"
              onClick={() => setMobileMenuOpen(false)}
              className="absolute inset-0 z-0 bg-slate-950/40"
            />

            {/* Drawer */}
            <aside className="absolute right-0 top-0 z-10 flex h-full w-[280px] max-w-[85vw] flex-col bg-white shadow-2xl">
              <div className="flex h-14 items-center justify-between border-b border-slate-200 px-4">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-indigo-600" />
                  <span className="text-sm font-semibold text-slate-900">
                    BlogForge
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                  aria-label="Close navigation menu"
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
                      strokeWidth={2}
                      d="M6 6l12 12M18 6L6 18"
                    />
                  </svg>
                </button>
              </div>

              <nav className="flex flex-1 flex-col gap-2 bg-white p-4">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate({ section: "public", page: "blogs" });
                  }}
                  className="rounded-lg border border-slate-200 px-4 py-3 text-left text-sm font-medium text-slate-700 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                >
                  Blogs
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate({ section: "public", page: "about" });
                  }}
                  className="rounded-lg border border-slate-200 px-4 py-3 text-left text-sm font-medium text-slate-700 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                >
                  About Us
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate({ section: "public", page: "login" });
                  }}
                  className="rounded-lg border border-slate-200 px-4 py-3 text-left text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900"
                >
                  Login
                </button>

                <Button
                  className="mt-0"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    goToRegister();
                  }}
                >
                  Get Started
                </Button>
              </nav>
            </aside>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="bg-[#060B16] py-12 lg:py-15 px-4 relative overflow-hidden">
        {/* Subtle radial bg */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-600 opacity-5 blur-3xl rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left */}
            <div>
              <div className="inline-flex items-center gap-2 bg-indigo-950/80 border border-indigo-800/60 rounded-full px-3 py-1 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-indigo-300 font-medium">
                  Multi-agent AI platform
                </span>
              </div>

              <h1 className="text-4xl lg:text-[2.75rem] xl:text-5xl font-bold text-white leading-[1.15] tracking-tight">
                Turn Ideas Into
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                  Research-Backed
                </span>
                <br />
                Technical Blogs
              </h1>

              <p className="mt-5 text-slate-400 text-lg leading-relaxed max-w-[420px]">
                Create high-quality IT technical blogs using AI agents, live web
                research, human review, and transparent workflow tracking.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  size="lg"
                  onClick={() =>
                    navigate({ section: "public", page: "register" })
                  }
                >
                  Start Writing
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </Button>
                {/* <Button
                  variant="outline"
                  size="lg"
                  className="border-slate-700 text-slate-300 hover:bg-slate-800/50 hover:text-white hover:border-slate-600"
                >
                  Explore Blogs
                </Button> */}
                <Button
                  variant="outline"
                  size="lg"
                  className="border-slate-700 text-white lg:text-indigo-400 hover:bg-slate-800/50 hover:border-indigo-400 hover:text-white"
                  onClick={() => navigate({ section: "public", page: "blogs" })}
                >
                  Explore Blogs
                </Button>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-5 text-sm text-slate-500">
                {[
                  "Source-backed writing",
                  "Human in the loop",
                  "Export PDF · DOCX",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-1.5">
                    <svg
                      className="w-3.5 h-3.5 text-green-500 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: visual */}
            <div>
              <HeroWorkflowVisual />
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="py-16 px-4 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-widest mb-2">
              Platform capabilities
            </p>
            <h2 className="text-2xl font-bold text-slate-900">
              Built for technical depth
            </h2>
            <p className="text-slate-500 mt-2 text-sm max-w-lg mx-auto">
              Every feature designed for producing credible, research-backed
              technical content that developers trust.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {capabilities.map((cap) => (
              <div
                key={cap.title}
                className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 hover:shadow-sm transition-all"
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 border ${cap.accent}`}
                >
                  {cap.icon}
                </div>
                <h3 className="font-semibold text-slate-900 mb-1.5">
                  {cap.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {cap.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow chain */}
      <section className="py-14 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-widest mb-2">
            Transparent by design
          </p>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            End-to-end workflow you can follow
          </h2>
          <p className="text-slate-500 text-sm mb-8 max-w-md mx-auto">
            No black-box generation. Watch every step, understand every source,
            approve every plan.
          </p>
          <div className="flex items-center justify-center flex-wrap gap-1">
            {workflowSteps.map((step, i) => (
              <div key={step.label} className="flex items-center">
                <div
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium ${
                    i === 0
                      ? "bg-indigo-600 text-white"
                      : i === workflowSteps.length - 1
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                  }`}
                >
                  {step.label}
                </div>
                {i < workflowSteps.length - 1 && (
                  <svg
                    className="w-4 h-4 text-slate-300 mx-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                )}
              </div>
            ))}
          </div>

          {/* Three key principles */}
          <div className="mt-10 grid sm:grid-cols-3 gap-4">
            {[
              {
                num: "01",
                title: "What did I ask?",
                desc: "Your topic and plan are always visible.",
              },
              {
                num: "02",
                title: "What is it doing?",
                desc: "Every workflow step shown in real time.",
              },
              {
                num: "03",
                title: "Where is this from?",
                desc: "Every claim linked to a source you can verify.",
              },
            ].map((p) => (
              <div
                key={p.num}
                className="text-left bg-slate-50 border border-slate-200 rounded-xl p-5"
              >
                <p className="font-mono text-xs text-indigo-500 mb-2">
                  {p.num}
                </p>
                <p className="font-semibold text-slate-900 text-sm mb-1">
                  {p.title}
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {p.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof strip */}
      <section className="py-8 px-4 bg-slate-50 border-y border-slate-200">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
          <span className="font-medium text-slate-400 text-xs uppercase tracking-widest">
            Trusted source types
          </span>
          {[
            "Official Documentation",
            "Research Papers",
            "Engineering Blogs",
            "Technical Publications",
            "Open Standards",
          ].map((t) => (
            <Badge key={t} variant="default" size="md">
              {t}
            </Badge>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-[#060B16]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-3">
            Ready to write your first technical blog?
          </h2>
          <p className="text-slate-400 mb-6 text-sm">
            Join engineers and technical writers using BlogForge to produce
            credible, research-backed content.
          </p>
          <Button
            size="lg"
            onClick={() => navigate({ section: "public", page: "register" })}
          >
            Create Free Account
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </Button>
          <p className="mt-3 text-xs text-slate-600">
            No credit card required · Export to PDF, DOCX, and Markdown
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#060B16] border-t border-slate-800 py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <BlogForgeLogo dark size="sm" />
          <div className="flex items-center gap-4 text-xs text-slate-600">
            <a href="#" className="hover:text-slate-400 transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-slate-400 transition-colors">
              Terms
            </a>
            <a href="#" className="hover:text-slate-400 transition-colors">
              Documentation
            </a>
          </div>
          <p className="text-xs text-slate-700">
            © 2026 BlogForge. AI-powered technical blog authoring.
          </p>
        </div>
      </footer>
    </div>
  );
}
