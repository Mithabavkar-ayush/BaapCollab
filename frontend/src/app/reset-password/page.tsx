"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { API_BASE } from "@/lib/api";
import { Inter } from 'next/font/google';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'] });

const EyeIcon = () => (
  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);
const EyeOffIcon = () => (
  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
);

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!token) {
      setMessage({ text: "Missing reset token in URL.", type: 'error' });
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ text: "Passwords do not match.", type: 'error' });
      return;
    }

    if (password.length < 8) {
      setMessage({ text: "Password must be at least 8 characters.", type: 'error' });
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: password }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: "Your password has been reset successfully!", type: 'success' });
        setTimeout(() => {
          router.push("/");
        }, 3000);
      } else {
        setMessage({ text: data.detail || "This reset link is no longer valid. Please request a new one.", type: 'error' });
      }
    } catch {
      setMessage({ text: "Network error. Please try again.", type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token && !message) {
    return (
      <div className="text-center pb-8 border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Invalid Link</h2>
        <p className="text-gray-500 mb-6">This reset link is no longer valid. Please request a new one.</p>
        <Link href="/" className="auth-button">
          Back to Login
        </Link>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-[30px] font-bold text-center mb-2 text-[#111827]">
        Secure Your Account
      </h1>
      <p className="text-[#6B7280] text-center mb-10 text-[15px]">
        Enter a new password that you haven't used before.
      </p>

      {message && message.type === 'success' ? (
        <div className="text-center">
          <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{message.text}</h2>
          <p className="text-gray-500">Redirecting to login...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* New Password */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="New Password"
              className="w-full p-4 pl-12 pr-12 rounded-xl border border-gray-200 bg-white text-[#111827] outline-none focus:border-[#524EEE] focus:ring-2 focus:ring-[#524EEE]/10 transition-all font-medium text-[15px]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center hover:opacity-70 transition-opacity">
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>

          {/* Confirm Password */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <input
              type={showConfirm ? "text" : "password"}
              placeholder="Confirm New Password"
              className="w-full p-4 pl-12 pr-12 rounded-xl border border-gray-200 bg-white text-[#111827] outline-none focus:border-[#524EEE] focus:ring-2 focus:ring-[#524EEE]/10 transition-all font-medium text-[15px]"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button type="button" onClick={() => setShowConfirm(!showConfirm)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center hover:opacity-70 transition-opacity">
              {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>

          {message && message.type === 'error' && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-medium text-center">
              {message.text}
            </div>
          )}

          <button type="submit" disabled={isSubmitting || !password || !confirmPassword || password !== confirmPassword} className="auth-button mt-4">
            {isSubmitting ? "Updating..." : "Update Password"}
          </button>
        </form>
      )}

      {(!message || message.type !== 'success') && (
        <div className="mt-8 text-center text-sm text-gray-500 hover:text-[#524EEE] transition-colors">
          <Link href="/">
            ← Back to login
          </Link>
        </div>
      )}
    </>
  );
}

export default function ResetPassword() {
  return (
    <main className={`min-h-screen flex flex-col items-center pt-24 bg-[#F8FAFC] ${inter.className}`}>
      <div className="bg-white rounded-[32px] premium-shadow hairline-border-projects p-10 w-full max-w-[480px]">
        <div className="flex justify-center mb-6">
          <div className="w-[60px] h-[60px] flex items-center justify-center bg-indigo-50 rounded-2xl">
            <svg className="w-8 h-8 text-[#524EEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>
        
        <Suspense fallback={<div className="text-center p-8">Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}
