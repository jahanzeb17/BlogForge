export type PublicPage = 'landing' | 'login' | 'register' | 'blogs' | 'about'
export type AppPage = 'new-blog' | 'workflow' | 'outline-review' | 'blog-workspace' | 'my-blogs' | 'activity'
export type AdminPage = 'dashboard' | 'users' | 'runs' | 'security'
export type Route =
  | { section: 'public'; page: PublicPage }
  | { section: 'app'; page: AppPage }
  | { section: 'admin'; page: AdminPage }
export type NavFn = (route: Route) => void
export type WorkflowStatus = 'pending' | 'running' | 'completed' | 'failed' | 'waiting'
export interface WorkflowStep { id: string; label: string; description: string; isHITL?: boolean }
export interface BlogRun { id: string; topic: string; status: 'draft' | 'running' | 'waiting' | 'completed' | 'failed'; created: string; updated: string; user?: string; error?: string }
export interface Source { id: string; title: string; url: string; publisher: string; type: 'documentation' | 'paper' | 'publication' | 'standard' | 'other'; section: string; snippet: string; date?: string }
export interface PlanSection { id: number; title: string; goal: string; researchFocus: string }
export interface AdminUser { id: string; username: string; role: 'user' | 'admin'; joined: string; blogsCreated: number; lastActive: string }
export interface SecurityEvent { id: string; runId: string; username: string; attempted: string; result: string; timestamp: string }
export function routeForRun(
  run: Pick<BlogRun, "status" | "interrupt_type">
): Route {
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
}

export function toUiStatus(
  status: BlogRun["status"]
): WorkflowStatus {
  if (status === "draft") return "pending";
  if (status === "waiting") return "waiting";
  if (status === "running") return "running";
  if (status === "completed") return "completed";
  if (status === "failed") return "failed";

  return "pending";
}
