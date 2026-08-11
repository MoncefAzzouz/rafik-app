"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import TopBar from "@/components/TopBar";
import Sidebar from "@/components/Sidebar";
import TaxiDashboard from "@/components/TaxiDashboard";
import FoodDashboard from "@/components/FoodDashboard";
import TruckDashboard from "@/components/TruckDashboard";
import ServicesDashboard from "@/components/ServicesDashboard";
import SettingsPage from "@/components/SettingsPage";
import ChatMonitor from "@/components/ChatMonitor";
import PromoCodesPage from "@/components/PromoCodesPage";
import MobileAppDashboard from "@/components/MobileAppDashboard";

function AdminShellWrapper() {
  const params = useParams();
  const router = useRouter();
  const { setActiveService } = useTheme();
  
  const service = (params?.service as string) || "services";
  const page = (params?.page as string) || "dashboard";

  // Sync parameters with context state
  useEffect(() => {
    if (["taxi", "food", "services", "truck", "mobile"].includes(service)) {
      setActiveService(service as any);
    }
  }, [service, setActiveService]);

  const handleNavigate = (pageId: string) => {
    router.push(`/${service}/${pageId}`);
  };

  const renderContent = () => {
    if (page === "settings") return <SettingsPage />;
    // Mobile App section owns all of its own pages (slides, modules, app-promos, notifications, legal)
    if (service === "mobile") return <MobileAppDashboard activePage={page} />;
    if (page === "chats") return <ChatMonitor />;
    // Promo codes are shared by taxi, food, and services
    if (page === "promos") return <PromoCodesPage />;

    switch (service) {
      case "taxi":
        return <TaxiDashboard activePage={page} />;
      case "food":
        return <FoodDashboard activePage={page} />;
      case "truck":
        return <TruckDashboard activePage={page} />;
      case "services":
        return <ServicesDashboard activePage={page} />;
      default:
        return <ServicesDashboard activePage={page} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <TopBar />
      <div className="flex flex-1">
        <Sidebar activePage={page} onNavigate={handleNavigate} />
        <main className="flex-1 p-6 lg:p-10 overflow-y-auto" key={`${service}-${page}`}>
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/");
    } else if (user?.role !== "ADMIN") {
      router.push("/worker/dashboard");
    } else {
      setAuthorized(true);
    }
  }, [isAuthenticated, user, router]);

  if (!authorized) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <AdminShellWrapper />
    </ThemeProvider>
  );
}
