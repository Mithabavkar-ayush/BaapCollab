"use client";

import { useState } from "react";
import { GoogleLogin } from '@react-oauth/google';
import { SUPPORTED_BRANCHES } from "@/data/institutions";

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
  
  if (step === 1 && !authToken) {
    return (
      <div className="min-h-screen flex flex-col items-center pt-24 bg-[#F8FAFC]">
        <div className="flex items-center gap-2 mb-12">
          <div className="w-2.5 h-2.5 rounded-full bg-[#524EEE]"></div>
          <div className="w-8 h-[2px] bg-gray-200"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-gray-200"></div>
          <div className="w-8 h-[2px] bg-gray-200"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-gray-200"></div>
        </div>

        <div className="bg-white rounded-3xl premium-shadow hairline-border-projects p-12 w-full max-w-[480px] mb-8 text-center">
          <div className="flex justify-center mb-8">
            <div className="w-[70px] h-[70px] flex items-center justify-center">
              <img src="/baap-logo.jpg" alt="Baap Logo" className="w-full h-full object-contain" />
            </div>
          </div>

          <h1 className="text-[32px] premium-heading mb-3 text-[#111827]">Welcome to BaapCollab</h1>
          <p className="text-[#6B7280] mb-10 text-[16px] premium-spacing">Sign in to join your college community</p>

          <div className="flex flex-col gap-4">
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleLoginSuccess}
                onError={() => {
                  console.log('Login Failed');
                  setAuthError("Google Login Fail: Ensure you are logged into Google and whitelisted.");
                }}
                theme="outline"
                shape="pill"
                size="large"
              />
            </div>
            {authError && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium">
                {authError}
              </div>
            )}
          </div>

          <div className="relative py-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-3 text-gray-400 font-medium tracking-wider">Trusted by Baap Students</span></div>
          </div>

          <p className="text-[13px] text-gray-400">By continuing, you agree to BaapCollab Terms of Service</p>
        </div>
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
          <p className="text-center text-[#6B7280] mb-8 text-[15px]">Enter your college name exactly as registered</p>

          <form onSubmit={handleBranchSubmit} className="flex flex-col gap-6 text-left">
            <div className="flex flex-col gap-2">
              <label htmlFor="branch-manual" className="text-[14px] font-medium text-[#111827]">
                Institution Name
              </label>
              <div className="relative">
                <input
                  id="branch-manual"
                  type="text"
                  placeholder="e.g., The Baap Company - BCA Program"
                  className={`w-full p-4 rounded-xl border ${validationError ? 'border-red-300 bg-red-50/20' : 'border-gray-200'} bg-white text-gray-700 outline-none focus:border-[#524EEE] transition-all`}
                  value={manualCollegeName}
                  onChange={(e) => setManualCollegeName(e.target.value)}
                  disabled={isChecking}
                  required
                />
                <div className="absolute inset-y-0 right-0 flex items-center px-4">
                  {isChecking ? (
                    <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  )}
                </div>
              </div>

              {isChecking && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                  <span className="text-xs text-indigo-500 font-medium">Checking association...</span>
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
              {isChecking ? 'Verifying...' : 'Next Step'}
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
        <p className="text-center text-[#6B7280] mb-8 text-[16px]">Step 3: Tell us a bit about yourself</p>

        <form onSubmit={handleProfileComplete} className="w-full max-w-[600px] px-4 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-[15px] font-medium text-[#111827]">Name</label>
            <input
              name="name"
              type="text"
              placeholder="e.g., Your Full Name"
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
                  className="w-full appearance-none p-3.5 rounded-lg border border-gray-300 text-gray-700 outline-none focus:border-[#524EEE] bg-white transition-all"
                  value={profileData.year}
                  onChange={(e) => setProfileData({ ...profileData, year: e.target.value })}
                  required
                >
                  <option value="2024">2024</option>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[15px] font-medium text-[#111827]">Skills (comma-separated)</label>
            <input
              name="skills"
              type="text"
              placeholder="e.g., React, Python, UI Design"
              className="w-full p-3.5 rounded-lg border border-gray-300 outline-none focus:border-[#524EEE] bg-white transition-all"
              value={profileData.skills}
              onChange={(e) => setProfileData({ ...profileData, skills: e.target.value })}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[15px] font-medium text-[#111827]">Bio</label>
            <textarea
              name="bio"
              placeholder="Tell us about yourself..."
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

          <div className="flex gap-4 mt-4 pb-10">
            <button type="button" onClick={() => setStep(2)} className="flex-1 py-4 bg-white border border-gray-200 text-[#111827] font-medium rounded-xl hover:bg-gray-50 transition-colors">
              Back to Institute
            </button>
            <button type="submit" className="flex-1 py-4 bg-[#524EEE] hover:bg-[#433fd1] text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-100">
              Launch Dashboard
              <svg className="w-4 h-4" transform="rotate(-90)" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
          </div>
        </form>
      </div>
    );
  }

  return null;
}
