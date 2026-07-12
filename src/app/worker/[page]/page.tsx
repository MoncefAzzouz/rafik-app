"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import WorkerPanel from "@/components/WorkerPanel";

export default function WorkerRoutePage() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/");
    } else if (user?.role !== "WORKER") {
      router.push("/services/dashboard");
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

  return <WorkerPanel />;
}
