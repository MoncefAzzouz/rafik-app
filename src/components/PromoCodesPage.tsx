"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { API_URL } from "@/lib/api";
import {
  Ticket, Plus, X, Check, Trash2, Loader2, RefreshCw, Percent, Calendar,
  Users, Power, Edit2, Car, Utensils, Wrench, Globe, Truck,
} from "lucide-react";

type PromoScope = "TAXI" | "FOOD" | "SERVICES" | "TRUCK" | "ALL";
type DiscountType = "PERCENTAGE" | "FIXED";
type PromoStatus = "active" | "inactive" | "scheduled" | "expired" | "used_up";

interface PromoCode {
  id: string;
  code: string;
  description?: string | null;
  scope: PromoScope;
  discountType: DiscountType;
  discountValue: number;
  maxDiscount?: number | null;
  minOrderAmount?: number | null;
  maxUses?: number | null;
  maxUsesPerUser: number;
  usedCount: number;
  startsAt?: string | null;
  expiresAt?: string | null;
  isActive: boolean;
  status: PromoStatus;
  redemptionCount: number;
  createdAt: string;
}

const SCOPE_META: Record<PromoScope, { label: string; icon: React.ComponentType<{ size?: number; className?: string }>; cls: string }> = {
  ALL: { label: "All services", icon: Globe, cls: "bg-slate-100 text-slate-600" },
  TAXI: { label: "Taxi", icon: Car, cls: "bg-amber-50 text-amber-700" },
  FOOD: { label: "Food", icon: Utensils, cls: "bg-orange-50 text-orange-700" },
  SERVICES: { label: "Services", icon: Wrench, cls: "bg-indigo-50 text-indigo-700" },
  TRUCK: { label: "Truck", icon: Truck, cls: "bg-teal-50 text-teal-700" },
};

