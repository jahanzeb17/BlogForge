import { useEffect, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  LoadingSpinner,
  Modal,
} from "../../components/ui";
import { api, type AdminUser } from "../../services/api";

function formatDate(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

export default function Users() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingUser, setPendingUser] = useState<AdminUser | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;

    api.admin
      .users()
      .then((data) => {
        if (alive) {
          setUsers(data);
        }
      })
      .catch((e) => {
        if (alive) {
          setError(e instanceof Error ? e.message : "Unable to load users.");
        }
      })
      .finally(() => {
        if (alive) {
          setLoading(false);
        }
      });

    return () => {
      alive = false;
    };
  }, []);

  const handleRoleChange = async () => {
    if (!pendingUser) return;

    const user = pendingUser;

    setUpdatingUserId(user.user_id);
    setError("");

    try {
      const updated = await api.admin.updateUserRole(
        user.user_id,
        !user.is_admin,
      );

      setUsers((current) =>
        current.map((item) =>
          item.user_id === updated.user_id
            ? {
                ...item,
                is_admin: updated.is_admin,
              }
            : item,
        ),
      );

      setPendingUser(null);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to update the user's role.",
      );
    } finally {
      setUpdatingUserId(null);
    }
  };

  if (loading) {
    return (
      <div className="grid min-h-64 place-items-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <div className="p-4 sm:p-8">
        <div className="mx-auto max-w-7xl">
          <header>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
              Administration
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
              Users
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage registered BlogForge accounts and administrator access.
            </p>
          </header>

          {error && (
            <div className="mt-5">
              {/* Alert does not accept className in the current
                  shared UI component, so spacing is handled outside. */}
              <Alert variant="danger">{error}</Alert>
            </div>
          )}

          {users.length === 0 ? (
            <div className="mt-6 rounded-xl border border-slate-200 bg-white">
              <EmptyState title="No users found" />
            </div>
          ) : (
            <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-[1000px] w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      {[
                        "Username",
                        "Email",
                        "ID",
                        "Role",
                        "Blogs",
                        "Joined",
                        "Action",
                      ].map((heading) => (
                        <th
                          key={heading}
                          className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {users.map((user) => {
                      const updating = updatingUserId === user.user_id;

                      return (
                        <tr
                          key={user.user_id}
                          className="border-t border-slate-100 align-middle transition-colors hover:bg-slate-50/70"
                        >
                          <td className="px-4 py-4">
                            <span className="font-medium text-slate-800">
                              {user.username}
                            </span>
                          </td>

                          <td className="max-w-xs px-4 py-4">
                            <span className="break-all text-slate-600">
                              {user.email}
                            </span>
                          </td>

                          <td className="whitespace-nowrap px-4 py-4 font-mono text-xs text-slate-400">
                            {user.user_id}
                          </td>

                          <td className="px-4 py-4">
                            {/* Changed from the unsupported "purple"
                                variant to the supported "info" variant.
                                Indigo keeps the admin role visually
                                connected to the Admin Console theme. */}
                            <Badge variant={user.is_admin ? "info" : "default"}>
                              {user.is_admin ? "Admin" : "User"}
                            </Badge>
                          </td>

                          <td className="px-4 py-4 text-slate-700">
                            {user.total_blogs_created}
                          </td>

                          <td className="whitespace-nowrap px-4 py-4 text-xs text-slate-500">
                            {formatDate(user.joined_at)}
                          </td>

                          <td className="px-4 py-4">
                            <Button
                              size="sm"
                              variant={user.is_admin ? "danger" : "outline"}
                              disabled={updating}
                              onClick={() => setPendingUser(user)}
                            >
                              {updating
                                ? "Updating..."
                                : user.is_admin
                                  ? "Make user"
                                  : "Make admin"}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile hint for the horizontally scrollable
                  admin table. */}
              <div className="border-t border-slate-100 bg-slate-50 px-4 py-2 text-center text-[11px] text-slate-400 sm:hidden">
                Swipe horizontally to view all columns.
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal
        open={Boolean(pendingUser)}
        onClose={() => updatingUserId === null && setPendingUser(null)}
        title={
          pendingUser?.is_admin
            ? "Remove administrator access?"
            : "Grant administrator access?"
        }
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              disabled={updatingUserId !== null}
              onClick={() => setPendingUser(null)}
            >
              Cancel
            </Button>

            <Button
              variant={pendingUser?.is_admin ? "danger" : "primary"}
              disabled={updatingUserId !== null}
              onClick={handleRoleChange}
            >
              {updatingUserId !== null
                ? "Updating..."
                : pendingUser?.is_admin
                  ? "Remove access"
                  : "Make admin"}
            </Button>
          </div>
        }
      >
        <p className="text-sm leading-6 text-slate-600">
          {pendingUser?.is_admin ? (
            <>
              This will remove administrator access from{" "}
              <strong className="text-slate-800">{pendingUser.username}</strong>
              .
            </>
          ) : (
            <>
              This will grant administrator access to{" "}
              <strong className="text-slate-800">
                {pendingUser?.username}
              </strong>
              , including access to the Admin Console.
            </>
          )}
        </p>
      </Modal>
    </>
  );
}
