"use client";

import { useState, useEffect } from "react";
import { Inter } from 'next/font/google';
import Link from 'next/link';
import { SUPPORTED_BRANCHES } from "@/data/institutions";

// Modular Components
import OnboardingSteps from "@/components/dashboard/OnboardingSteps";
import DashboardHome from "@/components/dashboard/DashboardHome";
import ProjectList from "@/components/dashboard/ProjectList";
import ForumList from "@/components/dashboard/ForumList";
import ProfileSettings from "@/components/dashboard/ProfileSettings";
import CreatePostModal from "@/components/dashboard/CreatePostModal";

const inter = Inter({ subsets: ['latin'] });
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "https://baapcollab-backend-production.up.railway.app")
  .replace(/\/$/, "")
  .replace("http://", "https://"); // FORCE HTTPS to prevent Mixed Content errors
const PRODUCTION_DOMAIN = "baapcollab.vercel.app";

console.log("PRODUCTION_BUILD_V3_SLASHFIX_ACTIVE");

export default function Dashboard() {
  const [step, setStep] = useState(1);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [userId, setUserId] = useState<number | null>(null);

  // Debug mode toggle (hidden)
  useEffect(() => {
    (window as any).debugAPI = () => {
      console.log("Current API BASE:", API_BASE);
      alert(`API BASE: ${API_BASE}`);
    };
  }, []);

  // Dashboard State Data
  const [lfmPosts, setLfmPosts] = useState<any[]>([]);
  const [forumPosts, setForumPosts] = useState<any[]>([]);
  const [allForumPosts, setAllForumPosts] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [showGuide, setShowGuide] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'projects' | 'forum' | 'settings'>('dashboard');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [modalType, setModalType] = useState<'project' | 'discussion'>('project');
  const [authError, setAuthError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab && ['dashboard', 'projects', 'forum', 'settings'].includes(tab)) {
        setActiveTab(tab as any);
      }
    }
  }, []);

  // Search/Validation State (Propagated to components)
  const [manualCollegeName, setManualCollegeName] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // States for Profile Details
  const [profileData, setProfileData] = useState({
    name: "",
    dept: "",
    year: "2026",
    skills: "",
    bio: "",
    linkedin_url: "",
    github_url: ""
  });

  useEffect(() => {
    if (user) {
      setImgError(false);
      setProfileData({
        name: user.name || "",
        dept: user.department || "",
        year: (user.graduation_year || 2026).toString(),
        skills: user.skills || "",
        bio: user.bio || "",
        linkedin_url: user.linkedin_url || "",
        github_url: user.github_url || ""
      });
    }
  }, [user]);

  // Auto-hide toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Domain Locking
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      if (hostname !== PRODUCTION_DOMAIN && hostname !== "localhost" && !hostname.includes("127.0.0.1")) {
        // Only redirect if we are on a long vercel preview URL
        if (hostname.includes("vercel.app")) {
          window.location.replace(`https://${PRODUCTION_DOMAIN}${window.location.pathname}${window.location.search}`);
        }
      }
    }
  }, []);

  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session
  useEffect(() => {
    const savedToken = localStorage.getItem('baap_token') || localStorage.getItem('token');
    const savedStep = localStorage.getItem('baap_step');

    if (savedToken) {
      setAuthToken(savedToken);
      // Ensure both keys are synced for components like ForumList
      localStorage.setItem('baap_token', savedToken);
      localStorage.setItem('token', savedToken);
      if (savedStep) setStep(parseInt(savedStep));
      fetchUser(savedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  // Persist step changes
  useEffect(() => {
    if (step > 1) {
      localStorage.setItem('baap_step', step.toString());
    }
  }, [step]);

  const fetchUser = async (token: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include'
      });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);

        if (userData.branch_id === null) {
          setStep(2);
        } else if (userData.department === null || userData.department === "") {
          setStep(3);
        } else {
          setStep(4);
          if (!userData.has_seen_welcome) setShowGuide(true);
          fetchData(token); // Immediate hydration
        }
      } else if (res.status === 401 || res.status === 403) {
        handleLogout();
      }
    } catch (err) {
      console.error("Auth hydration failed:", err);
      // Don't log out on network error, only on 401/403
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('baap_token');
    localStorage.removeItem('baap_step');
    localStorage.removeItem('token');
    setAuthToken(null);
    setUser(null);
    setStep(1);
    setActiveTab('dashboard');
    setIsLoading(false);
    // Force a clean state for next login
    window.location.reload();
  };

  const fetchData = async (tokenOverride?: string) => {
    const currentToken = tokenOverride || authToken;
    if (!currentToken || isLoading) return;
    try {
      const headers = { 'Authorization': `Bearer ${currentToken}` };
      const [postsRes, leaderRes] = await Promise.all([
        fetch(`${API_BASE}/posts/`, {
          headers: { ...headers, 'X-Sync-Version': 'v3-slash' },
          credentials: 'include'
        }),
        fetch(`${API_BASE}/rewards/leaderboard`, {
          headers,
          credentials: 'include'
        })
      ]);

      if (postsRes.ok) {
        const allPosts = await postsRes.json();
        setLfmPosts(allPosts.filter((p: any) => p.type === 'LFM').slice(0, 3));
        const forum = allPosts.filter((p: any) => p.type === 'FORUM');
        setAllForumPosts(forum);
        setForumPosts(forum.slice(0, 4));
      } else {
        const errText = await postsRes.text();
        console.error("Posts fetch failed:", postsRes.status, errText);
        setToast({ message: `Failed to load posts (Status ${postsRes.status})`, type: 'error' });
      }

      if (leaderRes.ok) {
        const leaderData = await leaderRes.json();
        setLeaderboard(leaderData);
      } else {
        console.error("Leaderboard fetch failed:", leaderRes.status);
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setToast({ message: "Network error while loading dashboard data", type: 'error' });
    }
  };

  useEffect(() => {
    if (step === 4 && authToken && !isLoading) {
      fetchData();
    }
  }, [step, authToken, isLoading, userId]);

  const removePostFromState = (postId: number) => {
    setLfmPosts(prev => prev.filter(p => p.id !== postId));
    setForumPosts(prev => prev.filter(p => p.id !== postId));
    setAllForumPosts(prev => prev.filter(p => p.id !== postId));
  };

  const handleBranchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCollegeName.trim() || !authToken) return;

    setIsChecking(true);
    setValidationError(null);

    setTimeout(async () => {
      const inputWords = manualCollegeName.trim().toLowerCase().split(/\s+/).filter(w => w.length > 0);
      const matchedBranches = SUPPORTED_BRANCHES.filter(branch => {
        const branchName = branch.name.toLowerCase();
        const branchWords = branchName.split(/[\s,.-]+/).filter(w => w.length > 0);
        return inputWords.every(iWord => {
          if (iWord.length <= 2) return branchWords.some(bw => bw === iWord);
          return branchWords.some(bw => bw.startsWith(iWord));
        });
      });

      if (matchedBranches.length === 1) {
        const match = matchedBranches[0];
        try {
          const res = await fetch(`${API_BASE}/auth/onboarding/institute?branch_id=${match.id}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}` },
            credentials: 'include'
          });
          if (res.ok) {
            setStep(3);
          } else {
            const errData = await res.json().catch(() => ({}));
            console.error("Institution Verification Failed:", res.status, errData);
            setValidationError(`Server error (${res.status}). Please try again.`);
          }
        } catch (err) {
          console.error("Institution Connection Error:", err);
          setValidationError("Connection error. The backend may be blocking this request (CORS) or is offline.");
        }
      } else if (matchedBranches.length > 1) {
        setValidationError("Too many matches found. Please be more specific.");
      } else {
        setValidationError("You can't use the Baap Collab. You need to be associated to the Baap Company.");
      }
      setIsChecking(false);
    }, 1200);
  };

  const handleProfileComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken) return;

    const details = {
      name: profileData.name,
      department: profileData.dept,
      graduation_year: parseInt(profileData.year),
      skills: profileData.skills,
      bio: profileData.bio,
      linkedin_url: profileData.linkedin_url,
      github_url: profileData.github_url
    };

    try {
      const res = await fetch(`${API_BASE}/auth/onboarding/details`, {
        method: 'POST',
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
        setStep(4);
        if (!updatedUser.has_seen_welcome) setShowGuide(true);
      }
    } catch (err) {
      console.error("Could not save profile:", err);
    }
  };

  const handleLoginSuccess = async (credentialResponse: any) => {
    setAuthError(null);
    if (credentialResponse.credential) {
      try {
        const res = await fetch(`${API_BASE}/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credential: credentialResponse.credential }),
          credentials: 'include'
        });
        if (res.ok) {
          const data = await res.json();
          localStorage.setItem('baap_token', data.token);
          localStorage.setItem('token', data.token);
          setAuthToken(data.token);
          setUser(data.user);

          if (data.requires_onboarding) {
            localStorage.setItem('baap_step', '2');
            setStep(2);
          } else {
            localStorage.setItem('baap_step', '4');
            setStep(4);
            if (!data.user.has_seen_welcome) {
              setShowGuide(true);
            }
            fetchData(data.token); // Immediate hydration
          }
        } else {
          const errData = await res.json().catch(() => ({}));
          console.error("Google Login Backend Error:", res.status, errData);
          setAuthError(`Backend error during login (${res.status}).`);
        }
      } catch (err: any) {
        console.error("Google Login Network Error:", err);
        setAuthError("Network error. Backend might be unreachable or rejecting CORS.");
      }
    }
  };

  const handleWelcomeComplete = async () => {
    setShowGuide(false);
    if (!authToken) return;
    try {
      await fetch(`${API_BASE}/auth/welcome-seen`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` },
        credentials: 'include'
      });
      // Update local user state
      setUser((prev: any) => ({ ...prev, has_seen_welcome: true }));
    } catch (err) {
      console.error("Failed to mark welcome as seen:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (step < 4) {
    return (
      <main className={inter.className}>
        <OnboardingSteps
          step={step}
          setStep={setStep}
          authToken={authToken}
          setAuthToken={setAuthToken}
          setUser={setUser}
          profileData={profileData}
          setProfileData={setProfileData}
          handleLoginSuccess={handleLoginSuccess}
          authError={authError}
          setAuthError={setAuthError}
          handleBranchSubmit={handleBranchSubmit}
          manualCollegeName={manualCollegeName}
          setManualCollegeName={setManualCollegeName}
          isChecking={isChecking}
          validationError={validationError}
          handleProfileComplete={handleProfileComplete}
        />
      </main>
    );
  }

  const initials = user?.name?.split(' ').map((n: any) => n[0]).join('') || 'U';
  const userBranchName = SUPPORTED_BRANCHES.find(b => b.id === user?.branch_id)?.name || "Partner Institute";

  return (
    <div className={`min-h-screen bg-[#F8FAFC] ${inter.className}`}>
      <header className="fixed top-0 left-0 right-0 min-h-[5rem] bg-white/80 backdrop-blur-md z-[1000] border-b border-gray-100/50 flex items-center justify-between px-[5%] py-4 flex-nowrap gap-6">
        <div className="flex items-center gap-3 shrink-0 flex-shrink-0">
          <Link href="/">
            <div className="flex items-center gap-2 group transition-transform hover:scale-105 active:scale-95 cursor-pointer">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:bg-gray-50 transition-colors">
                <img src="/baap-logo.jpg" alt="Logo" className="w-5 h-5 md:w-6 md:h-6 object-contain grayscale opacity-80" />
              </div>
              <span className="font-black text-lg md:text-xl tracking-tighter text-gray-900">BaapCollab</span>
              <span className="ml-2 text-[10px] text-gray-300 font-mono">v3.3-proto-lockdown</span>
            </div>
          </Link>
          <div className="hidden sm:block h-6 w-px bg-gray-100 mx-2"></div>
          <span className="hidden sm:block px-3 py-1 bg-indigo-50 text-[#524EEE] rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100/50 shadow-sm">
            Student
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-1 md:gap-2 px-1.5 py-1.5 bg-gray-50/50 border border-gray-100/80 rounded-[20px] shadow-sm">
          <button
            onClick={() => { setActiveTab('dashboard'); fetchData(); }}
            className={`px-5 py-2 rounded-[14px] text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-white text-[#524EEE] shadow-sm ring-1 ring-gray-100' : 'text-gray-500 hover:text-black hover:bg-white/50'}`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-5 py-2 rounded-[14px] text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'projects' ? 'bg-white text-[#524EEE] shadow-sm ring-1 ring-gray-100' : 'text-gray-500 hover:text-black hover:bg-white/50'}`}
          >
            Projects
          </button>
          <button
            onClick={() => setActiveTab('forum')}
            className={`px-5 py-2 rounded-[14px] text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'forum' ? 'bg-white text-[#524EEE] shadow-sm ring-1 ring-gray-100' : 'text-gray-500 hover:text-black hover:bg-white/50'}`}
          >
            Forum
          </button>
        </nav>

        <div className="flex items-center gap-4 shrink-0 justify-end">
          <div
            onClick={() => setActiveTab('settings')}
            className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center overflow-hidden border-2 border-white shadow-md hover:scale-105 transition-transform cursor-pointer group"
          >
            {user?.picture ? (
              <img src={user.picture} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-bold text-sm">{(user?.name || "?").charAt(0)}</span>
            )}
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('baap_token');
              localStorage.removeItem('baap_step');
              localStorage.removeItem('token');
              window.location.reload();
            }}
            className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
            title="Logout"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>


      <main className="w-full max-w-[1920px] mx-auto pt-[100px] pb-[100px] md:pb-20 px-6 xl:px-12">
        {activeTab === 'dashboard' && (
          <DashboardHome
            user={user} initials={initials} userBranchName={userBranchName}
            imgError={imgError} setImgError={setImgError}
            lfmPosts={lfmPosts} forumPosts={forumPosts} leaderboard={leaderboard}
            setActiveTab={setActiveTab} setModalType={setModalType} setShowCreateModal={setShowCreateModal}
          />
        )}
        {activeTab === 'projects' && (
          <ProjectList
            lfmPosts={lfmPosts}
            setModalType={setModalType}
            setShowCreateModal={setShowCreateModal}
            loggedInUser={user}
            onPostDeleted={removePostFromState}
          />
        )}
        {activeTab === 'forum' && (
          <ForumList
            forumPosts={allForumPosts}
            setModalType={setModalType}
            setShowCreateModal={setShowCreateModal}
            loggedInUser={user}
            onPostDeleted={removePostFromState}
          />
        )}
        {activeTab === 'settings' && (
          <ProfileSettings
            user={user} initials={initials} imgError={imgError} setImgError={setImgError}
            userBranchName={userBranchName} profileData={profileData} setProfileData={setProfileData}
            authToken={authToken} setUser={setUser} setToast={setToast}
          />
        )}
      </main>

      {toast && (
        <div className={`fixed top-24 md:top-auto md:bottom-8 left-1/2 -translate-x-1/2 z-[200] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-8 md:slide-in-from-bottom-8 duration-300 ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
          <span className="font-bold">{toast.message}</span>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-white/90 backdrop-blur-md border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-[1000] flex justify-around items-center px-4 pb-2">
        <button
          onClick={() => { setActiveTab('dashboard'); fetchData(); }}
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${activeTab === 'dashboard' ? 'text-[#524EEE] scale-110' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <svg className="w-6 h-6 mb-1" fill={activeTab === 'dashboard' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={activeTab === 'dashboard' ? "1.5" : "2"} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
          <span className="text-[10px] font-bold uppercase tracking-wider">Home</span>
        </button>
        <button
          onClick={() => setActiveTab('projects')}
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${activeTab === 'projects' ? 'text-[#524EEE] scale-110' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <svg className="w-6 h-6 mb-1" fill={activeTab === 'projects' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={activeTab === 'projects' ? "1.5" : "2"} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          <span className="text-[10px] font-bold uppercase tracking-wider">Projects</span>
        </button>
        <button
          onClick={() => setActiveTab('forum')}
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${activeTab === 'forum' ? 'text-[#524EEE] scale-110' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <svg className="w-6 h-6 mb-1" fill={activeTab === 'forum' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={activeTab === 'forum' ? "1.5" : "2"} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>
          <span className="text-[10px] font-bold uppercase tracking-wider">Forum</span>
        </button>
      </nav>

      {showGuide && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4 backdrop-blur-md">
          <div className="bg-white rounded-[40px] p-10 max-w-md w-full shadow-2xl border border-gray-100 animate-in zoom-in duration-300 text-center">
            <div className="text-4xl mb-6">✨</div>
            <h3 className="text-3xl font-bold text-[#111827] mb-3">Ready to Collab?</h3>
            <p className="text-gray-600 mb-10 leading-relaxed">Welcome to BaapCollab! Explore projects and help others.</p>
            <button onClick={handleWelcomeComplete} className="w-full bg-[#524EEE] hover:bg-[#433fd1] text-white py-5 rounded-[24px] font-bold shadow-xl transition-all">Let's Go!</button>
          </div>
        </div>
      )}

      {showCreateModal && (
        <CreatePostModal
          modalType={modalType} setShowCreateModal={setShowCreateModal}
          authToken={authToken} onSuccess={fetchData} setToast={setToast}
        />
      )}
    </div>
  );
}
