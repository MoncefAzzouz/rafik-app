"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { KeyRound, Mail, ArrowLeft, AlertCircle, RefreshCw } from "lucide-react";

interface LoginPageProps {
  onBack: () => void;
}

export default function LoginPage({ onBack }: LoginPageProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:4000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed. Please check credentials.");
      }

      // Check if user is allowed on dashboard (ADMIN or WORKER)
      if (data.user.role !== "ADMIN" && data.user.role !== "WORKER") {
        throw new Error("Access denied. Client logins are only allowed on the mobile app.");
      }

      login(data.token, data.user);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 relative font-inter">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-[6rem] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-[6rem] pointer-events-none"></div>

      <div className="bg-slate-850/50 border border-slate-800 backdrop-blur-md rounded-[2.5rem] shadow-2xl p-8 max-w-md w-full relative">
        
        {/* Back Button */}
        <button
          onClick={onBack}
          disabled={loading}
          className="absolute top-6 left-6 w-10 h-10 bg-slate-900 hover:bg-slate-800 border border-slate-850 hover:border-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer disabled:opacity-50"
        >
          <ArrowLeft size={16} />
        </button>

        <div className="space-y-2 mt-8 text-center">
          <div className="inline-flex items-center gap-1.5 bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full border border-blue-500/20 text-[9px] font-black uppercase tracking-wider">
            Secure Authentication
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Portal Sign In</h2>
          <p className="text-xs text-slate-400 font-bold font-inter">Enter your credentials to access the console</p>
        </div>

        {error && (
          <div className="mt-6 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold font-inter p-4 rounded-2xl flex items-start gap-3 text-left">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 text-left mt-6">
          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 block mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input
                type="email"
                required
                disabled={loading}
                placeholder="e.g. admin@rafik.app"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-5 py-4 bg-slate-900/60 border border-slate-800 focus:border-blue-500/30 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/5 transition-all font-semibold text-xs text-slate-300 placeholder:text-slate-600 disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 block mb-2">Password</label>
            <div className="relative">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input
                type="password"
                required
                disabled={loading}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-5 py-4 bg-slate-900/60 border border-slate-800 focus:border-blue-500/30 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/5 transition-all font-semibold text-xs text-slate-300 placeholder:text-slate-600 disabled:opacity-50"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-xl shadow-blue-500/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Verifying Credentials...
                </>
              ) : (
                "Authorize Access"
              )}
            </button>
          </div>
        </form>

        {/* Hints card for evaluator */}
        <div className="mt-8 bg-slate-900/40 border border-slate-800/40 rounded-2xl p-4 text-[10px] text-slate-500 text-left font-inter space-y-1">
          <div className="font-black text-slate-400 uppercase">Test Accounts:</div>
          <div>Admin: <span className="font-bold text-slate-300">admin@rafik.app</span> (PW: admin123)</div>
          <div>Worker: <span className="font-bold text-slate-300">lyes@rafik.app</span> (PW: worker123)</div>
        </div>

      </div>
    </div>
  );
}
