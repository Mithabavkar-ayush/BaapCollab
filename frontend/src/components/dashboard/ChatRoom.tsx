"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { formatDistanceToNow, parseISO } from "date-fns";
import { useWebSocket } from "@/lib/useWebSocket";
import { API_BASE, apiFetch } from "@/lib/api";
import { ChevronUp, ChevronDown, MessageSquare, X } from "lucide-react";

interface ChatRoomProps {
    loggedInUser: any;
    token: string | null;
    isOpen: boolean;
    onClose: () => void;
    isJoined: boolean;
    onJoin: () => void;
}

function Avatar({ picture, profile_pic_url, name, size = 40, userId }: { picture?: string | null; profile_pic_url?: string | null; name?: string | null; size?: number; userId?: string | number }) {
    const initials = name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || "?";
    const imageUrl = profile_pic_url || picture;

    const content = (
        <div
            style={{ width: size, height: size, minWidth: size }}
            className={`rounded-full bg-[#EEF2FF] border border-[rgba(0,0,0,0.06)] flex items-center justify-center overflow-hidden shrink-0 ${userId ? 'cursor-pointer hover:ring-2 hover:ring-indigo-400/50 transition-all' : ''}`}
        >
            {imageUrl ? (
                <img
                    src={imageUrl}
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

    if (userId) {
        return <Link href={`/profile/${userId}`}>{content}</Link>;
    }

    return content;
}

export default function ChatRoom({ loggedInUser, token, isOpen, onClose, isJoined, onJoin }: ChatRoomProps) {
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(true);
    const [fetchingOlder, setFetchingOlder] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    
    // Slow Mode State
    const [slowModeSeconds, setSlowModeSeconds] = useState(0);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const timeAgo = (dateStr: string) => {
        if (!dateStr) return "now";
        try {
            const utcStr = dateStr.includes('T') && !dateStr.endsWith('Z') && !dateStr.includes('+') 
                ? `${dateStr}Z` 
                : dateStr;
            const date = parseISO(utcStr);
            if (isNaN(date.getTime())) return "now";
            return formatDistanceToNow(date, { addSuffix: true });
        } catch (err) {
            return "now";
        }
    };

    const scrollToBottom = (behavior: "auto" | "smooth" = "smooth") => {
        messagesEndRef.current?.scrollIntoView({ behavior });
    };

    const shouldAutoScroll = () => {
        if (!containerRef.current) return true;
        const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
        return scrollHeight - scrollTop - clientHeight < 150;
    };

    const handleWsMessage = useCallback((data: any) => {
        if (data.type === "message_history" && data.messages) {
            setMessages(data.messages);
            setLoading(false);
            
            if (loggedInUser) {
                const userMessages = data.messages.filter((m: any) => String(m.user_id) === String(loggedInUser.id));
                if (userMessages.length > 0) {
                    const latestMsg = userMessages[userMessages.length - 1];
                    const utcStr = latestMsg.created_at.includes('T') && !latestMsg.created_at.endsWith('Z') && !latestMsg.created_at.includes('+') 
                        ? `${latestMsg.created_at}Z` 
                        : latestMsg.created_at;
                    const createdTime = parseISO(utcStr).getTime();
                    const now = Date.now();
                    const diffSeconds = Math.floor((now - createdTime) / 1000);
                    
                    if (diffSeconds < 60) {
                        setSlowModeSeconds(60 - diffSeconds);
                    }
                }
            }
            
            setTimeout(() => scrollToBottom("auto"), 100);
        } else if (data.type === "new_message") {
            const autoScroll = shouldAutoScroll();
            
            setMessages(prev => {
                if (prev.some(m => m.id === data.id)) return prev;
                return [...prev, data];
            });
            
            if (autoScroll || String(data.user_id) === String(loggedInUser?.id)) {
                setTimeout(() => scrollToBottom(), 100);
            }
        } else if (data.type === "slowmode_error") {
            setSlowModeSeconds(data.retry_after);
        }
    }, [loggedInUser]);

    const { send } = useWebSocket(handleWsMessage, !!loggedInUser && isJoined && isOpen, loggedInUser?.id, "/ws/chat/general");

    useEffect(() => {
        if (!token) {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (slowModeSeconds > 0) {
            const timer = setInterval(() => {
                setSlowModeSeconds(prev => prev - 1);
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [slowModeSeconds]);

    const sendMessage = () => {
        if (!input.trim() || !loggedInUser || slowModeSeconds > 0) return;
        send(input.trim());
        setInput("");
    };

    const handleScroll = async () => {
        if (!containerRef.current || fetchingOlder || !hasMore || messages.length === 0) return;
        if (containerRef.current.scrollTop === 0) {
            setFetchingOlder(true);
            const oldestId = messages[0].id;
            try {
                const res = await apiFetch(`/chat/general/history?before_id=${oldestId}&limit=50`);
                if (res.ok) {
                    const olderMessages = await res.json();
                    if (olderMessages.length < 50) setHasMore(false);
                    const prevScrollHeight = containerRef.current.scrollHeight;
                    setMessages(prev => {
                        const existingIds = new Set(prev.map(m => m.id));
                        const uniqueOlder = olderMessages.filter((m: any) => !existingIds.has(m.id));
                        return [...uniqueOlder, ...prev];
                    });
                    requestAnimationFrame(() => {
                        if (containerRef.current) {
                            containerRef.current.scrollTop = containerRef.current.scrollHeight - prevScrollHeight;
                        }
                    });
                }
            } catch (err) {
                console.error("Failed to load older messages", err);
            } finally {
                setFetchingOlder(false);
            }
        }
    };

    // Auto-scroll when opened
    useEffect(() => {
        if (isOpen && isJoined) {
            setTimeout(() => scrollToBottom("auto"), 300);
        }
    }, [isOpen]);

    return (
        <>
            {/* Backdrop */}
            <div 
                className={`fixed inset-0 bg-black/50 z-[1000] transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            ></div>

            {/* Side Drawer */}
            <div className={`fixed inset-y-0 right-0 z-[1001] w-full md:w-[480px] bg-white/70 backdrop-blur-xl border-l border-white/20 shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100/50">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className={`w-3 h-3 rounded-full animate-pulse bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]`}></div>
                        </div>
                        <h2 className="font-bold text-[#111827] text-lg">General Room</h2>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {!isJoined ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in duration-300">
                        <button 
                            onClick={onJoin}
                            className="bg-[#524EEE] hover:bg-[#433fd1] text-white px-10 py-3.5 rounded-2xl font-bold shadow-xl shadow-indigo-100 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                        >
                            <MessageSquare className="w-5 h-5" />
                            Join General Chat
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Messages List */}
                        <div 
                            ref={containerRef}
                            onScroll={handleScroll}
                            className="flex-1 overflow-y-auto p-6 space-y-5 bg-white/30 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                        >
                            {loading ? (
                                <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                                    <div className="w-5 h-5 border-2 border-indigo-300 border-t-transparent rounded-full animate-spin mr-3" />
                                    Establishing Connection...
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm italic">
                                </div>
                            ) : (
                                <>
                                {fetchingOlder && (
                                    <div className="flex items-center justify-center py-2 text-xs text-indigo-500 font-bold">
                                        <div className="w-3 h-3 border-2 border-indigo-300 border-t-transparent rounded-full animate-spin mr-2" />
                                        Fetching older logs...
                                    </div>
                                )}
                                {messages.map((msg: any, idx: number) => {
                                    const isMe = String(msg.user_id) === String(loggedInUser?.id);
                                    
                                    return (
                                        <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                                            <div className={`flex gap-3 max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                                <div className="shrink-0 pt-1">
                                                    <Avatar 
                                                        picture={msg.avatar_url} 
                                                        profile_pic_url={msg.avatar_url} 
                                                        name={msg.full_name} 
                                                        size={36} 
                                                        userId={msg.user_id} 
                                                    />
                                                </div>
                                                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                                    <div className="flex items-baseline gap-2 mb-1 px-1">
                                                        <span className="text-xs font-bold text-gray-700/80">{isMe ? 'You' : msg.full_name}</span>
                                                        <span className="text-[10px] text-gray-400 font-medium">{timeAgo(msg.created_at)}</span>
                                                    </div>
                                                    <div 
                                                        className={`px-4 py-2.5 rounded-2xl text-[15px] leading-relaxed ${
                                                            isMe 
                                                            ? 'bg-[#524EEE] text-white rounded-tr-sm' 
                                                            : 'bg-white/80 border border-white/50 text-gray-800 rounded-tl-sm'
                                                        }`}
                                                    >
                                                        {msg.content}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                </>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-6 bg-white/50 border-t border-gray-100/50 shrink-0">
                            {!token ? (
                                <div className="w-full py-3 bg-gray-50/50 rounded-xl text-center text-sm text-gray-500 font-medium border border-gray-100">
                                    Please log in to chat.
                                </div>
                            ) : (
                                <div className="flex items-end gap-3">
                                    <div className="flex-1 relative">
                                        <textarea
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    sendMessage();
                                                }
                                            }}
                                            disabled={slowModeSeconds > 0}
                                            placeholder={slowModeSeconds > 0 ? "Slow mode active..." : "Type your message..."}
                                            className={`w-full min-h-[48px] max-h-32 px-4 py-3.5 bg-white/80 border ${slowModeSeconds > 0 ? 'border-orange-200 bg-orange-50/30 text-orange-700' : 'border-gray-200 focus:border-[#524EEE]'} rounded-2xl text-[15px] focus:outline-none focus:ring-4 focus:ring-[#524EEE]/10 transition-all resize-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden`}
                                            rows={1}
                                            style={{ height: input ? 'auto' : '48px' }}
                                        />
                                        {slowModeSeconds > 0 && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 px-2.5 py-1 bg-orange-100 text-orange-700 rounded-md text-[10px] font-bold tracking-wide">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                WAIT {Math.floor(slowModeSeconds / 60)}:{String(slowModeSeconds % 60).padStart(2, '0')}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={sendMessage}
                                        disabled={!input.trim() || slowModeSeconds > 0}
                                        className="w-12 h-12 shrink-0 bg-[#524EEE] text-white rounded-2xl flex items-center justify-center hover:bg-[#433fd1] hover:shadow-lg hover:shadow-indigo-100 transition-all disabled:opacity-50 active:scale-95 shadow-sm"
                                    >
                                        <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </>
    );
}
