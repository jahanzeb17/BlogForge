import { useEffect, useState } from "react";
import type { NavFn } from "../../types";
import { Badge, LoadingSpinner } from "../../components/ui";
import { api } from "../../services/api";
export default function Users({
  _navigate,
}: {
  navigate: NavFn;
  _navigate?: NavFn;
}) {
  const [users, setUsers] = useState<any[]>([]);
  useEffect(() => {
    api.admin.users().then(setUsers);
  }, []);
  if (!users.length)
    return (
      <div className="p-8">
        <LoadingSpinner />
      </div>
    );
  return (
    <div className="p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-sm text-slate-500 mt-1">
          Registered BlogForge accounts.
        </p>
        <div className="mt-6 bg-white border rounded-xl overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left p-3">Username</th>
                <th className="text-left p-3">User ID</th>
                <th className="text-left p-3">Role</th>
                <th className="text-left p-3">Blogs</th>
                <th className="text-left p-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.user_id} className="border-t">
                  <td className="p-3 font-medium">{u.username}</td>
                  <td className="p-3 font-mono text-xs">{u.user_id}</td>
                  <td className="p-3">
                    <Badge variant={u.is_admin ? "purple" : "default"}>
                      {u.is_admin ? "Admin" : "User"}
                    </Badge>
                  </td>
                  <td className="p-3">{u.total_blogs_created}</td>
                  <td className="p-3 text-xs text-slate-500">
                    {u.joined_at
                      ? new Date(u.joined_at).toLocaleDateString()
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
