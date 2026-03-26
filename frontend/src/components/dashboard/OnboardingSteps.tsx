"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SUPPORTED_BRANCHES } from "@/data/institutions";
import { API_BASE as API, apiFetch } from "@/lib/api";

interface OnboardingStepsProps {
  step: number;
  setStep: (step: number) => void;
  authToken: string | null;
  setAuthToken: (token: string | null) => void;
  setUser: (user: any) => void;
  profileData: any;
  setProfileData: (data: any) => void;
  handleLoginSuccess: (credentialResponse: any) => Promise<void>;
  authError: string | null;
  setAuthError: (error: string | null) => void;
  handleBranchSubmit: (e: React.FormEvent) => Promise<void>;
  manualCollegeName: string;
  setManualCollegeName: (name: string) => void;
  isChecking: boolean;
  validationError: string | null;
  handleProfileComplete: (e: React.FormEvent) => Promise<void>;
}

export default function OnboardingSteps({
  step,
  setStep,
  authToken,
  setAuthToken,
  setUser,
  profileData,
  setProfileData,
  handleLoginSuccess,
  authError,
  setAuthError,
  handleBranchSubmit,
  manualCollegeName,
  setManualCollegeName,
  isChecking,
  validationError,
  handleProfileComplete
}: OnboardingStepsProps) {
  const router = useRouter();
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // OTP state
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSuccess, setOtpSuccess] = useState(false);
  const [pendingAuthData, setPendingAuthData] = useState<any>(null);


  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setForgotSuccess(false);
    setIsSubmitting(true);
    try {
      const res = await apiFetch(`/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setForgotSuccess(true);
      } else {
        setAuthError(data.detail || "Email doesn't exist. Try another or signup with the email.");
      }
    } catch {
      setAuthError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (isSignUp && password !== confirmPassword) {
      setAuthError("Passwords do not match.");
      return;
    }
    setIsSubmitting(true);
    const endpoint = isSignUp ? "/auth/signup" : "/auth/login";
    try {
      const res = await apiFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        if (isSignUp && data.otp_sent) {
          setPendingAuthData({ token: data.token, user: data.user, requires_onboarding: data.requires_onboarding });
          setOtpSent(true);
        } else {
          handleLoginSuccess({ token: data.token, user: data.user, requires_onboarding: data.requires_onboarding });
        }
      } else {
        if (res.status === 403 && data.requires_verification) {
            setOtpSent(true);
            setAuthError(null);
            return;
        }
        setAuthError(data.detail || "Authentication failed. Please try again.");
      }
    } catch {
      setAuthError("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOTPVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError(null);
    setIsSubmitting(true);
    try {
      const res = await apiFetch(`/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (res.ok) {
        setOtpSuccess(true);
        setTimeout(() => {
          if (pendingAuthData) {
            handleLoginSuccess(pendingAuthData);
          } else {
            console.error("DEBUG: OTP verified but pendingAuthData is missing");
            window.location.reload(); // Fallback to fresh login
          }
        }, 1000);
      } else {
        setOtpError(data.detail || "Invalid code. Please try again.");
      }
    } catch {
      setOtpError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Eye SVG icons
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

  if (step === 1 && otpSent && !otpSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center pt-24 bg-[#F8FAFC]">
        <div className="bg-white rounded-[32px] premium-shadow hairline-border-projects p-10 w-full max-w-[480px] mb-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-[#524EEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <h1 className="text-[26px] font-bold text-center mb-2 text-[#111827]">Check your email</h1>
          <p className="text-[#6B7280] text-center mb-2 text-[15px]">We sent a 6-digit code to</p>
          <p className="text-[#524EEE] font-bold text-center mb-8 text-[15px]">{email}</p>
          <form onSubmit={handleOTPVerify} className="flex flex-col gap-5">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              className="w-full p-4 rounded-xl border border-gray-200 bg-white text-[#111827] text-center text-3xl font-bold tracking-[0.5em] outline-none focus:border-[#524EEE] focus:ring-2 focus:ring-[#524EEE]/10 transition-all"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              required
            />
            {otpError && <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-medium text-center">{otpError}</div>}
            {otpSuccess && <div className="p-4 bg-green-50 border border-green-100 rounded-2xl text-green-600 text-sm font-medium text-center">✅ Verified! Redirecting...</div>}
            <button type="submit" disabled={isSubmitting || otp.length < 6} className="auth-button mt-2">
              {isSubmitting ? "Verifying..." : "Verify Email"}
              {!isSubmitting && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>}
            </button>
          </form>
          <button onClick={() => setOtpSent(false)} className="mt-6 w-full text-center text-sm text-gray-500 hover:text-[#524EEE] transition-colors">
            ← Back
          </button>
        </div>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="min-h-screen flex flex-col items-center pt-24 bg-[#F8FAFC]">
        <div className="flex items-center gap-2 mb-12">
          <div className="w-2.5 h-2.5 rounded-full bg-[#524EEE]"></div>
          <div className="w-8 h-[2px] bg-gray-200"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-gray-200"></div>
          <div className="w-8 h-[2px] bg-gray-200"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-gray-200"></div>
        </div>

        <div className="bg-white rounded-[32px] premium-shadow hairline-border-projects p-10 w-full max-w-[480px] mb-8">
          <div className="flex justify-center mb-8">
            <div className="w-[60px] h-[60px] flex items-center justify-center">
              <img src="/baap-logo.jpg" alt="Baap Logo" className="w-full h-full object-contain" />
            </div>
          </div>

          <h1 className="text-[30px] font-bold text-center mb-2 text-[#111827]">
            {isForgotPassword ? "Reset Password" : (isSignUp ? "Create an Account" : "Welcome Back")}
          </h1>
          <p className="text-[#6B7280] text-center mb-10 text-[15px]">
            {isForgotPassword ? "Enter your email to receive a password reset link" : (isSignUp ? "Join the BaapCollab community today" : "Sign in to your college network")}
          </p>

          {forgotSuccess ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Check your email!</h2>
              <p className="text-gray-600 mb-8">We've sent a password reset link.</p>
              <button 
                type="button" 
                onClick={() => { setForgotSuccess(false); setIsForgotPassword(false); setEmail(""); }} 
                className="inline-block auth-button w-full text-center"
              >
                Return to Login
              </button>
            </div>
          ) : (
            <form onSubmit={isForgotPassword ? handleForgotSubmit : handleSubmit} className="flex flex-col gap-5">
            {/* Email */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <input
                type="email"
                placeholder="Email Address"
                className="auth-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {!isForgotPassword && (
              <>
                {/* Password with eye */}
                <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="auth-input pr-12"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center hover:opacity-70 transition-opacity">
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>

            {/* Confirm Password with eye */}
            {isSignUp && (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirm Password"
                  className="auth-input pr-12"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center hover:opacity-70 transition-opacity">
                  {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            )}
              </>
            )}

            <button type="submit" disabled={isSubmitting} className="auth-button mt-2">
              {isSubmitting ? "Please wait..." : (isForgotPassword ? "Send Reset Link" : (isSignUp ? "Create Account" : "Sign In"))}
              {!isSubmitting && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>}
            </button>

            {authError && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-medium text-center">
                {authError}
              </div>
            )}
          </form>
          )}

          {!isSignUp && !isForgotPassword && !forgotSuccess && (
            <div className="flex justify-end mt-4">
              <button 
                type="button"
                onClick={() => { setIsForgotPassword(true); setAuthError(null); }}
                className="text-sm text-[#524EEE] font-semibold hover:underline"
              >
                Forgot password?
              </button>
            </div>
          )}

          {!forgotSuccess && (
            <div className="mt-8 text-center text-[14px]">
              {isForgotPassword ? (
                <button
                  onClick={() => { setIsForgotPassword(false); setAuthError(null); }}
                  className="text-sm text-gray-500 hover:text-[#524EEE] transition-colors"
                >
                  ← Back to login
                </button>
              ) : (
                <>
                  <span className="text-gray-500">
                    {isSignUp ? "Already have an account? " : "New to BaapCollab? "}
                  </span>
                  <button
                    onClick={() => { setIsSignUp(!isSignUp); setAuthError(null); }}
                    className="auth-toggle"
                  >
                    {isSignUp ? "Sign In" : "Create Account"}
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <p className="text-[13px] text-gray-400 font-medium">
          Protected by Baap Security Systems
        </p>
      </div>
    );
  }


  if (step === 2) {
    return (
      <div className="min-h-screen flex flex-col items-center pt-24 bg-[#F8FAFC]">
        <div className="flex items-center gap-2 mb-12">
          <div className="w-2.5 h-2.5 rounded-full bg-[#524EEE]"></div>
          <div className="w-8 h-[2px] bg-[#524EEE]"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-[#524EEE]"></div>
          <div className="w-8 h-[2px] bg-gray-200"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-gray-200"></div>
        </div>

        <div className="bg-white rounded-3xl premium-shadow hairline-border-projects p-8 w-full max-w-[480px] mb-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-[60px] h-[60px] rounded-[16px] bg-indigo-50 flex items-center justify-center text-[#524EEE] shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>

          <h1 className="text-[28px] font-semibold text-center mb-2 text-[#111827]">Institution Verification</h1>
          <p className="text-center text-[#6B7280] mb-8 text-[15px]">Select your college from the official Baap list</p>

          <form onSubmit={handleBranchSubmit} className="flex flex-col gap-6 text-left">
            <div className="flex flex-col gap-2">
              <label htmlFor="branch-manual" className="text-[14px] font-medium text-[#111827]">
                Institution Name
              </label>
              <div className="relative">
                <select
                  id="branch-manual"
                  className={`w-full p-4 rounded-xl border ${validationError ? 'border-red-300 bg-red-50/20' : 'border-gray-200'} bg-white text-gray-700 outline-none focus:border-[#524EEE] transition-all appearance-none cursor-pointer`}
                  value={manualCollegeName}
                  onChange={(e) => setManualCollegeName(e.target.value)}
                  disabled={isChecking}
                  required
                >
                  <option value="" disabled>Select your institution</option>
                  {SUPPORTED_BRANCHES.map((branch) => (
                    <option key={branch.id} value={branch.name}>
                      {branch.name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                  {isChecking ? (
                    <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </div>
              </div>

              {isChecking && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                  <span className="text-xs text-indigo-500 font-medium">Saving institution...</span>
                </div>
              )}

              {validationError && (
                <div className="mt-2 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-xs leading-relaxed font-medium">
                  {validationError}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isChecking || !manualCollegeName.trim()}
              className="w-full bg-[#524EEE] hover:bg-[#433fd1] text-white py-4 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mt-4"
            >
              {isChecking ? 'Saving...' : 'Continue to Profile'}
              {!isChecking && <svg className="w-4 h-4" transform="rotate(-90)" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="min-h-screen flex flex-col items-center pt-16 bg-[#F8FAFC]">
        <div className="flex items-center gap-2 mb-12">
          <div className="w-2.5 h-2.5 rounded-full bg-[#524EEE]"></div>
          <div className="w-8 h-[2px] bg-[#524EEE]"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-[#524EEE]"></div>
          <div className="w-8 h-[2px] bg-[#524EEE]"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-[#524EEE]"></div>
        </div>

        <div className="flex justify-center mb-6">
          <div className="w-[80px] h-[80px] rounded-[24px] bg-indigo-50 flex items-center justify-center text-[#524EEE] shadow-md border border-indigo-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path d="M12 14l9-5-9-5-9 5 9 5z" />
              <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
          </div>
        </div>

        <h1 className="text-[32px] font-semibold text-center mb-2 text-[#111827]">Complete Your Profile</h1>
        <p className="text-center text-[#6B7280] mb-8 text-[16px]">Final Step: Let the network know who you are</p>

        <form onSubmit={handleProfileComplete} className="w-full max-w-[600px] px-4 flex flex-col gap-6">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 text-amber-800 text-sm">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>Once you submit your profile, you will be sent to the verification waiting room while we cross-verify your details.</p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[15px] font-medium text-[#111827]">Full Name</label>
            <input
              name="name"
              type="text"
              placeholder="e.g., Ayush Mithabavkar"
              className="w-full p-3.5 rounded-lg border border-gray-300 outline-none focus:border-[#524EEE] bg-white transition-all"
              value={profileData.name}
              onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
              required
            />
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 flex flex-col gap-2">
              <label className="text-[15px] font-medium text-[#111827]">Department</label>
              <input
                name="dept"
                type="text"
                placeholder="e.g., Computer Science"
                className="w-full p-3.5 rounded-lg border border-gray-300 outline-none focus:border-[#524EEE] bg-white transition-all"
                value={profileData.dept}
                onChange={(e) => setProfileData({ ...profileData, dept: e.target.value })}
                required
              />
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <label className="text-[15px] font-medium text-[#111827]">Graduation Year</label>
              <div className="relative">
                <select
                  name="year"
                  className="w-full appearance-none p-3.5 rounded-lg border border-gray-300 text-gray-700 outline-none focus:border-[#524EEE] bg-white transition-all cursor-pointer"
                  value={profileData.year}
                  onChange={(e) => setProfileData({ ...profileData, year: e.target.value })}
                  required
                >
                  <option value="2024">2024</option>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                  <option value="2028">2028</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[15px] font-medium text-[#111827]">Primary Skills (comma-separated)</label>
            <input
              name="skills"
              type="text"
              placeholder="e.g., Next.js, FastAPI, UI Design"
              className="w-full p-3.5 rounded-lg border border-gray-300 outline-none focus:border-[#524EEE] bg-white transition-all"
              value={profileData.skills}
              onChange={(e) => setProfileData({ ...profileData, skills: e.target.value })}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[15px] font-medium text-[#111827]">Professional Bio</label>
            <textarea
              name="bio"
              placeholder="Tell us about yourself and what you're building..."
              className="w-full p-4 rounded-lg border border-gray-300 outline-none focus:border-[#524EEE] min-h-[120px] resize-y bg-white transition-all"
              value={profileData.bio}
              onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
              required
            ></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[15px] font-medium text-[#111827]">LinkedIn URL</label>
              <input
                name="linkedin"
                type="url"
                placeholder="https://linkedin.com/in/..."
                className="w-full p-3.5 rounded-lg border border-gray-300 outline-none focus:border-[#524EEE] bg-white transition-all"
                value={profileData.linkedin_url}
                onChange={(e) => setProfileData({ ...profileData, linkedin_url: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[15px] font-medium text-[#111827]">GitHub URL</label>
              <input
                name="github"
                type="url"
                placeholder="https://github.com/..."
                className="w-full p-3.5 rounded-lg border border-gray-300 outline-none focus:border-[#524EEE] bg-white transition-all"
                value={profileData.github_url}
                onChange={(e) => setProfileData({ ...profileData, github_url: e.target.value })}
              />
            </div>
          </div>

          {validationError && (
            <div className="mt-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium">
              {validationError}
            </div>
          )}
          <div className="flex gap-4 mt-4 pb-12">
            <button 
              type="button" 
              onClick={() => setStep(2)} 
              disabled={isChecking}
              className="flex-1 py-4 bg-white border border-gray-200 text-[#111827] font-medium rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Back to Institute
            </button>
            <button 
              type="submit" 
              disabled={isChecking}
              className="flex-1 py-4 bg-[#524EEE] hover:bg-[#433fd1] text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 disabled:opacity-70 disabled:cursor-wait"
            >
              {isChecking ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Submitting for Verification...
                </>
              ) : (
                <>
                  Submit for Verification
                  <svg className="w-4 h-4" transform="rotate(-90)" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return null;
}
