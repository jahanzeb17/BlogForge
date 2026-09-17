import { Button, Badge, BlogForgeLogo } from "../components/ui";

interface AboutUsProps {
  onGetStarted?: () => void;
  onBackHome?: () => void;
}

export default function AboutUs({ onGetStarted, onBackHome }: AboutUsProps) {
  return (
    <div className="min-h-screen bg-white">
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
        <section className="border-b border-slate-200 bg-white px-4 py-16">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
                About BlogForge
              </p>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Built to make technical writing more reliable
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-500">
                BlogForge was created around a simple idea: technical content
                should be useful, understandable, research-backed, and
                transparent about how it was produced.
              </p>
            </div>

            <div className="mt-10 mx-auto max-w-4xl">
              <div className="space-y-5 text-left">
                <p className="text-base leading-8 text-slate-600">
                  BlogForge was created to make technical writing a more
                  structured and manageable process. Writing a useful technical
                  article is rarely just about generating text. A good article
                  usually requires understanding the topic, planning the right
                  structure, finding reliable sources, checking technical
                  information, writing each section clearly, and reviewing the
                  final result.
                </p>

                <p className="text-base leading-8 text-slate-600">
                  We designed BlogForge around this complete process rather than
                  treating AI as a single text-generation tool. The platform
                  uses focused workflow stages where AI agents can assist with
                  planning, research, writing, review, and export. Each stage
                  has a clear purpose, while important checkpoints remain
                  visible so the user can understand what is happening
                  throughout the process.
                </p>

                <p className="text-base leading-8 text-slate-600">
                  The problem we want to address is the time and effort involved
                  in producing technical content that is both well organized and
                  grounded in research. BlogForge aims to bring these activities
                  together in one workflow, helping users move from an initial
                  idea to a structured technical blog while keeping research,
                  transparency, and human review at the center of the
                  experience.
                </p>
              </div>
            </div>

            <div className="mt-16 overflow-hidden rounded-2xl border border-slate-200 bg-[#080D1A]">
              <div className="grid items-center lg:grid-cols-[0.8fr_1.2fr]">
                <div className="flex justify-center p-8 sm:p-12">
                  <div className="relative flex h-56 w-56 items-center justify-center overflow-hidden rounded-2xl border border-indigo-500/30 bg-slate-900">
                    <div className="absolute inset-0 bg-[radial-gradient(#4F46E5_0.8px,transparent_0.8px)] [background-size:24px_24px] opacity-20" />

                    {/* Replace this placeholder with the developer photo:
                    /public/images/jahanzeb-riaz.jpg */}
                    <div className="relative flex h-32 w-32 items-center justify-center rounded-full border-2 border-indigo-400/50 bg-indigo-950 text-4xl font-bold text-indigo-300 shadow-2xl shadow-indigo-500/20">
                      JR
                    </div>

                    <div className="absolute bottom-4 rounded-full border border-indigo-800/60 bg-indigo-950/90 px-3 py-1 text-xs font-medium text-indigo-300">
                      Developer
                    </div>
                  </div>
                </div>

                <div className="p-8 sm:p-12">
                  <Badge variant="info">The developer behind BlogForge</Badge>

                  <h3 className="mt-5 text-3xl font-bold text-white">
                    Jahanzeb Riaz
                  </h3>

                  <p className="mt-2 text-sm font-medium text-indigo-300">
                    Developer & Creator of BlogForge
                  </p>

                  <p className="mt-6 text-sm leading-7 text-slate-400">
                    BlogForge was built from the motivation to explore how
                    multi-agent AI can make a complex technical-writing process
                    more structured and manageable. Instead of treating AI as a
                    single text-generation step, the platform separates the work
                    into stages that can be inspected and reviewed.
                  </p>

                  <p className="mt-4 text-sm leading-7 text-slate-400">
                    The project focuses on a practical problem faced by
                    technical writers and developers: producing useful articles
                    requires more than generating paragraphs. Research, source
                    selection, organization, technical accuracy, review, and
                    presentation all matter. BlogForge brings those activities
                    into one workflow.
                  </p>

                  <div className="mt-7 grid gap-3 sm:grid-cols-3">
                    {["AI agents", "Research", "Human review"].map((item) => (
                      <div
                        key={item}
                        className="rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-3 text-center text-xs font-medium text-slate-300"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 rounded-2xl border border-indigo-100 bg-indigo-50/60 px-6 py-8 text-center">
              <h3 className="text-xl font-semibold text-slate-900">
                Explore what BlogForge can create
              </h3>
              <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Start with a topic and let the workflow take you from an initial
                idea toward a structured technical blog.
              </p>

              {onGetStarted && (
                <div className="mt-5">
                  <Button onClick={onGetStarted}>
                    Get Started with BlogForge
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
