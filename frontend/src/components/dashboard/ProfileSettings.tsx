"use client";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "https://baapcollab-backend-production.up.railway.app")
    .replace(/\/$/, "")
    .replace("http://", "https://");

interface ProfileSettingsProps {
    user: any;
    initials: string;
    imgError: boolean;
    setImgError: (error: boolean) => void;
    userBranchName: string;
    profileData: any;
    setProfileData: (data: any) => void;
    authToken: string | null;
    setUser: (user: any) => void;
    setToast: (toast: { message: string, type: 'success' | 'error' } | null) => void;
}

export default function ProfileSettings({
    user,
    initials,
    imgError,
    setImgError,
    userBranchName,
    profileData,
    setProfileData,
    authToken,
    setUser,
    setToast
}: ProfileSettingsProps) {
    return (
        <div className="lg:col-span-3 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-3xl font-bold text-[#111827]">Profile Settings</h1>
            </div>

            {/* Identity Card */}
            <div className="bg-white rounded-3xl premium-shadow premium-hover p-8 flex items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center text-[#524EEE] text-2xl font-bold shadow-inner overflow-hidden">
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
                    <h2 className="text-2xl font-bold text-[#111827]">{user?.name || "Baap Student"}</h2>
                    <p className="text-gray-500 mb-3">{user?.email}</p>
                    <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-zinc-100 border border-gray-200 rounded-full text-xs font-bold text-gray-600">Student</span>
                        <span className="px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full text-xs font-bold text-emerald-600">verified</span>
                    </div>
                </div>
            </div>

            {/* College Information */}
            <div className="bg-white rounded-3xl premium-shadow premium-hover p-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-zinc-50 rounded-lg">🏢</div>
                    <h3 className="font-bold text-gray-900">College Information</h3>
                </div>
                <div className="p-6 bg-indigo-50/30 rounded-2xl border border-indigo-50">
                    <p className="font-bold text-[#111827] text-lg mb-1">{userBranchName}</p>
                    <p className="text-sm text-indigo-400 font-medium">Baap Partner Institution</p>
                </div>
            </div>

            {/* Personal Information Form */}
            <div className="bg-white rounded-3xl premium-shadow premium-hover p-8">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 bg-zinc-50 rounded-lg">👤</div>
                    <div>
                        <h3 className="font-bold text-gray-900">Personal Information</h3>
                        <p className="text-xs text-gray-400">Update your profile details</p>
                    </div>
                </div>

                <form onSubmit={async (e) => {
                    e.preventDefault();
                    if (!authToken) return;

                    const details = {
                        name: user?.name,
                        department: profileData.dept,
                        graduation_year: parseInt(profileData.year),
                        skills: profileData.skills,
                        bio: profileData.bio,
                        linkedin_url: profileData.linkedin_url,
                        github_url: profileData.github_url
                    };

                    try {
                        const res = await fetch(`${API_BASE}/auth/profile`, {
                            method: 'PATCH',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${authToken}`
                            },
                            body: JSON.stringify(details),
                            credentials: 'include'
                        });
                        if (res.ok) {
                            const updatedUser = await res.json();
                            setUser(updatedUser);
                            setToast({ message: "Profile updated successfully!", type: "success" });
                        } else {
                            setToast({ message: "Failed to update profile.", type: "error" });
                        }
                    } catch (err) {
                        setToast({ message: "Connection error.", type: "error" });
                    }
                }} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 premium-spacing">Department</label>
                            <input
                                type="text"
                                className="w-full p-4 rounded-xl border border-gray-100 bg-[#F9FAFB] focus:bg-white focus:border-[#524EEE] outline-none transition-all premium-shadow"
                                value={profileData.dept}
                                onChange={(e) => setProfileData({ ...profileData, dept: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 premium-spacing">Graduation Year</label>
                            <select
                                className="w-full p-4 rounded-xl border border-gray-100 bg-[#F9FAFB] focus:bg-white focus:border-[#524EEE] outline-none transition-all appearance-none premium-shadow"
                                value={profileData.year}
                                onChange={(e) => setProfileData({ ...profileData, year: e.target.value })}
                            >
                                <option value="2024">2024</option>
                                <option value="2025">2025</option>
                                <option value="2026">2026</option>
                                <option value="2027">2027</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 premium-spacing">Bio</label>
                        <textarea
                            className="w-full p-4 rounded-xl border border-gray-100 bg-[#F9FAFB] focus:bg-white focus:border-[#524EEE] outline-none transition-all min-h-[120px] premium-shadow"
                            value={profileData.bio}
                            onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                        ></textarea>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 premium-spacing">Skills (comma-separated)</label>
                        <input
                            type="text"
                            className="w-full p-4 rounded-xl border border-gray-100 bg-[#F9FAFB] focus:bg-white focus:border-[#524EEE] outline-none transition-all premium-shadow"
                            value={profileData.skills}
                            onChange={(e) => setProfileData({ ...profileData, skills: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-gray-50 mt-10">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 flex items-center gap-2 premium-spacing">
                                <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                                LinkedIn URL
                            </label>
                            <input
                                type="url"
                                placeholder="https://linkedin.com/in/..."
                                className="w-full p-4 rounded-xl border border-gray-100 bg-[#F9FAFB] focus:bg-white focus:border-[#524EEE] outline-none transition-all premium-shadow"
                                value={profileData.linkedin_url}
                                onChange={(e) => setProfileData({ ...profileData, linkedin_url: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 flex items-center gap-2 premium-spacing">
                                <svg className="w-4 h-4 text-gray-900" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                                GitHub URL
                            </label>
                            <input
                                type="url"
                                placeholder="https://github.com/..."
                                className="w-full p-4 rounded-xl border border-gray-100 bg-[#F9FAFB] focus:bg-white focus:border-[#524EEE] outline-none transition-all premium-shadow"
                                value={profileData.github_url}
                                onChange={(e) => setProfileData({ ...profileData, github_url: e.target.value })}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="px-8 py-4 bg-[#524EEE] hover:bg-[#433fd1] hover:shadow-xl hover:shadow-indigo-100/50 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 transition-all flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
                        Save Changes
                    </button>
                </form>
            </div>
        </div>
    );
}
