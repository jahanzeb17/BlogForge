import { useEffect, useState } from "react";
import type { Route, NavFn } from "../../types";
import { BlogForgeLogo, StatusBadge, Avatar } from "../../components/ui";
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
  const refresh = () =>
    api
      .getRuns()
      .then(setRuns)
      .catch(() => {});
  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 5000);
    return () => clearInterval(t);
  }, []);
  const handleRunClick = (id: string, status: string) => {
    setRunId(id);
    navigate({
      section: "app",
      page:
        status === "interrupted"
          ? "outline-review"
          : status === "completed"
            ? "blog-workspace"
            : "workflow",
    });
    setSidebarOpen(false);
  };
  const Sidebar = () => (
    <div className="flex flex-col h-full">
      <div className="px-4 py-4 border-b border-slate-200">
        <BlogForgeLogo size="sm" />
      </div>
      <nav className="p-3 space-y-1">
        {[
          ["new-blog", "New Blog"],
          ["my-blogs", "My Blogs"],
          ["activity", "Activity"],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => {
              navigate({ section: "app", page: id as any });
              setSidebarOpen(false);
            }}
            className={`w-full text-left px-3 py-2 rounded-md text-sm ${route.page === id ? "bg-indigo-50 text-indigo-700 font-medium" : "text-slate-600 hover:bg-slate-100"}`}
          >
            {label}
          </button>
        ))}
      </nav>
      <div className="mx-3 border-t border-slate-200" />
      <div className="flex-1 overflow-y-auto px-3 py-3">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider px-3 mb-2">
          Recent
        </p>
        {runs.map((r) => (
          <button
            key={r.id}
            onClick={() => handleRunClick(r.id, r.status)}
            className="w-full text-left px-3 py-2.5 rounded-md hover:bg-slate-100"
          >
            <p className="text-xs font-medium text-slate-700 truncate">
              {r.topic}
            </p>
            <div className="mt-1">
              <StatusBadge
                status={
                  (r.status === "interrupted"
                    ? "waiting"
                    : ["pending", "resuming"].includes(r.status)
                      ? "running"
                      : r.status) as any
                }
              />
            </div>
          </button>
        ))}
      </div>
      <div className="p-3 border-t border-slate-200">
        {isAdmin && (
          <button
            onClick={() => navigate({ section: "admin", page: "dashboard" })}
            className="w-full mb-2 px-3 py-2 rounded-md text-sm text-purple-700 bg-purple-50"
          >
            Admin Panel
          </button>
        )}
        <div className="flex items-center gap-3 px-3 py-2">
          <Avatar name={username} />
          <span className="text-xs font-medium truncate flex-1">
            {username}
          </span>
          <button
            onClick={onLogout}
            className="text-xs text-slate-400 hover:text-red-500"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 transition-transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <Sidebar />
      </aside>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200">
          <button onClick={() => setSidebarOpen(true)}>☰</button>
          <BlogForgeLogo size="sm" />
          <Avatar name={username} size="sm" />
        </div>
        <main className="flex-1 overflow-y-auto">
          {route.page === "new-blog" && (
            <NewBlogPage navigate={navigate} startRun={startRun} />
          )}{" "}
          {route.page === "workflow" && runId && (
            <WorkflowPage navigate={navigate} runId={runId} />
          )}{" "}
          {route.page === "outline-review" && runId && (
            <OutlineReviewPage
              navigate={navigate}
              runId={runId}
              setRunId={setRunId}
            />
          )}{" "}
          {route.page === "blog-workspace" && runId && (
            <BlogWorkspacePage navigate={navigate} runId={runId} />
          )}{" "}
          {route.page === "my-blogs" && (
            <MyBlogsPage navigate={navigate} setRunId={setRunId} />
          )}{" "}
          {route.page === "activity" && <ActivityPage navigate={navigate} />}
        </main>
      </div>
    </div>
  );
}
