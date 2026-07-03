"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export type ServiceType = "taxi" | "food" | "services";

export interface ServiceConfig {
  id: ServiceType;
  label: string;
  themeClass: string;
  emoji: string;
  description: string;
}

export const SERVICE_CONFIGS: Record<ServiceType, ServiceConfig> = {
  taxi: {
    id: "taxi",
    label: "Taxi",
    themeClass: "theme-taxi",
    emoji: "🚕",
    description: "Ride & Transport",
  },
  food: {
    id: "food",
    label: "Food",
    themeClass: "theme-food",
    emoji: "🍕",
    description: "Food Delivery",
  },
  services: {
    id: "services",
    label: "Services",
    themeClass: "theme-services",
    emoji: "🔧",
    description: "On-Demand Services",
  },
};

interface ThemeContextType {
  activeService: ServiceType;
  setActiveService: (service: ServiceType) => void;
  config: ServiceConfig;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [activeService, setActiveServiceState] = useState<ServiceType>("taxi");

  const setActiveService = useCallback((service: ServiceType) => {
    setActiveServiceState(service);
  }, []);

  const config = SERVICE_CONFIGS[activeService];

  return (
    <ThemeContext.Provider value={{ activeService, setActiveService, config }}>
      <div className={config.themeClass}>{children}</div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
