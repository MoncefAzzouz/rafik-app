"use client";

import { API_URL } from "@/lib/api";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Lock, CheckCircle2, Loader2, KeyRound } from "lucide-react";

function ResetInner() {
  const params = useSearchParams();
  const token = params.get("token") || "";

  const [status, setStatus] = useState<"checking" | "valid" | "invalid" | "done">("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) { setStatus("invalid"); return; }
    fetch(`${API_URL}/api/auth/reset-password/${token}`)
      .then(r => r.json())
      .then(d => setStatus(d.valid ? "valid" : "invalid"))
      .catch(() => setStatus("invalid"));
  }, [token]);

  const submit = async () => {
    setError("");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== confirm) return setError("Passwords don't match.");
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) setStatus("done");
      else setError(d.error || "Something went wrong.");
    } catch { setError("Network error. Please try again."); }
    finally { setSubmitting(false); }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-slate-100 rounded-[2rem] shadow-xl p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#0F766E] text-white flex items-center justify-center"><KeyRound size={22} /></div>
          <div>
            <span className="text-xl font-black tracking-tighter uppercase text-[#0F766E] block leading-none">RAFIK</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Reset password</span>
          </div>
        </div>

        {status === "checking" && <p className="text-slate-400 flex items-center gap-2 font-medium"><Loader2 size={16} className="animate-spin" /> Checking your link…</p>}

        {status === "invalid" && (
          <div className="space-y-2">
            <p className="text-sm font-bold text-rose-600">This reset link is invalid or has expired.</p>
            <p className="text-xs text-slate-500 leading-relaxed">Please request a new password reset from the Rafik app and open the newest email.</p>
          </div>
        )}

        {status === "valid" && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500 font-medium">Choose a new password for your account.</p>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">New password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-teal-200" placeholder="••••••••" />
              </div>
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Confirm password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-teal-200" placeholder="••••••••" />
              </div>
            </div>
            {error && <p className="text-xs font-bold text-rose-600">{error}</p>}
            <button onClick={submit} disabled={submitting} className="w-full py-4 bg-[#0F766E] text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-[#115E59] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2">
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Update password
            </button>
          </div>
        )}

        {status === "done" && (
          <div className="space-y-3 text-center py-4">
            <CheckCircle2 size={48} className="text-emerald-500 mx-auto" />
            <p className="text-sm font-black text-slate-800">Password updated!</p>
            <p className="text-xs text-slate-500 leading-relaxed">You can now open the Rafik app and sign in with your new password.</p>
          </div>
        )}
      </div>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="animate-spin text-slate-300" /></main>}>
      <ResetInner />
    </Suspense>
  );
}
