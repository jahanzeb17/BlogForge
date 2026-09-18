import { useState } from "react";
import type { AdminPage, NavFn, Route } from "../../types";
import { Avatar, BlogForgeLogo, Button } from "../../components/ui";
import Dashboard from "./Dashboard";
import Users from "./Users";
import Runs from "./Runs";
import Security from "./Security";

const navigation: { id: AdminPage; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "users", label: "Users" },
  { id: "runs", label: "Blog Runs" },
  { id: "security", label: "Security / Guardrails" },
];

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
  const nav = (page: AdminPage) => {
    navigate({ section: "admin", page });
    setOpen(false);
  };

  const content =
    route.page === "dashboard" ? (
      <Dashboard navigate={navigate} />
    ) : route.page === "users" ? (
      <Users />
    ) : route.page === "runs" ? (
      <Runs />
    ) : (
      <Security />
    );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {open && (
        <button
          type="button"
          aria-label="Close admin navigation"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-950 text-white transition-transform lg:static lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="border-b border-slate-800 p-4">
          <BlogForgeLogo dark size="sm" />
        </div>
        <nav className="p-3" aria-label="Admin navigation">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Admin console
          </p>
          <div className="space-y-1">
            {navigation.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => nav(item.id)}
                className={`w-full rounded-md px-3 py-2 text-left text-sm transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${route.page === item.id ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-slate-800"}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </nav>
        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-800 p-3">
          <Button
            fullWidth
            variant="outline"
            size="sm"
            className="mb-2 border-slate-600 text-white hover:bg-slate-800"
            onClick={() => navigate({ section: "app", page: "new-blog" })}
          >
            Back to BlogForge
          </Button>
          <div className="flex items-center gap-3 px-2 py-2">
            <Avatar name={username} size="sm" />
            <span className="min-w-0 flex-1 truncate text-xs text-slate-200">
              {username}
            </span>
            <button
              type="button"
              onClick={onLogout}
              className="rounded text-xs text-slate-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Logout
            </button>
          </div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-3 text-white lg:hidden">
          <button
            type="button"
            aria-label="Open admin navigation"
            onClick={() => setOpen(true)}
            className="rounded px-2 py-1 text-lg text-slate-300 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            ☰
          </button>
          <span className="text-sm font-semibold">Admin Console</span>
          <Avatar name={username} size="sm" />
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto">{content}</main>
      </div>
    </div>
  );
}
