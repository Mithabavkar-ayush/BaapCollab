"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "https://baapcollab-backend-production.up.railway.app")
    .replace(/\/$/, "")
    .replace("http://", "https://");

interface ForumListProps {
    forumPosts: any[];
    setModalType: (type: 'project' | 'discussion') => void;
    setShowCreateModal: (show: boolean) => void;
    loggedInUser: any;
    onPostDeleted: (postId: number) => void;
}

function Avatar({ picture, name, size = 40, authorId }: { picture?: string | null; name?: string | null; size?: number; authorId?: string | number }) {
    const initials = name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || "?";

    const content = (
        <div
            style={{ width: size, height: size, minWidth: size }}
            className={`rounded-full bg-[#EEF2FF] border border-[rgba(0,0,0,0.06)] flex items-center justify-center overflow-hidden shrink-0 ${authorId ? 'cursor-pointer hover:ring-2 hover:ring-emerald-400/50 transition-all' : ''}`}
        >
            {picture ? (
                <img
                    src={picture}
                    alt={name || ""}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
            ) : (
                <span className="text-[#524EEE] font-bold" style={{ fontSize: size * 0.35 }}>{initials}</span>
            )}
        </div>
    );

    if (authorId) {
        return <Link href={`/profile/${authorId}`}>{content}</Link>;
    }

    return content;
}

