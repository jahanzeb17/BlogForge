// // import { Badge, Button } from "../components/ui";

// // interface AboutUsProps {
// //   onGetStarted?: () => void;
// // }

// // const principles = [
// //   {
// //     number: "01",
// //     title: "Research before writing",
// //     description:
// //       "BlogForge is designed to gather relevant technical sources before asking writing agents to produce the content. This gives the writing process an evidence base instead of relying only on model memory.",
// //   },
// //   {
// //     number: "02",
// //     title: "Specialized agents",
// //     description:
// //       "Different stages of the workflow have different responsibilities. Planning, research, writing, review, and finalization can each be handled as distinct stages rather than one opaque generation request.",
// //   },
// //   {
// //     number: "03",
// //     title: "Human review matters",
// //     description:
// //       "AI can accelerate technical writing, but important decisions should remain visible to the person using the platform. BlogForge therefore includes review checkpoints where human input can shape the result.",
// //   },
// // ];

// // export default function AboutUs({ onGetStarted }: AboutUsProps) {
// //   return (
// //     <section id="about" className="scroll-mt-16 bg-white px-4 py-16">
// //       <div className="mx-auto max-w-7xl">
// //         {/* Header */}
// //         <div className="mx-auto max-w-3xl text-center">
// //           <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
// //             About BlogForge
// //           </p>

// //           <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
// //             Built to solve a real technical writing problem
// //           </h2>

// //           <p className="mt-4 text-sm leading-6 text-slate-500 sm:text-base">
// //             Technical writing is not simply about generating paragraphs. Good
// //             technical content requires understanding the topic, researching
// //             reliable information, organizing the material, connecting claims to
// //             sources, and reviewing the final result.
// //           </p>
// //         </div>

// //         {/* Main story */}
// //         <div className="mt-12 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-stretch">
// //           <div className="rounded-2xl border border-slate-200 bg-slate-50 p-7 sm:p-9">
// //             <div className="flex items-center gap-3">
// //               <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white">
// //                 <svg
// //                   className="h-5 w-5"
// //                   fill="none"
// //                   stroke="currentColor"
// //                   viewBox="0 0 24 24"
// //                 >
// //                   <path
// //                     strokeLinecap="round"
// //                     strokeLinejoin="round"
// //                     strokeWidth={1.8}
// //                     d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5s3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18s-3.332.477-4.5 1.253"
// //                   />
// //                 </svg>
// //               </div>

// //               <div>
// //                 <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
// //                   The idea
// //                 </p>

// //                 <h3 className="text-lg font-bold text-slate-900">
// //                   Why BlogForge exists
// //                 </h3>
// //               </div>
// //             </div>

// //             <div className="mt-6 space-y-5 text-sm leading-7 text-slate-600">
// //               <p>
// //                 Creating a high-quality technical blog can take significant
// //                 time. The writer needs to understand the subject, find useful
// //                 sources, decide what information belongs in the article,
// //                 structure the explanation, write each section, and then validate
// //                 the result.
// //               </p>

// //               <p>
// //                 At the same time, simply asking an AI model to "write a
// //                 technical blog" does not provide enough visibility into where
// //                 the information came from or how the content was produced.
// //               </p>

// //               <p>
// //                 BlogForge was designed around a different idea:{" "}
// //                 <strong className="font-semibold text-slate-900">
// //                   make the writing workflow visible.
// //                 </strong>
// //               </p>

// //               <p>
// //                 Instead of treating AI writing as one black-box operation,
// //                 BlogForge breaks the process into stages such as planning,
// //                 research, writing, review, and finalization.
// //               </p>
// //             </div>
// //           </div>

// //           {/* Problem / solution */}
// //           <div className="rounded-2xl border border-slate-800 bg-[#080D1A] p-7 sm:p-9">
// //             <Badge variant="info">The problem we are addressing</Badge>

// //             <div className="mt-7 space-y-6">
// //               <div>
// //                 <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
// //                   Before
// //                 </p>

// //                 <div className="mt-3 space-y-2.5">
// //                   {[
// //                     "Research scattered across many sources",
// //                     "Writing and research treated as one task",
// //                     "Limited visibility into AI decisions",
// //                     "Difficult to verify technical claims",
// //                   ].map((item) => (
// //                     <div key={item} className="flex items-start gap-3">
// //                       <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-600" />

// //                       <p className="text-sm leading-5 text-slate-400">{item}</p>
// //                     </div>
// //                   ))}
// //                 </div>
// //               </div>

// //               <div className="h-px bg-slate-800" />

// //               <div>
// //                 <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
// //                   With BlogForge
// //                 </p>

// //                 <div className="mt-3 space-y-2.5">
// //                   {[
// //                     "Structured research workflow",
// //                     "Specialized AI stages",
// //                     "Visible progress and checkpoints",
// //                     "Sources connected to the writing process",
// //                   ].map((item) => (
// //                     <div key={item} className="flex items-start gap-3">
// //                       <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />

