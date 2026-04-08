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

export default function ChatRoom({ loggedInUser, token }: ChatRoomProps) {
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(true);
    const [fetchingOlder, setFetchingOlder] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    
    // UI States
    const [isJoined, setIsJoined] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);
    
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
                    
                    if (diffSeconds < 300) {
                        setSlowModeSeconds(300 - diffSeconds);
                    }
                }
            }
            
            setTimeout(() => scrollToBottom("auto"), 100);
        } else if (data.type === "new_message") {
            const autoScroll = shouldAutoScroll();
            
            // Check for unread if minimized
            if (!isExpanded && String(data.user_id) !== String(loggedInUser?.id)) {
                setHasUnread(true);
            }

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
    }, [loggedInUser, isExpanded]);

    const { send } = useWebSocket(handleWsMessage, !!loggedInUser && isJoined, loggedInUser?.id, "/ws/chat/general");

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

    const handleExpandToggle = () => {
        if (!isExpanded) {
            setIsExpanded(true);
            setHasUnread(false);
            setTimeout(() => scrollToBottom("auto"), 300);
        } else {
            setIsExpanded(false);
        }
    };

    const handleJoin = () => {
        setIsJoined(true);
        setIsExpanded(true);
    };

    // Glassmorphism classes
    const glassClasses = "bg-white/70 backdrop-blur-md border border-white shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] rounded-3xl overflow-hidden transition-all duration-300 ease-in-out";

    return (
        <div 
            className={`${glassClasses} ${isExpanded ? 'h-[400px]' : 'h-[72px] cursor-pointer hover:bg-white/80 active:scale-[0.99]'} w-full flex flex-col relative`}
            onClick={!isExpanded ? handleExpandToggle : undefined}
        >
            {/* Header / Minimized Bar Content */}
            <div className={`flex items-center justify-between px-6 shrink-0 transition-all ${isExpanded ? 'py-4 border-b border-gray-100/50' : 'h-full'}`}>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className={`w-3 h-3 rounded-full animate-pulse transition-colors ${hasUnread ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]'}`}></div>
                        {hasUnread && <div className="absolute inset-0 rounded-full animate-ping bg-rose-500 opacity-75"></div>}
                    </div>
                    <h2 className={`font-bold text-[#111827] flex items-center gap-2 ${isExpanded ? 'text-lg' : 'text-base'}`}>
                        General Room
                        {!isExpanded && hasUnread && <span className="text-[10px] bg-rose-500 text-white px-1.5 py-0.5 rounded-full ml-1">New</span>}
                    </h2>
                    {!isExpanded && <span className="hidden md:block text-xs text-gray-400 font-medium">Public community chat • Join to participate</span>}
                </div>

                <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                    {!isJoined ? (
                        <button 
                            onClick={handleJoin}
                            className="bg-[#524EEE] hover:bg-[#433fd1] text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 transition-all active:scale-95 flex items-center gap-2"
                        >
                            <MessageSquare className="w-4 h-4" />
                            Join Chat
                        </button>
                    ) : (
                        <button 
                            onClick={handleExpandToggle}
                            className="p-2 text-gray-400 hover:text-[#524EEE] hover:bg-indigo-50 rounded-xl transition-all"
                        >
                            {isExpanded ? <ChevronDown className="w-6 h-6" /> : <ChevronUp className="w-6 h-6" />}
                        </button>
                    )}
                </div>
            </div>

            {/* Chat Content (Expanded Only) */}
            <div className={`flex-1 flex flex-col overflow-hidden transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <div 
                    ref={containerRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar bg-white/30"
                >
                    {loading && isJoined ? (
                        <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                            <div className="w-5 h-5 border-2 border-indigo-300 border-t-transparent rounded-full animate-spin mr-3" />
                            Connecting...
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm italic">
                            <div className="w-16 h-16 bg-white/50 rounded-full flex items-center justify-center text-3xl mb-4 border border-white/50 shadow-sm">👋</div>
                            No messages here yet. Say hello!
                        </div>
                    ) : (
                        <>
                        {fetchingOlder && (
                            <div className="flex items-center justify-center py-2 text-xs text-indigo-500 font-bold">
                                <div className="w-3 h-3 border-2 border-indigo-300 border-t-transparent rounded-full animate-spin mr-2" />
                                Loading older messages...
                            </div>
                        )}
                        {messages.map((msg: any, idx: number) => {
                            const isMe = String(msg.user_id) === String(loggedInUser?.id);
                            
                            return (
                                <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`flex gap-3 max-w-[80%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
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
                                            <div className="flex items-baseline gap-2 mb-1">
                                                <span className="text-xs font-bold text-gray-700/80">{isMe ? 'You' : msg.full_name}</span>
                                                <span className="text-[10px] text-gray-400 font-medium">{timeAgo(msg.created_at)}</span>
                                            </div>
                                            <div 
                                                className={`px-4 py-2.5 rounded-2xl text-[15px] leading-relaxed shadow-sm ${
                                                    isMe 
                                                    ? 'bg-[#524EEE] text-white rounded-tr-sm shadow-indigo-100' 
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
                <div className="p-4 bg-white/50 border-t border-gray-100/50 shrink-0">
                    {!token ? (
                        <div className="w-full py-3 bg-gray-50/50 rounded-xl text-center text-sm text-gray-500 font-medium border border-gray-100">
                            Please log in to participate in the chat.
                        </div>
                    ) : (
                        <div className="flex items-end gap-3 max-w-5xl mx-auto">
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
                                    className={`w-full min-h-[44px] max-h-32 px-4 py-3 bg-white/80 border ${slowModeSeconds > 0 ? 'border-orange-200 bg-orange-50/30 text-orange-700' : 'border-gray-200 focus:border-[#524EEE]'} rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-[#524EEE]/10 transition-all resize-none custom-scrollbar`}
                                    rows={1}
                                    style={{ height: input ? 'auto' : '44px' }}
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
                                className="w-11 h-11 shrink-0 bg-[#524EEE] text-white rounded-xl flex items-center justify-center hover:bg-[#433fd1] hover:shadow-lg hover:shadow-indigo-100 transition-all disabled:opacity-50 active:scale-95 shadow-sm"
                            >
                                <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                                </svg>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
