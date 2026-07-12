"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface UserProfile {
  id: string;
  email: string;
  phone: string;
  fullName: string;
  role: "ADMIN" | "WORKER" | "CLIENT";
  profileImage: string | null;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: UserProfile) => void;
  logout: () => void;
  updateUser: (updatedUser: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("rafik_auth_token");
    const savedUser = localStorage.getItem("rafik_auth_user");
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (err) {
        localStorage.removeItem("rafik_auth_token");
        localStorage.removeItem("rafik_auth_user");
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback((newToken: string, newUser: UserProfile) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("rafik_auth_token", newToken);
    localStorage.setItem("rafik_auth_user", JSON.stringify(newUser));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("rafik_auth_token");
    localStorage.removeItem("rafik_auth_user");
  }, []);

  const updateUser = useCallback((updatedFields: Partial<UserProfile>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updatedFields };
      localStorage.setItem("rafik_auth_user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const value = {
    user,
    token,
    isAuthenticated: !!token,
    login,
    logout,
    updateUser,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