// //                       <p className="text-sm leading-5 text-slate-300">{item}</p>
// //                     </div>
// //                   ))}
// //                 </div>
// //               </div>
// //             </div>
// //           </div>
// //         </div>

// //         {/* Principles */}
// //         <div className="mt-12">
// //           <div className="mb-6">
// //             <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
// //               Our approach
// //             </p>

// //             <h3 className="mt-1 text-xl font-bold text-slate-900">
// //               Three principles behind BlogForge
// //             </h3>
// //           </div>

// //           <div className="grid gap-5 md:grid-cols-3">
// //             {principles.map((principle) => (
// //               <div
// //                 key={principle.number}
// //                 className="rounded-xl border border-slate-200 bg-white p-6 transition-all hover:border-indigo-200 hover:shadow-sm"
// //               >
// //                 <span className="font-mono text-xs font-semibold text-indigo-500">
// //                   {principle.number}
// //                 </span>

// //                 <h4 className="mt-3 text-base font-semibold text-slate-900">
// //                   {principle.title}
// //                 </h4>

// //                 <p className="mt-2 text-sm leading-6 text-slate-500">
// //                   {principle.description}
// //                 </p>
// //               </div>
// //             ))}
// //           </div>
// //         </div>

// //         {/* Developer */}
// //         <div className="mt-14 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
// //           <div className="grid lg:grid-cols-[280px_1fr]">
// //             {/* Developer image placeholder */}
// //             <div className="flex min-h-[300px] items-center justify-center bg-[#080D1A] p-8">
// //               <div className="flex h-48 w-48 items-center justify-center rounded-2xl border border-indigo-500/30 bg-slate-900 shadow-xl">
// //                 {/*
// //                  * Replace this placeholder with the developer's picture later.
// //                  *
// //                  * Example:
// //                  * <img
// //                  *   src="/images/jahanzeb-riaz.jpg"
// //                  *   alt="Jahanzeb Riaz"
// //                  *   className="h-full w-full rounded-2xl object-cover"
// //                  * />
// //                  */}
// //                 <div className="text-center">
// //                   <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-600 text-2xl font-bold text-white">
// //                     JR
// //                   </div>

// //                   <p className="mt-3 text-xs text-slate-500">Developer photo</p>
// //                 </div>
// //               </div>
// //             </div>

// //             {/* Developer information */}
// //             <div className="p-7 sm:p-9">
// //               <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
// //                 Developer
// //               </p>

// //               <h3 className="mt-2 text-2xl font-bold text-slate-900">
// //                 Jahanzeb Riaz
// //               </h3>

// //               <p className="mt-1 text-sm font-medium text-slate-500">
// //                 Developer &amp; Creator of BlogForge
// //               </p>

// //               <div className="mt-6 max-w-3xl space-y-4 text-sm leading-6 text-slate-600">
// //                 <p>
// //                   BlogForge was created as a practical exploration of how
// //                   multi-agent AI systems can be used to support technical
// //                   content creation without hiding the important parts of the
// //                   process from the person using them.
// //                 </p>

// //                 <p>
// //                   The motivation behind the platform is straightforward:
// //                   technical writers and developers need content that is not only
// //                   fast to produce, but also structured, understandable, and
// //                   supported by reliable research.
// //                 </p>

// //                 <p>
// //                   The project therefore focuses on combining AI automation with
// //                   web research, workflow visibility, and human review. The goal
// //                   is not simply to generate more words, but to create a workflow
// //                   where users can understand how a technical blog moves from an
// //                   initial idea to a finished article.
// //                 </p>
// //               </div>

// //               <div className="mt-7 flex flex-wrap gap-2">
// //                 <Badge variant="info">AI Engineering</Badge>
// //                 <Badge variant="default">Full-Stack Development</Badge>
// //                 <Badge variant="default">Research Workflows</Badge>
// //                 <Badge variant="default">Technical Writing</Badge>
// //               </div>
// //             </div>
// //           </div>
// //         </div>

// //         {/* Closing CTA */}
// //         {onGetStarted && (
// //           <div className="mt-12 text-center">
// //             <h3 className="text-xl font-bold text-slate-900">
// //               See what BlogForge can build for you
// //             </h3>

// //             <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
// //               Start with a topic and let the workflow take you from idea,
// //               through research and writing, to a reviewable technical blog.
// //             </p>

// //             <div className="mt-5">
// //               <Button size="lg" onClick={onGetStarted}>
// //                 Start Writing
// //               </Button>
// //             </div>
// //           </div>
// //         )}
// //       </div>
// //     </section>
// //   );
// // }

// import { Button, Badge } from "../components/ui";

// interface AboutUsProps {
//   onGetStarted?: () => void;
// }

