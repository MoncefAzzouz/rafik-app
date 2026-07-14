"use client";

import { API_URL } from "@/lib/api";
import { WILAYAS, DEFAULT_WILAYA } from "@/lib/locations";
import { getSocket } from "@/lib/socket";
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useParams, useRouter } from "next/navigation";
import {
  Wrench, Users, DollarSign, CalendarCheck, Clock, CheckCircle2, XCircle,
  LogOut, Shield, UserCheck, Star, Edit2, Calendar, MessageSquare, BarChart3,
  X, Copy, Check, ChevronRight, Activity, Phone, MapPin, Globe, Award, Sparkles, Code,
  ThumbsUp, ThumbsDown, Send, Eye, User, Loader2
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
  clientWilaya?: string | null;
  clientCommune?: string | null;
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
  mediationModeSnapshot?: "MEDIATED" | "DIRECT" | null;
  finalPrice?: number | null;
  conversation?: { id: string } | null;
  statusHistory: StatusHistory[];
}

interface EffectiveModes {
  mediationMode: "MEDIATED" | "DIRECT";
  commissionMode: "PERCENTAGE" | "SUBSCRIPTION";
  commissionPercent: number;
  subscriptionFee: number;
}

interface PortfolioPost {
  id: string;
  image: string;
  caption?: string | null;
  createdAt: string;
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
  profileImage?: string | null;
  portfolio: string[];
  portfolioPosts?: PortfolioPost[];
  availableTimes: string[];
  wilaya?: string | null;
  commune?: string | null;
  address?: string | null;
  effectiveModes?: EffectiveModes;
}

interface EarningsJob {
  bookingId: string;
  client: string;
  category: string;
  date: string;
  price: number;
  platformCut: number;
  net: number;
  commissionMode: string | null;
  commissionPercent: number | null;
}

interface MyEarnings {
  commissionMode: "PERCENTAGE" | "SUBSCRIPTION";
  commissionPercent: number | null;
  subscriptionFee: number | null;
  completedJobs: number;
  gross: number;
  platformCut: number;
  netEarnings: number;
  jobs: EarningsJob[];
  subscriptionPayments: { id: string; amount: number; periodStart: string; periodEnd: string; paidAt: string; note?: string | null }[];
}

interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: "ADMIN" | "WORKER" | "CLIENT";
  text: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  bookingId: string;
  booking: {
    id: string;
    clientName: string;
    clientPhone: string;
    serviceCategory: string;
    status: string;
  };
  lastMessage: ChatMessage | null;
  unread: number;
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
  cancelled: { label: "Cancelled", color: "text-rose-700 border-rose-200", bg: "bg-rose-500" },
  awaiting_worker: { label: "New Order — Respond!", color: "text-cyan-700 border-cyan-200", bg: "bg-cyan-500" },
  accepted: { label: "Accepted", color: "text-teal-700 border-teal-200", bg: "bg-teal-500" },
  declined: { label: "Declined", color: "text-rose-700 border-rose-200", bg: "bg-rose-400" }
};

