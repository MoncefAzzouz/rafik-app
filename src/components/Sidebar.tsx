"use client";

import { useTheme, ServiceType } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  Car,
  Users,
  MapPin,
  Store,
  ShoppingBag,
  Utensils,
  Wrench,
  FolderKanban,
  UserCheck,
  CalendarCheck,
  Settings,
  LogOut,
  TrendingUp,
  MessageSquare,
  BarChart3,
} from "lucide-react";

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const SERVICE_NAV: Record<ServiceType, NavItem[]> = {
  taxi: [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "rides", label: "Rides", icon: Car },
    { id: "drivers", label: "Drivers", icon: Users },
    { id: "zones", label: "Zones & Maps", icon: MapPin },
    { id: "earnings", label: "Earnings", icon: TrendingUp },
  ],
  food: [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "restaurants", label: "Restaurants", icon: Store },
    { id: "orders", label: "Orders", icon: ShoppingBag },
    { id: "drivers", label: "Drivers", icon: Car },
    { id: "subscriptions", label: "Subscriptions", icon: TrendingUp },
  ],
  services: [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "categories", label: "Service Categories", icon: FolderKanban },
    { id: "professionals", label: "Professionals", icon: UserCheck },
    { id: "bookings", label: "Bookings", icon: CalendarCheck },
    { id: "chats", label: "Chats", icon: MessageSquare },
    { id: "reviews", label: "Reviews", icon: MessageSquare },
    { id: "clients", label: "Clients", icon: Users },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "earnings", label: "Earnings", icon: TrendingUp },
  ],
};

interface SidebarProps {
  activePage: string;
  onNavigate: (pageId: string) => void;
}

export default function Sidebar({ activePage, onNavigate }: SidebarProps) {
  const { activeService, config } = useTheme();
  const { logout, user } = useAuth();
  const navItems = SERVICE_NAV[activeService];

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-100 p-6 h-full sticky top-0 shrink-0 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {/* Brand Header */}
      <div className="flex items-center gap-4 mb-12 group cursor-pointer">
        <div
          className="p-3 rounded-2xl transition-transform group-hover:rotate-12 shadow-lg text-2xl flex items-center justify-center"
          style={{
            background: `var(--primary)`,
            boxShadow: `0 8px 24px color-mix(in srgb, var(--primary) 20%, transparent)`,
          }}
        >
          {config.emoji}
        </div>
        <div>
          <span className="text-xl font-black tracking-tighter uppercase block leading-none" style={{ color: "var(--primary)" }}>
            RAFIK
          </span>
          <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-slate-400 block">
            {config.description}
          </span>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 space-y-2">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 pl-4">
          Management
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 relative group overflow-hidden text-left ${
                isActive
                  ? "text-white shadow-xl"
                  : "text-slate-500 hover:text-primary hover:bg-primary/5"
              }`}
              style={
                isActive
                  ? {
                      background: "var(--primary)",
                      boxShadow: `0 10px 30px color-mix(in srgb, var(--primary) 20%, transparent)`,
                    }
                  : undefined
              }
            >
              <Icon
                size={20}
                className={`transition-transform duration-300 group-hover:scale-110 ${
                  isActive ? "text-white" : "text-slate-400 group-hover:text-primary"
                }`}
              />
              <span className="text-sm font-bold uppercase tracking-wider">{item.label}</span>
              {isActive && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-white rounded-l-full" />
              )}
            </button>
          );
        })}

        {/* System section */}
        <div className="mt-8">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 pl-4">
            System
          </p>
          <button
            onClick={() => onNavigate("settings")}
            className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 relative group overflow-hidden text-left ${
              activePage === "settings"
                ? "text-white shadow-xl"
                : "text-slate-500 hover:text-primary hover:bg-primary/5"
            }`}
            style={
              activePage === "settings"
                ? {
                    background: "var(--primary)",
                    boxShadow: `0 10px 30px color-mix(in srgb, var(--primary) 20%, transparent)`,
                  }
                : undefined
            }
          >
            <Settings
              size={20}
              className={`transition-transform duration-300 group-hover:scale-110 ${
                activePage === "settings" ? "text-white" : "text-slate-400 group-hover:text-primary"
              }`}
            />
            <span className="text-sm font-bold uppercase tracking-wider">Settings</span>
          </button>
        </div>
      </nav>

      {/* Bottom: Admin Card + Logout */}
      <div className="pt-6 border-t border-slate-100 mt-auto space-y-4">
        <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs"
            style={{ background: "color-mix(in srgb, var(--primary) 10%, transparent)", color: "var(--primary)" }}
          >
            {(user?.fullName || "R").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-tight truncate">{user?.fullName || "Admin"}</p>
            <p className="text-[10px] font-bold text-slate-400 truncate">{user?.email || ""}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-3 py-4 bg-rose-50 text-rose-600 rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-rose-100 active:scale-[0.98] transition-all cursor-pointer"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
}
