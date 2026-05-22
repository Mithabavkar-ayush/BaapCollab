"use client";

import Link from "next/link";
import { SUPPORTED_BRANCHES } from "@/data/institutions";
import { formatDistanceToNow } from "date-fns";

interface DashboardHomeProps {
    user: any;
    initials: string;
    userBranchName: string;
    imgError: boolean;
    setImgError: (error: boolean) => void;
    lfmPosts: any[];
    forumPosts: any[];
    leaderboard: any[];
    setActiveTab: (tab: 'dashboard' | 'projects' | 'forum' | 'settings' | 'admin') => void;
    setModalType: (type: 'project' | 'discussion') => void;
    setShowCreateModal: (show: boolean) => void;
    setToast: (toast: { message: string; type: 'success' | 'error' } | null) => void;
}

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { API_BASE, apiFetch } from "@/lib/api";

export default function DashboardHome({
    user,
    initials,
    userBranchName,
    imgError,
    setImgError,
    lfmPosts,
    forumPosts,
    leaderboard,
    setActiveTab,
    setModalType,
    setShowCreateModal,
    setToast
}: DashboardHomeProps) {
    const router = useRouter();

    useEffect(() => {
        if (user && !user.is_approved) {
            console.log("Gatekeeper: Unapproved user detected on Dashboard. Redirecting to Waiting Room.");
            router.push("/waiting-room");
        }
    }, [user, router]);

    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string>("");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState<string>("ADMIN");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const isSuper = user?.role === "SUPERADMIN";

    const fetchAllUsers = async () => {
        if (!isSuper) return;
        const token = localStorage.getItem('baap_token') || localStorage.getItem('token');
        try {
            const res = await apiFetch("/admin/users", {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                // Filter out superadmins just in case, though backend should handle it
                setAllUsers(data.filter((u: any) => u.role !== 'SUPERADMIN'));
            }
        } catch (err) {
            console.error("Failed to fetch users for role management:", err);
        }
    };

    useEffect(() => {
        if (isSuper) fetchAllUsers();
    }, [isSuper]);

    const handleRoleUpdate = async () => {
        if (!selectedUserId || !isSuper) return;
        setIsSubmitting(true);
        const token = localStorage.getItem('baap_token') || localStorage.getItem('token');
        try {
            const res = await apiFetch(`/admin/users/${selectedUserId}/role`, {
                method: 'PATCH',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ role: selectedRole })
            });
            if (res.ok) {
                setToast({ message: `Success: User role updated to ${selectedRole}`, type: 'success' });
                fetchAllUsers();
                setSelectedUserId("");
                setSearchQuery("");
            } else {
                const err = await res.json();
                setToast({ message: err.detail || "Failed to update role", type: 'error' });
            }
        } catch (err) {
            setToast({ message: "Network error updating role", type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredUsers = allUsers.filter(u => {
        const query = searchQuery.toLowerCase();
        const name = (u.name || "").toLowerCase();
        const email = (u.email || "").toLowerCase();
        return name.includes(query) || email.includes(query);
    });

    if (user && !user.is_approved) return null; // Prevent flash of dashboard

    return (
        <div className="animate-in fade-in duration-500">
            <div className="mb-10 flex flex-col md:flex-row gap-6 md:items-start">
                <div className="flex-1 w-full">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#111827] mb-1 flex flex-wrap gap-x-2">
                        <span className="animate-welcome-part">Welcome back,</span>
                        <span className="animate-welcome-part delay-400">
                            {user?.name ? user.name.split(' ')[0] : 'Student'}
                        </span>
                        <span className="animate-welcome-part delay-800">
                            {user?.name && user.name.split(' ').length > 1 ? user.name.split(' ').slice(1).join(' ') + '!' : '!'}
                        </span>
                    </h1>
                    <p className="text-[#6B7280] text-xs sm:text-sm md:text-base mb-8">{userBranchName} • {user?.department || 'Member'}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        {/* Identity Card */}
                        <div className="bg-white rounded-3xl premium-shadow hairline-border-projects p-4 sm:p-6 md:p-8 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 md:gap-6">
                            <div className="w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-full bg-indigo-50 flex items-center justify-center text-[#524EEE] text-xl md:text-2xl font-bold shadow-inner overflow-hidden border-4 border-white">
                                {user?.profile_pic_url && !imgError ? (
                                    <img
                                        src={user.profile_pic_url}
                                        alt=""
                                        className="w-full h-full object-cover"
                                        referrerPolicy="no-referrer"
                                        onError={() => setImgError(true)}
                                    />
                                ) : (
                                    initials
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h2 className="text-xl md:text-2xl premium-heading text-[#111827] mb-1 truncate">{user?.name || "Baap Student"}</h2>
                                <p className="text-gray-500 text-xs sm:text-sm mb-4 premium-spacing break-all">{user?.email}</p>
                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 border border-gray-100 rounded-md text-[10px] sm:text-[11px] font-bold text-gray-600 uppercase">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                        {user?.role || "Student"}
                                    </span>
                                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-100 rounded-md text-[10px] sm:text-[11px] font-bold text-emerald-600 uppercase">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                                        verified
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* College Information Card */}
                        <div className="bg-white rounded-3xl premium-shadow hairline-border-projects p-4 sm:p-6 md:p-8 flex flex-col justify-center">
                            <div className="flex items-center gap-3 mb-4 sm:mb-6">
                                <div className="p-2 bg-indigo-50 rounded-xl text-lg sm:text-xl">🏢</div>
                                <h3 className="premium-heading text-gray-900 text-sm">College Information</h3>
                            </div>
                            <div className="p-4 sm:p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                                <p className="font-bold text-[#111827] text-base sm:text-[17px] mb-1 line-clamp-2">{userBranchName}</p>
                                <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest">Baap Partner Institution</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {isSuper && (
                <div className="mb-10 animate-in slide-in-from-top-4 duration-500">
                    <div className="bg-white rounded-3xl border-2 border-indigo-100/50 p-4 sm:p-6 md:p-8 shadow-xl shadow-indigo-100/20">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 bg-indigo-50 rounded-xl text-lg sm:text-xl">🛡️</div>
                            <div>
                                <h3 className="text-base sm:text-lg font-bold text-[#111827]">Manage User Roles</h3>
                                <p className="text-xs text-gray-500 font-medium">Promote or demote members of the community</p>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch md:items-end">
                            <div className="md:col-span-1 space-y-1.5 relative" ref={dropdownRef}>
                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Select User</label>
                                <div className="relative">
                                    <input 
                                        type="text"
                                        placeholder="Search by name or email..."
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            setIsDropdownOpen(true);
                                            if (selectedUserId) setSelectedUserId("");
                                        }}
                                        onFocus={() => setIsDropdownOpen(true)}
                                        className="w-full px-4 sm:px-5 py-3.5 sm:py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm font-medium"
                                    />
                                    {isDropdownOpen && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 max-h-60 overflow-y-auto overflow-x-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                            {filteredUsers.length > 0 ? filteredUsers.map((u) => (
                                                <button
                                                    key={u.id}
                                                    onClick={() => {
                                                        setSelectedUserId(u.id);
                                                        setSearchQuery(u.name || "");
                                                        setIsDropdownOpen(false);
                                                    }}
                                                    className="w-full text-left px-4 sm:px-5 py-3 hover:bg-indigo-50 transition-colors border-b border-gray-50 last:border-0"
                                                >
                                                    <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                                                        {u.name ? u.name : <span className="text-gray-400 italic">Pending Setup</span>} — <span className="text-gray-500 font-normal">{u.email}</span>
                                                    </p>
                                                    <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mt-0.5">
                                                        {u.role}
                                                    </p>
                                                </button>
                                            )) : (
                                                <div className="px-5 py-8 text-center text-gray-400 text-sm italic">
                                                    No users found
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Assign Role</label>
                                <select 
                                    value={selectedRole}
                                    onChange={(e) => setSelectedRole(e.target.value)}
                                    className="w-full px-4 sm:px-5 py-3.5 sm:py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm font-medium cursor-pointer"
                                >
                                    <option value="ADMIN">ADMIN</option>
                                    <option value="STUDENT">STUDENT</option>
                                </select>
                            </div>
                            <button 
                                onClick={handleRoleUpdate}
                                disabled={!selectedUserId || isSubmitting}
                                className="w-full py-3.5 sm:py-4 min-h-[44px] bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center"
                            >
                                {isSubmitting ? "Updating..." : (selectedRole === "ADMIN" ? "Promote to Admin" : "Demote to Student")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <button
                    onClick={() => { setModalType('project'); setShowCreateModal(true); }}
                    className="flex items-center gap-3 sm:gap-4 md:gap-6 p-4 sm:p-6 md:p-8 rounded-3xl hairline-border-projects bg-white hover:border-[#524EEE] premium-shadow premium-hover transition-all group text-left"
                >
                    <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 shrink-0 rounded-2xl bg-[#524EEE] text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-indigo-100">
                        <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
                    </div>
                    <div>
                        <h3 className="premium-heading text-[#111827] text-base sm:text-lg mb-1">Create New Project</h3>
                        <p className="text-gray-500 text-xs sm:text-sm premium-spacing">Start collaborating with others</p>
                    </div>
                </button>

                <button
                    onClick={() => { setModalType('discussion'); setShowCreateModal(true); }}
                    className="flex items-center gap-3 sm:gap-4 md:gap-6 p-4 sm:p-6 md:p-8 rounded-3xl hairline-border-helper bg-white hover:border-[#10B981] premium-shadow premium-hover transition-all group text-left"
                >
                    <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 shrink-0 rounded-2xl bg-[#10B981] text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-emerald-100">
                        <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                    </div>
                    <div>
                        <h3 className="premium-heading text-[#111827] text-base sm:text-lg mb-1">Start Discussion</h3>
                        <p className="text-gray-500 text-xs sm:text-sm premium-spacing">Share knowledge with the community</p>
                    </div>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch w-full">
                {/* Position 1: Recent Projects */}
                <div className="bg-white rounded-3xl premium-shadow hairline-border-projects hover:border-[#6366F1] premium-hover overflow-hidden h-full flex flex-col">
                    <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
                        <h2 className="text-base sm:text-lg premium-heading text-[#111827]">Recent Projects</h2>
                        <button onClick={() => setActiveTab('projects')} className="text-xs sm:text-sm text-[#524EEE] font-bold hover:underline transition-all">View all</button>
                    </div>
                    <div className="divide-y divide-gray-100 flex-1">
                        {lfmPosts.length > 0 ? lfmPosts.map((post: any) => (
                             <div
                                key={post.id}
                                onClick={() => setActiveTab('projects')}
                                className="p-4 sm:p-6 hover:bg-gray-50/50 transition-all cursor-pointer group"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                                    <h3 className="premium-heading text-base sm:text-lg text-[#111827] group-hover:text-[#6366F1] group-hover:underline transition-colors truncate min-w-0 flex-1">{post.title}</h3>
                                    <span className="shrink-0 mt-1 sm:mt-0.5 whitespace-nowrap text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md self-start sm:self-auto">
                                        {(() => {
                                            if (!post.created_at) return 'Recently';
                                            const date = new Date(post.created_at);
                                            if (isNaN(date.getTime())) return 'Recently';
                                            return formatDistanceToNow(date, { addSuffix: true });
                                        })()}
                                    </span>
                                </div>
                                <p className="text-[#6B7280] text-xs sm:text-sm line-clamp-2 premium-spacing leading-relaxed">{post.content}</p>
                            </div>
                        )) : (
                            <div className="p-10 flex h-full items-center justify-center text-center text-gray-400 font-medium">No projects yet.</div>
                        )}
                    </div>
                </div>

                {/* Position 2: Forum Activity */}
                <div className="bg-white rounded-3xl premium-shadow hairline-border-forum hover:border-[#10B981] premium-hover overflow-hidden h-full flex flex-col">
                    <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
                        <h2 className="text-lg premium-heading text-[#111827]">Forum Activity</h2>
                        <button onClick={() => setActiveTab('forum')} className="text-sm text-[#524EEE] font-bold hover:underline transition-all">View all</button>
                    </div>
                    <div className="divide-y divide-gray-100 flex-1">
                        {forumPosts.length > 0 ? forumPosts.map((post: any) => (
                            <div
                                key={post.id}
                                onClick={() => setActiveTab('forum')}
                                className="p-6 hover:bg-gray-50/50 transition-all cursor-pointer group"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                                    <h3 className="premium-heading text-base sm:text-lg text-[#111827] group-hover:text-[#10B981] group-hover:underline transition-colors truncate min-w-0 flex-1">{post.title}</h3>
                                    <span className="shrink-0 mt-1 sm:mt-0.5 whitespace-nowrap text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md self-start sm:self-auto">
                                        {(() => {
                                            if (!post.created_at) return 'Recently';
                                            const date = new Date(post.created_at);
                                            if (isNaN(date.getTime())) return 'Recently';
                                            return formatDistanceToNow(date, { addSuffix: true });
                                        })()}
                                    </span>
                                </div>
                                <p className="text-[#6B7280] text-sm line-clamp-2 premium-spacing leading-relaxed">{post.content}</p>
                            </div>
                        )) : (
                            <div className="p-10 flex h-full items-center justify-center text-center text-gray-400 font-medium">No activity yet.</div>
                        )}
                    </div>
                </div>
                
                {/* Position 3: Helper of the Week */}
                <div className="bg-white rounded-3xl premium-shadow hairline-border-helper hover:border-[#10B981] premium-hover overflow-hidden h-full flex flex-col">
                    <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/30 shrink-0">
                        <h2 className="text-lg premium-heading text-[#111827]">Helper of the Week</h2>
                        <Link href="/leaderboard" className="text-sm text-[#524EEE] font-bold hover:underline transition-all">View all</Link>
                    </div>
                    <Link href={leaderboard[0] ? `/profile/${leaderboard[0].id}` : "#"} className="p-6 flex-1 flex flex-col items-center justify-center text-center cursor-pointer group">
                        <div className="w-24 h-24 rounded-full bg-indigo-50 flex items-center justify-center text-[#524EEE] text-3xl font-bold shadow-inner mb-4 overflow-hidden border-4 border-white shrink-0 group-hover:scale-105 transition-transform">
                            {leaderboard[0]?.profile_pic_url ? (
                                <img src={leaderboard[0].profile_pic_url} alt="" className="w-full h-full object-cover" />
                            ) : leaderboard[0]?.display_name ? (
                                <div className="w-full h-full flex items-center justify-center bg-indigo-100 text-[#524EEE]">
                                    {leaderboard[0].display_name.substring(0, 2).toUpperCase()}
                                </div>
                            ) : (
                                "?"
                            )}
                        </div>
                        <h3 className="text-xl premium-heading text-[#111827] mb-1 w-full truncate px-2 group-hover:text-[#10B981] transition-colors">
                            {leaderboard[0]?.display_name || leaderboard[0]?.name || "—"}
                        </h3>
                        <p className="text-gray-500 text-sm mb-6 premium-spacing w-full truncate">
                            {leaderboard[0]?.reward_points || 0} Contribution Points
                        </p>
                        <span className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-bold text-emerald-600 uppercase tracking-wider shrink-0 transition-colors group-hover:bg-emerald-100">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                            Top Helper
                        </span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
