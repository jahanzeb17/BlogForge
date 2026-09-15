import { useEffect, useState } from "react";
import type { Route } from "./types";
import Landing from "./pages/Landing";
import { LoginPage, RegisterPage } from "./pages/Auth";
import AppShell from "./pages/app/Shell";
import AdminShell from "./pages/admin/Shell";
import {
  api,
  clearToken,
  clearRunId,
  getStoredRunId,
  saveRunId,
  saveToken,
  type User,
  type RunDetail,
  type AuthResponse,
} from "./services/api";

export default function App() {
  const [route, setRoute] = useState<Route>({
    section: "public",
    page: "landing",
  });

  const [user, setUser] = useState<User | null>(null);

  const [runId, setRunIdState] = useState<string | null>(() =>
    getStoredRunId(),
  );

  const [booting, setBooting] = useState(true);

  const setRunId = (id: string | null) => {
    setRunIdState(id);

    if (id) {
      saveRunId(id);
    } else {
      clearRunId();
    }
  };

  const routeForRun = (
    run: Pick<RunDetail, "status" | "interrupt_type">,
  ): Route => {
    if (run.interrupt_type === "research_plan_review") {
      return {
        section: "app",
        page: "outline-review",
      };
    }

    if (run.interrupt_type === "final_draft_review") {
      return {
        section: "app",
        page: "blog-workspace",
      };
    }

    if (run.status === "completed") {
      return {
        section: "app",
        page: "blog-workspace",
      };
    }

    return {
      section: "app",
      page: "workflow",
    };
  };

  useEffect(() => {
    if (!localStorage.getItem("blogforge_token")) {
      setBooting(false);
      return;
    }

    api
      .me()
      .then(async (u) => {
        setUser(u);

        if (u.is_admin) {
          setRoute({
            section: "admin",
            page: "dashboard",
          });

          return;
        }

        const storedId = getStoredRunId();

        if (storedId) {
          try {
            const run = await api.getRun(storedId);

            setRunIdState(storedId);
            setRoute(routeForRun(run));

            return;
          } catch {
            clearRunId();
            setRunIdState(null);
          }
        }

        setRoute({
          section: "app",
          page: "new-blog",
        });
      })
      .catch(() => {
        clearToken();
        clearRunId();
        setRunIdState(null);
      })
      .finally(() => setBooting(false));
  }, []);

  const navigate = (newRoute: Route) => {
    setRoute(newRoute);
  };

  const handleAuth = async (auth: AuthResponse) => {
    saveToken(auth.access_token);

    try {
      const u = await api.me();

      setUser(u);

      setRoute(
        u.is_admin
          ? {
              section: "admin",
              page: "dashboard",
            }
          : {
              section: "app",
              page: "new-blog",
            },
      );
    } catch (error) {
      clearToken();
      throw error;
    }
  };

  useEffect(() => {
    const onUnauthorized = () => {
      clearToken();
      clearRunId();

      setUser(null);
      setRunIdState(null);

      setRoute({
        section: "public",
        page: "login",
      });
    };

    window.addEventListener("blogforge:unauthorized", onUnauthorized);

    return () => {
      window.removeEventListener("blogforge:unauthorized", onUnauthorized);
    };
  }, []);

  const handleLogout = () => {
    clearToken();
    setUser(null);
    setRunId(null);

    setRoute({
      section: "public",
      page: "landing",
    });
  };

  const startRun = (id: string) => {
    setRunId(id);

    setRoute({
      section: "app",
      page: "workflow",
    });
  };

  if (booting) {
    return (
      <div className="h-screen grid place-items-center bg-slate-50 text-sm text-slate-500">
        Loading BlogForge…
      </div>
    );
  }

  if (route.section === "public") {
    if (route.page === "landing") {
      return <Landing navigate={navigate} />;
    }

    if (route.page === "login") {
      return (
        <LoginPage
          navigate={navigate}
          onLogin={handleAuth}
          initialEmail={route.loginEmail}
          registrationSuccess={route.registrationSuccess}
        />
      );
    }

    if (route.page === "register") {
      return <RegisterPage navigate={navigate} onLogin={handleAuth} />;
    }
  }

  if (!user) {
    return <LoginPage navigate={navigate} onLogin={handleAuth} />;
  }

  if (route.section === "app") {
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
  }

  if (route.section === "admin") {
    return (
      <AdminShell
        route={route}
        navigate={navigate}
        onLogout={handleLogout}
        username={user.username}
      />
    );
  }

  return null;
}
