"use client";

import { useTheme, SERVICE_CONFIGS, ServiceType } from "@/context/ThemeContext";
import { Bell, Search, Sparkles, Menu } from "lucide-react";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function TopBar() {
  const { activeService, setActiveService, config } = useTheme();
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

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
        <div className="relative">
          <button
            onClick={() => setIsAlertsOpen(!isAlertsOpen)}
            className="w-12 h-12 bg-slate-50 hover:bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-100 text-slate-500 relative transition-all active:scale-95 cursor-pointer"
          >
            <Bell size={18} />
            <span className="absolute top-3 right-3 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
            <span className="absolute top-3 right-3 w-2 h-2 bg-rose-500 rounded-full" />
          </button>
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
            R
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-black uppercase tracking-tight">Rafik Admin</p>
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
