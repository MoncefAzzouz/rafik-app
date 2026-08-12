"use client";

import { useTheme, SERVICE_CONFIGS, ServiceType } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { API_URL } from "@/lib/api";
import { Bell, Search, Sparkles, Menu, CheckCheck, Trash2, Package } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

interface AdminAlert {
  id: string; type: string; vertical?: string | null; event?: string | null;
  title: string; body?: string | null; link?: string | null; readAt?: string | null; createdAt: string;
}
function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
const VERTICAL_EMOJI: Record<string, string> = { truck: "🚚", services: "🔧", food: "🍕", taxi: "🚕" };

export default function TopBar() {
  const { activeService, setActiveService, config } = useTheme();
  const { user, token } = useAuth();
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [alerts, setAlerts] = useState<AdminAlert[]>([]);
  const [unread, setUnread] = useState(0);
  const bellRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  const fetchAlerts = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/app/admin/alerts?limit=30`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const d = await res.json(); setAlerts(d.items || []); setUnread(d.unread || 0); }
    } catch { /* ignore */ }
  }, [token]);

  // Load on mount, then poll every 30s so the badge stays fresh.
  useEffect(() => {
    fetchAlerts();
    const t = setInterval(fetchAlerts, 30000);
    return () => clearInterval(t);
  }, [fetchAlerts]);

  // Close the dropdown when clicking outside it.
  useEffect(() => {
    if (!isAlertsOpen) return;
    const onClick = (e: MouseEvent) => { if (bellRef.current && !bellRef.current.contains(e.target as Node)) setIsAlertsOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [isAlertsOpen]);

  const openBell = async () => {
    const next = !isAlertsOpen;
    setIsAlertsOpen(next);
    if (next && unread > 0) {
      setUnread(0);
      try { await fetch(`${API_URL}/api/app/admin/alerts/read-all`, { method: "PUT", headers: { Authorization: `Bearer ${token}` } }); } catch {}
      setAlerts(prev => prev.map(a => ({ ...a, readAt: a.readAt || new Date().toISOString() })));
    }
  };

  const openAlert = (a: AdminAlert) => {
    setIsAlertsOpen(false);
    if (a.link) router.push(a.link);
  };

  const clearAll = async () => {
    setAlerts([]); setUnread(0);
    try { await fetch(`${API_URL}/api/app/admin/alerts`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }); } catch {}
  };

  const services = Object.values(SERVICE_CONFIGS);

  const handleServiceChange = (svcId: ServiceType) => {
    setActiveService(svcId);
    const parts = pathname.split("/");
    const currentPage = parts.length > 2 ? parts[parts.length - 1] : "dashboard";
    router.push(`/${svcId}/${currentPage}`);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 lg:px-10 h-20 flex justify-between items-center">
      {/* Left: Workspace Label */}
      <div className="hidden sm:flex items-center gap-3">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Workspace</span>
        <span className="text-xs font-bold text-slate-300">/</span>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 border border-primary/10 rounded-lg text-primary text-[10px] font-black uppercase tracking-wider">
          <Sparkles size={10} style={{ fill: "currentColor" }} />
          Rafik Admin v1.0
        </div>
      </div>

      {/* Center: Service Switcher */}
      <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 rounded-2xl p-1.5">
        {services.map((svc) => (
          <button
            key={svc.id}
            onClick={() => handleServiceChange(svc.id as ServiceType)}
            className={`service-btn ${activeService === svc.id ? "active" : ""}`}
          >
            <span className="mr-1.5">{svc.emoji}</span>
            {svc.label}
          </button>
        ))}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <div className="relative" ref={bellRef}>
          <button
            onClick={openBell}
            className="w-12 h-12 bg-slate-50 hover:bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-100 text-slate-500 relative transition-all active:scale-95 cursor-pointer"
          >
            <Bell size={18} />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </button>

          {isAlertsOpen && (
            <div className="absolute right-0 mt-3 w-[360px] max-w-[90vw] bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden z-50 animate-fadeIn">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <span className="text-xs font-black text-slate-700 uppercase tracking-wider">Notifications</span>
                {alerts.length > 0 && (
                  <button onClick={clearAll} className="text-[10px] font-black text-slate-400 hover:text-rose-500 uppercase tracking-wider flex items-center gap-1 cursor-pointer"><Trash2 size={12} /> Clear</button>
                )}
              </div>
              <div className="max-h-[420px] overflow-y-auto">
                {alerts.length === 0 && (
                  <div className="py-12 flex flex-col items-center justify-center text-slate-300 gap-2">
                    <CheckCheck size={28} />
                    <p className="text-xs font-bold text-slate-400">You're all caught up</p>
                  </div>
                )}
                {alerts.map((a) => (
                  <button key={a.id} onClick={() => openAlert(a)} className={`w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 flex gap-3 cursor-pointer ${a.readAt ? "" : "bg-primary/5"}`}>
                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-base shrink-0">{VERTICAL_EMOJI[a.vertical || ""] || <Package size={15} className="text-slate-400" />}</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-black text-slate-800 leading-tight">{a.title}</p>
                      {a.body && <p className="text-[11px] text-slate-500 font-inter truncate">{a.body}</p>}
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5">{timeAgo(a.createdAt)}</p>
                    </div>
                    {!a.readAt && <span className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Admin Profile */}
        <div className="flex items-center gap-3 pl-4 border-l border-slate-100">
          <div
            className="w-10 h-10 rounded-2xl text-white font-black uppercase flex items-center justify-center shadow-lg text-xs"
            style={{
              background: `linear-gradient(135deg, var(--primary), var(--primary-400))`,
              boxShadow: `0 8px 24px color-mix(in srgb, var(--primary) 20%, transparent)`,
            }}
          >
            {(user?.fullName || "R").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-black uppercase tracking-tight">{user?.fullName || "Admin"}</p>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Online</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
