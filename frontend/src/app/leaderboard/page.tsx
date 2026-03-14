"use client";

import { useState, useEffect } from "react";
import { Inter } from 'next/font/google';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'] });
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "https://baapcollab-backend-production.up.railway.app")
    .replace(/\/$/, "")
    .replace("http://", "https://");

export default function LeaderboardPage() {
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const res = await fetch(`${API_BASE}/rewards/leaderboard`, {
                    credentials: 'include'
                });
                if (res.ok) {
                    const data = await res.json();
                    // Limit to exactly Top 5 as per Mission
                    setLeaderboard(data.slice(0, 5));
                }
            } catch (err) {
                console.error("Failed to fetch leaderboard:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, []);

    // Width mapping: Rank 1 (index 0) = 100%, Rank 2 = 90%, etc.
    const getWidth = (index: number) => {
        const widths = ["100%", "90%", "80%", "70%", "60%"];
        return widths[index] || "60%";
    };

    return (
        <main className={`min-h-screen bg-[#F8FAFC] pb-20 ${inter.className}`}>
            {/* Header */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 h-16 flex items-center px-8 justify-between flex-wrap gap-6">
                <div className="flex items-center gap-3">
                    <Link href="/">
                        <div className="flex items-center gap-2 cursor-pointer">
                            <img src="/baap-logo.jpg" alt="BaapCollab Logo" className="w-10 h-10 object-contain" />
                            <span className="font-bold text-xl tracking-tight">BaapCollab</span>
                        </div>
                    </Link>
                </div>
                <div className="flex items-center gap-6">
                    <Link href="/" className="text-gray-500 hover:text-black font-medium text-sm transition-colors">Dashboard</Link>
                    <div className="bg-[#EFF6FF] text-[#2563EB] px-3 py-1 rounded-full text-xs font-semibold">Leaderboard</div>
                </div>
            </nav>

            <div className="max-w-5xl mx-auto px-10 pt-16">
                <div className="mb-14 text-left">
                    <h1 className="text-6xl font-black tracking-tight text-gray-900 mb-4 animate-welcome-part">
                        Community <span className="text-gray-400">Leaders</span>
                    </h1>
                    <div className="animate-welcome-part delay-400">
                        <p className="text-xl text-gray-400 font-medium max-w-2xl">
                            Top contributors driving innovation across the platform
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                    </div>
                ) : (
                    <div className="flex flex-col items-start gap-5">
                        {leaderboard.map((member, index) => (
                            <Link
                                key={member.id}
                                href={`/profile/${member.id}`}
                                className="leaderboard-item inline-block animate-welcome-part"
                                style={{
                                    "--staggered-width": getWidth(index),
                                    animationDelay: `${index * 100 + 600}ms`
                                } as React.CSSProperties}
                            >
                                <div className="bg-white p-7 pr-5 rounded-[24px] premium-shadow border border-transparent hover:border-[#10B981]/10 transition-all cursor-pointer flex items-center justify-between group ultra-slim-border-hover">
                                    <div className="flex items-center gap-6">
                                        <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center font-black text-xl text-gray-400 group-hover:bg-[#10B981]/10 group-hover:text-[#10B981] transition-colors shadow-inner">
                                            {index + 1}
                                        </div>
                                        <div className="w-14 h-14 rounded-full bg-[#EEF2FF] flex items-center justify-center text-[#4F46E5] font-bold text-xl overflow-hidden shadow-inner ring-4 ring-white">
                                            {member.picture ? (
                                                <img src={member.picture} alt={member.display_name || member.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span>{(member.display_name || member.name || '?').charAt(0)}</span>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-extrabold text-xl text-gray-900 group-hover:text-black transition-colors">{member.display_name || member.name || "—"}</h3>
                                            <p className="text-gray-400 text-sm font-semibold tracking-wide uppercase">{member.department || "General Contributor"}</p>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className="text-3xl font-black text-gray-900 group-hover:text-[#10B981] transition-colors leading-none">
                                            {member.reward_points}
                                        </div>
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">Points</div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
