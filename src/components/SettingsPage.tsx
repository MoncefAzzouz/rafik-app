"use client";

import { Settings, Bell, Shield, Palette, Moon, Sun, Save } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export default function SettingsPage() {
  const { config } = useTheme();

  return (
    <div className="space-y-10 max-w-5xl mx-auto animate-fadeIn pb-16">
      <div className="space-y-2">
        <h1 className="text-4xl font-black tracking-tighter text-slate-800 uppercase italic">
          Panel <span className="text-primary">Settings</span>
        </h1>
        <p className="text-sm text-slate-400 font-medium">Manage admin panel preferences and configurations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* General */}
        <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm space-y-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600"><Settings size={20} /></div>
            <div><h3 className="text-sm font-black uppercase tracking-tight text-slate-800">General</h3><p className="text-[10px] text-slate-400 font-bold">App configuration</p></div>
          </div>
          <div className="space-y-5">
            <div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 block mb-2">App Name</label>
              <input type="text" defaultValue="Rafik App" className="w-full px-5 py-4 bg-slate-50 border border-transparent focus:border-primary/20 rounded-2xl outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all font-semibold text-xs" /></div>
            <div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 block mb-2">Default Language</label>
              <select className="w-full px-5 py-4 bg-slate-50 border border-transparent focus:border-primary/20 rounded-2xl outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all font-semibold text-xs appearance-none">
                <option>Arabic (العربية)</option><option>French (Français)</option><option>English</option>
              </select></div>
            <div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 block mb-2">Timezone</label>
              <select className="w-full px-5 py-4 bg-slate-50 border border-transparent focus:border-primary/20 rounded-2xl outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all font-semibold text-xs appearance-none">
                <option>Africa/Algiers (GMT+1)</option><option>Europe/Paris (GMT+2)</option>
              </select></div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm space-y-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600"><Bell size={20} /></div>
            <div><h3 className="text-sm font-black uppercase tracking-tight text-slate-800">Notifications</h3><p className="text-[10px] text-slate-400 font-bold">Alert preferences</p></div>
          </div>
          <div className="space-y-4">
            {[
              { label: "New booking alerts", desc: "Get notified for new bookings", on: true },
              { label: "Driver registration", desc: "Alert when new drivers register", on: true },
              { label: "Revenue reports", desc: "Daily revenue summary emails", on: false },
              { label: "System alerts", desc: "Critical system notifications", on: true },
            ].map((n, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-colors">
                <div><p className="text-xs font-black text-slate-800 uppercase tracking-tight">{n.label}</p><p className="text-[10px] text-slate-400 font-bold">{n.desc}</p></div>
                <div className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${n.on ? "bg-primary" : "bg-slate-200"}`} style={n.on ? { background: "var(--primary)" } : undefined}>
                  <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all shadow-sm ${n.on ? "left-[22px]" : "left-0.5"}`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security */}
        <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm space-y-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600"><Shield size={20} /></div>
            <div><h3 className="text-sm font-black uppercase tracking-tight text-slate-800">Security</h3><p className="text-[10px] text-slate-400 font-bold">Account protection</p></div>
          </div>
          <div className="space-y-5">
            <div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 block mb-2">Admin Email</label>
              <input type="email" defaultValue="admin@rafik-app.dz" className="w-full px-5 py-4 bg-slate-50 border border-transparent focus:border-primary/20 rounded-2xl outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all font-semibold text-xs" /></div>
            <div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 block mb-2">Change Password</label>
              <input type="password" placeholder="••••••••••" className="w-full px-5 py-4 bg-slate-50 border border-transparent focus:border-primary/20 rounded-2xl outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all font-semibold text-xs" /></div>
            <button className="w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all hover:opacity-90 cursor-pointer" style={{ background: "color-mix(in srgb, var(--primary) 10%, transparent)", color: "var(--primary)" }}>Enable Two-Factor Auth</button>
          </div>
        </div>

        {/* Appearance */}
        <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm space-y-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600"><Palette size={20} /></div>
            <div><h3 className="text-sm font-black uppercase tracking-tight text-slate-800">Appearance</h3><p className="text-[10px] text-slate-400 font-bold">Visual preferences</p></div>
          </div>
          <div className="space-y-5">
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 mb-3">Active Theme</p>
              <div className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                <div className="w-10 h-10 rounded-xl" style={{ background: "var(--primary)" }} />
                <div>
                  <p className="text-xs font-black uppercase tracking-tight text-primary">{config.label} Theme</p>
                  <p className="text-[10px] text-slate-400 font-bold">Currently active service color</p>
                </div>
              </div>
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 mb-3">Mode</p>
              <div className="flex gap-3">
                <button className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white border border-slate-200 text-xs font-black uppercase tracking-wider text-slate-600 cursor-pointer"><Sun size={16} /> Light</button>
                <button className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-black uppercase tracking-wider text-slate-400 cursor-pointer"><Moon size={16} /> Dark</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="px-8 py-4 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-lg active:scale-[0.98] flex items-center gap-2 cursor-pointer" style={{ boxShadow: `0 8px 24px color-mix(in srgb, var(--primary) 15%, transparent)` }}>
          <Save size={16} /> Save Changes
        </button>
      </div>
    </div>
  );
}
