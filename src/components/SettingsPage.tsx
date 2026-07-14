"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { API_URL } from "@/lib/api";
import { Shield, Users, Percent, Wallet, Check, MessageSquare, UserCog, Loader2 } from "lucide-react";

type MediationMode = "MEDIATED" | "DIRECT";
type CommissionMode = "PERCENTAGE" | "SUBSCRIPTION";

interface PlatformSettings {
  mediationMode: MediationMode;
  commissionMode: CommissionMode;
  commissionPercent: number;
  subscriptionFee: number;
}

export default function SettingsPage() {
  const { token, user } = useAuth();
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [mediationMode, setMediationMode] = useState<MediationMode>("MEDIATED");
  const [commissionMode, setCommissionMode] = useState<CommissionMode>("PERCENTAGE");
  const [commissionPercent, setCommissionPercent] = useState("15");
  const [subscriptionFee, setSubscriptionFee] = useState("3000");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/api/settings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data: PlatformSettings = await res.json();
          setSettings(data);
          setMediationMode(data.mediationMode);
          setCommissionMode(data.commissionMode);
          setCommissionPercent(String(data.commissionPercent));
          setSubscriptionFee(String(data.subscriptionFee));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (token) load();
  }, [token]);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch(`${API_URL}/api/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          mediationMode,
          commissionMode,
          commissionPercent: parseFloat(commissionPercent),
          subscriptionFee: parseInt(subscriptionFee),
        }),
      });
      if (res.ok) {
        setSettings(await res.json());
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to save settings");
      }
    } catch {
      setError("Network error — is the backend running?");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn pb-16 text-left">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-black tracking-tighter text-slate-800 uppercase">Platform Settings</h1>
        <p className="text-sm text-slate-400 font-medium font-inter">
          Global defaults for every worker. You can override each worker individually from their profile drawer.
        </p>
      </div>

      {/* GLOBAL SWITCH 1 — Order handling mode */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <UserCog size={20} />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-tight text-slate-800">Order Handling — Global Switch</h2>
            <p className="text-xs text-slate-400 font-bold font-inter">How orders flow between clients and workers (default for all workers)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => setMediationMode("MEDIATED")}
            className={`p-6 rounded-3xl border-2 text-left transition-all cursor-pointer ${
              mediationMode === "MEDIATED"
                ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                : "border-slate-100 bg-slate-50/50 hover:border-slate-200"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <Shield size={20} className={mediationMode === "MEDIATED" ? "text-primary" : "text-slate-400"} />
              {mediationMode === "MEDIATED" && <Check size={18} className="text-primary" />}
            </div>
            <p className="text-xs font-black uppercase tracking-tight text-slate-800 mb-1">Admin in the Middle</p>
            <p className="text-[11px] text-slate-500 font-bold font-inter leading-relaxed">
              You relay everything: contact the worker, send the quote to the client, confirm both sides. Clients and workers never talk directly.
            </p>
          </button>

          <button
            onClick={() => setMediationMode("DIRECT")}
            className={`p-6 rounded-3xl border-2 text-left transition-all cursor-pointer ${
              mediationMode === "DIRECT"
                ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                : "border-slate-100 bg-slate-50/50 hover:border-slate-200"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <MessageSquare size={20} className={mediationMode === "DIRECT" ? "text-primary" : "text-slate-400"} />
              {mediationMode === "DIRECT" && <Check size={18} className="text-primary" />}
            </div>
            <p className="text-xs font-black uppercase tracking-tight text-slate-800 mb-1">Direct (You Observe)</p>
            <p className="text-[11px] text-slate-500 font-bold font-inter leading-relaxed">
              Worker and client negotiate and chat with each other directly. You watch every conversation live from the Chats page, but don&apos;t intervene.
            </p>
          </button>
        </div>
      </div>

      {/* GLOBAL SWITCH 2 — Payment model */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Wallet size={20} />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-tight text-slate-800">Payment Model — Global Switch</h2>
            <p className="text-xs text-slate-400 font-bold font-inter">How the platform earns from workers (default for all workers)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => setCommissionMode("PERCENTAGE")}
            className={`p-6 rounded-3xl border-2 text-left transition-all cursor-pointer ${
              commissionMode === "PERCENTAGE"
                ? "border-emerald-500 bg-emerald-50/50 shadow-lg shadow-emerald-500/10"
                : "border-slate-100 bg-slate-50/50 hover:border-slate-200"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <Percent size={20} className={commissionMode === "PERCENTAGE" ? "text-emerald-600" : "text-slate-400"} />
              {commissionMode === "PERCENTAGE" && <Check size={18} className="text-emerald-600" />}
            </div>
            <p className="text-xs font-black uppercase tracking-tight text-slate-800 mb-1">Percentage per Job</p>
            <p className="text-[11px] text-slate-500 font-bold font-inter leading-relaxed">
              The platform takes a percentage of each completed job&apos;s price. The worker keeps the rest.
            </p>
          </button>

          <button
            onClick={() => setCommissionMode("SUBSCRIPTION")}
            className={`p-6 rounded-3xl border-2 text-left transition-all cursor-pointer ${
              commissionMode === "SUBSCRIPTION"
                ? "border-violet-500 bg-violet-50/50 shadow-lg shadow-violet-500/10"
                : "border-slate-100 bg-slate-50/50 hover:border-slate-200"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <Users size={20} className={commissionMode === "SUBSCRIPTION" ? "text-violet-600" : "text-slate-400"} />
              {commissionMode === "SUBSCRIPTION" && <Check size={18} className="text-violet-600" />}
            </div>
            <p className="text-xs font-black uppercase tracking-tight text-slate-800 mb-1">Subscription (Fixed Price)</p>
            <p className="text-[11px] text-slate-500 font-bold font-inter leading-relaxed">
              Workers pay a fixed monthly fee and keep 100% of their job money. You record their payments on the Earnings page.
            </p>
          </button>
        </div>

        {/* Values */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className={commissionMode === "PERCENTAGE" ? "" : "opacity-50"}>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Commission Percentage (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={commissionPercent}
              onChange={(e) => setCommissionPercent(e.target.value)}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/10 focus:bg-white transition-all font-black text-sm text-slate-800"
            />
          </div>
          <div className={commissionMode === "SUBSCRIPTION" ? "" : "opacity-50"}>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Monthly Subscription Fee (DZD)</label>
            <input
              type="number"
              min="0"
              value={subscriptionFee}
              onChange={(e) => setSubscriptionFee(e.target.value)}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-violet-500/10 focus:bg-white transition-all font-black text-sm text-slate-800"
            />
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-10 py-4 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-primary/90 shadow-lg shadow-primary/20 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
          {saving ? "Saving..." : "Save Global Settings"}
        </button>
        {saved && (
          <span className="text-xs font-black text-emerald-600 uppercase tracking-wider animate-fadeIn">✓ Settings saved</span>
        )}
        {error && (
          <span className="text-xs font-black text-rose-600 uppercase tracking-wider animate-fadeIn">{error}</span>
        )}
      </div>

      {/* Current summary + account */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 space-y-3">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Active Configuration</h3>
          <p className="text-sm font-black uppercase">
            {settings?.mediationMode === "DIRECT" ? "Direct — clients & workers chat" : "Mediated — admin relays everything"}
          </p>
          <p className="text-sm font-black uppercase text-emerald-400">
            {settings?.commissionMode === "SUBSCRIPTION"
              ? `Subscription: ${settings?.subscriptionFee.toLocaleString()} DZD / month`
              : `Commission: ${settings?.commissionPercent}% per completed job`}
          </p>
          <p className="text-[10px] font-bold text-slate-400 font-inter leading-relaxed">
            Per-worker overrides win over these defaults. Set them from Professionals → worker profile → Mode &amp; Payment.
          </p>
        </div>

        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 space-y-3">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Signed-in Account</h3>
          <p className="text-sm font-black uppercase text-slate-800">{user?.fullName || "Admin"}</p>
          <p className="text-xs font-bold text-slate-400 font-inter">{user?.email}</p>
          <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-lg text-[9px] font-black uppercase tracking-widest">
            {user?.role}
          </span>
        </div>
      </div>
    </div>
  );
}
