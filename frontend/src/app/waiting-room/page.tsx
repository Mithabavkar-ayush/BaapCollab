"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE, apiFetch } from "@/lib/api";


export default function WaitingRoom() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const checkStatus = async () => {
    try {
      const token = localStorage.getItem("baap_token") || localStorage.getItem("token");
      if (!token) {
        router.push("/");
        return;
      }

      const res = await apiFetch(`/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data);
        if (data.is_approved) {
          // If approved, redirect to dashboard (home)
          window.location.href = "/";
        }
      } else if (res.status === 401 || res.status === 403) {
        router.push("/");
      }
    } catch (err) {
      console.error("Failed to check status:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="w-12 h-12 border-4 border-[#524EEE] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#F8FAFC]">
      <div className="bg-white rounded-3xl premium-shadow hairline-border-projects p-5 sm:p-8 md:p-12 w-full max-w-[calc(100%-2rem)] sm:max-w-[540px] mx-4 text-center">
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 rounded-[28px] bg-indigo-50 flex items-center justify-center text-[#524EEE] shadow-inner border border-indigo-100/50">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <h1 className="text-2xl sm:text-[32px] font-bold text-gray-900 mb-4 tracking-tight">Verification in Progress</h1>
        <p className="text-gray-500 text-base sm:text-lg mb-8 leading-relaxed">
          Thanks for joining <span className="font-bold text-[#524EEE]">BaapCollab</span>! We've sent a notification to the administrator to verify your institution status.
        </p>

        <div className="bg-gray-50 rounded-2xl p-5 sm:p-6 mb-8 text-left border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-2 rounded-full bg-amber-400"></div>
            <span className="text-xs sm:text-sm font-bold text-gray-600 uppercase tracking-widest">Status: Pending Approval</span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500">
            You will be automatically redirected to the dashboard once your request is approved. You'll also receive an email at <span className="font-medium text-gray-900 break-all">{user?.email}</span>.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <button
            onClick={checkStatus}
            className="w-full py-3.5 sm:py-4 min-h-[44px] bg-[#524EEE] hover:bg-[#433fd1] text-white font-bold rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-indigo-100"
          >
            <span>Refresh Status</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          
          <p className="text-xs text-gray-400">
            Verification typically takes less than 24 hours.
          </p>
        </div>
      </div>

      <div className="mt-12 opacity-50 flex items-center gap-2 grayscale transition-all hover:grayscale-0 hover:opacity-100">
        <img src="/baap-logo.jpg" alt="Logo" className="w-5 h-5 object-contain" />
        <span className="text-sm font-black tracking-tighter text-gray-900 uppercase">BaapCollab Secure Access</span>
      </div>
    </div>
  );
}
