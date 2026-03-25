"use client";

import { useEffect, useState } from "react";
import { API_BASE, apiFetch } from "@/lib/api";
import { useRouter, usePathname } from "next/navigation";

export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem("baap_token") || localStorage.getItem("token");
      
      // Public routes that don't need the guard
      const publicRoutes = ["/onboarding", "/waiting-room", "/reset-password", "/forgot-password"];
      const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

      if (!token) {
        if (!isPublicRoute) {
          router.push("/onboarding");
        }
        setLoading(false);
        return;
      }

      try {
        const res = await apiFetch(`/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
          const user = await res.json();
          
          // Logic:
          // 1. If not approved and NOT already on waiting-room or onboarding, force to waiting-room
          if (!user.is_approved && !isPublicRoute) {
            router.push("/waiting-room");
          }
          // 2. If approved and on waiting-room, go to dashboard
          else if (user.is_approved && pathname === "/waiting-room") {
            router.push("/");
          }
        } else {
          // Token invalid
          if (!isPublicRoute) {
            router.push("/onboarding");
          }
        }
      } catch (err) {
        console.error("RouteGuard check failed:", err);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, [pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="w-8 h-8 border-4 border-[#524EEE] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return <>{children}</>;
}