export default function WorkerPanel() {
  const { user, token, logout } = useAuth();
  const params = useParams();
  const router = useRouter();

  const activeTab = (params?.page as "dashboard" | "bookings" | "chat" | "profile" | "reviews" | "earnings") || "dashboard";

  const setActiveTab = (tabId: string) => {
    router.push(`/worker/${tabId}`);
  };

  const [profile, setProfile] = useState<ProfessionalProfile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [earnings, setEarnings] = useState<MyEarnings | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit states for Profile Tab
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [editedBio, setEditedBio] = useState("");
  const [editedRate, setEditedRate] = useState("");
  const [editedExperience, setEditedExperience] = useState("");
  const [editedWilaya, setEditedWilaya] = useState(DEFAULT_WILAYA);
  const [editedCommune, setEditedCommune] = useState("");
  const [editedAddress, setEditedAddress] = useState("");
  const [newTimeSlot, setNewTimeSlot] = useState("");

  // Direct-mode order actions
  const [quoteInputs, setQuoteInputs] = useState<Record<string, { price: string; time: string }>>({});

  // Profile picture + portfolio post states
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [newPostFile, setNewPostFile] = useState<File | null>(null);
  const [newPostPreview, setNewPostPreview] = useState<string | null>(null);
  const [newPostCaption, setNewPostCaption] = useState("");
  const [publishingPost, setPublishingPost] = useState(false);

  // Chat state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [sending, setSending] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // JSON viewer states
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const effectiveModes = profile?.effectiveModes;
  const isDirectMode = effectiveModes?.mediationMode === "DIRECT";

  // Fetch full professional dataset (identified by the logged-in account's userId)
  const fetchWorkerData = async () => {
    if (!token || !user) return;
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };
      const resMe = await fetch(`${API_URL}/api/professionals/me`, { headers });

      if (resMe.ok) {
        const me: ProfessionalProfile = await resMe.json();
        setProfile(me);
        setEditedBio(me.bio);
        setEditedRate(me.rate);
        setEditedExperience(me.experience);
        setEditedWilaya(me.wilaya || DEFAULT_WILAYA);
        setEditedCommune(me.commune || "");
        setEditedAddress(me.address || "");

        const [resBookings, resReviews, resEarnings, resConvs] = await Promise.all([
          fetch(`${API_URL}/api/bookings/worker/${me.id}`, { headers }),
          fetch(`${API_URL}/api/reviews/worker/${me.id}`, { headers }),
          fetch(`${API_URL}/api/earnings/me`, { headers }),
          fetch(`${API_URL}/api/chat/conversations`, { headers }),
        ]);
        if (resBookings.ok) setBookings(await resBookings.json());
        if (resReviews.ok) setReviews(await resReviews.json());
        if (resEarnings.ok) setEarnings(await resEarnings.json());
        if (resConvs.ok) setConversations(await resConvs.json());
      } else {
        setProfile(null);
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

  // ── Direct-mode order actions ──
  const bookingAction = async (bookingId: string, action: "accept" | "decline") => {
    try {
      const res = await fetch(`${API_URL}/api/bookings/${bookingId}/${action}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchWorkerData();
    } catch (err) {
      console.error(err);
    }
  };

  const sendQuote = async (bookingId: string) => {
    const input = quoteInputs[bookingId];
    if (!input?.price) return;
    try {
      const res = await fetch(`${API_URL}/api/bookings/${bookingId}/quote`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ workerQuote: parseInt(input.price), bookingTime: input.time || undefined }),
      });
      if (res.ok) fetchWorkerData();
    } catch (err) {
      console.error(err);
    }
  };

  const moveBookingStatus = async (bookingId: string, status: string) => {
    try {
      const url = status === "completed"
        ? `${API_URL}/api/bookings/${bookingId}/complete`
        : `${API_URL}/api/bookings/${bookingId}/status`;
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(status === "completed" ? {} : { status }),
      });
      if (res.ok) fetchWorkerData();
    } catch (err) {
      console.error(err);
    }
  };

  // ── Profile picture ──
  const handleAvatarUpload = async (file: File) => {
    if (!profile) return;
    setUploadingAvatar(true);
    try {
      const form = new FormData();
      form.append("image", file);
      const res = await fetch(`${API_URL}/api/professionals/${profile.id}/profile-image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (res.ok) {
        const updated = await res.json();
        setProfile(prev => (prev ? { ...prev, profileImage: updated.profileImage } : prev));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingAvatar(false);
    }
  };

  // ── Portfolio posts ──
  const handlePublishPost = async () => {
    if (!profile || !newPostFile || publishingPost) return;
    setPublishingPost(true);
    try {
      const form = new FormData();
      form.append("images", newPostFile);
      if (newPostCaption.trim()) form.append("caption", newPostCaption.trim());
      const res = await fetch(`${API_URL}/api/professionals/${profile.id}/portfolio`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (res.ok) {
        const updated = await res.json();
        setProfile(prev => (prev ? { ...prev, portfolioPosts: updated.portfolioPosts } : prev));
        setNewPostFile(null);
        setNewPostPreview(null);
        setNewPostCaption("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPublishingPost(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!profile) return;
    try {
      const res = await fetch(`${API_URL}/api/professionals/${profile.id}/portfolio/${postId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setProfile(prev => prev
          ? { ...prev, portfolioPosts: (prev.portfolioPosts || []).filter(p => p.id !== postId) }
          : prev);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ── Chat ──
  const openConversation = async (c: Conversation) => {
    setSelectedConv(c);
    try {
      const res = await fetch(`${API_URL}/api/chat/conversations/${c.id}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setMessages(await res.json());
      const socket = getSocket();
      socket.emit("join_conversation", c.id);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!token) return;
    const socket = getSocket();
    const onNewMessage = (msg: ChatMessage) => {
      setMessages(prev =>
        selectedConv && msg.conversationId === selectedConv.id && !prev.some(m => m.id === msg.id)
          ? [...prev, msg]
          : prev
      );
    };
    socket.on("new_message", onNewMessage);
    return () => {
      socket.off("new_message", onNewMessage);
    };
  }, [token, selectedConv]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendChatMessage = async () => {
    if (!selectedConv || !chatInput.trim() || sending) return;
    setSending(true);
    const text = chatInput.trim();
    try {
      // REST send (also broadcasts over the socket server-side)
      const res = await fetch(`${API_URL}/api/chat/conversations/${selectedConv.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages(prev => (prev.some(m => m.id === msg.id) ? prev : [...prev, msg]));
        setChatInput("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const updateStatus = async (newStatus: "online" | "busy" | "offline") => {
    if (!profile) return;
    try {
      const res = await fetch(`${API_URL}/api/professionals/${profile.id}/status`, {
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
      const res = await fetch(`${API_URL}/api/professionals/${profile.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          bio: editedBio,
          rate: editedRate,
          experience: editedExperience,
          wilaya: editedWilaya,
          commune: editedCommune || null,
          address: editedAddress || null
        })
      });
      if (res.ok) {
        const updated = await res.json();
        setProfile(prev => ({ ...updated, effectiveModes: prev?.effectiveModes }));
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
      const res = await fetch(`${API_URL}/api/professionals/${profile.id}/available-times`, {
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
      const res = await fetch(`${API_URL}/api/professionals/${profile.id}/available-times`, {
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

  // Helper stats — real numbers from /api/earnings/me (respects the worker's payment model)
  const completedJobs = bookings.filter(b => b.status === "completed");
  const activeJobs = bookings.filter(b => !["completed", "cancelled", "declined", "pending_review"].includes(b.status));
  const incomingOrders = bookings.filter(b => b.status === "awaiting_worker");
  const totalEarnings = earnings?.gross ?? completedJobs.reduce((sum, b) => sum + (b.finalPrice ?? b.workerQuote ?? 0), 0);
  const workerPayout = earnings?.netEarnings ?? totalEarnings;
  const totalUnread = conversations.reduce((s, c) => s + (c.unread || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Professional Space...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-8">
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl max-w-md w-full text-center space-y-6">
          <XCircle className="mx-auto text-rose-500" size={48} />
          <h2 className="text-xl font-black uppercase text-slate-800">Professional Record Missing</h2>
          <p className="text-xs text-slate-400 font-medium leading-relaxed">
            Your user account doesn&apos;t have a linked professional provider record. Please contact the administrator.
          </p>
          <button
            onClick={logout}
            className="w-full py-4 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-2xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
          >
            Disconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row">
      
      {/* ── SIDEBAR (matching admin style) ── */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-100 p-6 h-screen sticky top-0 shrink-0 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {/* Brand Header */}
        <div className="flex items-center gap-4 mb-8 group cursor-pointer">
          <div className="p-3 rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-500/20 text-white font-black text-xl italic flex items-center justify-center group-hover:rotate-6 transition-transform">
            R
          </div>
          <div>
            <span className="text-xl font-black tracking-tighter uppercase text-indigo-600 block leading-none">RAFIK</span>
            <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-slate-400 block">Pro Console</span>
          </div>
        </div>

        {/* Worker Profile Card */}
        <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl mb-6">
          {profile.profileImage ? (
            <img
              src={profile.profileImage.startsWith("/uploads") ? `${API_URL}${profile.profileImage}` : profile.profileImage}
              alt={profile.name}
              className="w-10 h-10 rounded-xl object-cover border border-indigo-100"
            />
          ) : (
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 font-black rounded-xl flex items-center justify-center text-sm uppercase border border-indigo-100">
              {profile.name.split(" ").map(n => n[0]).join("")}
            </div>
          )}
          <div className="truncate">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">{profile.name}</h4>
            <span className="text-[9px] font-bold text-slate-400 uppercase">{profile.category}</span>
          </div>
        </div>

        {/* Mode badge — how this worker's orders are handled */}
        <div className={`mb-6 p-3 rounded-2xl border text-left ${
          isDirectMode ? "bg-cyan-50 border-cyan-100" : "bg-indigo-50 border-indigo-100"
        }`}>
          <span className={`text-[8px] font-black uppercase tracking-widest block mb-0.5 ${
            isDirectMode ? "text-cyan-600" : "text-indigo-500"
          }`}>
            {isDirectMode ? "⚡ Direct Mode" : "🛡 Mediated Mode"}
          </span>
          <p className="text-[9px] font-bold text-slate-500 font-inter leading-snug">
            {isDirectMode
              ? "You talk to clients directly: accept orders, send quotes, and chat."
              : "The admin handles client contact and relays quotes for you."}
          </p>
        </div>

        {/* Status Switches */}
        <div className="mb-6 space-y-2">
          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Duty Status</label>
          <div className="grid grid-cols-3 gap-1 bg-slate-50 p-1 rounded-2xl border border-slate-100">
            {(["online", "busy", "offline"] as const).map(st => (
              <button
                key={st}
                onClick={() => updateStatus(st)}
                className={`text-[9px] py-2 rounded-xl font-black uppercase tracking-wider transition-all cursor-pointer ${
                  profile.status === st
                    ? st === "online" ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/20" : st === "busy" ? "bg-amber-500 text-white shadow-sm shadow-amber-500/20" : "bg-slate-700 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 pl-4">Management</p>
          {[
            { id: "dashboard", label: "Overview", icon: BarChart3 },
            { id: "bookings", label: `Bookings (${activeJobs.length})`, icon: CalendarCheck },
            ...(isDirectMode || conversations.length > 0
              ? [{ id: "chat", label: totalUnread > 0 ? `Chat (${totalUnread})` : "Chat", icon: MessageSquare }]
              : []),
            { id: "profile", label: "Edit Profile", icon: Edit2 },
            { id: "reviews", label: "My Reviews", icon: Star },
            { id: "earnings", label: "My Earnings", icon: DollarSign }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 relative group overflow-hidden text-left ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-xl shadow-indigo-500/20"
                    : "text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                }`}
              >
                <Icon
                  size={20}
                  className={`transition-transform duration-300 group-hover:scale-110 ${
                    isActive ? "text-white" : "text-slate-400 group-hover:text-indigo-600"
                  }`}
                />
                <span className="text-sm font-bold uppercase tracking-wider">{tab.label}</span>
                {isActive && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-white rounded-l-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom: Logout */}
        <div className="pt-6 border-t border-slate-100 mt-auto">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-3 py-4 bg-rose-50 text-rose-600 rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-rose-100 active:scale-[0.98] transition-all cursor-pointer"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile header for small screens */}
      <div className="lg:hidden bg-white border-b border-slate-100 p-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-sm italic">R</div>
          <span className="text-sm font-black tracking-tighter uppercase text-indigo-600">RAFIK</span>
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {[
            { id: "dashboard", icon: BarChart3 },
            { id: "bookings", icon: CalendarCheck },
            ...(isDirectMode || conversations.length > 0 ? [{ id: "chat", icon: MessageSquare }] : []),
            { id: "profile", icon: Edit2 },
            { id: "reviews", icon: Star },
            { id: "earnings", icon: DollarSign }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                  isActive ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "text-slate-400 hover:bg-slate-50"
                }`}
              >
                <Icon size={16} />
              </button>
            );
          })}
          <button onClick={logout} className="p-2.5 rounded-xl text-rose-400 hover:bg-rose-50 cursor-pointer">
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* ── MAIN WORKSPACE CONTENT ── */}
      <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-8 text-left">
          
          {/* Header Dashboard section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">
                {activeTab === "dashboard" && "Overview"}
                {activeTab === "bookings" && "Active Bookings"}
                {activeTab === "chat" && "Client Chat"}
                {activeTab === "profile" && "Profile Setup"}
                {activeTab === "reviews" && "Review Log"}
                {activeTab === "earnings" && "My Finances"}
              </h1>
              <p className="text-xs text-slate-400 font-bold font-inter">
                {activeTab === "dashboard" && "Quick summary of pending jobs, notifications, and client comments."}
                {activeTab === "bookings" && (isDirectMode
                  ? "Accept or decline new orders, send your quotes, and drive jobs to completion."
                  : "Follow the jobs the admin assigns you — the admin relays quotes to clients.")}
                {activeTab === "chat" && "Talk directly with your clients about their orders."}
                {activeTab === "profile" && "Define your hourly rate, service location, availability slots, and portfolio."}
                {activeTab === "reviews" && "See how clients rated your technical execution and punctuality."}
                {activeTab === "earnings" && "Detailed ledger of completed work under your payment model."}
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
              {/* New incoming orders alert (direct mode) */}
              {incomingOrders.length > 0 && (
                <button
                  onClick={() => setActiveTab("bookings")}
                  className="w-full bg-cyan-600 text-white p-5 rounded-[2rem] flex items-center justify-between shadow-lg shadow-cyan-600/20 hover:bg-cyan-700 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3 text-left">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                    </span>
                    <span className="text-xs font-black uppercase tracking-widest">
                      {incomingOrders.length} new order{incomingOrders.length > 1 ? "s" : ""} waiting for your response!
                    </span>
                  </div>
                  <ChevronRight size={18} />
                </button>
              )}

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
                              <span>
                                {b.clientAddress}
                                {(b.clientCommune || b.clientWilaya) && (
                                  <span className="ml-1.5 text-cyan-700 font-black">· {[b.clientCommune, b.clientWilaya].filter(Boolean).join(", ")}</span>
                                )}
                              </span>
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
                                  src={photo.startsWith("/uploads") ? `${API_URL}${photo}` : photo}
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

                        {/* DIRECT-MODE ACTIONS: the worker drives this order themselves */}
                        {b.mediationModeSnapshot === "DIRECT" && (
                          <div className="space-y-3">
                            {b.status === "awaiting_worker" && (
                              <div className="grid grid-cols-2 gap-3">
                                <button
                                  onClick={() => bookingAction(b.id, "accept")}
                                  className="py-3.5 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-emerald-600 active:scale-[0.98] transition-all cursor-pointer"
                                >
                                  <ThumbsUp size={13} /> Accept Order
                                </button>
                                <button
                                  onClick={() => bookingAction(b.id, "decline")}
                                  className="py-3.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-rose-100 active:scale-[0.98] transition-all cursor-pointer"
                                >
                                  <ThumbsDown size={13} /> Decline
                                </button>
                              </div>
                            )}

                            {(b.status === "accepted" || b.status === "quote_rejected") && (
                              <div className="bg-cyan-50/50 border border-cyan-100 p-4 rounded-2xl space-y-3">
                                <span className="text-[9px] font-black text-cyan-700 uppercase tracking-widest">
                                  {b.status === "quote_rejected" ? "Client rejected — send a new quote" : "Send your quote to the client"}
                                </span>
                                <div className="grid grid-cols-2 gap-2">
                                  <input
                                    type="number"
                                    placeholder="Price DZD"
                                    value={quoteInputs[b.id]?.price || ""}
                                    onChange={(e) => setQuoteInputs(prev => ({ ...prev, [b.id]: { price: e.target.value, time: prev[b.id]?.time || "" } }))}
                                    className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black outline-none"
                                  />
                                  <select
                                    value={quoteInputs[b.id]?.time || ""}
                                    onChange={(e) => setQuoteInputs(prev => ({ ...prev, [b.id]: { price: prev[b.id]?.price || "", time: e.target.value } }))}
                                    className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black outline-none"
                                  >
                                    <option value="">Time slot…</option>
                                    {profile.availableTimes.map(t => <option key={t} value={t}>{t}</option>)}
                                  </select>
                                </div>
                                <button
                                  onClick={() => sendQuote(b.id)}
                                  disabled={!quoteInputs[b.id]?.price}
                                  className="w-full py-3 bg-cyan-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-cyan-700 transition-all cursor-pointer disabled:opacity-40"
                                >
                                  Send Quote to Client
                                </button>
                              </div>
                            )}

                            {b.status === "quote_sent" && (
                              <div className="grid grid-cols-2 gap-3">
                                <button
                                  onClick={() => moveBookingStatus(b.id, "quote_approved")}
                                  className="py-3 bg-emerald-500 text-white rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-emerald-600 transition-all cursor-pointer"
                                >
                                  Client Approved
                                </button>
                                <button
                                  onClick={() => moveBookingStatus(b.id, "quote_rejected")}
                                  className="py-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-rose-100 transition-all cursor-pointer"
                                >
                                  Client Rejected
                                </button>
                              </div>
                            )}

                            {b.status === "quote_approved" && (
                              <button
                                onClick={() => moveBookingStatus(b.id, "in_progress")}
                                className="w-full py-3.5 bg-orange-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-orange-600 transition-all cursor-pointer"
                              >
                                Start the Job
                              </button>
                            )}

                            {b.status === "in_progress" && (
                              <button
                                onClick={() => moveBookingStatus(b.id, "completed")}
                                className="w-full py-3.5 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all cursor-pointer"
                              >
                                <CheckCircle2 size={14} /> Mark as Completed
                              </button>
                            )}

                            {b.conversation && !["completed", "cancelled", "declined"].includes(b.status) && (
                              <button
                                onClick={() => setActiveTab("chat")}
                                className="w-full py-3 bg-white border border-cyan-200 text-cyan-700 rounded-2xl font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-2 hover:bg-cyan-50 transition-all cursor-pointer"
                              >
                                <MessageSquare size={13} /> Chat with {b.clientName.split(" ")[0]}
                              </button>
                            )}
                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB: DIRECT CHAT WITH CLIENTS */}
          {activeTab === "chat" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[60vh] animate-fadeIn">
              {/* Conversation list */}
              <div className="bg-white border border-slate-100 rounded-[2rem] p-4 shadow-sm overflow-y-auto max-h-[70vh] space-y-2">
                {conversations.length === 0 ? (
                  <div className="text-center py-12 px-4 space-y-2">
                    <MessageSquare className="mx-auto text-slate-200" size={32} />
                    <p className="text-xs font-bold text-slate-400 font-inter">
                      No conversations yet. A chat opens automatically for every direct-mode order you receive.
                    </p>
                  </div>
                ) : (
                  conversations.map(c => (
                    <button
                      key={c.id}
                      onClick={() => openConversation(c)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                        selectedConv?.id === c.id
                          ? "border-indigo-500 bg-indigo-50/50"
                          : "border-slate-100 hover:border-slate-200 hover:bg-slate-50/50"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-black text-indigo-600 font-mono">{c.booking.id}</span>
                        {c.unread > 0 && (
                          <span className="bg-indigo-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full">{c.unread}</span>
                        )}
                      </div>
                      <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{c.booking.clientName}</p>
                      <p className="text-[10px] font-bold text-slate-400 font-inter truncate mt-1">
                        {c.lastMessage ? c.lastMessage.text : "Say salam to your client 👋"}
                      </p>
                    </button>
                  ))
                )}
              </div>

              {/* Thread */}
              <div className="lg:col-span-2 bg-white border border-slate-100 rounded-[2rem] shadow-sm flex flex-col max-h-[70vh]">
                {!selectedConv ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-3">
                    <MessageSquare className="text-slate-200" size={40} />
                    <p className="text-sm font-black text-slate-400 uppercase tracking-tight">Select a client conversation</p>
                  </div>
                ) : (
                  <>
                    <div className="p-5 border-b border-slate-100 flex justify-between items-center shrink-0">
                      <div>
                        <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{selectedConv.booking.clientName}</p>
                        <p className="text-[10px] font-bold text-slate-400 font-inter">
                          {selectedConv.booking.serviceCategory} · {selectedConv.booking.id}
                        </p>
                      </div>
                      <a
                        href={`tel:${selectedConv.booking.clientPhone}`}
                        className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-xl"
                      >
                        <Phone size={12} /> Call
                      </a>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-slate-50/40">
                      {messages.length === 0 ? (
                        <p className="text-center text-xs font-bold text-slate-400 font-inter py-12">No messages yet — start the conversation.</p>
                      ) : (
                        messages.map(m => (
                          <div key={m.id} className={`flex ${m.senderRole === "WORKER" ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                              m.senderRole === "WORKER"
                                ? "bg-indigo-600 text-white rounded-br-md"
                                : "bg-white border border-slate-100 text-slate-700 rounded-bl-md"
                            }`}>
                              <p className="text-xs font-medium font-inter leading-relaxed">{m.text}</p>
                              <p className={`text-[8px] font-bold mt-1 ${m.senderRole === "WORKER" ? "text-white/50" : "text-slate-300"}`}>
                                {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                      <div ref={chatBottomRef} />
                    </div>

                    <div className="p-4 border-t border-slate-100 shrink-0 flex gap-2">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendChatMessage()}
                        placeholder="Write a message…"
                        className="flex-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-semibold outline-none focus:bg-white focus:border-indigo-200 transition-colors"
                      />
                      <button
                        onClick={sendChatMessage}
                        disabled={sending || !chatInput.trim()}
                        className="px-5 py-3 bg-indigo-600 text-white rounded-2xl flex items-center justify-center hover:bg-indigo-700 transition-all cursor-pointer disabled:opacity-40"
                      >
                        {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                      </button>
                    </div>
                  </>
                )}
              </div>
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

                {/* Profile picture */}
                <div className="flex items-center gap-5 bg-slate-50 p-5 rounded-3xl border border-slate-100">
                  <div className="relative">
                    {profile.profileImage ? (
                      <img
                        src={profile.profileImage.startsWith("/uploads") ? `${API_URL}${profile.profileImage}` : profile.profileImage}
                        alt={profile.name}
                        className="w-20 h-20 rounded-3xl object-cover border-2 border-white shadow-md"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-indigo-100 text-indigo-600 font-black rounded-3xl flex items-center justify-center text-2xl uppercase border-2 border-white shadow-md">
                        {profile.name.split(" ").map(n => n[0]).join("")}
                      </div>
                    )}
                    <button
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="absolute -bottom-1.5 -right-1.5 w-8 h-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center justify-center shadow-lg cursor-pointer transition-all disabled:opacity-60"
                      title="Change profile picture"
                    >
                      {uploadingAvatar ? <Loader2 size={13} className="animate-spin" /> : <Edit2 size={13} />}
                    </button>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleAvatarUpload(f);
                        e.target.value = "";
                      }}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{profile.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 font-inter">
                      Your photo is shown to clients and to the admin — use a clear, professional picture.
                    </p>
                  </div>
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

                  {/* Service location */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Wilaya</label>
                      <select
                        disabled={!isEditingBio}
                        value={editedWilaya}
                        onChange={(e) => { setEditedWilaya(e.target.value); setEditedCommune(""); }}
                        className="w-full px-5 py-4 bg-slate-50 focus:bg-white border border-transparent focus:border-blue-500/20 rounded-2xl outline-none font-semibold text-xs text-slate-700 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {Object.keys(WILAYAS).map(w => <option key={w} value={w}>{w}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Commune (Where You Work)</label>
                      <select
                        disabled={!isEditingBio}
                        value={editedCommune}
                        onChange={(e) => setEditedCommune(e.target.value)}
                        className="w-full px-5 py-4 bg-slate-50 focus:bg-white border border-transparent focus:border-blue-500/20 rounded-2xl outline-none font-semibold text-xs text-slate-700 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <option value="">— Select —</option>
                        {(WILAYAS[editedWilaya] || []).map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Street / Neighborhood</label>
                    <input
                      type="text"
                      disabled={!isEditingBio}
                      placeholder="e.g. Cité El Hidhab"
                      value={editedAddress}
                      onChange={(e) => setEditedAddress(e.target.value)}
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

                {/* Portfolio — publish your work like posts */}
                <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 lg:p-8 shadow-sm space-y-5">
                  <div className="border-b border-slate-50 pb-3">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">My Work Posts</h3>
                    <p className="text-[10px] font-bold text-slate-400 font-inter mt-1">
                      Show your best jobs — clients see these when choosing a professional.
                    </p>
                  </div>

                  {/* New post composer */}
                  <div className="bg-slate-50 border border-slate-100 rounded-3xl p-4 space-y-3">
                    {newPostPreview ? (
                      <div className="relative">
                        <img src={newPostPreview} alt="New post" className="w-full h-36 object-cover rounded-2xl border border-slate-200" />
                        <button
                          onClick={() => { setNewPostFile(null); setNewPostPreview(null); }}
                          className="absolute top-2 right-2 w-7 h-7 bg-slate-900/70 text-white rounded-lg flex items-center justify-center cursor-pointer hover:bg-slate-900"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <label className="w-full h-24 border-2 border-dashed border-slate-200 hover:border-indigo-300 rounded-2xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors">
                        <Sparkles size={18} className="text-slate-300" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Add a photo of your work</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) {
                              setNewPostFile(f);
                              setNewPostPreview(URL.createObjectURL(f));
                            }
                            e.target.value = "";
                          }}
                        />
                      </label>
                    )}
                    <input
                      type="text"
                      value={newPostCaption}
                      onChange={(e) => setNewPostCaption(e.target.value)}
                      placeholder="Describe this job… (e.g. Kitchen rewiring in Sétif)"
                      className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl text-xs font-semibold outline-none focus:border-indigo-200 transition-colors"
                    />
                    <button
                      onClick={handlePublishPost}
                      disabled={!newPostFile || publishingPost}
                      className="w-full py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2"
                    >
                      {publishingPost ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                      Publish Post
                    </button>
                  </div>

                  {/* Posts list */}
                  {(profile.portfolioPosts?.length ?? 0) === 0 ? (
                    <p className="text-[10px] text-slate-400 font-bold font-inter text-center py-4">
                      No posts yet — publish your first job photo above.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {profile.portfolioPosts!.map((post) => (
                        <div key={post.id} className="border border-slate-100 rounded-3xl overflow-hidden group">
                          <div className="relative">
                            <img
                              src={post.image.startsWith("/uploads") ? `${API_URL}${post.image}` : post.image}
                              alt={post.caption || "Work post"}
                              className="w-full h-40 object-cover"
                            />
                            <button
                              onClick={() => { if (confirm("Delete this post?")) handleDeletePost(post.id); }}
                              className="absolute top-2 right-2 w-8 h-8 bg-slate-900/60 hover:bg-rose-600 text-white rounded-xl flex items-center justify-center cursor-pointer transition-colors opacity-0 group-hover:opacity-100"
                              title="Delete post"
                            >
                              <X size={14} />
                            </button>
                          </div>
                          <div className="p-4">
                            <p className="text-xs font-bold text-slate-700 font-inter">{post.caption || "—"}</p>
                            <p className="text-[9px] font-bold text-slate-400 font-inter mt-1">
                              {new Date(post.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
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

          {/* TAB 5: MY EARNINGS PAGE — respects the worker's payment model */}
          {activeTab === "earnings" && (
            <div className="space-y-8 animate-fadeIn">

              {/* Payment model banner */}
              <div className={`p-5 rounded-[2rem] border flex items-center gap-4 ${
                earnings?.commissionMode === "SUBSCRIPTION"
                  ? "bg-violet-50 border-violet-100"
                  : "bg-indigo-50 border-indigo-100"
              }`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white ${
                  earnings?.commissionMode === "SUBSCRIPTION" ? "bg-violet-600" : "bg-indigo-600"
                }`}>
                  <DollarSign size={20} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-tight text-slate-800">
                    {earnings?.commissionMode === "SUBSCRIPTION"
                      ? `Subscription plan — ${earnings?.subscriptionFee?.toLocaleString()} DZD / month`
                      : `Percentage plan — the platform takes ${earnings?.commissionPercent ?? 15}% per completed job`}
                  </p>
                  <p className="text-[10px] font-bold text-slate-500 font-inter">
                    {earnings?.commissionMode === "SUBSCRIPTION"
                      ? "You keep 100% of every job. Pay your monthly fee to the platform."
                      : "Your share is paid out after the platform commission is deducted."}
                  </p>
                </div>
              </div>

              {/* Financial KPI stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Gross Billings</span>
                  <span className="text-2xl font-black text-slate-800 tracking-tight block mt-2">{(earnings?.gross ?? 0).toLocaleString()} DZD</span>
                  <p className="text-[10px] text-slate-400 font-bold font-inter mt-1">{earnings?.completedJobs ?? 0} completed jobs</p>
                </div>

                <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">My Earnings</span>
                  <span className="text-2xl font-black text-emerald-600 tracking-tight block mt-2">{(earnings?.netEarnings ?? 0).toLocaleString()} DZD</span>
                  <p className="text-[10px] text-slate-400 font-bold font-inter mt-1">
                    {earnings?.commissionMode === "SUBSCRIPTION" ? "100% of job money" : "After platform commission"}
                  </p>
                </div>

                <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    {earnings?.commissionMode === "SUBSCRIPTION" ? "Subscription Paid" : "Platform Commission"}
                  </span>
                  <span className="text-2xl font-black text-slate-400 tracking-tight block mt-2">
                    {earnings?.commissionMode === "SUBSCRIPTION"
                      ? `${earnings.subscriptionPayments.reduce((s, p) => s + p.amount, 0).toLocaleString()} DZD`
                      : `${(earnings?.platformCut ?? 0).toLocaleString()} DZD`}
                  </span>
                </div>
              </div>

              {/* Earnings Table */}
              <div className="bg-white border border-slate-100 rounded-[2rem] p-6 lg:p-8 shadow-sm">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-6">Payment Ledger History</h3>

                {(earnings?.jobs?.length ?? 0) === 0 ? (
                  <div className="text-center text-slate-400 font-bold font-inter py-8 border border-dashed border-slate-100 rounded-xl text-xs">
                    No completed jobs available to generate ledger records.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          <th className="py-4">Job ID</th>
                          <th className="py-4">Date</th>
                          <th className="py-4">Customer</th>
                          <th className="py-4 text-right">Job Price</th>
                          <th className="py-4 text-right">Platform Cut</th>
                          <th className="py-4 text-right">My Share</th>
                        </tr>
                      </thead>
                      <tbody>
                        {earnings!.jobs.map((j) => (
                          <tr key={j.bookingId} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors text-xs font-semibold text-slate-700">
                            <td className="py-4 font-bold">{j.bookingId}</td>
                            <td className="py-4 text-slate-500">{j.date}</td>
                            <td className="py-4 uppercase text-[10px] text-slate-500">{j.client}</td>
                            <td className="py-4 text-right text-slate-800 font-black">{j.price.toLocaleString()} DZD</td>
                            <td className="py-4 text-right font-black text-rose-400">
                              {j.platformCut > 0 ? `-${j.platformCut.toLocaleString()} DZD` : "—"}
                            </td>
                            <td className="py-4 text-right text-emerald-600 font-black">{j.net.toLocaleString()} DZD</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Subscription payment history */}
              {earnings?.commissionMode === "SUBSCRIPTION" && (
                <div className="bg-white border border-slate-100 rounded-[2rem] p-6 lg:p-8 shadow-sm">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-6">My Subscription Payments</h3>
                  {earnings.subscriptionPayments.length === 0 ? (
                    <div className="text-center text-slate-400 font-bold font-inter py-8 border border-dashed border-slate-100 rounded-xl text-xs">
                      No subscription payments recorded yet — contact the admin to register your payment.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {earnings.subscriptionPayments.map(p => (
                        <div key={p.id} className="flex justify-between items-center border border-slate-100 p-4 rounded-2xl">
                          <div>
                            <p className="text-xs font-black text-slate-800">{p.amount.toLocaleString()} DZD</p>
                            <p className="text-[10px] font-bold text-slate-400 font-inter">
                              {new Date(p.periodStart).toLocaleDateString()} → {new Date(p.periodEnd).toLocaleDateString()}
                              {p.note ? ` · ${p.note}` : ""}
                            </p>
                          </div>
                          <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl">Paid</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

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
