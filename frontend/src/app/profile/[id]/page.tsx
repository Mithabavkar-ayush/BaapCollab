"use client";

import { useState, useEffect } from "react";
import { Inter } from 'next/font/google';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { API_BASE, apiFetch } from "@/lib/api";

const inter = Inter({ subsets: ['latin'] });

export default function ProfilePage() {
    const { id } = useParams();
    const router = useRouter();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (!id) return;

        const fetchProfile = async () => {
            try {
                const res = await apiFetch(`/auth/profile/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setProfile(data);
                }
            } catch (err) {
                console.error("Failed to fetch profile:", err);
            } finally {
                setLoading(false);
            }
        };

        const fetchCurrentUser = async () => {
            const token = localStorage.getItem('baap_token') || localStorage.getItem('token');
            if (!token) return;
            try {
                const res = await apiFetch(`/auth/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    setCurrentUser(await res.json());
                }
            } catch (err) {
                console.error("Failed to fetch current user:", err);
            }
        };

        fetchProfile();
        fetchCurrentUser();
    }, [id]);

    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center bg-[#F8FAFC] ${inter.className}`}>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className={`min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] ${inter.className}`}>
                <h1 className="text-2xl font-bold mb-4">User Not Found</h1>
                <Link href="/" className="text-blue-600 hover:underline">Return Home</Link>
            </div>
        );
    }

    return (
        <main className={`min-h-screen bg-[#F8FAFC] pb-20 ${inter.className}`}>
            {/* Header */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 h-16 flex items-center px-8 justify-between">
                <div className="flex items-center gap-2">
                    <Link href="/">
                        <div className="flex items-center gap-2 group transition-transform hover:scale-105 active:scale-95 cursor-pointer">
                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm group-hover:bg-gray-50 transition-colors">
                                <img src="/baap-logo.jpg" alt="Logo" className="w-5 h-5 object-contain grayscale opacity-80" />
                            </div>
                            <span className="font-black text-lg tracking-tighter text-gray-900">BaapCollab</span>
                        </div>
                    </Link>
                </div>

                {/* Centered Navigation Capsule */}
                <nav className="hidden lg:flex items-center gap-1 px-1.5 py-1.5 bg-gray-50/50 border border-gray-100/80 rounded-[20px] shadow-sm">
                    <Link href="/?tab=dashboard" className="px-5 py-2 rounded-[14px] text-sm font-bold text-gray-500 hover:text-black hover:bg-white/50 transition-all">
                        Dashboard
                    </Link>
                    <Link href="/?tab=projects" className="px-5 py-2 rounded-[14px] text-sm font-bold text-gray-500 hover:text-black hover:bg-white/50 transition-all">
                        Projects
                    </Link>
                    <Link href="/?tab=forum" className="px-5 py-2 rounded-[14px] text-sm font-bold text-gray-500 hover:text-black hover:bg-white/50 transition-all">
                        Forum
                    </Link>
                </nav>

                <div className="flex items-center gap-6">
                    <Link href="/leaderboard" className="text-gray-500 hover:text-black font-medium text-sm transition-colors">Leaderboard</Link>
                    <div className="bg-[#EFF6FF] text-[#2563EB] px-3 py-1 rounded-full text-xs font-semibold">Profile</div>
                </div>
            </nav>

            <div className="max-w-4xl mx-auto px-8 pt-16">
                <div className="bg-white rounded-[32px] premium-shadow p-12 relative overflow-hidden animate-welcome-part">
                    {/* Decorative background circle */}
                    <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-[#F5F3FF] rounded-full blur-3xl opacity-50"></div>

                    <div className="relative flex flex-col md:flex-row items-center md:items-start gap-12">
                        {/* Avatar Section */}
                        <div className="flex-shrink-0">
                            <div className="w-40 h-40 rounded-full bg-[#EEF2FF] flex items-center justify-center text-[#4F46E5] font-bold text-5xl overflow-hidden shadow-xl ring-8 ring-white">
                                {profile.picture ? (
                                    <img src={profile.picture} alt={profile.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span>{profile.name?.charAt(0) || 'S'}</span>
                                )}
                            </div>
                            <div className="mt-4 text-center">
                                <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-gray-200">
                                    {profile.role || "Student"}
                                </span>
                            </div>
                            <div className="mt-4 text-center">
                                <div className="bg-[#10B981]/10 text-[#10B981] px-4 py-2 rounded-2xl text-xs font-bold inline-block border border-[#10B981]/20">
                                    {profile.reward_points} Reward Points
                                </div>
                            </div>
                        </div>

                        {/* Info Section */}
                        <div className="flex-grow text-center md:text-left">
                            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-2">{profile.name}</h1>
                            <p className="text-xl text-gray-500 mb-6 font-medium">{profile.department} | Class of {profile.graduation_year}</p>

                            <div className="mb-8">
                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Biography</h4>
                                <p className="text-gray-600 leading-relaxed text-lg max-w-2xl">{profile.bio || "No biography provided yet."}</p>
                            </div>

                            <div className="mb-10">
                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Skills & Expertise</h4>
                                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                                    {profile.skills ? profile.skills.split(',').map((skill: string, i: number) => (
                                        <span key={i} className="bg-white border border-gray-100 px-4 py-2 rounded-xl text-sm font-medium text-gray-700 shadow-sm animate-welcome-part" style={{ animationDelay: `${i * 100 + 400}ms` }}>
                                            {skill.trim()}
                                        </span>
                                    )) : (
                                        <span className="text-gray-400 italic">No skills listed</span>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-4 justify-center md:justify-start">
                                {profile.linkedin_url && (
                                    <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="bg-[#0077b5] text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-[#0077b5]/20">
                                        LinkedIn
                                    </a>
                                )}
                            </div>

                            {/* Admin Actions */}
                            {(currentUser?.role === "ADMIN" || currentUser?.role === "SUPERADMIN") && (
                                <div className="mt-10 pt-8 border-t border-gray-100 flex flex-wrap gap-4 justify-center md:justify-start">
                                    {/* Verify Member Toggle */}
                                    <button
                                        disabled={actionLoading}
                                        onClick={async () => {
                                            setActionLoading(true);
                                            const token = localStorage.getItem('baap_token') || localStorage.getItem('token');
                                            try {
                                                const res = await apiFetch(`/auth/admin/role?target_email=${profile.email}&new_role=${profile.role === 'ADMIN' ? 'STUDENT' : 'ADMIN'}`, {
                                                    method: 'PATCH',
                                                    headers: { 'Authorization': `Bearer ${token}` }
                                                });
                                                if (res.ok) {
                                                    const data = await res.json();
                                                    setProfile({ ...profile, role: data.role });
                                                    alert("User role updated!");
                                                }
                                            } finally {
                                                setActionLoading(false);
                                            }
                                        }}
                                        className={`px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg ${profile.role === 'ADMIN' 
                                            ? 'bg-amber-500 text-white shadow-amber-200' 
                                            : 'bg-emerald-500 text-white shadow-emerald-200'}`}
                                    >
                                        {profile.role === 'ADMIN' ? 'Revoke Admin' : 'Verify as Admin'}
                                    </button>

                                    {/* Delete User Button - SUPERADMIN only */}
                                    {currentUser?.role === "SUPERADMIN" && (
                                        <button
                                            disabled={actionLoading}
                                            onClick={async () => {
                                                if (!confirm(`Are you sure you want to PERMANENTLY delete ${profile.name}?`)) return;
                                                setActionLoading(true);
                                                const token = localStorage.getItem('baap_token') || localStorage.getItem('token');
                                                try {
                                                    const res = await apiFetch(`/auth/admin/users/${profile.id}`, {
                                                        method: 'DELETE',
                                                        headers: { 'Authorization': `Bearer ${token}` }
                                                    });
                                                    if (res.ok) {
                                                        alert("User deleted.");
                                                        window.location.href = "/";
                                                    }
                                                } finally {
                                                    setActionLoading(false);
                                                }
                                            }}
                                            className="px-6 py-3 bg-red-500 text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-red-600 transition-all shadow-lg shadow-red-200"
                                        >
                                            Delete User
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
