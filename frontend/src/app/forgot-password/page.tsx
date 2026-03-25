"use client";

import { useState } from "react";
import { Inter } from 'next/font/google';
import Link from "next/link";
import { API_BASE, apiFetch } from "@/lib/api";

const inter = Inter({ subsets: ['latin'] });

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const res = await apiFetch(`/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: "Check your email! We've sent a password reset link.", type: 'success' });
        setEmail("");
      } else {
        setMessage({ text: data.detail || "Something went wrong.", type: 'error' });
      }
    } catch {
      setMessage({ text: "Network error. Please try again.", type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className={`min-h-screen flex flex-col items-center pt-24 bg-[#F8FAFC] ${inter.className}`}>
      <div className="bg-white rounded-[32px] premium-shadow hairline-border-projects p-10 w-full max-w-[480px]">
        
        <div className="flex justify-center mb-6">
          <div className="w-[60px] h-[60px] flex items-center justify-center">
            <img src="/baap-logo.jpg" alt="Baap Logo" className="w-full h-full object-contain" />
          </div>
        </div>

        <h1 className="text-[30px] font-bold text-center mb-2 text-[#111827]">
          Reset Password
        </h1>
        <p className="text-[#6B7280] text-center mb-10 text-[15px]">
          Enter your email and we'll send you a recovery link
        </p>

        {message && message.type === 'success' ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Check your email!</h2>
            <p className="text-gray-600 mb-8">{message.text}</p>
            <Link href="/" className="inline-block auth-button w-full text-center">
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <input
                type="email"
                placeholder="Email Address"
                className="w-full p-4 pl-12 rounded-xl border border-gray-200 bg-white text-[#111827] outline-none focus:border-[#524EEE] focus:ring-2 focus:ring-[#524EEE]/10 transition-all font-medium text-[15px]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {message && message.type === 'error' && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-medium text-center">
                {message.text}
              </div>
            )}

            <button type="submit" disabled={isSubmitting || !email} className="auth-button mt-2">
              {isSubmitting ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}

        {!message || message.type !== 'success' ? (
          <div className="mt-8 text-center text-sm text-gray-500 hover:text-[#524EEE] transition-colors">
            <Link href="/">
              ← Back to login
            </Link>
          </div>
        ) : null}
      </div>
    </main>
  );
}