// export default function AboutUs({ onGetStarted }: AboutUsProps) {
//   return (
//     <section
//       id="about"
//       className="scroll-mt-16 border-b border-slate-200 bg-white px-4 py-16"
//     >
//       <div className="mx-auto max-w-7xl">
//         <div className="mx-auto max-w-3xl text-center">
//           <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
//             About BlogForge
//           </p>
//           <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
//             Built to make technical writing more reliable
//           </h2>
//           <p className="mt-4 text-base leading-7 text-slate-500">
//             BlogForge was created around a simple idea: technical content should
//             be useful, understandable, research-backed, and transparent about
//             how it was produced.
//           </p>
//         </div>

//         <div className="mt-12 grid gap-6 lg:grid-cols-3">
//           {[
//             {
//               number: "01",
//               title: "The problem",
//               text: "Creating a strong technical article often requires topic planning, source discovery, fact checking, writing, editing, and repeated review. Doing every stage manually takes significant time.",
//             },
//             {
//               number: "02",
//               title: "Our approach",
//               text: "BlogForge divides the process into focused workflow stages so AI agents can assist with planning, research, writing, review, and export while keeping important checkpoints visible.",
//             },
//             {
//               number: "03",
//               title: "The goal",
//               text: "The goal is not simply to generate more text. It is to create a controlled writing workflow that helps produce technical content with clearer structure, stronger source grounding, and human oversight.",
//             },
//           ].map((item) => (
//             <article
//               key={item.number}
//               className="rounded-2xl border border-slate-200 bg-slate-50 p-6"
//             >
//               <span className="text-xs font-bold tracking-widest text-indigo-600">
//                 {item.number}
//               </span>
//               <h3 className="mt-4 text-lg font-semibold text-slate-900">
//                 {item.title}
//               </h3>
//               <p className="mt-3 text-sm leading-6 text-slate-500">
//                 {item.text}
//               </p>
//             </article>
//           ))}
//         </div>

//         <div className="mt-16 overflow-hidden rounded-2xl border border-slate-200 bg-[#080D1A]">
//           <div className="grid items-center lg:grid-cols-[0.8fr_1.2fr]">
//             <div className="flex justify-center p-8 sm:p-12">
//               <div className="relative flex h-56 w-56 items-center justify-center overflow-hidden rounded-2xl border border-indigo-500/30 bg-slate-900">
//                 <div className="absolute inset-0 bg-[radial-gradient(#4F46E5_0.8px,transparent_0.8px)] [background-size:24px_24px] opacity-20" />

//                 {/* Replace this placeholder with the developer photo:
//                     /public/images/jahanzeb-riaz.jpg */}
//                 <div className="relative flex h-32 w-32 items-center justify-center rounded-full border-2 border-indigo-400/50 bg-indigo-950 text-4xl font-bold text-indigo-300 shadow-2xl shadow-indigo-500/20">
//                   JR
//                 </div>

//                 <div className="absolute bottom-4 rounded-full border border-indigo-800/60 bg-indigo-950/90 px-3 py-1 text-xs font-medium text-indigo-300">
//                   Developer
//                 </div>
//               </div>
//             </div>

//             <div className="p-8 sm:p-12">
//               <Badge variant="info">The developer behind BlogForge</Badge>

//               <h3 className="mt-5 text-3xl font-bold text-white">
//                 Jahanzeb Riaz
//               </h3>

//               <p className="mt-2 text-sm font-medium text-indigo-300">
//                 Developer & Creator of BlogForge
//               </p>

//               <p className="mt-6 text-sm leading-7 text-slate-400">
//                 BlogForge was built from the motivation to explore how
//                 multi-agent AI can make a complex technical-writing process more
//                 structured and manageable. Instead of treating AI as a single
//                 text-generation step, the platform separates the work into
//                 stages that can be inspected and reviewed.
//               </p>

//               <p className="mt-4 text-sm leading-7 text-slate-400">
//                 The project focuses on a practical problem faced by technical
//                 writers and developers: producing useful articles requires more
//                 than generating paragraphs. Research, source selection,
//                 organization, technical accuracy, review, and presentation all
//                 matter. BlogForge brings those activities into one workflow.
//               </p>

//               <div className="mt-7 grid gap-3 sm:grid-cols-3">
//                 {["AI agents", "Research", "Human review"].map((item) => (
//                   <div
//                     key={item}
//                     className="rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-3 text-center text-xs font-medium text-slate-300"
//                   >
//                     {item}
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>
//         </div>

//         <div className="mt-10 rounded-2xl border border-indigo-100 bg-indigo-50/60 px-6 py-8 text-center">
//           <h3 className="text-xl font-semibold text-slate-900">
//             Explore what BlogForge can create
//           </h3>
//           <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-500">
//             Start with a topic and let the workflow take you from an initial
//             idea toward a structured technical blog.
//           </p>

//           {onGetStarted && (
//             <div className="mt-5">
//               <Button onClick={onGetStarted}>Get Started with BlogForge</Button>
//             </div>
//           )}
//         </div>
//       </div>
//     </section>
//   );
// }

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
