"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "https://baapcollab-backend-production.up.railway.app")
    .replace(/\/$/, "")
    .replace("http://", "https://");

interface ProjectListProps {
    lfmPosts: any[];
    setModalType: (type: 'project' | 'discussion') => void;
    setShowCreateModal: (show: boolean) => void;
    loggedInUser?: any;
    onPostDeleted: (postId: number) => void;
}

export default function ProjectList({
    lfmPosts,
    setModalType,
    setShowCreateModal,
    loggedInUser,
    onPostDeleted
}: ProjectListProps) {
    const [localPosts, setLocalPosts] = useState<any[]>(lfmPosts);
    const [viewingApplicantsId, setViewingApplicantsId] = useState<number | null>(null);
    const [applicantsData, setApplicantsData] = useState<any[]>([]);
    const [loadingApplicants, setLoadingApplicants] = useState(false);
    const [applyingId, setApplyingId] = useState<number | null>(null);
    const [deletingPostId, setDeletingPostId] = useState<number | null>(null);

    // Sync local state when parent fetches fresh data (e.g., has_applied status from the server)
    useEffect(() => {
        setLocalPosts(lfmPosts);
    }, [lfmPosts]);

    const handleApply = async (e: React.MouseEvent, postId: number) => {
        e.stopPropagation(); // prevent card click
        if (!loggedInUser) return; // silently ignore if not logged in

        const isUnenrolling = localPosts.find(p => p.id === postId)?.has_applied;

        // Optimistically toggle UI before API response
        setLocalPosts(prev => prev.map(p =>
            p.id === postId ? { ...p, has_applied: !isUnenrolling } : p
        ));
        setApplyingId(postId);

        try {
            const endpoint = `${API_BASE}/posts/${postId}/apply`;
            const method = isUnenrolling ? 'DELETE' : 'POST';

            const res = await fetch(endpoint, {
                method: method,
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                credentials: 'include'
            });
            if (!res.ok) {
                // Revert optimistic update silently on failure
                setLocalPosts(prev => prev.map(p =>
                    p.id === postId ? { ...p, has_applied: isUnenrolling } : p
                ));
                console.error("Enrollment update failed:", await res.json().catch(() => ({})));
            }
        } catch (error) {
            // Revert on network error
            setLocalPosts(prev => prev.map(p =>
                p.id === postId ? { ...p, has_applied: isUnenrolling } : p
            ));
            console.error("Network error during enrollment:", error);
        } finally {
            setApplyingId(null);
        }
    };

    const handleCheckApplicants = async (e: React.MouseEvent, postId: number) => {
        e.stopPropagation(); // prevent card click
        setViewingApplicantsId(postId);
        setLoadingApplicants(true);
        try {
            const res = await fetch(`${API_BASE}/posts/${postId}/applicants`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                credentials: 'include'
            });
            if (res.ok) {
                const data = await res.json();
                setApplicantsData(data);
            }
        } catch (error) {
            console.error("Fetch applicants error:", error);
        } finally {
            setLoadingApplicants(false);
        }
    };

    const handleDeletePost = async (postId: number) => {
        try {
            // Instant UI Update
            setLocalPosts(prev => prev.filter(p => p.id !== postId));
            onPostDeleted(postId);
            setDeletingPostId(null);

            const res = await fetch(`${API_BASE}/posts/${postId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                credentials: 'include'
            });

            if (!res.ok) {
                const err = await res.json();
                alert(err.detail || "Failed to delete project.");
                // Rollback or refresh if needed, but for "instant" we assume success
                // In a full implementation, we'd add the post back to state here.
            }
        } catch (error) {
            console.error("Delete error:", error);
            alert("Network error while deleting.");
        }
    };

    const displayPosts = localPosts.length > 0 ? localPosts : lfmPosts;

    return (
        <div className="animate-in fade-in duration-500 pb-10">
            {/* Header Section */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm mb-10 overflow-hidden">
                <div className="px-8 py-6 flex items-center justify-between bg-zinc-50/30">
                    <h2 className="text-xl font-black text-[#111827] tracking-tight">All Projects</h2>
                    <button
                        onClick={() => { setModalType('project'); setShowCreateModal(true); }}
                        className="px-5 py-2.5 bg-[#524EEE] text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 hover:scale-105 transition-transform active:scale-95"
                    >
                        + New Project
                    </button>
                </div>
            </div>

            {/* Projects List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {displayPosts.length > 0 ? displayPosts.map((post: any) => (
                    <div key={post.id} className="bg-white rounded-2xl border border-gray-100 p-[25px] shadow-sm hover:shadow-md hover:border-indigo-100 transition-all cursor-pointer group">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-black text-2xl text-[#111827] tracking-tight group-hover:text-[#524EEE] transition-colors">{post.title}</h3>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded-md">
                                {(() => {
                                    if (!post.created_at) return 'Recently';
                                    const date = new Date(post.created_at);
                                    if (isNaN(date.getTime())) return 'Recently';
                                    return formatDistanceToNow(date, { addSuffix: true });
                                })()}
                            </span>
                        </div>
                        <p className="text-gray-500 leading-relaxed mb-8 text-sm font-medium">{post.content}</p>
                        <div className="flex items-center justify-between pt-5 border-t border-gray-50">
                            <div className="flex items-center gap-3">
                                <Link href={`/profile/${post.author_id}`} className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 shadow-inner overflow-hidden border border-white cursor-pointer hover:ring-2 hover:ring-indigo-400/50 transition-all">
                                    {post.author_picture ? (
                                        <img src={post.author_picture} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="font-bold text-xs">{(post.author_name || "?").charAt(0)}</span>
                                    )}
                                </Link>
                                <Link href={`/profile/${post.author_id}`} className="text-sm font-bold text-gray-700 cursor-pointer hover:text-[#524EEE] transition-colors">{post.author_name || "Baap User"}</Link>
                            </div>

                            {String(loggedInUser?.id) === String(post.author_id) ? (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => handleCheckApplicants(e, post.id)}
                                        className="px-5 py-2.5 bg-indigo-50 text-[#524EEE] font-bold rounded-xl text-xs hover:bg-[#524EEE] hover:text-white transition-all shadow-sm"
                                    >
                                        Check Applicants
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setDeletingPostId(post.id); }}
                                        className="px-3 py-2.5 bg-red-50 text-red-500 font-bold rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                        title="Delete Project"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                            ) : post.has_applied ? (
                                <button
                                    onClick={(e) => handleApply(e, post.id)}
                                    disabled={applyingId === post.id}
                                    className="px-5 py-2.5 bg-white text-gray-500 font-bold rounded-xl text-xs border border-gray-200 shadow-sm hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-50"
                                >
                                    {applyingId === post.id ? "Updating..." : "Unenroll"}
                                </button>
                            ) : (
                                <button
                                    onClick={(e) => handleApply(e, post.id)}
                                    disabled={applyingId === post.id}
                                    className="px-5 py-2.5 bg-gray-50 text-gray-900 font-bold rounded-xl text-xs hover:bg-[#524EEE] hover:text-white transition-all shadow-sm disabled:opacity-50"
                                >
                                    {applyingId === post.id ? "Updating..." : "Enroll"}
                                </button>
                            )}
                        </div>
                    </div>
                )) : (
                    <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-20 text-center flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-3xl">🏗️</div>
                        <p className="text-gray-400 font-bold">No projects found in your institute yet.</p>
                    </div>
                )}
            </div>

            {/* Confirm Delete Modal */}
            {deletingPostId && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeletingPostId(null)}></div>
                    <div className="bg-white rounded-3xl w-full max-w-sm p-6 relative z-10 shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-center">
                        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        </div>
                        <h3 className="text-xl font-black text-gray-900 mb-2">Delete Project?</h3>
                        <p className="text-sm text-gray-500 mb-6">This action cannot be undone. All applicant data will be permanently removed.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeletingPostId(null)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
                            <button onClick={() => handleDeletePost(deletingPostId)} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors">Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Applicants Modal */}
            {viewingApplicantsId && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setViewingApplicantsId(null)}></div>
                    <div className="bg-white rounded-3xl w-full max-w-lg p-8 relative z-10 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-black text-gray-900">Project Applicants</h3>
                            <button onClick={() => setViewingApplicantsId(null)} className="p-2 bg-gray-100 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {loadingApplicants ? (
                            <div className="flex justify-center py-12">
                                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                            </div>
                        ) : applicantsData.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-4xl mb-3">👻</div>
                                <p className="text-gray-500 font-medium">No applicants yet.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-2">
                                {applicantsData.map(app => (
                                    <Link key={app.id} href={`/profile/${app.id}`} className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 bg-white hover:border-indigo-200 hover:shadow-md transition-all group">
                                        <div className="w-12 h-12 rounded-full bg-indigo-50 border border-gray-100 overflow-hidden flex items-center justify-center text-indigo-500 shrink-0">
                                            {app.picture ? (
                                                <img src={app.picture} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="font-bold text-lg">{app.name.charAt(0)}</span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">{app.name}</h4>
                                            <p className="text-sm text-gray-500 truncate">{app.email}</p>
                                        </div>
                                        <div className="text-indigo-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
