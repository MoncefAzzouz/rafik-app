"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import LandingPage from "@/components/LandingPage";
import LoginPage from "@/components/LoginPage";

function MainRoutingShell() {
  const { isAuthenticated, user } = useAuth();
  const [view, setView] = useState<"landing" | "login">("landing");
  const router = useRouter();

  // Automatic routing redirects when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === "ADMIN") {
        router.push("/truck/dashboard");
      } else if (user.role === "WORKER") {
        router.push("/worker/dashboard");
      }
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated) {
    if (view === "login") {
      return <LoginPage onBack={() => setView("landing")} />;
    }
    return <LandingPage onGoToLogin={() => setView("login")} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Redirecting to Dashboard...</p>
      </div>
    </div>
  );
}

export default function Home() {
  return <MainRoutingShell />;
}
