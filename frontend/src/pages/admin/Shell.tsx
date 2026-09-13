import { useState } from "react";
import type { Route, NavFn } from "../../types";
import { BlogForgeLogo, Avatar } from "../../components/ui";
import Dashboard from "./Dashboard";
import Users from "./Users";
import Runs from "./Runs";
import Security from "./Security";
export default function AdminShell({
  route,
  navigate,
  onLogout,
  username,
}: {
  route: Route & { section: "admin" };
  navigate: NavFn;
  onLogout: () => void;
  username: string;
}) {
  const [open, setOpen] = useState(false);
  const nav = (page: any) => {
    navigate({ section: "admin", page });
    setOpen(false);
  };
  const content =
    route.page === "dashboard" ? (
      <Dashboard navigate={navigate} />
    ) : route.page === "users" ? (
      <Users navigate={navigate} />
    ) : route.page === "runs" ? (
      <Runs navigate={navigate} />
    ) : (
      <Security navigate={navigate} />
    );
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-slate-950 text-white transition-transform ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="p-4 border-b border-slate-800">
          <BlogForgeLogo dark size="sm" />
        </div>
        <nav className="p-3 space-y-1">
          {[
            ["dashboard", "Dashboard"],
            ["users", "Users"],
            ["runs", "Blog Runs"],
            ["security", "Security / Guardrails"],
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => nav(id)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm ${route.page === id ? "bg-indigo-600" : "text-slate-300 hover:bg-slate-800"}`}
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-slate-800">
          <button
            onClick={() => navigate({ section: "app", page: "new-blog" })}
            className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded"
          >
            ← Back to BlogForge
          </button>
          <div className="flex items-center gap-3 mt-2 px-2 py-2">
            <Avatar name={username} size="sm" />
            <span className="text-xs truncate flex-1">{username}</span>
            <button onClick={onLogout} className="text-xs text-slate-400">
              Logout
            </button>
          </div>
        </div>
      </aside>
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="lg:hidden bg-slate-950 text-white p-3 flex justify-between">
          <button onClick={() => setOpen(true)}>☰</button>
          <span className="text-sm font-semibold">Admin Console</span>
        </div>
        <main className="flex-1 overflow-y-auto">{content}</main>
      </div>
    </div>
  );
}
