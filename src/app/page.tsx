"use client";

import { useState, useEffect } from "react";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import TopBar from "@/components/TopBar";
import Sidebar from "@/components/Sidebar";
import TaxiDashboard from "@/components/TaxiDashboard";
import FoodDashboard from "@/components/FoodDashboard";
import ServicesDashboard from "@/components/ServicesDashboard";
import SettingsPage from "@/components/SettingsPage";

function AdminShell() {
  const { activeService } = useTheme();
  const [activePage, setActivePage] = useState("dashboard");

  // Reset to dashboard whenever the service changes
  useEffect(() => {
    setActivePage("dashboard");
  }, [activeService]);

  const renderContent = () => {
    if (activePage === "settings") return <SettingsPage />;

    switch (activeService) {
      case "taxi":
        return <TaxiDashboard activePage={activePage} />;
      case "food":
        return <FoodDashboard activePage={activePage} />;
      case "services":
        return <ServicesDashboard activePage={activePage} />;
      default:
        return <TaxiDashboard activePage={activePage} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <TopBar />
      <div className="flex flex-1">
        <Sidebar activePage={activePage} onNavigate={setActivePage} />
        <main className="flex-1 p-6 lg:p-10 overflow-y-auto" key={`${activeService}-${activePage}`}>
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <ThemeProvider>
      <AdminShell />
    </ThemeProvider>
  );
}