const STATUS_META: Record<PromoStatus, { label: string; cls: string }> = {
  active: { label: "Active", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  inactive: { label: "Disabled", cls: "bg-slate-100 text-slate-500 border-slate-200" },
  scheduled: { label: "Scheduled", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  expired: { label: "Expired", cls: "bg-rose-50 text-rose-700 border-rose-200" },
  used_up: { label: "Limit reached", cls: "bg-amber-50 text-amber-700 border-amber-200" },
};

const dzd = (n: number | null | undefined) => `${(n ?? 0).toLocaleString()} DZD`;
const dateInput = (iso?: string | null) => (iso ? new Date(iso).toISOString().slice(0, 10) : "");

export default function PromoCodesPage() {
  const { token } = useAuth();
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [scopeFilter, setScopeFilter] = useState<"all" | PromoScope>("all");
  const [editing, setEditing] = useState<PromoCode | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 3500); };

  const fetchPromos = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/promos`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setPromos(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { if (token) fetchPromos(); }, [token, fetchPromos]);

  const save = async (fields: Partial<PromoCode>, id?: string) => {
    const res = await fetch(`${API_URL}/api/promos${id ? `/${id}` : ""}`, {
      method: id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(fields),
    });
    if (res.ok) {
      setEditing(null); setShowNew(false); fetchPromos();
      showToast(id ? "Promo code updated ✓" : "🎟️ Promo code created!");
    } else {
      const d = await res.json().catch(() => ({}));
      showToast(`⚠ ${d.error || "Failed"}`);
    }
  };

  const toggleActive = async (p: PromoCode) => {
    await save({ isActive: !p.isActive }, p.id);
  };

  const remove = async (p: PromoCode) => {
    if (!confirm(`Delete promo code ${p.code} permanently?`)) return;
    const res = await fetch(`${API_URL}/api/promos/${p.id}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) { fetchPromos(); showToast("Promo code deleted"); }
  };

  const filtered = promos.filter(p => scopeFilter === "all" || p.scope === scopeFilter);
  const activeCount = promos.filter(p => p.status === "active").length;
  const totalRedemptions = promos.reduce((s, p) => s + p.usedCount, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fadeIn pb-16 text-left">
      {toast && (
        <div className="fixed top-24 right-8 z-50 animate-fadeIn bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-800">
          <Ticket size={16} className="text-emerald-400" />
          <span className="text-xs font-bold font-inter">{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tighter text-slate-800 uppercase flex items-center gap-3">
            <Ticket className="text-emerald-600" size={28} /> Promo Codes
          </h1>
          <p className="text-sm text-slate-400 font-medium font-inter">
            Discounts for taxi rides, food orders, and service bookings — with deadlines, usage limits, and on/off switch
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchPromos} className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase text-slate-600 hover:bg-slate-50 transition-all cursor-pointer">
            <RefreshCw size={13} />
          </button>
          <button onClick={() => setShowNew(true)} className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer flex items-center gap-2">
            <Plus size={14} /> New Promo Code
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: "Total Codes", value: String(promos.length), sub: `${activeCount} usable right now` },
          { label: "Total Redemptions", value: String(totalRedemptions), sub: "Times codes were used" },
          { label: "Expired / Disabled", value: String(promos.filter(p => p.status === "expired" || p.status === "inactive").length), sub: "Not usable" },
        ].map(t => (
          <div key={t.label} className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{t.label}</span>
            <span className="text-2xl font-black text-slate-800 tracking-tight block mt-2">{t.value}</span>
            <p className="text-[10px] text-slate-400 font-bold font-inter mt-1">{t.sub}</p>
          </div>
        ))}
      </div>

      {/* Scope filter */}
      <div className="flex gap-2 flex-wrap">
        {([
          { v: "all" as const, label: `All (${promos.length})` },
          { v: "TAXI" as const, label: "🚕 Taxi" },
          { v: "FOOD" as const, label: "🍔 Food" },
          { v: "SERVICES" as const, label: "🔧 Services" },
          { v: "TRUCK" as const, label: "🚚 Truck" },
          { v: "ALL" as const, label: "🌐 All-services codes" },
        ]).map(f => (
          <button key={f.v} onClick={() => setScopeFilter(f.v)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer ${scopeFilter === f.v ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-slate-300" size={28} /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-12 text-center space-y-2">
          <Ticket className="mx-auto text-slate-200" size={36} />
          <p className="text-sm font-black text-slate-400 uppercase">No promo codes here yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(p => {
            const scope = SCOPE_META[p.scope];
            const ScopeIcon = scope.icon;
            const st = STATUS_META[p.status];
            const usagePct = p.maxUses ? Math.min(100, Math.round((p.usedCount / p.maxUses) * 100)) : 0;
            return (
              <div key={p.id} className={`bg-white border rounded-[2rem] p-6 shadow-sm ${p.status === "active" ? "border-slate-100" : "border-slate-100 opacity-75"}`}>
                <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
                  {/* Code + scope */}
                  <div className="flex items-center gap-4 min-w-64">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Ticket size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-base font-black text-slate-800 tracking-tight">{p.code}</span>
                        <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider border ${st.cls}`}>{st.label}</span>
                      </div>
                      <p className="text-[11px] font-bold text-slate-400 font-inter mt-0.5">{p.description || "—"}</p>
                      <span className={`inline-flex items-center gap-1 mt-1 text-[9px] px-2 py-0.5 rounded-lg font-black uppercase tracking-wider ${scope.cls}`}>
                        <ScopeIcon size={9} /> {scope.label}
                      </span>
                    </div>
                  </div>

                  {/* Discount + rules */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1 text-center">
                    <div className="bg-slate-50/70 rounded-xl px-2 py-2.5">
                      <p className="text-sm font-black text-emerald-600">
                        {p.discountType === "PERCENTAGE" ? `${p.discountValue}%` : dzd(p.discountValue)}
                      </p>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Discount</p>
                    </div>
                    <div className="bg-slate-50/70 rounded-xl px-2 py-2.5">
                      <p className="text-sm font-black text-slate-800">{p.usedCount}{p.maxUses ? `/${p.maxUses}` : ""}</p>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Used{p.maxUses ? ` (${usagePct}%)` : ""}</p>
                    </div>
                    <div className="bg-slate-50/70 rounded-xl px-2 py-2.5">
                      <p className="text-sm font-black text-slate-800">{p.maxUsesPerUser}</p>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Per Client</p>
                    </div>
                    <div className="bg-slate-50/70 rounded-xl px-2 py-2.5">
                      <p className="text-sm font-black text-slate-800">{p.expiresAt ? new Date(p.expiresAt).toLocaleDateString() : "∞"}</p>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Deadline</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => toggleActive(p)}
                      className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer flex items-center gap-1.5 ${p.isActive ? "bg-slate-100 text-slate-600 hover:bg-slate-200" : "bg-emerald-500 text-white hover:bg-emerald-600"}`}>
                      <Power size={11} /> {p.isActive ? "Disable" : "Enable"}
                    </button>
                    <button onClick={() => setEditing(p)}
                      className="px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-[9px] font-black uppercase tracking-wider hover:bg-slate-50 cursor-pointer flex items-center gap-1.5">
                      <Edit2 size={11} /> Edit
                    </button>
                    <button onClick={() => remove(p)}
                      className="px-3 py-2 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-[9px] font-black uppercase tracking-wider hover:bg-rose-100 cursor-pointer">
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>

                {/* Extra rules line */}
                {(p.minOrderAmount || p.maxDiscount || p.startsAt) && (
                  <div className="mt-3 pt-3 border-t border-slate-50 flex flex-wrap gap-4 text-[10px] font-bold text-slate-400 font-inter">
                    {p.minOrderAmount != null && <span>Minimum order: {dzd(p.minOrderAmount)}</span>}
                    {p.maxDiscount != null && <span>Discount capped at {dzd(p.maxDiscount)}</span>}
                    {p.startsAt && <span>Starts {new Date(p.startsAt).toLocaleDateString()}</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {(showNew || editing) && (
        <PromoModal
          promo={editing}
          onClose={() => { setShowNew(false); setEditing(null); }}
          onSave={(fields) => save(fields, editing?.id)}
        />
      )}
    </div>
  );
}

// ══════════════════ MODAL ══════════════════

function PromoModal({ promo, onClose, onSave }: {
  promo: PromoCode | null;
  onClose: () => void;
  onSave: (fields: Partial<PromoCode>) => void;
}) {
  const [code, setCode] = useState(promo?.code ?? "");
  const [description, setDescription] = useState(promo?.description ?? "");
  const [scope, setScope] = useState<PromoScope>(promo?.scope ?? "ALL");
  const [discountType, setDiscountType] = useState<DiscountType>(promo?.discountType ?? "PERCENTAGE");
  const [discountValue, setDiscountValue] = useState(promo ? String(promo.discountValue) : "");
  const [maxDiscount, setMaxDiscount] = useState(promo?.maxDiscount != null ? String(promo.maxDiscount) : "");
  const [minOrderAmount, setMinOrderAmount] = useState(promo?.minOrderAmount != null ? String(promo.minOrderAmount) : "");
  const [maxUses, setMaxUses] = useState(promo?.maxUses != null ? String(promo.maxUses) : "");
  const [maxUsesPerUser, setMaxUsesPerUser] = useState(String(promo?.maxUsesPerUser ?? 1));
  const [startsAt, setStartsAt] = useState(dateInput(promo?.startsAt));
  const [expiresAt, setExpiresAt] = useState(dateInput(promo?.expiresAt));
  const [isActive, setIsActive] = useState(promo?.isActive ?? true);

  // Live example on a 1000 DZD order
  const example = 1000;
  const exDiscount = discountType === "PERCENTAGE"
    ? Math.min(Math.round((example * (parseFloat(discountValue) || 0)) / 100), maxDiscount ? parseInt(maxDiscount) : Infinity)
    : Math.min(parseInt(discountValue) || 0, example);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeIn p-4">
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-5 relative text-left">
        <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400 hover:text-slate-800 cursor-pointer">
          <X size={18} />
        </button>
        <div className="space-y-1">
          <h2 className="text-xl font-black text-slate-800 uppercase">{promo ? "Edit Promo Code" : "New Promo Code"}</h2>
          <p className="text-xs text-slate-400 font-bold font-inter">Set the discount, where it works, and its limits</p>
        </div>

        {/* Code + description */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Code *</label>
            <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="WELCOME20"
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black font-mono outline-none focus:bg-white uppercase" />
          </div>
          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Description</label>
            <input value={description ?? ""} onChange={e => setDescription(e.target.value)} placeholder="20% off your first order"
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:bg-white" />
          </div>
        </div>

        {/* Scope */}
        <div>
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Where does it work? *</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(["ALL", "TAXI", "FOOD", "SERVICES", "TRUCK"] as PromoScope[]).map(s => {
              const m = SCOPE_META[s];
              const Icon = m.icon;
              return (
                <button key={s} onClick={() => setScope(s)}
                  className={`py-3 px-2 rounded-2xl border text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${scope === s ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"}`}>
                  <Icon size={12} /> {m.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Discount type + value */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Discount Type *</label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { v: "PERCENTAGE" as const, label: "%" },
                { v: "FIXED" as const, label: "DZD" },
              ]).map(t => (
                <button key={t.v} onClick={() => setDiscountType(t.v)}
                  className={`py-3.5 rounded-2xl border text-xs font-black uppercase transition-all cursor-pointer ${discountType === t.v ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-500 border-slate-200"}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">
              {discountType === "PERCENTAGE" ? "Percent off *" : "Amount off (DZD) *"}
            </label>
            <input type="number" value={discountValue} onChange={e => setDiscountValue(e.target.value)} placeholder={discountType === "PERCENTAGE" ? "20" : "500"}
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black outline-none focus:bg-white" />
          </div>
          <div className={discountType === "PERCENTAGE" ? "" : "opacity-40 pointer-events-none"}>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Max discount (DZD)</label>
            <input type="number" value={maxDiscount} onChange={e => setMaxDiscount(e.target.value)} placeholder="No cap"
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black outline-none focus:bg-white" />
          </div>
        </div>

        {/* Limits */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Min order (DZD)</label>
            <input type="number" value={minOrderAmount} onChange={e => setMinOrderAmount(e.target.value)} placeholder="None"
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black outline-none focus:bg-white" />
          </div>
          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Max total uses</label>
            <input type="number" value={maxUses} onChange={e => setMaxUses(e.target.value)} placeholder="Unlimited"
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black outline-none focus:bg-white" />
          </div>
          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Uses per client</label>
            <input type="number" value={maxUsesPerUser} onChange={e => setMaxUsesPerUser(e.target.value)} placeholder="1"
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black outline-none focus:bg-white" />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer pb-3.5">
              <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="w-4 h-4 accent-emerald-600" />
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider">Active</span>
            </label>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2 flex items-center gap-1.5"><Calendar size={10} /> Starts (optional)</label>
            <input type="date" value={startsAt} onChange={e => setStartsAt(e.target.value)}
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black outline-none focus:bg-white" />
          </div>
          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2 flex items-center gap-1.5"><Calendar size={10} /> Deadline (optional)</label>
            <input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)}
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black outline-none focus:bg-white" />
          </div>
        </div>

        {/* Live example */}
        {discountValue && (
          <p className="text-[11px] font-bold text-slate-600 font-inter bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
            📐 On a {example.toLocaleString()} DZD order: client saves <strong className="text-emerald-700">{exDiscount.toLocaleString()} DZD</strong> and pays <strong className="text-slate-900">{(example - exDiscount).toLocaleString()} DZD</strong>
          </p>
        )}

        <button
          onClick={() => {
            if (!code || !discountValue) { alert("Code and discount value are required."); return; }
            onSave({
              code, description, scope, discountType,
              discountValue: parseFloat(discountValue),
              maxDiscount: maxDiscount === "" ? null : parseInt(maxDiscount),
              minOrderAmount: minOrderAmount === "" ? null : parseInt(minOrderAmount),
              maxUses: maxUses === "" ? null : parseInt(maxUses),
              maxUsesPerUser: parseInt(maxUsesPerUser) || 1,
              startsAt: startsAt || null,
              expiresAt: expiresAt || null,
              isActive,
            } as Partial<PromoCode>);
          }}
          className="w-full py-4 bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <Check size={14} /> {promo ? "Save Changes" : "Create Promo Code"}
        </button>
      </div>
    </div>
  );
}
