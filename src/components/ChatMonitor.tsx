"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { API_URL } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { MessageSquare, Eye, Loader2, User, Wrench, RefreshCw } from "lucide-react";

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
    worker: { name: string };
  };
  lastMessage: ChatMessage | null;
  unread: number;
}

export default function ChatMonitor() {
  const { token } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/chat/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setConversations(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchConversations();
  }, [token, fetchConversations]);

  // Live updates: admins receive every new_message via the "admins" room
  useEffect(() => {
    if (!token) return;
    const socket = getSocket();
    const onNewMessage = (msg: ChatMessage) => {
      setMessages(prev =>
        selected && msg.conversationId === selected.id && !prev.some(m => m.id === msg.id)
          ? [...prev, msg]
          : prev
      );
      fetchConversations();
    };
    socket.on("new_message", onNewMessage);
    return () => {
      socket.off("new_message", onNewMessage);
    };
  }, [token, selected, fetchConversations]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const openConversation = async (c: Conversation) => {
    setSelected(c);
    setLoadingMessages(true);
    try {
      const res = await fetch(`${API_URL}/api/chat/conversations/${c.id}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setMessages(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMessages(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto animate-fadeIn pb-16 space-y-6 text-left">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tighter text-slate-800 uppercase">Chats</h1>
          <p className="text-sm text-slate-400 font-medium font-inter">
            Direct-mode conversations between workers and clients — you are a read-only observer
          </p>
        </div>
        <button
          onClick={fetchConversations}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase text-slate-600 hover:bg-slate-50 transition-all cursor-pointer flex items-center gap-2"
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[60vh]">
        {/* Conversation list */}
        <div className="bg-white border border-slate-100 rounded-[2rem] p-4 shadow-sm overflow-y-auto max-h-[70vh] space-y-2">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-slate-300" size={24} /></div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-2">
              <MessageSquare className="mx-auto text-slate-200" size={32} />
              <p className="text-xs font-bold text-slate-400 font-inter">
                No conversations yet. Chats open automatically when a booking is created for a worker in direct mode.
              </p>
            </div>
          ) : (
            conversations.map(c => (
              <button
                key={c.id}
                onClick={() => openConversation(c)}
                className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                  selected?.id === c.id
                    ? "border-primary bg-primary/5"
                    : "border-slate-100 hover:border-slate-200 hover:bg-slate-50/50"
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-black text-primary font-mono">{c.booking.id}</span>
                  {c.unread > 0 && (
                    <span className="bg-primary text-white text-[9px] font-black px-2 py-0.5 rounded-full">{c.unread}</span>
                  )}
                </div>
                <p className="text-xs font-black text-slate-800 uppercase tracking-tight">
                  {c.booking.clientName} ↔ {c.booking.worker.name}
                </p>
                <p className="text-[10px] font-bold text-slate-400 font-inter truncate mt-1">
                  {c.lastMessage ? c.lastMessage.text : "No messages yet"}
                </p>
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{c.booking.serviceCategory} · {c.booking.status.replace(/_/g, " ")}</span>
              </button>
            ))
          )}
        </div>

        {/* Thread */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-[2rem] shadow-sm flex flex-col max-h-[70vh]">
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-3">
              <Eye className="text-slate-200" size={40} />
              <p className="text-sm font-black text-slate-400 uppercase tracking-tight">Select a conversation to observe</p>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div className="p-5 border-b border-slate-100 flex justify-between items-center shrink-0">
                <div>
                  <p className="text-xs font-black text-slate-800 uppercase tracking-tight">
                    {selected.booking.clientName} ↔ {selected.booking.worker.name}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 font-inter">
                    {selected.booking.serviceCategory} · Booking {selected.booking.id}
                  </p>
                </div>
                <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-cyan-700 bg-cyan-50 border border-cyan-100 px-3 py-1.5 rounded-xl">
                  <Eye size={12} /> Observer Mode
                </span>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-slate-50/40">
                {loadingMessages ? (
                  <div className="flex justify-center py-12"><Loader2 className="animate-spin text-slate-300" size={24} /></div>
                ) : messages.length === 0 ? (
                  <p className="text-center text-xs font-bold text-slate-400 font-inter py-12">No messages exchanged yet.</p>
                ) : (
                  messages.map(m => (
                    <div key={m.id} className={`flex ${m.senderRole === "WORKER" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                        m.senderRole === "WORKER"
                          ? "bg-primary text-white rounded-br-md"
                          : "bg-white border border-slate-100 text-slate-700 rounded-bl-md"
                      }`}>
                        <div className={`flex items-center gap-1.5 mb-1 text-[9px] font-black uppercase tracking-widest ${
                          m.senderRole === "WORKER" ? "text-white/70" : "text-slate-400"
                        }`}>
                          {m.senderRole === "WORKER" ? <Wrench size={10} /> : <User size={10} />}
                          {m.senderRole === "WORKER" ? selected.booking.worker.name : selected.booking.clientName}
                        </div>
                        <p className="text-xs font-medium font-inter leading-relaxed">{m.text}</p>
                        <p className={`text-[8px] font-bold mt-1 ${m.senderRole === "WORKER" ? "text-white/50" : "text-slate-300"}`}>
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={bottomRef} />
              </div>

              {/* Observer notice instead of an input */}
              <div className="p-4 border-t border-slate-100 shrink-0">
                <div className="w-full py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-center text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center justify-center gap-2">
                  <Eye size={13} /> Direct mode — you are observing, only the worker and client can write
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
