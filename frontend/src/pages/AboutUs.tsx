import { motion } from "framer-motion";
import { Button, Badge, BlogForgeLogo } from "../components/ui";

interface AboutUsProps {
  onGetStarted?: () => void;
  onBackHome?: () => void;
}

// ─── Developer profile links ──────────────────────────────────────────────────
// Update these values whenever you want to change the external profiles.
const DEVELOPER_IMAGE = "/images/jahanzeb-riaz.jpeg";

const PORTFOLIO_URL = "https://jazzy-portfolio-three.vercel.app/";

const LINKEDIN_URL = "https://www.linkedin.com/in/jahanzeb-riaz/";

// ─── Animation variants ───────────────────────────────────────────────────────

const fadeUp = {
  hidden: {
    opacity: 0,
    y: 30,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

const fadeLeft = {
  hidden: {
    opacity: 0,
    x: -40,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.65,
      ease: "easeOut",
    },
  },
};

const fadeRight = {
  hidden: {
    opacity: 0,
    x: 40,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.65,
      ease: "easeOut",
    },
  },
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const cardAnimation = {
  hidden: {
    opacity: 0,
    y: 30,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: "easeOut",
    },
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function AboutUs({ onGetStarted, onBackHome }: AboutUsProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur"
      >
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <motion.button
            type="button"
            onClick={onBackHome}
            className="cursor-pointer"
            aria-label="Back to BlogForge home"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <BlogForgeLogo />
          </motion.button>

          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, delay: 0.15 }}
          >
            {onBackHome && (
              <Button variant="ghost" size="sm" onClick={onBackHome}>
                Home
              </Button>
            )}

            {onGetStarted && (
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Button size="sm" onClick={onGetStarted}>
                  Get Started
                </Button>
              </motion.div>
            )}
          </motion.div>
        </div>
      </motion.header>

      <main>
        <section className="border-b border-slate-200 bg-white px-4 py-16">
          <div className="mx-auto max-w-7xl">
            {/* ─────────────────────────────────────────────────────────────── */}
            {/* About BlogForge */}
            {/* ─────────────────────────────────────────────────────────────── */}

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.15 }}
            >
              <motion.div
                className="mx-auto max-w-3xl text-center"
                variants={staggerContainer}
              >
                <motion.p
                  className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600"
                  variants={fadeUp}
                >
                  About BlogForge
                </motion.p>

                <motion.h2
                  className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl"
                  variants={fadeUp}
                >
                  Built to make technical writing more reliable
                </motion.h2>

                <motion.p
                  className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base"
                  variants={fadeUp}
                >
                  BlogForge is built around a simple idea: technical content
                  should be useful, understandable, research-backed, and
                  transparent.
                </motion.p>
              </motion.div>

              <motion.div
                className="mx-auto mt-10 max-w-3xl"
                variants={staggerContainer}
              >
                <div className="space-y-6 text-left">
                  <motion.div variants={fadeUp}>
                    <h3 className="text-base font-semibold text-slate-900">
                      More than text generation
                    </h3>

                    <p className="mt-2 text-sm leading-7 text-slate-600 sm:text-base">
                      Writing a good technical article involves much more than
                      generating text. It requires understanding the topic,
                      planning the structure, finding reliable sources, checking
                      technical information, writing clearly, and reviewing the
                      final result.
                    </p>
                  </motion.div>

                  <motion.div variants={fadeUp}>
                    <h3 className="text-base font-semibold text-slate-900">
                      A structured AI workflow
                    </h3>

                    <p className="mt-2 text-sm leading-7 text-slate-600 sm:text-base">
                      BlogForge brings these steps together into one structured
                      workflow. Focused AI agents assist with planning,
                      research, writing, review, and export, while important
                      checkpoints remain visible throughout the process.
                    </p>
                  </motion.div>

                  <motion.div variants={fadeUp}>
                    <h3 className="text-base font-semibold text-slate-900">
                      Why we built it
                    </h3>

                    <p className="mt-2 text-sm leading-7 text-slate-600 sm:text-base">
                      Technical writers and developers often move between
                      research, source selection, planning, writing,
                      fact-checking, and review. BlogForge brings these
                      activities together into one manageable workflow.
                    </p>
                  </motion.div>

                  <motion.div variants={fadeUp}>
                    <h3 className="text-base font-semibold text-slate-900">
                      The goal
                    </h3>

                    <p className="mt-2 text-sm leading-7 text-slate-600 sm:text-base">
                      The goal is not simply to generate more content. BlogForge
                      explores how multi-agent AI can support complex technical
                      writing while keeping the important steps visible and
                      understandable.
                    </p>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>

            {/* ─────────────────────────────────────────────────────────────── */}
            {/* Developer */}
            {/* ─────────────────────────────────────────────────────────────── */}

            <motion.div
              className="mt-16 overflow-hidden rounded-2xl border border-slate-200 bg-[#080D1A]"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.12 }}
            >
              <div className="grid items-center lg:grid-cols-[0.8fr_1.2fr]">
                {/* Developer image */}
                <motion.div
                  className="flex justify-center p-8 sm:p-12"
                  variants={fadeLeft}
                >
                  <motion.div
                    className="relative flex h-56 w-56 items-center justify-center overflow-hidden rounded-2xl border border-indigo-500/30 bg-slate-900"
                    whileHover={{
                      y: -5,
                      scale: 1.02,
                      transition: { duration: 0.25 },
                    }}
                  >
                    <div className="absolute inset-0 bg-[radial-gradient(#4F46E5_0.8px,transparent_0.8px)] [background-size:24px_24px] opacity-20" />

                    <motion.img
                      src={DEVELOPER_IMAGE}
                      alt="Jahanzeb Riaz - AI Engineer and Backend Developer"
                      className="relative z-10 h-full w-full rounded-2xl object-cover"
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 0.65,
                        ease: "easeOut",
                      }}
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />

                    {/* Fallback initials */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.div
                        className="flex h-32 w-32 items-center justify-center rounded-full border-2 border-indigo-400/50 bg-indigo-950 text-4xl font-bold text-indigo-300 shadow-2xl shadow-indigo-500/20"
                        initial={{ opacity: 0, scale: 0.75 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{
                          duration: 0.55,
                          delay: 0.15,
                        }}
                      >
                        JR
                      </motion.div>
                    </div>

                    <motion.div
                      className="absolute bottom-4 z-20 rounded-full border border-indigo-800/60 bg-indigo-950/90 px-3 py-1 text-xs font-medium text-indigo-300"
                      initial={{ opacity: 0, y: 8 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 0.4,
                        delay: 0.35,
                      }}
                    >
                      AI Engineer
                    </motion.div>
                  </motion.div>
                </motion.div>

                {/* Developer information */}
                <motion.div className="p-8 sm:p-12" variants={fadeRight}>
                  <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={staggerContainer}
                  >
                    <motion.div variants={fadeUp}>
                      <Badge variant="info">
                        The developer behind BlogForge
                      </Badge>
                    </motion.div>

                    <motion.h3
                      className="mt-5 text-3xl font-bold text-white"
                      variants={fadeUp}
                    >
                      Jahanzeb Riaz
                    </motion.h3>

                    <motion.p
                      className="mt-2 text-sm font-medium text-indigo-300"
                      variants={fadeUp}
                    >
                      AI Engineer · Backend Systems · GenAI
                    </motion.p>

                    <motion.p
                      className="mt-6 text-sm leading-7 text-slate-400"
                      variants={fadeUp}
                    >
                      I am a final-year BS Information Technology student at
                      Shaheed Benazir Bhutto University, Sanghar Campus. I am
                      currently developing my Final Year Project, BlogForge, an
                      AI-powered platform involving RAG systems, agentic
                      workflows, LLM pipelines, and scalable backend services.
                    </motion.p>

                    <motion.p
                      className="mt-4 text-sm leading-7 text-slate-400"
                      variants={fadeUp}
                    >
                      I have also gained professional experience through AI
                      engineering internships at{" "}
                      <strong className="font-semibold text-slate-200">
                        SOC Solutions
                      </strong>{" "}
                      and{" "}
                      <strong className="font-semibold text-slate-200">
                        Botmer Internations
                      </strong>
                      , where I developed practical exposure to AI engineering
                      and application development workflows.
                    </motion.p>

                    <motion.p
                      className="mt-4 text-sm leading-7 text-slate-400"
                      variants={fadeUp}
                    >
                      I aim to build intelligent, maintainable, and scalable
                      software. I’m particularly interested in AI Engineer and
                      Software/Backend Developer roles focused on RAG systems,
                      agentic AI, robust APIs, and scalable AI applications.
                    </motion.p>
                  </motion.div>

                  {/* Skills */}
                  <motion.div
                    className="mt-7 grid gap-3 sm:grid-cols-3"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.2 }}
                    variants={staggerContainer}
                  >
                    {[
                      "AI Engineering",
                      "Backend Development",
                      "GenAI & Agentic AI",
                      // "FastAPI",
                      // "RAG Pipelines",
                      // "LLM Applications",
                    ].map((item) => (
                      <motion.div
                        key={item}
                        variants={cardAnimation}
                        className="rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-3 text-center text-xs font-medium text-slate-300 transition-colors hover:border-indigo-500/50 hover:text-indigo-300"
                        whileHover={{
                          y: -3,
                          transition: { duration: 0.2 },
                        }}
                      >
                        {item}
                      </motion.div>
                    ))}
                  </motion.div>

                  {/* External profile links */}
                  <motion.div
                    className="mt-7 flex flex-wrap gap-3"
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.45,
                      delay: 0.3,
                    }}
                  >
                    <motion.a
                      href={PORTFOLIO_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border border-indigo-700/60 bg-indigo-950/70 px-4 py-2.5 text-sm font-medium text-indigo-300 transition-colors hover:border-indigo-500 hover:bg-indigo-900/70 hover:text-white"
                      whileHover={{
                        y: -2,
                        scale: 1.02,
                      }}
                      whileTap={{
                        scale: 0.97,
                      }}
                    >
                      Portfolio
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.8}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4m-5-8h5v5m-1-4L10 14"
                        />
                      </svg>
                    </motion.a>

                    <motion.a
                      href={LINKEDIN_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:border-slate-500 hover:bg-slate-800 hover:text-white"
                      whileHover={{
                        y: -2,
                        scale: 1.02,
                      }}
                      whileTap={{
                        scale: 0.97,
                      }}
                    >
                      LinkedIn
                      <span className="inline-flex items-center justify-center rounded-md border border-sky-400 p-1">
                        <svg
                          className="h-4 w-4 text-sky-400"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V8.999h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.287zM5.337 7.433a2.062 2.062 0 110-4.124 2.062 2.062 0 010 4.124zM7.119 20.452H3.554V8.999h3.565v11.453z" />
                        </svg>
                      </span>
                    </motion.a>
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>

            {/* ─────────────────────────────────────────────────────────────── */}
            {/* Closing CTA */}
            {/* ─────────────────────────────────────────────────────────────── */}

            <motion.div
              className="mt-10 rounded-2xl border border-indigo-100 bg-indigo-50/60 px-6 py-8 text-center"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeUp}
            >
              <h3 className="text-xl font-semibold text-slate-900">
                Explore what BlogForge can create
              </h3>

              <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Start with a topic and let the workflow take you from an initial
                idea toward a structured, research-backed technical blog.
              </p>

              {onGetStarted && (
                <motion.div
                  className="mt-5"
                  whileHover={{
                    scale: 1.03,
                  }}
                  whileTap={{
                    scale: 0.97,
                  }}
                >
                  <Button onClick={onGetStarted}>
                    Get Started with BlogForge
                  </Button>
                </motion.div>
              )}
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  );
}
