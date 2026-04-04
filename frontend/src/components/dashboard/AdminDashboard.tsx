import React, { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

interface AdminDashboardProps {
  user: any;
  token: string | null;
  setToast: (toast: { message: string; type: "success" | "error" } | null) => void;
  latestWsApproval?: { userId: number; status: string; actedBy: string } | null;
}

export default function AdminDashboard({ user, token, setToast, latestWsApproval }: AdminDashboardProps) {
  const [usersList, setUsersList] = useState<any[]>([]);
  const [resolvedUsers, setResolvedUsers] = useState<Record<number, { status: string; actedBy: string }>>({});
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

  useEffect(() => {
    if (latestWsApproval) {
      setResolvedUsers(prev => ({
        ...prev,
        [latestWsApproval.userId]: { status: latestWsApproval.status, actedBy: latestWsApproval.actedBy }
      }));
    }
  }, [latestWsApproval]);

  const handleRoleChange = async (userId: number, currentRole: string) => {
    // This function is no longer used in this component but kept for reference if needed
    // The requirement says remove role management from Admin table
    return;
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
      if (res.ok) {
        setToast({ message: `User ${action}d successfully.`, type: "success" });
        setResolvedUsers(prev => ({
          ...prev,
          [userId]: { status: approved ? "approved" : "rejected", actedBy: user.name }
        }));
      } else {
        const data = await res.json().catch(() => ({}));
        if (res.status === 403) setToast({ message: "Permission denied", type: "error" });
        else setToast({ message: data.detail || `Failed to ${action}`, type: "error" });
      }
    } catch (err) {
      setToast({ message: "Network error.", type: "error" });
    }
  };

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
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-gray-900">Admin Panel</h2>
          <p className="text-gray-500 mt-1">Manage users, approvals, and platform moderation</p>
        </div>
      </div>

      {/* Pending Approvals Section */}
      {usersList.filter(u => !u.is_approved && !u.rejection_handled && !u.is_banned && !resolvedUsers[u.id]).length > 0 && (
        <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-2 mb-4">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            </span>
            <h3 className="text-lg font-bold text-amber-800">Pending Approvals</h3>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {usersList.filter(u => !u.is_approved && !u.rejection_handled && !u.is_banned && !resolvedUsers[u.id]).map(u => (
              <div key={u.id} className="bg-amber-50/50 border border-amber-100 rounded-2xl p-5 hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-gray-900">{u.name || "New User"}</h4>
                    <p className="text-xs text-gray-500">{u.email}</p>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Institution:</span>
                    <span className="text-xs text-gray-700 font-medium">{u.institution || "Not specified"}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider shrink-0 mt-0.5">Skills:</span>
                    <span className="text-xs text-gray-700 line-clamp-2">{u.skills || "No skills listed"}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => handleApprove(u.id, true)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 rounded-xl transition-colors"
                  >
                    Approve
                  </button>
                  <button 
                    onClick={() => handleApprove(u.id, false)}
                    className="flex-1 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold py-2 rounded-xl transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 border-b border-gray-100"></div>
        </div>
      )}

      {/* Main User Directory */}
      <div className="flex items-center gap-2 mb-6">
        <h3 className="text-lg font-bold text-gray-900">User Directory</h3>
        <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded-full">
          {usersList.filter(u => u.is_approved || resolvedUsers[u.id]).length} members
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[800px]">
          <thead>
            <tr className="border-b border-gray-100 text-left">
              <th className="py-4 px-2 font-bold text-gray-500 text-xs italic w-[15%]">Name</th>
              <th className="py-4 px-2 font-bold text-gray-500 text-xs italic w-[20%]">Email</th>
              <th className="py-4 px-2 font-bold text-gray-500 text-xs italic w-[20%]">Institution</th>
              <th className="py-4 px-2 font-bold text-gray-500 text-xs italic">Skills</th>
              <th className="py-4 px-2 font-bold text-gray-500 text-xs italic w-[100px]">Status</th>
              {isSuper && <th className="py-4 px-2 font-bold text-gray-500 text-xs italic text-right w-[120px]">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {usersList
              .filter(u => u.is_approved || resolvedUsers[u.id])
              .map((u) => {
              const restrictAdminTarget = u.id === user.id || u.role === "SUPERADMIN";
              const currentSessionStatus = resolvedUsers[u.id];
              const skillsArray = u.skills ? u.skills.split(',').map((s: string) => s.trim()).filter((s: string) => s !== "") : [];

              return (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="py-3 px-2 font-semibold text-gray-900 text-sm">
                    {u.name ? u.name : <span className="text-gray-400 italic">Pending Setup</span>}
                  </td>
                  <td className="py-3 px-2 text-gray-400 text-[11px] font-medium truncate max-w-[180px]">
                    {u.email}
                  </td>
                  <td className="py-3 px-2 text-gray-700 text-xs truncate max-w-[180px]" title={u.institution || ""}>
                    {u.institution || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex flex-wrap gap-1">
                      {skillsArray.slice(0, 2).map((skill: string, idx: number) => (
                        <span key={idx} className="px-2 py-0.5 bg-indigo-50 text-[#524EEE] text-[10px] font-bold rounded-md border border-indigo-100/50">
                          {skill}
                        </span>
                      ))}
                      {skillsArray.length > 2 && (
                        <span className="text-[10px] font-black text-gray-400 self-center">
                          +{skillsArray.length - 2} more
                        </span>
                      )}
                      {skillsArray.length === 0 && <span className="text-gray-300">—</span>}
                    </div>
                  </td>
                  <td className="py-3 px-2 text-xs">
                    {currentSessionStatus ? (
                      <span className={`px-2 py-1 rounded-md font-bold text-[9px] uppercase tracking-wider ${currentSessionStatus.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {currentSessionStatus.status}
                      </span>
                    ) : (
                        <div className="scale-90 origin-left whitespace-nowrap">
                            {getStatusText(u)}
                        </div>
                    )}
                  </td>
                  {isSuper && (
                    <td className="py-3 px-2 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                            {/* Ban Toggle */}
                            <button
                                disabled={restrictAdminTarget}
                                onClick={() => handleBanToggle(u.id, u.is_banned)}
                                className={`text-[9px] font-black uppercase tracking-wider px-2 py-1.5 rounded-lg transition-colors disabled:opacity-30 ${u.is_banned ? "bg-gray-800 text-white hover:bg-black" : "bg-red-50 text-red-600 hover:bg-red-100"}`}
                            >
                                {u.is_banned ? "Unban" : "Ban"}
                            </button>

                            {/* Suspend Toggle */}
                            {!u.is_banned && (
                                u.is_suspended ? (
                                <button disabled={restrictAdminTarget} onClick={() => handleUnsuspend(u.id)} className="text-[9px] bg-orange-100 text-orange-700 font-black uppercase tracking-wider px-2 py-1.5 rounded-lg disabled:opacity-30 hover:bg-orange-200">
                                    Lift
                                </button>
                                ) : (
                                <button disabled={restrictAdminTarget} onClick={() => setSuspendModal({ isOpen: true, targetId: u.id })} className="text-[9px] bg-orange-50 text-orange-600 font-black uppercase tracking-wider px-2 py-1.5 rounded-lg disabled:opacity-30 hover:bg-orange-100">
                                    Susp.
                                </button>
                                )
                            )}
                        </div>
                    </td>
                  )}
                </tr>
              );
            })}
            {usersList.length === 0 && (
              <tr>
                 <td colSpan={isSuper ? 6 : 5} className="py-8 text-center text-gray-400">No users found in the system.</td>
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
