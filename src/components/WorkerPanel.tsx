"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useParams, useRouter } from "next/navigation";
import {
  Wrench, Users, DollarSign, CalendarCheck, Clock, CheckCircle2, XCircle,
  LogOut, Shield, UserCheck, Star, Edit2, Calendar, MessageSquare, BarChart3,
  X, Copy, Check, ChevronRight, Activity, Phone, MapPin, Globe, Award, Sparkles, Code
} from "lucide-react";

interface Review {
  id: string;
  clientName: string;
  rating: number;
  comment: string;
  date: string;
}

interface StatusHistory {
  status: string;
  timestamp: string;
}

interface Booking {
  id: string;
  clientName: string;
  clientPhone: string;
  clientAddress: string;
  serviceCategory: string;
  workerId: string;
  status: string;
  price: string;
  description: string;
  time: string;
  bookingDate: string;
  bookingTime?: string;
  clientPhotos: string[];
  workerQuote: number | null;
  quoteStatus: string;
  statusHistory: StatusHistory[];
}

interface ProfessionalProfile {
  id: string;
  name: string;
  category: string;
  phone: string;
  status: "online" | "busy" | "offline";
  verified: boolean;
  jobs: number;
  rating: number;
  joined: string;
  rate: string;
  experience: string;
  bio: string;
  portfolio: string[];
  availableTimes: string[];
}

const STATUS_DETAILS: Record<string, { label: string; color: string; bg: string }> = {
  pending_review: { label: "Pending Review", color: "text-amber-700 border-amber-200", bg: "bg-amber-500" },
  contacting_worker: { label: "Contacting Worker", color: "text-blue-700 border-blue-200", bg: "bg-blue-400" },
  quote_sent: { label: "Quote Sent", color: "text-purple-700 border-purple-200", bg: "bg-purple-500" },
  quote_approved: { label: "Quote Approved", color: "text-sky-700 border-sky-200", bg: "bg-sky-500" },
  quote_rejected: { label: "Quote Rejected", color: "text-rose-700 border-rose-200", bg: "bg-rose-400" },
  both_confirmed: { label: "Both Confirmed", color: "text-emerald-700 border-emerald-200", bg: "bg-emerald-500" },
  dispatched: { label: "Dispatched", color: "text-violet-700 border-violet-200", bg: "bg-violet-600" },
  in_progress: { label: "In Progress", color: "text-orange-700 border-orange-200", bg: "bg-orange-500" },
  completed: { label: "Completed", color: "text-emerald-800 border-emerald-300", bg: "bg-emerald-600" },
  cancelled: { label: "Cancelled", color: "text-rose-700 border-rose-200", bg: "bg-rose-500" }
};

