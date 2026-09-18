// import { useEffect, useState } from "react";
// import type { AppPage, NavFn, Route } from "../../types";
// import { routeForRun, toUiStatus } from "../../types";
// import {
//   Avatar,
//   BlogForgeLogo,
//   Button,
//   StatusBadge,
// } from "../../components/ui";
// import { api, type RunSummary } from "../../services/api";
// import NewBlogPage from "./NewBlog";
// import WorkflowPage from "./Workflow";
// import OutlineReviewPage from "./OutlineReview";
// import BlogWorkspacePage from "./BlogWorkspace";
// import MyBlogsPage from "./MyBlogs";
// import ActivityPage from "./ActivityPage";

// interface Props {
//   route: Route & { section: "app" };
//   navigate: NavFn;
//   onLogout: () => void;
//   isAdmin: boolean;
//   runId: string | null;
//   setRunId: (id: string | null) => void;
//   startRun: (id: string) => void;
//   username: string;
// }

// const primaryNav: { id: AppPage; label: string }[] = [
//   { id: "new-blog", label: "New Blog" },
//   { id: "my-blogs", label: "My Blogs" },
//   { id: "activity", label: "Activity" },
// ];

// export default function AppShell({
//   route,
//   navigate,
//   onLogout,
//   isAdmin,
//   runId,
//   setRunId,
//   startRun,
//   username,
// }: Props) {
//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const [runs, setRuns] = useState<RunSummary[]>([]);

//   useEffect(() => {
//     let alive = true;
//     const refresh = () => {
//       api
//         .getRuns()
//         .then((data) => {
//           if (alive) setRuns(data.slice(0, 8));
//         })
//         .catch(() => undefined);
//     };

//     refresh();
//     const timer = window.setInterval(refresh, 5000);
//     return () => {
//       alive = false;
//       window.clearInterval(timer);
//     };
//   }, [route.page]);

//   const openRun = (run: RunSummary) => {
//     setRunId(run.id);
//     navigate(routeForRun(run));
//     setSidebarOpen(false);
//   };

//   const Sidebar = () => (
//     <div className="flex h-full flex-col">
//       <div className="border-b border-slate-200 px-4 py-4">
//         <BlogForgeLogo size="sm" />
//       </div>

//       <nav className="p-3" aria-label="Main navigation">
//         <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
//           Workspace
//         </p>
//         <div className="space-y-1">
//           {primaryNav.map((item) => (
//             <button
//               key={item.id}
//               type="button"
//               onClick={() => {
//                 navigate({ section: "app", page: item.id });
//                 setSidebarOpen(false);
//               }}
//               className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
//                 route.page === item.id
//                   ? "bg-indigo-50 font-medium text-indigo-700"
//                   : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
//               }`}
//             >
//               {item.label}
//             </button>
//           ))}
//         </div>
//       </nav>

//       <div className="mx-3 border-t border-slate-200" />

//       <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
//         <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
//           Recent runs
//         </p>
//         {runs.length === 0 ? (
//           <p className="px-3 py-2 text-xs text-slate-400">No runs yet.</p>
//         ) : (
//           <div className="space-y-1">
//             {runs.map((run) => (
//               <button
//                 key={run.id}
//                 type="button"
//                 onClick={() => openRun(run)}
//                 className="w-full rounded-md px-3 py-2.5 text-left transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
//               >
//                 <p className="truncate text-xs font-medium text-slate-700">
//                   {run.topic}
//                 </p>
//                 <div className="mt-1.5">
//                   <StatusBadge status={toUiStatus(run.status)} />
//                 </div>
//               </button>
//             ))}
//           </div>
//         )}
//       </div>

//       <div className="border-t border-slate-200 p-3">
//         {isAdmin && (
//           <Button
//             fullWidth
//             variant="outline"
//             size="sm"
//             className="mb-2"
//             onClick={() => navigate({ section: "admin", page: "dashboard" })}
//           >
//             Admin Console
//           </Button>
//         )}
//         <div className="flex items-center gap-3 rounded-lg px-2 py-2">
//           <Avatar name={username} />
//           <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-700">
//             {username}
//           </span>
//           <button
//             type="button"
//             onClick={onLogout}
//             className="text-xs font-medium text-slate-400 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
//           >
//             Logout
//           </button>
//         </div>
//       </div>
//     </div>
//   );

//   return (
//     <div className="flex h-screen overflow-hidden bg-slate-50">
//       {sidebarOpen && (
//         <button
//           type="button"
//           aria-label="Close navigation"
//           className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden"
//           onClick={() => setSidebarOpen(false)}
//         />
//       )}

//       <aside
//         className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-slate-200 bg-white transition-transform lg:static lg:translate-x-0 ${
//           sidebarOpen ? "translate-x-0" : "-translate-x-full"
//         }`}
//       >
//         <Sidebar />
//       </aside>

//       <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
//         <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
//           <button
//             type="button"
//             aria-label="Open navigation"
//             onClick={() => setSidebarOpen(true)}
//             className="rounded-md px-2 py-1 text-lg text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
//           >
//             ☰
//           </button>
//           <BlogForgeLogo size="sm" />
//           <Avatar name={username} size="sm" />
//         </header>

