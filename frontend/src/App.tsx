import { useEffect, useState } from "react";
import type { Route } from "./types";
import Landing from "./pages/Landing";
import { LoginPage, RegisterPage } from "./pages/Auth";
import AppShell from "./pages/app/Shell";
import AdminShell from "./pages/admin/Shell";
import { api, clearToken, saveToken, type User } from "./services/api";

export default function App() {
  const [route, setRoute] = useState<Route>({
    section: "public",
    page: "landing",
  });
  const [user, setUser] = useState<User | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem("blogforge_token")) {
      setBooting(false);
      return;
    }
    api
      .me()
      .then((u) => {
        setUser(u);
        setRoute(
          u.is_admin
            ? { section: "admin", page: "dashboard" }
            : { section: "app", page: "new-blog" },
        );
      })
      .catch(() => clearToken())
      .finally(() => setBooting(false));
  }, []);

  const navigate = (newRoute: Route) => setRoute(newRoute);
  const handleAuth = async (auth: { access_token: string }) => {
    saveToken(auth.access_token);
    const u = await api.me();
    setUser(u);
    setRoute(
      u.is_admin
        ? { section: "admin", page: "dashboard" }
        : { section: "app", page: "new-blog" },
    );
  };
  const handleLogout = () => {
    clearToken();
    setUser(null);
    setRunId(null);
    setRoute({ section: "public", page: "landing" });
  };
  const startRun = (id: string) => {
    setRunId(id);
    setRoute({ section: "app", page: "workflow" });
  };

  if (booting)
    return (
      <div className="h-screen grid place-items-center bg-slate-50 text-sm text-slate-500">
        Loading BlogForge…
      </div>
    );
  if (route.section === "public") {
    if (route.page === "landing") return <Landing navigate={navigate} />;
    if (route.page === "login")
      return <LoginPage navigate={navigate} onLogin={handleAuth} />;
    if (route.page === "register")
      return <RegisterPage navigate={navigate} onLogin={handleAuth} />;
  }
  if (!user) return <LoginPage navigate={navigate} onLogin={handleAuth} />;
  if (route.section === "app")
    return (
      <AppShell
        route={route}
        navigate={navigate}
        onLogout={handleLogout}
        isAdmin={user.is_admin}
        runId={runId}
        setRunId={setRunId}
        startRun={startRun}
        username={user.username}
      />
    );
  if (route.section === "admin")
    return (
      <AdminShell
        route={route}
        navigate={navigate}
        onLogout={handleLogout}
        username={user.username}
      />
    );
  return null;
}
