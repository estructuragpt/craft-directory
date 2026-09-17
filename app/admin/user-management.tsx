"use client";

import { useEffect, useState } from "react";
import { manageableRoles, type ManageableRole } from "../../src/lib/admin-users";

type AdminUser = { id: string; email: string; name: string; role: string };

export default function AdminUserManagement() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const response = await fetch("/api/admin/users", { cache: "no-store" });
      const result = await response.json().catch(() => null) as AdminUser[] | { error?: string } | null;
      if (!response.ok || !Array.isArray(result)) setError((result && !Array.isArray(result) ? result.error : null) ?? "Unable to load users.");
      else setUsers(result);
      setLoading(false);
    })();
  }, []);

  async function updateRole(userId: string, role: ManageableRole) {
    setUpdatingId(userId); setError(""); setSuccess("");
    const response = await fetch("/api/admin/users", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ userId, role }) });
    const result = await response.json().catch(() => null) as AdminUser | { error?: string } | null;
    if (!response.ok || !result || !("id" in result)) setError((result && "error" in result ? result.error : null) ?? "Unable to update the role.");
    else { setUsers((current) => current.map((user) => user.id === result.id ? result : user)); setSuccess(`Updated ${result.name}'s role.`); }
    setUpdatingId(null);
  }

  return <main className="workspace admin-users"><p className="eyebrow">ADMINISTRATION</p><h1>User role management</h1><p className="dashboard-summary">Assign application roles. Changes are recorded in the audit log.</p>{loading && <p>Loading users…</p>}{error && <p className="admin-message error" role="alert">{error}</p>}{success && <p className="admin-message success" role="status">{success}</p>}{!loading && !error && <div className="admin-user-list" aria-label="Users">{users.map((user) => <article key={user.id}><div><strong>{user.name}</strong><span>{user.email}</span></div><label>Role<select value={user.role} disabled={updatingId === user.id} onChange={(event) => void updateRole(user.id, event.target.value as ManageableRole)}>{manageableRoles.map((role) => <option key={role} value={role}>{role}</option>)}</select></label></article>)}{users.length === 0 && <p>No users found.</p>}</div>}</main>;
}
