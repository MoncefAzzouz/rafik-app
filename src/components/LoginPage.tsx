"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { KeyRound, Mail, ArrowLeft, AlertCircle, RefreshCw, Zap, ShieldCheck, Users, Star } from "lucide-react";

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
    <div className="min-h-screen bg-slate-50 flex relative overflow-hidden">
      
      {/* ══════════════ LEFT: Decorative Panel ══════════════ */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-indigo-600 via-indigo-500 to-blue-500 relative flex-col justify-between p-12 overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-xl" />
        <div className="absolute bottom-20 left-10 w-60 h-60 bg-white/5 rounded-full blur-xl" />
        <div className="absolute top-1/2 right-10 w-40 h-40 bg-indigo-400/20 rounded-full blur-2xl" />

        {/* Brand */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={onBack}>
            <div className="bg-white/15 backdrop-blur-sm p-2.5 rounded-2xl group-hover:rotate-6 transition-transform">
              <span className="text-white font-black text-lg italic">R</span>
            </div>
            <span className="text-xl font-black tracking-tighter uppercase text-white">RAFIK</span>
          </div>
        </div>

        {/* Center content */}
        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-4xl font-black text-white uppercase tracking-tight leading-tight">
              Manage Everything<br />
              <span className="text-indigo-200">In One Place.</span>
            </h2>
            <p className="text-sm text-indigo-100 font-medium mt-4 max-w-sm leading-relaxed">
              Access your admin dashboard or worker console to manage bookings, services, and clients seamlessly.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-3">
            {[
              { icon: ShieldCheck, label: "Secure Login" },
              { icon: Users, label: "Multi-Role" },
              { icon: Star, label: "Real-Time" }
            ].map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.label} className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2.5 rounded-full border border-white/10">
                  <Icon size={13} className="text-indigo-200" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white">{f.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom stats */}
        <div className="relative z-10 flex gap-8 pt-6 border-t border-white/10">
          {[
            { val: "99.9%", label: "Uptime" },
            { val: "2.8K+", label: "Users" },
            { val: "<1s", label: "Response" }
          ].map((s) => (
            <div key={s.label}>
              <span className="text-xl font-black text-white">{s.val}</span>
              <span className="block text-[9px] font-bold text-indigo-200 uppercase tracking-widest mt-0.5">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════ RIGHT: Login Form ══════════════ */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative">
        {/* Background gradient blobs */}
        <div className="absolute top-1/4 right-[10%] w-64 h-64 bg-indigo-100/30 rounded-full blur-[5rem] pointer-events-none" />
        <div className="absolute bottom-1/4 left-[10%] w-48 h-48 bg-blue-100/20 rounded-full blur-[4rem] pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          {/* Mobile back button */}
          <button
            onClick={onBack}
            disabled={loading}
            className="lg:hidden mb-8 w-10 h-10 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all cursor-pointer disabled:opacity-50"
          >
            <ArrowLeft size={16} />
          </button>

          {/* Header */}
          <div className="space-y-2 mb-8">
            <div className="inline-flex items-center gap-2 bg-indigo-50 px-3.5 py-1.5 rounded-full border border-indigo-100 mb-2">
              <Zap size={11} className="text-indigo-500 fill-indigo-500" />
              <span className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-indigo-600">Secure Portal</span>
            </div>
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Welcome Back</h2>
            <p className="text-sm text-slate-400 font-medium">Enter your credentials to access the console</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold p-4 rounded-2xl flex items-start gap-3">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 block mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="email"
                  required
                  disabled={loading}
                  placeholder="e.g. admin@rafik.app"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 focus:border-indigo-300 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all font-semibold text-sm text-slate-700 placeholder:text-slate-300 disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 block mb-2">Password</label>
              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="password"
                  required
                  disabled={loading}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 focus:border-indigo-300 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all font-semibold text-sm text-slate-700 placeholder:text-slate-300 disabled:opacity-50"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-xl shadow-indigo-500/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Verifying Credentials...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </div>
          </form>

          {/* Test Accounts */}
          <div className="mt-8 bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left space-y-2">
            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Test Accounts</div>
            <div className="text-[11px] text-slate-500 font-medium">
              Admin: <span className="font-bold text-slate-700">admin@rafik.app</span> <span className="text-slate-300 mx-1">·</span> PW: <span className="font-bold text-slate-700">admin123</span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Worker: <span className="font-bold text-slate-700">lyes@rafik.app</span> <span className="text-slate-300 mx-1">·</span> PW: <span className="font-bold text-slate-700">worker123</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