function DeleteModal({ onConfirm, onCancel, isDeleting }: { onConfirm: () => void; onCancel: () => void; isDeleting: boolean }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overlay-fade" style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}>
            <div className="modal-slow-fade bg-white rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl">
                <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mb-5 mx-auto">
                    <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </div>
                <h3 className="text-xl font-bold text-[#111827] text-center mb-2">Delete this post?</h3>
                <p className="text-gray-500 text-sm text-center mb-7 leading-relaxed">This action cannot be undone. The post and all its comments will be permanently removed.</p>
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-all disabled:opacity-60"
                    >
                        {isDeleting ? "Deleting…" : "Delete"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function PostCard({
    post,
    loggedInUser,
    onPostDeleted,
    token,
}: {
    post: any;
    loggedInUser: any;
    onPostDeleted: (postId: number) => void;
    token: string | null;
}) {
    const [expanded, setExpanded] = useState(false);
    const [comments, setComments] = useState<any[]>([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [commentInput, setCommentInput] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Edit State
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editContent, setEditContent] = useState("");
    const [updating, setUpdating] = useState(false);
    const [updateError, setUpdateError] = useState<string | null>(null);

    // Undo-Delete State
    const [pendingDelete, setPendingDelete] = useState<{ commentId: number; commentData: any; timerId: ReturnType<typeof setTimeout> } | null>(null);
    const [undoVisible, setUndoVisible] = useState(false);

    const isOwner = String(post.author_id) === String(loggedInUser?.id);
    const commentCount = post.comment_count || 0;
    const userAlreadyAssisted = comments.some(c => String(c.author_id) === String(loggedInUser?.id));

    const fetchComments = async () => {
        setLoadingComments(true);
        try {
            const res = await fetch(`${API_BASE}/posts/${post.id}/comments${loggedInUser ? `?current_user_id=${loggedInUser.id}` : ''}`, {
                credentials: 'include'
            });
            if (res.ok) {
                const data = await res.json();
                setComments(data);
            }
        } catch (err) {
            console.error("Failed to fetch comments", err);
        } finally {
            setLoadingComments(false);
        }
    };

    const handleToggle = () => {
        if (!expanded) fetchComments();
        setExpanded(!expanded);
    };

    const handleSubmitComment = async () => {
        if (!commentInput.trim() || !loggedInUser) return;
        setSubmitting(true);
        try {
            const res = await fetch(`${API_BASE}/posts/${post.id}/comments`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({ content: commentInput }),
                credentials: 'include'
            });
            if (res.ok) {
                const newComment = await res.json();
                setComments([...comments, newComment]);
                setCommentInput("");
            }
        } catch (err) {
            console.error("Comment failed", err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateComment = async (e: React.MouseEvent, commentId: number) => {
        e.preventDefault();
        if (!editContent.trim() || !loggedInUser) return;
        setUpdating(true);
        setUpdateError(null);
        // Use the token prop passed from parent (avoids SSR/hydration null issue)
        const authToken = token || localStorage.getItem("token");
        if (!authToken) {
            setUpdateError("Not authenticated. Please refresh.");
            setUpdating(false);
            return;
        }

        console.log(`[Assist Edit] Saving assist ID: ${commentId} for post ID: ${post.id}`);
        console.log(`[Assist Edit] New text: "${editContent}"`);

        try {
            const res = await fetch(`${API_BASE}/posts/${post.id}/comments/${commentId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${authToken}`
                },
                body: JSON.stringify({ content: editContent }),
                credentials: 'include'
            });
            if (res.ok) {
                const updated = await res.json();
                console.log("[Assist Edit] Save successful:", updated);
                // Map in-place so upvote_count from backend response is preserved
                setComments(prev => prev.map(c => c.id === commentId ? updated : c));
                setEditingId(null);
                setEditContent("");
                setUpdateError(null); // Clear any old errors on success
            } else {
                const errData = await res.json().catch(() => ({}));
                console.error("[Assist Edit] Server rejected with status:", res.status, errData);
                setUpdateError(errData.detail || `Save failed (${res.status}). Try again.`);
            }
        } catch (err) {
            console.error("[Assist Edit] Network error:", err);
            setUpdateError("Network error. Check your connection.");
        } finally {
            setUpdating(false);
        }
    };

    const handleDeleteComment = (commentId: number) => {
        if (!loggedInUser) return;

        // Find the comment data before hiding it
        const commentData = comments.find(c => c.id === commentId);
        if (!commentData) return;

        // Cancel any existing pending delete first
        if (pendingDelete) {
            clearTimeout(pendingDelete.timerId);
        }

        // Instantly hide the comment from the UI
        setComments(prev => prev.filter(c => c.id !== commentId));
        setUndoVisible(true);

        // Schedule the real deletion after 5 seconds
        const timerId = setTimeout(async () => {
            try {
                await fetch(`${API_BASE}/posts/${post.id}/comments/${commentId}`, {
                    method: "DELETE",
                    headers: { "Authorization": `Bearer ${token || localStorage.getItem("token")}` },
                    credentials: 'include'
                });
            } catch (err) {
                console.error("Deferred delete failed:", err);
            } finally {
                setPendingDelete(null);
                setUndoVisible(false);
            }
        }, 5000);

        setPendingDelete({ commentId, commentData, timerId });
    };

    const handleUndoDelete = () => {
        if (!pendingDelete) return;
        clearTimeout(pendingDelete.timerId);
        // Restore the comment back into the list
        setComments(prev => {
            const exists = prev.some(c => c.id === pendingDelete.commentId);
            if (exists) return prev;
            return [...prev, pendingDelete.commentData].sort((a, b) => a.id - b.id);
        });
        setPendingDelete(null);
        setUndoVisible(false);
    };


    const handleToggleUpvote = async (commentId: number) => {
        if (!loggedInUser) return;
        try {
            const res = await fetch(`${API_BASE}/posts/${post.id}/comments/${commentId}/upvote`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
                credentials: 'include'
            });
            if (res.ok) {
                const data = await res.json();
                setComments(comments.map(c => c.id === commentId ? {
                    ...c,
                    upvote_count: data.upvote_count,
                    user_has_upvoted: data.user_has_upvoted
                } : c));
            }
        } catch (err) {
            console.error("Upvote failed", err);
        }
    };

    const handleDeletePost = async () => {
        // Instant UI Update
        onPostDeleted(post.id);
        setShowDeleteModal(false);

        try {
            const res = await fetch(`${API_BASE}/posts/${post.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                credentials: 'include'
            });
            if (!res.ok) {
                console.error("Failed to delete post from server");
            }
        } catch (err) {
            console.error("Failed to delete post", err);
        } finally {
            setIsDeleting(false);
        }
    };

    const timeAgo = (dateStr: string) => {
        if (!dateStr) return "some time ago";
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return "some time ago";
            return formatDistanceToNow(date, { addSuffix: true });
        } catch (err) {
            return "some time ago";
        }
    };

    return (
        <>
            {showDeleteModal && (
                <DeleteModal
                    onConfirm={handleDeletePost}
                    onCancel={() => setShowDeleteModal(false)}
                    isDeleting={isDeleting}
                />
            )}

            <div className="forum-card overflow-hidden">
                {/* Card Header */}
                <div className="px-6 pt-5 pb-4">
                    <div className="flex items-start gap-4">
                        <Avatar picture={post.author_picture} name={post.author_name} size={44} authorId={post.author_id} />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                <Link href={`/profile/${post.author_id}`} className="font-bold text-[14px] text-[#111827] cursor-pointer hover:text-emerald-600 transition-colors">{post.author_name || "Baap Student"}</Link>
                                <span className="text-xs text-gray-400">{timeAgo(post.created_at)}</span>
                                <span className="px-2 py-0.5 bg-zinc-100 text-zinc-500 rounded text-[10px] font-bold uppercase tracking-wider ml-auto">General</span>
                            </div>
                            <h3 className="font-bold text-[18px] text-[#111827] leading-snug mt-1 mb-2">{post.title}</h3>
                            <p className="text-gray-500 text-sm leading-relaxed line-clamp-2">{post.content}</p>
                        </div>
                        {/* Delete button — owner only */}
                        {isOwner && (
                            <button
                                onClick={() => setShowDeleteModal(true)}
                                title="Delete post"
                                className="ml-2 p-2 rounded-xl text-gray-300 hover:text-red-400 hover:bg-red-50 transition-all shrink-0"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                {/* Action Bar */}
                <div className="px-6 pb-4 flex items-center gap-4">
                    <button
                        onClick={handleToggle}
                        className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold transition-all ${expanded
                            ? "bg-[#10B981] text-white shadow-sm"
                            : "bg-zinc-50 text-zinc-600 hover:bg-emerald-50 hover:text-emerald-600 ultra-slim-border-hover"
                            }`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span>Assist</span>
                        {commentCount > 0 && (
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${expanded ? "bg-white/25 text-white" : "bg-emerald-100 text-emerald-700"}`}>
                                {commentCount}
                            </span>
                        )}
                    </button>
                </div>

                {/* Threaded Comment Section */}
                {expanded && (
                    <div className="px-6 pb-5 border-t border-gray-50">
                        <div className="pt-4 thread-guide-line">
                            {loadingComments ? (
                                <div className="flex items-center gap-2 py-3 text-gray-400 text-sm">
                                    <div className="w-4 h-4 border-2 border-emerald-300 border-t-transparent rounded-full animate-spin" />
                                    Loading comments…
                                </div>
                            ) : comments.length === 0 ? (
                                <p className="text-gray-400 text-sm py-2 italic">No assists yet — be the first to help!</p>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    {comments.map((c: any) => (
                                        <div key={c.id} className="flex items-start gap-3 group">
                                            <Avatar picture={c.author_picture} name={c.author_name} size={32} authorId={c.author_id} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                    <div className="flex items-center gap-2">
                                                        <Link href={`/profile/${c.author_id}`} className="font-bold text-[13px] text-[#111827] cursor-pointer hover:text-emerald-600 transition-colors">{c.author_name || "Student"}</Link>
                                                        {/* Edit Icon for own comments */}
                                                        {String(c.author_id) === String(loggedInUser?.id) && editingId !== c.id && (
                                                            <button
                                                                onClick={() => { setEditingId(c.id); setEditContent(c.content); }}
                                                                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-[#10B981] transition-all"
                                                                title="Edit assist"
                                                            >
                                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                                </svg>
                                                            </button>
                                                        )}
                                                        {/* Delete Icon for comment author OR post owner */}
                                                        {(String(c.author_id) === String(loggedInUser?.id) || isOwner) && editingId !== c.id && (
                                                            <button
                                                                onClick={() => handleDeleteComment(c.id)}
                                                                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all ml-1"
                                                                title="Delete assist"
                                                            >
                                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* Upvote UI Logic */}
                                                    {String(c.author_id) === String(post.author_id) ? (
                                                        /* 1. Strip upvote option for Topic Owner's messages */
                                                        <div className="w-16 h-8" /> /* Invisible spacer for consistent alignment */
                                                    ) : isOwner ? (
                                                        /* 2. Plain text for Author viewing Helper messages */
                                                        <div className="flex items-center gap-1.5 px-2 py-1 text-gray-400 select-none">
                                                            <span className="text-xs font-bold">
                                                                {c.upvote_count || 0} {c.upvote_count === 1 ? 'Vote' : 'Votes'}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        /* 3. Interactive button for Helpers viewing other Helpers */
                                                        String(c.author_id) !== String(loggedInUser?.id) && (
                                                            <button
                                                                onClick={() => handleToggleUpvote(c.id)}
                                                                className={`flex items-center gap-1.5 px-2 py-1 rounded-full transition-all duration-200 active:scale-95 ${c.user_has_upvoted
                                                                    ? "text-[#10B981] bg-emerald-50"
                                                                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                                                                    }`}
                                                            >
                                                                <svg className={`w-4 h-4 transition-transform duration-200 ${c.user_has_upvoted ? "fill-current scale-110" : "fill-none"}`} stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.514" />
                                                                </svg>
                                                                <span className={`text-xs font-bold ${c.user_has_upvoted ? "text-[#10B981]" : "text-gray-500"}`}>{c.upvote_count || 0}</span>
                                                            </button>
                                                        )
                                                    )}
                                                </div>

                                                {editingId === c.id ? (
                                                    <div className="mt-1 flex flex-col gap-2">
                                                        <input
                                                            autoFocus
                                                            type="text"
                                                            value={editContent}
                                                            onChange={e => setEditContent(e.target.value)}
                                                            onKeyDown={e => {
                                                                if (e.key === 'Enter' && !updating && editContent.trim()) {
                                                                    handleUpdateComment(e as any, c.id);
                                                                }
                                                                if (e.key === 'Escape') {
                                                                    setEditingId(null);
                                                                    setUpdateError(null);
                                                                }
                                                            }}
                                                            className="w-full px-3 py-2 bg-zinc-50 border border-emerald-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
                                                        />
                                                        {updateError && (
                                                            <p className="text-xs text-red-500 font-medium px-1">{updateError}</p>
                                                        )}
                                                        <div className="flex items-center gap-2 pb-1">
                                                            <button
                                                                onClick={e => handleUpdateComment(e, c.id)}
                                                                disabled={updating || !editContent.trim()}
                                                                className="flex items-center gap-1.5 text-[11px] font-bold text-white bg-emerald-500 px-3 py-1.5 rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition-all active:scale-95"
                                                            >
                                                                {updating ? (
                                                                    <>
                                                                        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                                        </svg>
                                                                        Saving…
                                                                    </>
                                                                ) : "Save"}
                                                            </button>
                                                            <button
                                                                onClick={() => { setEditingId(null); setUpdateError(null); }}
                                                                disabled={updating}
                                                                className="text-[11px] font-bold text-gray-400 px-3 py-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-all"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p className="text-gray-600 text-sm leading-relaxed pr-8">{c.content}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Comment Input - Submission Lock */}
                            {token && !userAlreadyAssisted && (
                                <div className="mt-4 flex items-start gap-3">
                                    <Avatar picture={loggedInUser?.picture} name={loggedInUser?.name} size={32} />
                                    <div className="flex-1 flex gap-2">
                                        <input
                                            type="text"
                                            value={commentInput}
                                            onChange={e => setCommentInput(e.target.value)}
                                            onKeyDown={e => e.key === "Enter" && !submitting && handleSubmitComment()}
                                            placeholder="Write an assist…"
                                            className="w-full flex-1 px-4 py-2.5 rounded-2xl text-sm bg-zinc-50 hairline-mint placeholder-gray-400 ultra-slim-border"
                                        />
                                        <button
                                            onClick={handleSubmitComment}
                                            disabled={submitting || !commentInput.trim()}
                                            className="px-4 py-2.5 bg-[#10B981] text-white rounded-2xl text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50"
                                        >
                                            {submitting ? "…" : "Post"}
                                        </button>
                                    </div>
                                </div>
                            )}
                            {token && userAlreadyAssisted && (
                                <div className="mt-4 px-4 py-3 bg-zinc-50 rounded-2xl border border-gray-100 flex items-center gap-3">
                                    <span className="text-gray-400 text-xs font-medium">✨ You've shared your assist. You can edit it anytime.</span>
                                </div>
                            )}
                            {!token && (
                                <p className="mt-4 text-xs text-gray-400 italic">Log in to assist.</p>
                            )}
                        </div>
                    </div>
                )}
            </div >

            {/* Undo Delete Snackbar */}
            {undoVisible && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] animate-in slide-in-from-bottom-4 fade-in duration-300">
                    <div className="flex items-center gap-4 px-5 py-3.5 bg-gray-900 text-white rounded-2xl shadow-2xl border border-white/10">
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span className="text-sm font-medium text-gray-200">Assist deleted</span>
                        </div>
                        <button
                            onClick={handleUndoDelete}
                            className="text-sm font-black text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-wide"
                        >
                            Undo
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

export default function ForumList({
    forumPosts,
    setModalType,
    setShowCreateModal,
    loggedInUser,
    onPostDeleted,
}: ForumListProps) {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    return (
        <div className="animate-in fade-in duration-500">
            {/* Nav Bar */}
            <div className="flex items-center justify-between mb-5">
                <h2 className="text-[20px] font-bold text-[#111827] premium-heading">Community Forum</h2>
                <button
                    onClick={() => { setModalType('discussion'); setShowCreateModal(true); }}
                    className="px-5 py-2.5 bg-[#10B981] text-white rounded-2xl text-sm font-bold shadow-sm hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                    </svg>
                    Post Topic
                </button>
            </div>

            {/* Card List */}
            {forumPosts.length > 0 ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {forumPosts.map((post: any) => (
                        <PostCard
                            key={post.id}
                            post={post}
                            loggedInUser={loggedInUser}
                            onPostDeleted={onPostDeleted}
                            token={token}
                        />
                    ))}
                </div>
            ) : (
                <div className="forum-card p-20 text-center flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-3xl">💬</div>
                    <p className="text-gray-500 font-medium">Join the conversation! Start the first discussion.</p>
                </div>
            )}
        </div>
    );
}
