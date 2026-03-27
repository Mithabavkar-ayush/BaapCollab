import React, { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

interface AdminDashboardProps {
  user: any;
  token: string | null;
  setToast: (toast: { message: string; type: "success" | "error" } | null) => void;
}

export default function AdminDashboard({ user, token, setToast }: AdminDashboardProps) {
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [suspendModal, setSuspendModal] = useState<{ isOpen: boolean; targetId: number | null }>({ isOpen: false, targetId: null });
  const [suspendDays, setSuspendDays] = useState<string>("3");

  const isSuper = user?.role === "SUPERADMIN";

  const fetchUsers = async () => {
    if (!token) return;
    try {
      const res = await apiFetch("/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsersList(data);
      } else {
        const error = await res.json();
        setToast({ message: error.detail || "Failed to fetch users", type: "error" });
      }
    } catch (err) {
      setToast({ message: "Network error fetching users.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const handleRoleChange = async (userId: number, currentRole: string) => {
    if (!token || !isSuper) return;
    const newRole = currentRole === "STUDENT" ? "ADMIN" : "STUDENT";
    if (!window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;

    try {
      const res = await apiFetch(`/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setToast({ message: "Role updated successfully", type: "success" });
        fetchUsers();
      } else {
        if (res.status === 403) setToast({ message: "You do not have permission to perform this action.", type: "error" });
        else if (res.status === 404) setToast({ message: "User not found.", type: "error" });
        else {
          const e = await res.json();
          setToast({ message: e.detail || "Failed to update role", type: "error" });
        }
      }
    } catch (err) {
      setToast({ message: "Network error.", type: "error" });
    }
  };

  const handleBanToggle = async (userId: number, currentlyBanned: boolean) => {
    if (!token || !isSuper) return;
    const action = currentlyBanned ? "unban" : "ban";
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;

    try {
      const res = await apiFetch(`/admin/users/${userId}/ban`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ban: !currentlyBanned }),
      });
      if (res.ok) {
        setToast({ message: `User ${action}ned successfully`, type: "success" });
        fetchUsers();
      } else {
        if (res.status === 403) setToast({ message: "You do not have permission to perform this action.", type: "error" });
        else if (res.status === 404) setToast({ message: "User not found.", type: "error" });
        else {
          const e = await res.json();
          setToast({ message: e.detail || `Failed to ${action} user`, type: "error" });
        }
      }
    } catch (err) {
      setToast({ message: "Network error.", type: "error" });
    }
  };

  const handleSuspend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !isSuper || suspendModal.targetId === null) return;
    const days = parseInt(suspendDays);
    if (isNaN(days) || days <= 0) {
      setToast({ message: "Please enter a valid number of days", type: "error" });
      return;
    }

    try {
      const res = await apiFetch(`/admin/users/${suspendModal.targetId}/suspend`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ suspend: true, days }),
      });
      if (res.ok) {
        setToast({ message: "User suspended successfully", type: "success" });
        setSuspendModal({ isOpen: false, targetId: null });
        fetchUsers();
      } else {
        if (res.status === 403) setToast({ message: "You do not have permission to perform this action.", type: "error" });
        else if (res.status === 404) setToast({ message: "User not found.", type: "error" });
        else {
          const e = await res.json();
          setToast({ message: e.detail || "Failed to suspend user", type: "error" });
        }
      }
    } catch (err) {
      setToast({ message: "Network error.", type: "error" });
    }
  };

  const handleUnsuspend = async (userId: number) => {
    if (!token || !isSuper) return;
    if (!window.confirm(`Are you sure you want to unsuspend this user?`)) return;

    try {
      const res = await apiFetch(`/admin/users/${userId}/suspend`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ suspend: false }),
      });
      if (res.ok) {
        setToast({ message: "User unsuspended successfully", type: "success" });
        fetchUsers();
      } else {
        if (res.status === 403) setToast({ message: "You do not have permission.", type: "error" });
        else {
          const e = await res.json();
          setToast({ message: e.detail || "Error unsuspending", type: "error" });
        }
      }
    } catch (err) {
      setToast({ message: "Network error.", type: "error" });
    }
  };

  const handleApprove = async (userId: number, approved: boolean) => {
    if (!token) return;
    const action = approved ? "approve" : "reject";
    if (!window.confirm(`Are you sure you want to ${action} this new user?`)) return;

    try {
      const res = await apiFetch(`/admin/users/${userId}/${action}`, {
         method: "POST",
         headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        if (data.already_resolved) {
           setToast({ message: "This request has already been resolved.", type: "error" });
        } else {
           setToast({ message: `User ${action}d successfully.`, type: "success" });
        }
        fetchUsers();
      } else {
         if (res.status === 403) setToast({ message: "Permission denied", type: "error" });
         else setToast({ message: data.detail || `Failed to ${action}`, type: "error" });
      }
    } catch (err) {
      setToast({ message: "Network error.", type: "error" });
    }
  }

  const getStatusText = (u: any) => {
    if (u.is_banned) return <span className="text-red-600 font-bold">Banned</span>;
    if (u.is_suspended) {
      const dateStr = u.suspended_until ? new Date(u.suspended_until).toLocaleDateString() : "Indefinitely";
      return <span className="text-orange-500 font-bold">Suspended until {dateStr}</span>;
    }
    if (!u.is_approved) return <span className="text-yellow-600 font-bold">Pending Approval</span>;
    return <span className="text-green-600 font-bold">Active</span>;
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading users...</div>;
  }

  return (
    <div className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-gray-900">Admin Panel</h2>
          <p className="text-gray-500 mt-1">Manage users, roles, and moderation</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[800px]">
          <thead>
            <tr className="border-b border-gray-100 text-left">
              <th className="py-4 px-4 font-bold text-gray-500 text-sm">Name</th>
              <th className="py-4 px-4 font-bold text-gray-500 text-sm">Email</th>
              <th className="py-4 px-4 font-bold text-gray-500 text-sm">Role</th>
              <th className="py-4 px-4 font-bold text-gray-500 text-sm">Status</th>
              <th className="py-4 px-4 font-bold text-gray-500 text-sm text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {usersList.map((u) => {
              const restrictAdminTarget = u.id === user.id || u.role === "SUPERADMIN";

              return (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-4 font-medium text-gray-900">{u.name || "Unknown"}</td>
                  <td className="py-4 px-4 text-gray-500 text-sm">{u.email}</td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest ${u.role === 'SUPERADMIN' ? 'bg-purple-100 text-purple-700' : u.role === 'ADMIN' ? 'bg-indigo-100 text-[#524EEE]' : 'bg-gray-100 text-gray-600'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm">{getStatusText(u)}</td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                       {/* Pending Approval Actions for ADMIN & SUPERADMIN */}
                       {!u.is_approved && !u.is_banned && (
                          <>
                             <button onClick={() => handleApprove(u.id, true)} className="text-xs bg-emerald-100 text-emerald-700 font-bold px-3 py-1.5 rounded-lg hover:bg-emerald-200">Approve</button>
                             <button onClick={() => handleApprove(u.id, false)} className="text-xs bg-red-100 text-red-700 font-bold px-3 py-1.5 rounded-lg hover:bg-red-200">Reject</button>
                          </>
                       )}

                       {/* SUPERADMIN ONLY MODERATION ACTIONS */}
                       {isSuper && u.is_approved && (
                         <>
                          {/* Role Switch */}
                           <select
                              disabled={restrictAdminTarget}
                              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white disabled:opacity-50"
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.id, u.role)}
                           >
                             <option value="STUDENT">STUDENT</option>
                             <option value="ADMIN">ADMIN</option>
                             {u.role === "SUPERADMIN" && <option value="SUPERADMIN">SUPERADMIN</option>}
                           </select>

                          {/* Ban Toggle */}
                          <button
                            disabled={restrictAdminTarget}
                            onClick={() => handleBanToggle(u.id, u.is_banned)}
                            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${u.is_banned ? "bg-gray-800 text-white hover:bg-black" : "bg-red-50 text-red-600 hover:bg-red-100"}`}
                          >
                            {u.is_banned ? "Unban" : "Ban"}
                          </button>

                          {/* Suspend Toggle */}
                          {!u.is_banned && (
                            u.is_suspended ? (
                              <button disabled={restrictAdminTarget} onClick={() => handleUnsuspend(u.id)} className="text-xs bg-orange-100 text-orange-700 font-bold px-3 py-1.5 rounded-lg disabled:opacity-50 hover:bg-orange-200">
                                Lift Susp.
                              </button>
                            ) : (
                              <button disabled={restrictAdminTarget} onClick={() => setSuspendModal({ isOpen: true, targetId: u.id })} className="text-xs bg-orange-50 text-orange-600 font-bold px-3 py-1.5 rounded-lg disabled:opacity-50 hover:bg-orange-100">
                                Suspend
                              </button>
                            )
                          )}
                         </>
                       )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {usersList.length === 0 && (
              <tr>
                 <td colSpan={5} className="py-8 text-center text-gray-400">No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {suspendModal.isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl animate-in zoom-in duration-200">
            <h3 className="font-bold text-lg mb-4 text-gray-900">Suspend User</h3>
            <form onSubmit={handleSuspend}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Days)</label>
                <input
                  type="number"
                  min="1"
                  value={suspendDays}
                  onChange={(e) => setSuspendDays(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none"
                  required
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setSuspendModal({ isOpen: false, targetId: null })} className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-bold text-white bg-orange-500 rounded-xl hover:bg-orange-600">Apply Suspension</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
