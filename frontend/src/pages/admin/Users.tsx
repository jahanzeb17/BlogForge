import { useEffect, useState } from "react";
import { Badge, Button, LoadingSpinner } from "../../components/ui";
import { api, type AdminUser } from "../../services/api";

export default function Users() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);

  useEffect(() => {
    api.admin
      .users()
      .then(setUsers)
      .catch((e) => setError(e.message || "Unable to load users."))
      .finally(() => setLoading(false));
  }, []);

  const handleRoleChange = async (user: AdminUser) => {
    const newRole = !user.is_admin;

    const confirmed = window.confirm(
      newRole
        ? `Make ${user.username} an administrator?`
        : `Remove administrator access from ${user.username}?`,
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setUpdatingUserId(user.user_id);

    try {
      const updated = await api.admin.updateUserRole(user.user_id, newRole);

      setUsers((currentUsers) =>
        currentUsers.map((currentUser) =>
          currentUser.user_id === updated.user_id
            ? {
                ...currentUser,
                is_admin: updated.is_admin,
              }
            : currentUser,
        ),
      );
    } catch (e: any) {
      setError(e?.message || "Unable to update the user's role.");
    } finally {
      setUpdatingUserId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error && users.length === 0) {
    return <div className="p-8 text-sm text-red-600">{error}</div>;
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold">Users</h1>

        <p className="text-sm text-slate-500 mt-1">
          Registered BlogForge accounts.
        </p>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
            {error}
          </div>
        )}

        {users.length === 0 ? (
          <div className="mt-6 bg-white border rounded-xl p-8 text-center text-sm text-slate-500">
            No users found.
          </div>
        ) : (
          <div className="mt-6 bg-white border rounded-xl overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left p-3">Username</th>

                  <th className="text-left p-3">Email</th>

                  <th className="text-left p-3">User ID</th>

                  <th className="text-left p-3">Role</th>

                  <th className="text-left p-3">Blogs</th>

                  <th className="text-left p-3">Joined</th>

                  <th className="text-left p-3">Action</th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => (
                  <tr key={user.user_id} className="border-t">
                    <td className="p-3 font-medium text-slate-800">
                      {user.username}
                    </td>

                    <td className="p-3 text-slate-600">{user.email}</td>

                    <td className="p-3 font-mono text-xs text-slate-500">
                      {user.user_id}
                    </td>

                    <td className="p-3">
                      <Badge variant={user.is_admin ? "purple" : "default"}>
                        {user.is_admin ? "Admin" : "User"}
                      </Badge>
                    </td>

                    <td className="p-3">{user.total_blogs_created}</td>

                    <td className="p-3 text-xs text-slate-500">
                      {user.joined_at
                        ? new Date(user.joined_at).toLocaleDateString()
                        : "—"}
                    </td>

                    <td className="p-3">
                      <Button
                        onClick={() => handleRoleChange(user)}
                        loading={updatingUserId === user.user_id}
                      >
                        {user.is_admin ? "Make User" : "Make Admin"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
