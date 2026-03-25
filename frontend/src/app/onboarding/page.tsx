"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import OnboardingSteps from "@/components/dashboard/OnboardingSteps";
import { SUPPORTED_BRANCHES } from "@/data/institutions";

import { API_BASE } from "@/lib/api";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [manualCollegeName, setManualCollegeName] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
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
    const token = localStorage.getItem("baap_token") || localStorage.getItem("token");
    if (token) {
      setAuthToken(token);
      fetchUser(token);
    }
  }, []);

  const fetchUser = async (token: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include'
      });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        setProfileData({
          name: userData.name || "",
          dept: userData.department || "",
          year: (userData.graduation_year || 2026).toString(),
          skills: userData.skills || "",
          bio: userData.bio || "",
          linkedin_url: userData.linkedin_url || "",
          github_url: userData.github_url || ""
        });

        if (userData.branch_id === null) {
          setStep(2); // Step 2: Institute
        } else if (userData.department === null || userData.department === "") {
          setStep(3); // Step 3: Profile
        } else if (!userData.is_approved) {
          router.push("/waiting-room");
        } else {
          router.push("/");
        }
      }
    } catch (err) {
      console.error("Auth hydration failed:", err);
    }
  };

  const handleLoginSuccess = async (authData: any) => {
    setAuthError(null);
    if (authData.token) {
      if (typeof window !== "undefined") {
        localStorage.setItem('baap_token', authData.token);
        localStorage.setItem('token', authData.token);
      }
      setAuthToken(authData.token);
      setUser(authData.user);

      if (authData.requires_onboarding) {
        setStep(2);
      } else {
        router.push("/");
      }
    }
  };

  const handleBranchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCollegeName.trim() || !authToken) return;
    setIsChecking(true);
    
    const match = SUPPORTED_BRANCHES.find(b => b.name === manualCollegeName);
    if (match) {
        try {
            const res = await fetch(`${API_BASE}/auth/onboarding/institute?branch_id=${match.id}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${authToken}` },
                credentials: 'include'
            });
            if (res.ok) {
                setStep(3); // Go to Profile Builder
            } else {
                const errorText = await res.text();
                console.error("Institute save failed:", res.status, errorText);
                setValidationError(`Failed to save institution. Status: ${res.status}`);
            }
        } catch (err) {
            setValidationError("Connection error.");
        }
    } else {
        setValidationError("Please select a valid institution.");
    }
    setIsChecking(false);
  };

  const handleProfileComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken) return;
    setIsChecking(true);
    setValidationError(null);

    try {
      const res = await fetch(`${API_BASE}/auth/onboarding/details`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: profileData.name,
          department: profileData.dept,
          graduation_year: parseInt(profileData.year),
          skills: profileData.skills,
          bio: profileData.bio,
          linkedin_url: profileData.linkedin_url,
          github_url: profileData.github_url
        }),
        credentials: 'include'
      });
      if (res.ok) {
        router.push("/waiting-room");
      } else {
        const data = await res.json();
        setValidationError(data.detail || "Failed to save profile. Please check all fields.");
      }
    } catch (err) {
      console.error("Profile save failed");
      setValidationError("Connection error. Please try again.");
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <main>
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
