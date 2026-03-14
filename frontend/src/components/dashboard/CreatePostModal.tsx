"use client";

import { useState } from "react";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "https://baapcollab-backend-production.up.railway.app")
    .replace(/\/$/, "")
    .replace("http://", "https://");

interface CreatePostModalProps {
    modalType: 'project' | 'discussion';
    setShowCreateModal: (show: boolean) => void;
    authToken: string | null;
    onSuccess: () => void;
    setToast: (toast: { message: string, type: 'success' | 'error' } | null) => void;
}

export default function CreatePostModal({
    modalType,
    setShowCreateModal,
    authToken,
    onSuccess,
    setToast
}: CreatePostModalProps) {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [isPosting, setIsPosting] = useState(false);

    const handlePost = async () => {
        if (!title.trim() || !content.trim() || !authToken) return;

        setIsPosting(true);
        try {
            const res = await fetch(`${API_BASE}/posts/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    title,
                    content,
                    type: modalType === 'project' ? 'LFM' : 'FORUM'
                }),
                credentials: 'include'
            });

            if (res.ok) {
                setToast({ message: `${modalType === 'project' ? 'Project' : 'Discussion'} created!`, type: 'success' });
                onSuccess();
                setShowCreateModal(false);
            } else {
                setToast({ message: "Failed to create post.", type: 'error' });
            }
        } catch (err) {
            setToast({ message: "Network error.", type: 'error' });
        } finally {
            setIsPosting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="bg-white p-8 rounded-[32px] max-w-md w-full shadow-2xl border border-gray-100 animate-in zoom-in duration-300">
                <h2 className="text-xl font-bold mb-4 text-[#111827]">Create {modalType === 'project' ? 'Project' : 'Discussion'}</h2>
                <div className="space-y-4">
                    <input
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 outline-none focus:border-indigo-500 transition-all placeholder:text-gray-400"
                        placeholder="Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        disabled={isPosting}
                    />
                    <textarea
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 outline-none focus:border-indigo-500 transition-all placeholder:text-gray-400 min-h-[120px]"
                        placeholder="Description"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        disabled={isPosting}
                    ></textarea>
                    <div className="flex justify-end gap-4 pt-4">
                        <button
                            onClick={() => setShowCreateModal(false)}
                            className="text-gray-500 font-medium hover:text-gray-900 transition-colors"
                            disabled={isPosting}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handlePost}
                            disabled={isPosting || !title.trim() || !content.trim()}
                            className="bg-[#524EEE] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#433fd1] transition-all disabled:opacity-50"
                        >
                            {isPosting ? 'Posting...' : 'Post'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
