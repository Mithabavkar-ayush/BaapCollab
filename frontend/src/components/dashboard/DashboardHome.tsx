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
    setActiveTab: (tab: 'dashboard' | 'projects' | 'forum' | 'settings') => void;
    setModalType: (type: 'project' | 'discussion') => void;
    setShowCreateModal: (show: boolean) => void;
}

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
    setShowCreateModal
}: DashboardHomeProps) {
    return (
        <div className="animate-in fade-in duration-500">
            <div className="mb-10 flex flex-col md:flex-row gap-6 md:items-start">
                <div className="flex-1">
                    <h1 className="text-[34px] font-bold text-[#111827] mb-1 flex flex-wrap gap-x-2">
                        <span className="animate-welcome-part">Welcome back,</span>
                        <span className="animate-welcome-part delay-400">
                            {user?.name ? user.name.split(' ')[0] : 'Student'}
                        </span>
                        <span className="animate-welcome-part delay-800">
                            {user?.name && user.name.split(' ').length > 1 ? user.name.split(' ').slice(1).join(' ') + '!' : '!'}
                        </span>
                    </h1>
                    <p className="text-[#6B7280] text-[15px] mb-8">{userBranchName} • {user?.department || 'Member'}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        {/* Identity Card */}
                        <div className="bg-white rounded-3xl premium-shadow hairline-border-projects p-8 flex items-center gap-6">
                            <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center text-[#524EEE] text-2xl font-bold shadow-inner overflow-hidden border-4 border-white">
                                {user?.picture && !imgError ? (
                                    <img
                                        src={user.picture}
                                        alt=""
                                        className="w-full h-full object-cover"
                                        referrerPolicy="no-referrer"
                                        onError={() => setImgError(true)}
                                    />
                                ) : (
                                    initials
                                )}
                            </div>
                            <div>
                                <h2 className="text-2xl premium-heading text-[#111827] mb-1">{user?.name || "Baap Student"}</h2>
                                <p className="text-gray-500 text-sm mb-4 premium-spacing">{user?.email}</p>
                                <div className="flex items-center gap-3">
                                    <span className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 border border-gray-100 rounded-md text-[11px] font-bold text-gray-600 uppercase">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                        Student
                                    </span>
                                    <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-md text-[11px] font-bold text-emerald-600 uppercase">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                                        verified
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* College Information Card */}
                        <div className="bg-white rounded-3xl premium-shadow hairline-border-projects p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-indigo-50 rounded-xl text-xl">🏢</div>
                                <h3 className="premium-heading text-gray-900 text-sm">College Information</h3>
                            </div>
                            <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                                <p className="font-bold text-[#111827] text-[17px] mb-1 line-clamp-1">{userBranchName}</p>
                                <p className="text-[11px] text-indigo-500 font-bold uppercase tracking-widest">Baap Partner Institution</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <button
                    onClick={() => { setModalType('project'); setShowCreateModal(true); }}
                    className="flex items-center gap-6 p-8 rounded-3xl hairline-border-projects bg-white hover:border-[#524EEE] premium-shadow premium-hover transition-all group text-left"
                >
                    <div className="w-16 h-16 rounded-2xl bg-[#524EEE] text-white flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-lg shadow-indigo-100">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
                    </div>
                    <div>
                        <h3 className="premium-heading text-[#111827] text-lg mb-1">Create New Project</h3>
                        <p className="text-gray-500 text-sm premium-spacing">Start collaborating with others</p>
                    </div>
                </button>

                <button
                    onClick={() => { setModalType('discussion'); setShowCreateModal(true); }}
                    className="flex items-center gap-6 p-8 rounded-3xl hairline-border-helper bg-white hover:border-[#10B981] premium-shadow premium-hover transition-all group text-left"
                >
                    <div className="w-16 h-16 rounded-2xl bg-[#10B981] text-white flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-lg shadow-emerald-100">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                    </div>
                    <div>
                        <h3 className="premium-heading text-[#111827] text-lg mb-1">Start Discussion</h3>
                        <p className="text-gray-500 text-sm premium-spacing">Share knowledge with the community</p>
                    </div>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch w-full">
                {/* Position 1: Recent Projects */}
                <div className="bg-white rounded-3xl premium-shadow hairline-border-projects hover:border-[#6366F1] premium-hover overflow-hidden h-full flex flex-col">
                    <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
                        <h2 className="text-lg premium-heading text-[#111827]">Recent Projects</h2>
                        <button onClick={() => setActiveTab('projects')} className="text-sm text-[#524EEE] font-bold hover:underline transition-all">View all</button>
                    </div>
                    <div className="divide-y divide-gray-100 flex-1">
                        {lfmPosts.length > 0 ? lfmPosts.map((post: any) => (
                            <div
                                key={post.id}
                                onClick={() => setActiveTab('projects')}
                                className="p-6 hover:bg-gray-50/50 transition-all cursor-pointer group"
                            >
                                <div className="flex items-start justify-between gap-3 mb-2">
                                    <h3 className="premium-heading text-lg text-[#111827] group-hover:text-[#6366F1] group-hover:underline transition-colors truncate min-w-0 flex-1">{post.title}</h3>
                                    <span className="shrink-0 mt-1 whitespace-nowrap text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded-md">
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
                                <div className="flex items-start justify-between gap-3 mb-1">
                                    <h3 className="premium-heading text-lg text-[#111827] group-hover:text-[#10B981] group-hover:underline transition-colors truncate min-w-0 flex-1">{post.title}</h3>
                                    <span className="shrink-0 mt-1 whitespace-nowrap text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded-md">
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
                            {leaderboard[0]?.display_name ? (
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