//         <main className="min-h-0 flex-1 overflow-y-auto">
//           {route.page === "new-blog" && <NewBlogPage startRun={startRun} />}
//           {route.page === "workflow" && runId && (
//             <WorkflowPage navigate={navigate} runId={runId} />
//           )}
//           {route.page === "outline-review" && runId && (
//             <OutlineReviewPage navigate={navigate} runId={runId} />
//           )}
//           {route.page === "blog-workspace" && runId && (
//             <BlogWorkspacePage navigate={navigate} runId={runId} />
//           )}
//           {route.page === "my-blogs" && (
//             <MyBlogsPage navigate={navigate} setRunId={setRunId} />
//           )}
//           {route.page === "activity" && (
//             <ActivityPage navigate={navigate} setRunId={setRunId} />
//           )}
//         </main>
//       </div>
//     </div>
//   );
// }

import { useEffect, useState } from "react";
import type { AppPage, NavFn, Route } from "../../types";
import { routeForRun, toUiStatus } from "../../types";
import {
  Avatar,
  BlogForgeLogo,
  Button,
  StatusBadge,
} from "../../components/ui";
import { api, type RunSummary } from "../../services/api";
import NewBlogPage from "./NewBlog";
import WorkflowPage from "./Workflow";
import OutlineReviewPage from "./OutlineReview";
import BlogWorkspacePage from "./BlogWorkspace";
import MyBlogsPage from "./MyBlogs";
import ActivityPage from "./ActivityPage";

interface Props {
  route: Route & { section: "app" };
  navigate: NavFn;
  onLogout: () => void;
  isAdmin: boolean;
  runId: string | null;
  setRunId: (id: string | null) => void;
  startRun: (id: string) => void;
  username: string;
}

const primaryNav: { id: AppPage; label: string }[] = [
  { id: "new-blog", label: "New Blog" },
  { id: "my-blogs", label: "My Blogs" },
  { id: "activity", label: "Activity" },
];

export default function AppShell({
  route,
  navigate,
  onLogout,
  isAdmin,
  runId,
  setRunId,
  startRun,
  username,
}: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [runs, setRuns] = useState<RunSummary[]>([]);

  useEffect(() => {
    let alive = true;

    const refresh = () => {
      api
        .getRuns()
        .then((data) => {
          if (alive) setRuns(data.slice(0, 8));
        })
        .catch(() => undefined);
    };

    refresh();

    const timer = window.setInterval(refresh, 5000);

    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [route.page]);

  const openRun = (run: RunSummary) => {
    setRunId(run.id);
    navigate(routeForRun(run));
    setSidebarOpen(false);
  };

  const Sidebar = () => (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 px-4 py-4">
        <BlogForgeLogo size="sm" />
      </div>

      <nav className="p-3" aria-label="Main navigation">
        {/* Added a subtle indigo accent to make the light user sidebar
            visually connected to the BlogForge/admin color system. */}
        <div className="flex items-center gap-2 px-3 pb-2">
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 rounded-full bg-indigo-500"
          />
          <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-500">
            Workspace
          </p>
        </div>

        <div className="space-y-1">
          {primaryNav.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                navigate({
                  section: "app",
                  page: item.id,
                });
                setSidebarOpen(false);
              }}
              className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                route.page === item.id
                  ? "bg-indigo-50 font-medium text-indigo-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      <div className="mx-3 border-t border-slate-200" />

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {/* Added the same subtle indigo treatment to Recent Runs
            for consistency with the Workspace section. */}
        <div className="mb-2 flex items-center gap-2 px-3">
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 rounded-full bg-indigo-400"
          />
          <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-500">
            Recent runs
          </p>
        </div>

        {runs.length === 0 ? (
          <p className="px-3 py-2 text-xs text-slate-400">No runs yet.</p>
        ) : (
          <div className="space-y-1">
            {runs.map((run) => (
              <button
                key={run.id}
                type="button"
                onClick={() => openRun(run)}
                className="w-full rounded-md px-3 py-2.5 text-left transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <p className="truncate text-xs font-medium text-slate-700">
                  {run.topic}
                </p>

                <div className="mt-1.5">
                  <StatusBadge status={toUiStatus(run.status)} />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 p-3">
        {isAdmin && (
          <Button
            fullWidth
            variant="outline"
            size="sm"
            className="mb-2 border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800"
            onClick={() => {
              navigate({
                section: "admin",
                page: "dashboard",
              });

              // Close the sidebar automatically on mobile after navigation.
              setSidebarOpen(false);
            }}
          >
            Admin Console
          </Button>
        )}

        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <Avatar name={username} />

          <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-700">
            {username}
          </span>

          <button
            type="button"
            onClick={onLogout}
            className="rounded text-xs font-medium text-slate-400 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-slate-200 bg-white transition-transform lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <button
            type="button"
            aria-label="Open navigation"
            onClick={() => setSidebarOpen(true)}
            className="rounded-md px-2 py-1 text-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            ☰
          </button>

          <BlogForgeLogo size="sm" />

          <Avatar name={username} size="sm" />
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto">
          {route.page === "new-blog" && <NewBlogPage startRun={startRun} />}

          {route.page === "workflow" && runId && (
            <WorkflowPage navigate={navigate} runId={runId} />
          )}

          {route.page === "outline-review" && runId && (
            <OutlineReviewPage navigate={navigate} runId={runId} />
          )}

          {route.page === "blog-workspace" && runId && (
            <BlogWorkspacePage navigate={navigate} runId={runId} />
          )}

          {route.page === "my-blogs" && (
            <MyBlogsPage navigate={navigate} setRunId={setRunId} />
          )}

          {route.page === "activity" && (
            <ActivityPage navigate={navigate} setRunId={setRunId} />
          )}
        </main>
      </div>
    </div>
  );
}