export default function WorkerPanel() {
  const { user, token, logout } = useAuth();
  const params = useParams();
  const router = useRouter();

  const activeTab = (params?.page as "dashboard" | "bookings" | "profile" | "reviews" | "earnings") || "dashboard";

  const setActiveTab = (tabId: string) => {
    router.push(`/worker/${tabId}`);
  };

  const [profile, setProfile] = useState<ProfessionalProfile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit states for Profile Tab
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [editedBio, setEditedBio] = useState("");
  const [editedRate, setEditedRate] = useState("");
  const [editedExperience, setEditedExperience] = useState("");
  const [newTimeSlot, setNewTimeSlot] = useState("");

  // JSON viewer states
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fetch full professional dataset
  const fetchWorkerData = async () => {
    if (!token || !user) return;
    try {
      setLoading(true);
      // Fetch professional data by custom route or look up in professionals list
      const resPros = await fetch("http://localhost:4000/api/professionals");
      const prosList: ProfessionalProfile[] = await resPros.json();
      
      // Find the professional record associated with the logged in user phone or user email
      const matchedPro = prosList.find(p => p.phone === user.phone || p.name === user.fullName);
      
      if (matchedPro) {
        setProfile(matchedPro);
        setEditedBio(matchedPro.bio);
        setEditedRate(matchedPro.rate);
        setEditedExperience(matchedPro.experience);

        // Fetch bookings for this professional
        const resBookings = await fetch(`http://localhost:4000/api/bookings/worker/${matchedPro.id}`);
        const bookingsList = await resBookings.json();
        setBookings(bookingsList);

        // Fetch reviews
        const resReviews = await fetch(`http://localhost:4000/api/reviews/worker/${matchedPro.id}`);
        const reviewsList = await resReviews.json();
        setReviews(reviewsList);
      }
    } catch (err) {
      console.error("Error loading worker data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkerData();
  }, [token, user]);

  const updateStatus = async (newStatus: "online" | "busy" | "offline") => {
    if (!profile) return;
    try {
      const res = await fetch(`http://localhost:4000/api/professionals/${profile.id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setProfile(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    try {
      const res = await fetch(`http://localhost:4000/api/professionals/${profile.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          bio: editedBio,
          rate: editedRate,
          experience: editedExperience
        })
      });
      if (res.ok) {
        const updated = await res.json();
        setProfile(updated);
        setIsEditingBio(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddSlot = async () => {
    if (!profile || !newTimeSlot) return;
    const updatedSlots = [...profile.availableTimes, newTimeSlot].sort();
    try {
      const res = await fetch(`http://localhost:4000/api/professionals/${profile.id}/available-times`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ availableTimes: updatedSlots })
      });
      if (res.ok) {
        setProfile(prev => prev ? { ...prev, availableTimes: updatedSlots } : null);
        setNewTimeSlot("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveSlot = async (slotToRemove: string) => {
    if (!profile) return;
    const updatedSlots = profile.availableTimes.filter(s => s !== slotToRemove);
    try {
      const res = await fetch(`http://localhost:4000/api/professionals/${profile.id}/available-times`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ availableTimes: updatedSlots })
      });
      if (res.ok) {
        setProfile(prev => prev ? { ...prev, availableTimes: updatedSlots } : null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyJson = () => {
    let rawData: any = {};
    if (activeTab === "bookings") rawData = bookings;
    else if (activeTab === "profile") rawData = profile;
    else if (activeTab === "reviews") rawData = reviews;
    else if (activeTab === "earnings") rawData = { earnings: bookings.filter(b => b.status === "completed").map(b => ({ id: b.id, amount: b.workerQuote })) };
    else rawData = { profile, bookingsSummary: bookings.length, reviewsSummary: reviews.length };

    navigator.clipboard.writeText(JSON.stringify(rawData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getJSONData = () => {
    if (activeTab === "bookings") return bookings;
    if (activeTab === "profile") return profile;
    if (activeTab === "reviews") return reviews;
    if (activeTab === "earnings") return bookings.filter(b => b.status === "completed").map(b => ({ id: b.id, quote: b.workerQuote, date: b.bookingDate, client: b.clientName }));
    return { profile, bookingsSummary: bookings.length, reviewsSummary: reviews.length };
  };

  // Helper stats
  const completedJobs = bookings.filter(b => b.status === "completed");
  const activeJobs = bookings.filter(b => !["completed", "cancelled", "pending_review"].includes(b.status));
  const totalEarnings = completedJobs.reduce((sum, b) => sum + (b.workerQuote || 0), 0);
  const workerPayout = Math.round(totalEarnings * 0.85);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Professional Space...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-8">
        <div className="bg-slate-850 p-8 rounded-[2rem] border border-slate-800 max-w-md w-full text-center space-y-6">
          <XCircle className="mx-auto text-rose-500" size={48} />
          <h2 className="text-xl font-black uppercase">Professional Record Missing</h2>
          <p className="text-xs text-slate-400 font-bold leading-relaxed">
            Your user account doesn't have a linked professional provider record. Please contact the administrator.
          </p>
          <button
            onClick={logout}
            className="w-full py-4 bg-slate-800 hover:bg-slate-750 rounded-2xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
          >
            Disconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row">
      
      {/* ── SIDEBAR PANELS ── */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-400 flex flex-col justify-between shrink-0 border-r border-slate-800">
        <div className="p-6 space-y-8 text-left">
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center font-black text-xl italic tracking-tighter text-white shadow-lg shadow-blue-500/20">
              R
            </div>
            <div>
              <span className="text-sm font-black tracking-widest uppercase italic text-white block">RAFIK</span>
              <span className="text-[9px] font-black text-blue-400 uppercase tracking-wider block">Pro Console</span>
            </div>
          </div>

          {/* User Profile Card */}
          <div className="bg-slate-950/40 p-4 rounded-3xl border border-slate-800/40 flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 text-primary font-black rounded-xl flex items-center justify-center text-sm uppercase">
              {profile.name.split(" ").map(n => n[0]).join("")}
            </div>
            <div className="truncate">
              <h4 className="text-xs font-black text-white uppercase tracking-tight">{profile.name}</h4>
              <span className="text-[9px] font-bold text-slate-500 uppercase">{profile.category}</span>
            </div>
          </div>

          {/* Status Switches */}
          <div className="space-y-2">
            <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest px-1">My Duty Status</label>
            <div className="grid grid-cols-3 gap-1 bg-slate-950/50 p-1 rounded-2xl border border-slate-850">
              {(["online", "busy", "offline"] as const).map(st => (
                <button
                  key={st}
                  onClick={() => updateStatus(st)}
                  className={`text-[9px] py-2 rounded-xl font-black uppercase tracking-wider transition-colors cursor-pointer ${
                    profile.status === st
                      ? st === "online" ? "bg-emerald-500 text-white shadow-sm" : st === "busy" ? "bg-amber-500 text-white shadow-sm" : "bg-slate-800 text-white shadow-sm"
                      : "hover:text-white"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Navigation Menus */}
          <nav className="space-y-1.5 pt-4">
            {[
              { id: "dashboard", label: "Overview", icon: BarChart3 },
              { id: "bookings", label: `Bookings (${activeJobs.length})`, icon: CalendarCheck },
              { id: "profile", label: "Edit Profile", icon: Edit2 },
              { id: "reviews", label: "My Reviews", icon: MessageSquare },
              { id: "earnings", label: "My Earnings", icon: DollarSign }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full px-4 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-3 cursor-pointer ${
                    isActive
                      ? "bg-blue-500 text-white font-black shadow-lg shadow-blue-500/10 scale-[1.01]"
                      : "hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Logout */}
        <div className="p-6 border-t border-slate-850">
          <button
            onClick={logout}
            className="w-full px-4 py-3 bg-slate-850 hover:bg-rose-900/20 hover:text-rose-400 border border-slate-800 text-xs font-bold rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* ── MAIN WORKSPACE CONTENT ── */}
      <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-8 text-left">
          
          {/* Header Dashboard section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">
                {activeTab === "dashboard" && "Overview"}
                {activeTab === "bookings" && "Active Bookings"}
                {activeTab === "profile" && "Profile Setup"}
                {activeTab === "reviews" && "Review Log"}
                {activeTab === "earnings" && "My Finances"}
              </h1>
              <p className="text-xs text-slate-400 font-bold font-inter">
                {activeTab === "dashboard" && "Quick summary of pending jobs, notifications, and client comments."}
                {activeTab === "bookings" && "Accept client pricing proposals, complete pending tasks, and view location addresses."}
                {activeTab === "profile" && "Define your hourly rate, availability slots, and upload visual portfolios."}
                {activeTab === "reviews" && "See how clients rated your technical execution and punctuality."}
                {activeTab === "earnings" && "Detailed ledger of completed work and dynamic platform payouts."}
              </p>
            </div>

            <button
              onClick={() => setIsJsonModalOpen(true)}
              className="px-4 py-3.5 bg-slate-200/60 hover:bg-slate-250 text-slate-600 hover:text-slate-800 border border-slate-300/30 rounded-2xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Code size={14} />
              View API JSON
            </button>
          </div>

          {/* TAB 1: DASHBOARD OVERVIEW */}
          {activeTab === "dashboard" && (
            <div className="space-y-8 animate-fadeIn">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm flex items-center justify-between">
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Jobs Done</span>
                    <span className="text-2xl font-black text-slate-800 tracking-tight block">{completedJobs.length}</span>
                  </div>
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                    <CalendarCheck size={20} />
                  </div>
                </div>

                <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm flex items-center justify-between">
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Gross Revenue</span>
                    <span className="text-2xl font-black text-slate-800 tracking-tight block">{totalEarnings.toLocaleString()} DZD</span>
                  </div>
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                    <DollarSign size={20} />
                  </div>
                </div>

                <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm flex items-center justify-between">
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Average Rating</span>
                    <span className="text-2xl font-black text-slate-800 tracking-tight block">⭐ {profile.rating} / 5.0</span>
                  </div>
                  <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                    <Star size={20} />
                  </div>
                </div>

                <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm flex items-center justify-between">
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Duty State</span>
                    <span className="text-lg font-black text-slate-800 tracking-tight block uppercase">{profile.status}</span>
                  </div>
                  <div className="w-12 h-12 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center">
                    <Activity size={20} />
                  </div>
                </div>
              </div>

              {/* Bookings Queue */}
              <div className="bg-white border border-slate-100 rounded-[2rem] p-6 lg:p-8 shadow-sm space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Assigned Queue ({activeJobs.length})</h3>
                  <button
                    onClick={() => setActiveTab("bookings")}
                    className="text-[10px] font-black text-blue-500 uppercase tracking-wider hover:underline"
                  >
                    View All
                  </button>
                </div>

                {activeJobs.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 font-bold font-inter text-xs border border-dashed border-slate-100 rounded-2xl">
                    No active assignments in your queue.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeJobs.slice(0, 3).map((b) => {
                      const stat = STATUS_DETAILS[b.status] || STATUS_DETAILS.pending_review;
                      return (
                        <div key={b.id} className="border border-slate-100 p-5 rounded-2xl flex justify-between items-center hover:bg-slate-50 transition-colors">
                          <div className="space-y-1.5">
                            <span className="text-[9px] font-black text-slate-400 block">{b.id} · {b.bookingDate}</span>
                            <h4 className="text-xs font-black text-slate-700 uppercase tracking-tight">{b.clientName}</h4>
                            <p className="text-[10px] text-slate-500 font-bold font-inter line-clamp-1">{b.description}</p>
                          </div>
                          <span className={`text-[9px] px-3 py-1.5 rounded-full font-black uppercase tracking-wider ${stat.color} border bg-white`}>
                            {stat.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: MY BOOKINGS LIST */}
          {activeTab === "bookings" && (
            <div className="space-y-6 animate-fadeIn">
              {bookings.length === 0 ? (
                <div className="bg-white border border-slate-100 rounded-[2rem] p-12 text-center text-slate-400 font-bold font-inter">
                  No bookings found for your profile.
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {bookings.map((b) => {
                    const stat = STATUS_DETAILS[b.status] || STATUS_DETAILS.pending_review;
                    return (
                      <div key={b.id} className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm flex flex-col justify-between space-y-6 hover:shadow-md transition-all">
                        
                        {/* Header card */}
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <span className="text-[9px] font-black text-slate-400 block uppercase tracking-widest">{b.id} · Created {b.time}</span>
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">{b.clientName}</h3>
                          </div>
                          <span className={`text-[9px] px-3 py-1.5 rounded-full font-black uppercase tracking-wider ${stat.color} border`}>
                            {stat.label}
                          </span>
                        </div>

                        {/* Description block */}
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50 space-y-3">
                          <p className="text-xs text-slate-500 font-bold font-inter leading-relaxed">&ldquo;{b.description}&rdquo;</p>
                          <div className="flex flex-col gap-1 text-[10px] text-slate-400 font-bold font-inter">
                            <div className="flex items-center gap-1.5">
                              <MapPin size={12} className="text-slate-400" />
                              <span>{b.clientAddress}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Phone size={12} className="text-slate-400" />
                              <span>{b.clientPhone}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Calendar size={12} className="text-slate-400" />
                              <span>Schedule: <span className="text-slate-600 font-black">{b.bookingDate} {b.bookingTime || "(Time slots pending)"}</span></span>
                            </div>
                          </div>
                        </div>

                        {/* Pictures uploaded by client */}
                        {b.clientPhotos && b.clientPhotos.length > 0 && (
                          <div className="space-y-2">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Job Context Photos ({b.clientPhotos.length})</label>
                            <div className="flex gap-2.5 overflow-x-auto pb-1">
                              {b.clientPhotos.map((photo, pIdx) => (
                                <img
                                  key={pIdx}
                                  src={photo.startsWith("/uploads") ? `http://localhost:4000${photo}` : photo}
                                  alt="Job photo"
                                  className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Quote Status indicators */}
                        <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                          <div className="text-left">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Proposed Quote</span>
                            <span className="text-xs font-black text-slate-800 block mt-0.5">{b.workerQuote ? `${b.workerQuote.toLocaleString()} DZD` : "Pending Quote"}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Quote State</span>
                            <span className="text-[10px] font-black text-blue-500 block uppercase mt-0.5">{b.quoteStatus}</span>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: EDIT PROFILE PAGE */}
          {activeTab === "profile" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
              
              {/* Left Settings inputs card */}
              <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 lg:p-8 shadow-sm space-y-6 lg:col-span-2">
                <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Provider Credentials</h3>
                  {!isEditingBio ? (
                    <button
                      onClick={() => setIsEditingBio(true)}
                      className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-slate-50 cursor-pointer"
                    >
                      Modify Profile
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsEditingBio(false)}
                        className="px-4 py-2 border border-slate-200 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-slate-50 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        className="px-4 py-2 bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-blue-600 cursor-pointer"
                      >
                        Save
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Full Name</label>
                      <input
                        type="text"
                        disabled
                        value={profile.name}
                        className="w-full px-5 py-4 bg-slate-50 border border-transparent rounded-2xl outline-none font-semibold text-xs text-slate-500 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Registered Specialty</label>
                      <input
                        type="text"
                        disabled
                        value={profile.category}
                        className="w-full px-5 py-4 bg-slate-50 border border-transparent rounded-2xl outline-none font-semibold text-xs text-slate-500 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Rate Quote Rule</label>
                    <input
                      type="text"
                      disabled={!isEditingBio}
                      placeholder="e.g. 1,500 DZD / Hour"
                      value={editedRate}
                      onChange={(e) => setEditedRate(e.target.value)}
                      className="w-full px-5 py-4 bg-slate-50 focus:bg-white border border-transparent focus:border-blue-500/20 rounded-2xl outline-none font-semibold text-xs text-slate-700 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Experience Description</label>
                    <textarea
                      rows={3}
                      disabled={!isEditingBio}
                      value={editedExperience}
                      onChange={(e) => setEditedExperience(e.target.value)}
                      className="w-full px-5 py-4 bg-slate-50 focus:bg-white border border-transparent focus:border-blue-500/20 rounded-2xl outline-none font-semibold text-xs text-slate-700 transition-colors disabled:cursor-not-allowed disabled:opacity-60 resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Provider Biography</label>
                    <textarea
                      rows={4}
                      disabled={!isEditingBio}
                      value={editedBio}
                      onChange={(e) => setEditedBio(e.target.value)}
                      className="w-full px-5 py-4 bg-slate-50 focus:bg-white border border-transparent focus:border-blue-500/20 rounded-2xl outline-none font-semibold text-xs text-slate-700 transition-colors disabled:cursor-not-allowed disabled:opacity-60 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Right Side: Available Times slots settings */}
              <div className="space-y-6">
                <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 lg:p-8 shadow-sm space-y-6">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight border-b border-slate-50 pb-4">Schedule Slots</h3>

                  <div className="space-y-4 text-left">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. 13:30"
                        value={newTimeSlot}
                        onChange={(e) => setNewTimeSlot(e.target.value)}
                        className="flex-1 px-4 py-3 bg-slate-50 border border-slate-100 focus:border-blue-500/20 rounded-xl outline-none text-xs font-semibold"
                      />
                      <button
                        onClick={handleAddSlot}
                        className="px-4 py-3 bg-blue-500 text-white rounded-xl text-xs font-black uppercase hover:bg-blue-600 transition-colors cursor-pointer"
                      >
                        Add
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      {profile.availableTimes.map((slot) => (
                        <div key={slot} className="bg-slate-50 border border-slate-100 pl-3 pr-2 py-1.5 rounded-xl flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-600">{slot}</span>
                          <button
                            onClick={() => handleRemoveSlot(slot)}
                            className="w-5 h-5 rounded-lg hover:bg-rose-50 flex items-center justify-center text-slate-400 hover:text-rose-500 cursor-pointer"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Portfolio Showcase */}
                <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 lg:p-8 shadow-sm space-y-4">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight border-b border-slate-50 pb-2">My Portfolio</h3>
                  {profile.portfolio.length === 0 ? (
                    <p className="text-[10px] text-slate-400 font-bold font-inter">No portfolio items loaded.</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {profile.portfolio.map((url, pIdx) => (
                        <img
                          key={pIdx}
                          src={url.startsWith("/uploads") ? `http://localhost:4000${url}` : url}
                          alt="Portfolio item"
                          className="w-full h-16 rounded-xl object-cover border border-slate-100"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: MY REVIEWS PAGE */}
          {activeTab === "reviews" && (
            <div className="space-y-6 animate-fadeIn">
              {reviews.length === 0 ? (
                <div className="bg-white border border-slate-100 rounded-[2rem] p-12 text-center text-slate-400 font-bold font-inter">
                  No client reviews received yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {reviews.map((r) => (
                    <div key={r.id} className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm flex flex-col justify-between space-y-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">{r.clientName}</h4>
                            <p className="text-[9px] text-slate-400 font-bold font-inter mt-0.5">{r.date}</p>
                          </div>
                          <div className="flex text-amber-400 text-xs">
                            {Array.from({ length: 5 }).map((_, idx) => (
                              <span key={idx}>{idx < r.rating ? "★" : "☆"}</span>
                            ))}
                          </div>
                        </div>

                        <p className="text-xs text-slate-500 font-medium font-inter leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                          &ldquo;{r.comment}&rdquo;
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: MY EARNINGS PAGE */}
          {activeTab === "earnings" && (
            <div className="space-y-8 animate-fadeIn">
              
              {/* Financial KPI stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Total Bookings Billings</span>
                  <span className="text-2xl font-black text-slate-800 tracking-tight block mt-2">{totalEarnings.toLocaleString()} DZD</span>
                </div>
                
                <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">My Payout (85%)</span>
                  <span className="text-2xl font-black text-emerald-600 tracking-tight block mt-2">{workerPayout.toLocaleString()} DZD</span>
                </div>

                <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Platform Comm. (15%)</span>
                  <span className="text-2xl font-black text-slate-400 tracking-tight block mt-2">{(totalEarnings - workerPayout).toLocaleString()} DZD</span>
                </div>
              </div>

              {/* Earnings Table */}
              <div className="bg-white border border-slate-100 rounded-[2rem] p-6 lg:p-8 shadow-sm">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-6">Payment Ledger History</h3>
                
                {completedJobs.length === 0 ? (
                  <div className="text-center text-slate-400 font-bold font-inter py-8 border border-dashed border-slate-100 rounded-xl text-xs">
                    No completed jobs available to generate ledger records.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          <th className="py-4">Job ID</th>
                          <th className="py-4">Completion Date</th>
                          <th className="py-4">Customer Name</th>
                          <th className="py-4 text-right">Job Price</th>
                          <th className="py-4 text-right">My Share (85%)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {completedJobs.map((b) => {
                          const gross = b.workerQuote || 0;
                          const payout = Math.round(gross * 0.85);
                          return (
                            <tr key={b.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors text-xs font-semibold text-slate-700">
                              <td className="py-4 font-bold">{b.id}</td>
                              <td className="py-4 text-slate-500">{b.bookingDate}</td>
                              <td className="py-4 uppercase text-[10px] text-slate-500">{b.clientName}</td>
                              <td className="py-4 text-right text-slate-800 font-black">{gross.toLocaleString()} DZD</td>
                              <td className="py-4 text-right text-emerald-600 font-black">{payout.toLocaleString()} DZD</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      </main>

      {/* ── API JSON VIEWER MODAL ── */}
      {isJsonModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-[700px] bg-slate-950 text-slate-200 rounded-[3rem] shadow-2xl border border-white/10 overflow-hidden flex flex-col max-h-[85vh]">
            
            {/* Header */}
            <div className="p-8 lg:p-10 border-b border-white/5 flex justify-between items-center shrink-0">
              <div className="space-y-1 text-left">
                <div className="flex items-center gap-2 text-blue-400">
                  <Code size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Mobile API Endpoint</span>
                </div>
                <h2 className="text-2xl font-black uppercase italic tracking-tight text-white">
                  Worker API Output
                </h2>
                <p className="text-xs text-slate-400 font-medium font-inter">
                  Direct JSON structures configuration data for mobile app queries.
                </p>
              </div>
              
              <button 
                onClick={() => setIsJsonModalOpen(false)}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white border border-white/10 transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Code viewer */}
            <div className="flex-1 overflow-y-auto p-8 font-mono text-xs text-emerald-400 bg-slate-900/60 leading-relaxed text-left">
              <pre>{JSON.stringify(getJSONData(), null, 2)}</pre>
            </div>

            {/* Footer Actions */}
            <div className="p-8 border-t border-white/5 bg-slate-950 flex gap-4 shrink-0 justify-end">
              <button 
                onClick={handleCopyJson}
                className="px-6 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl font-black uppercase tracking-wider text-[10px] shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <Check size={14} strokeWidth={3} />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    Copy JSON API
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
