"use client";

import { API_URL } from "@/lib/api";
import { WILAYAS, DEFAULT_WILAYA } from "@/lib/locations";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Store, ShoppingBag, DollarSign, Clock, CheckCircle2, Truck, XCircle, Star, Plus, Activity,
  X, Shield, Phone, MapPin, Trash2, Check, Loader2, Bike, ThumbsDown, Wallet, RefreshCw, Utensils, ChevronRight, Users,
} from "lucide-react";

// ══════════════════ TYPES ══════════════════

interface Addition { id: string; name: string; price: number; isAvailable: boolean; }
interface MenuItem {
  id: string; name: string; description?: string | null; price: number; image?: string | null;
  isAvailable: boolean; prepTime: number; categoryId?: string | null; additions: Addition[];
}
interface FoodCategory { id: string; name: string; displayOrder: number; }
interface Cashier { id: string; cashierCode: string; name: string; phone?: string | null; email?: string | null; isActive: boolean; }

interface Restaurant {
  id: string; name: string; description?: string | null; address?: string | null; phone: string; email?: string | null;
  image?: string | null; rating: number; isActive: boolean; isPremium: boolean;
  status: "PENDING" | "APPROVED" | "SUSPENDED" | "ARCHIVED";
  availabilityStatus: "OPEN" | "CLOSED" | "VACATION" | "SATURATED" | "OTHER";
  wilaya?: string | null; commune?: string | null;
  categories?: FoodCategory[]; menuItems?: MenuItem[]; cashiers?: Cashier[];
  _count?: { menuItems: number; orders: number; cashiers: number };
}

interface Driver {
  id: string; driverCode: string; name: string; phone: string; email?: string | null;
  vehicleType: "MOTORCYCLE" | "BICYCLE" | "SCOOTER" | "CAR"; vehiclePlate?: string | null;
  status: "AVAILABLE" | "BUSY" | "OFFLINE" | "SUSPENDED";
  rating: number; totalDeliveries: number; maxOrdersCapacity: number;
  isVerified: boolean; isActive: boolean; cancellationCount: number;
  wilaya?: string | null; commune?: string | null; activeOrdersCount?: number;
}

interface FoodOrderItem {
  id: string; quantity: number; unitPrice: number; totalPrice: number; specialInstructions?: string | null;
  menuItem: { name: string; image?: string | null };
  additions: { id: string; quantity: number; totalPrice: number; addition: { name: string } }[];
}

interface FoodOrder {
  id: string; orderNumber: string; clientName: string; clientPhone: string;
  orderType: "DELIVERY" | "PICKUP";
  deliveryAddress?: string | null; deliveryWilaya?: string | null; deliveryCommune?: string | null;
  deliveryInstructions?: string | null;
  status: string; paymentMethod: string;
  subtotal: number; deliveryFee: number; totalAmount: number; deliveryDistance?: number | null;
  prepTime?: number | null; declineReason?: string | null;
  restaurantRating?: number | null; driverRating?: number | null;
  restaurant: { id: string; name: string; phone: string; commune?: string | null };
  driver?: { id: string; driverCode: string; name: string; phone: string } | null;
  items: FoodOrderItem[];
  statusHistory: { id: string; status: string; timestamp: string }[];
  createdAt: string;
}

interface FoodStats {
  totalOrders: number; ordersToday: number; activeOrders: number; deliveredOrders: number;
  totalRevenue: number; deliveryFeesCollected: number; avgBasket: number; todayRevenue: number;
  totalRestaurants: number; approvedRestaurants: number; totalDrivers: number; availableDrivers: number;
  recentOrders: (FoodOrder & { restaurant: { name: string }; driver?: { name: string } | null })[];
}

interface SubscriptionRow {
  restaurantId: string; restaurantName: string; isPremium: boolean; monthKey: string;
  revenue: number; ordersCount: number; tierLevel: number; totalDue: number;
  paidAmount: number; remainingAmount: number; status: "paid" | "partial" | "unpaid";
}

interface SubscriptionData {
  monthKey: string;
  grid: { minRevenue: number; maxRevenue: number | null; fee: number }[];
  rows: SubscriptionRow[];
  totals: { revenue: number; totalDue: number; paid: number; remaining: number };
}

// ══════════════════ CONSTANTS ══════════════════

const ORDER_STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-amber-50 text-amber-700 border-amber-200" },
  accepted: { label: "Accepted", color: "bg-sky-50 text-sky-700 border-sky-200" },
  preparing: { label: "Preparing", color: "bg-orange-50 text-orange-700 border-orange-200" },
  assigned: { label: "Driver Assigned", color: "bg-violet-50 text-violet-700 border-violet-200" },
  arrived: { label: "Driver Arrived", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  delivering: { label: "Delivering", color: "bg-blue-50 text-blue-700 border-blue-200" },
  delivered: { label: "Delivered", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  declined: { label: "Declined", color: "bg-rose-50 text-rose-700 border-rose-200" },
  cancelled: { label: "Cancelled", color: "bg-rose-50 text-rose-600 border-rose-200" },
};

const RESTAURANT_STATUS: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pending", color: "bg-amber-50 text-amber-700 border-amber-200" },
  APPROVED: { label: "Approved", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  SUSPENDED: { label: "Suspended", color: "bg-rose-50 text-rose-700 border-rose-200" },
  ARCHIVED: { label: "Archived", color: "bg-slate-100 text-slate-500 border-slate-200" },
};

const DRIVER_STATUS: Record<string, { label: string; color: string }> = {
  AVAILABLE: { label: "Available", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  BUSY: { label: "Busy", color: "bg-amber-50 text-amber-700 border-amber-200" },
  OFFLINE: { label: "Offline", color: "bg-slate-100 text-slate-500 border-slate-200" },
  SUSPENDED: { label: "Suspended", color: "bg-rose-50 text-rose-700 border-rose-200" },
};

const VEHICLES = { MOTORCYCLE: "🏍 Motorcycle", SCOOTER: "🛵 Scooter", BICYCLE: "🚲 Bicycle", CAR: "🚗 Car" };

const dz = (n: number) => `${n.toLocaleString()} DZD`;

// ══════════════════ MAIN ══════════════════

interface FoodDashboardProps {
  activePage: string;
}

export default function FoodDashboard({ activePage }: FoodDashboardProps) {
  const { token } = useAuth();
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const authHeaders = useCallback(
    (): Record<string, string> => ({ Authorization: `Bearer ${token}` }),
    [token]
  );

  const page =
    activePage === "restaurants" ? <RestaurantsPage authHeaders={authHeaders} showToast={showToast} /> :
    activePage === "orders" ? <OrdersPage authHeaders={authHeaders} showToast={showToast} /> :
    activePage === "drivers" ? <DriversPage authHeaders={authHeaders} showToast={showToast} /> :
    activePage === "subscriptions" || activePage === "earnings" ? <SubscriptionsPage authHeaders={authHeaders} showToast={showToast} /> :
    <FoodOverview authHeaders={authHeaders} />;

  return (
    <div className="relative">
      {toast && (
        <div className="fixed top-24 right-8 z-50 animate-fadeIn bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-800">
          <Activity size={18} className="text-primary animate-pulse" />
          <span className="text-xs font-bold font-inter">{toast}</span>
        </div>
      )}
      {page}
    </div>
  );
}

interface PageProps {
  authHeaders: () => Record<string, string>;
  showToast: (msg: string) => void;
}

// ══════════════════ PAGE: OVERVIEW ══════════════════

function FoodOverview({ authHeaders }: { authHeaders: () => Record<string, string> }) {
  const [stats, setStats] = useState<FoodStats | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/food/stats`, { headers: authHeaders() });
      if (res.ok) setStats(await res.json());
    } catch (err) { console.error(err); }
  }, [authHeaders]);

  useEffect(() => { load(); }, [load]);

  const cards = [
    { label: "Orders Today", value: stats?.ordersToday ?? 0, sub: `${stats?.activeOrders ?? 0} active now`, icon: ShoppingBag, cls: "bg-amber-50 text-amber-600" },
    { label: "Today Revenue", value: dz(stats?.todayRevenue ?? 0), sub: `${dz(stats?.totalRevenue ?? 0)} all time`, icon: DollarSign, cls: "bg-emerald-50 text-emerald-600" },
    { label: "Restaurants", value: `${stats?.approvedRestaurants ?? 0}/${stats?.totalRestaurants ?? 0}`, sub: "approved / total", icon: Store, cls: "bg-blue-50 text-blue-600" },
    { label: "Drivers Available", value: `${stats?.availableDrivers ?? 0}/${stats?.totalDrivers ?? 0}`, sub: `avg basket ${dz(stats?.avgBasket ?? 0)}`, icon: Bike, cls: "bg-purple-50 text-purple-600" },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fadeIn pb-16 text-left">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tighter text-slate-800 uppercase">Food Delivery</h1>
          <p className="text-sm text-slate-400 font-medium font-inter">Live overview — restaurants, orders and drivers</p>
        </div>
        <button onClick={load} className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase text-slate-600 hover:bg-slate-50 transition-all cursor-pointer flex items-center gap-2">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm flex items-center justify-between">
              <div className="space-y-1.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{c.label}</span>
                <span className="text-xl font-black text-slate-800 tracking-tight block">{c.value}</span>
                <span className="text-[10px] font-bold text-slate-400 font-inter">{c.sub}</span>
              </div>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${c.cls}`}>
                <Icon size={20} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm space-y-5">
        <h3 className="text-sm font-black uppercase tracking-tight text-slate-800">Recent Orders</h3>
        {(stats?.recentOrders?.length ?? 0) === 0 ? (
          <p className="text-xs text-slate-400 font-bold font-inter text-center py-6">No orders yet.</p>
        ) : (
          <div className="space-y-3">
            {stats!.recentOrders.map(o => {
              const st = ORDER_STATUS[o.status] || ORDER_STATUS.pending;
              return (
                <div key={o.id} className="border border-slate-100 p-4 rounded-2xl flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <span className="text-[10px] font-black text-primary font-mono">{o.orderNumber}</span>
                    <p className="text-xs font-black text-slate-800 uppercase tracking-tight truncate">
                      {o.clientName} ← {o.restaurant.name}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 font-inter">
                      {dz(o.totalAmount)}{o.driver ? ` · 🏍 ${o.driver.name}` : ""}
                    </p>
                  </div>
                  <span className={`text-[9px] px-3 py-1.5 rounded-full font-black uppercase tracking-wider border shrink-0 ${st.color}`}>
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════ PAGE: RESTAURANTS ══════════════════

function RestaurantsPage({ authHeaders, showToast }: PageProps) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState<Restaurant | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/restaurants`, { headers: authHeaders() });
      if (res.ok) setRestaurants(await res.json());
    } catch (err) { console.error(err); }
  }, [authHeaders]);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (id: string) => {
    const res = await fetch(`${API_URL}/api/restaurants/${id}`, { headers: authHeaders() });
    if (res.ok) setSelected(await res.json());
  };

  const patchRestaurant = async (id: string, fields: Record<string, unknown>, msg: string) => {
    const res = await fetch(`${API_URL}/api/restaurants/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(fields),
    });
    if (res.ok) { load(); if (selected?.id === id) openDetail(id); showToast(msg); }
  };

  const filtered = restaurants.filter(r => statusFilter === "all" || r.status === statusFilter);

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fadeIn pb-16 text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tighter text-slate-800 uppercase">Restaurants</h1>
          <p className="text-sm text-slate-400 font-medium font-inter">Approve, suspend and manage restaurants and their menus</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="px-5 py-3 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all cursor-pointer">
          <Plus size={14} /> Add Restaurant
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["all", "PENDING", "APPROVED", "SUSPENDED", "ARCHIVED"].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
              statusFilter === s ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
            }`}>
            {s === "all" ? `All (${restaurants.length})` : `${RESTAURANT_STATUS[s].label} (${restaurants.filter(r => r.status === s).length})`}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map(r => {
          const st = RESTAURANT_STATUS[r.status];
          return (
            <div key={r.id} className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer" onClick={() => openDetail(r.id)}>
              <div className="h-28 bg-slate-100 relative">
                {r.image && <img src={r.image.startsWith("/uploads") ? `${API_URL}${r.image}` : r.image} alt={r.name} className="w-full h-full object-cover" />}
                <div className="absolute top-3 right-3 flex gap-1.5">
                  {r.isPremium && <span className="bg-amber-400 text-white text-[9px] font-black uppercase px-2 py-1 rounded-lg">★ Premium</span>}
                  <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg border ${st.color}`}>{st.label}</span>
                </div>
              </div>
              <div className="p-5 space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">{r.name}</h3>
                  <span className="text-xs font-black text-slate-700">⭐ {r.rating || "—"}</span>
                </div>
                <p className="text-[10px] font-bold text-slate-400 font-inter flex items-center gap-1">
                  <MapPin size={11} /> {[r.commune, r.wilaya].filter(Boolean).join(", ") || "No location"}
                </p>
                <div className="flex gap-3 text-[10px] font-bold text-slate-500 font-inter pt-1">
                  <span>🍽 {r._count?.menuItems ?? 0} items</span>
                  <span>📦 {r._count?.orders ?? 0} orders</span>
                  <span className={`uppercase font-black ${r.availabilityStatus === "OPEN" ? "text-emerald-600" : "text-rose-500"}`}>{r.availabilityStatus}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {filtered.length === 0 && (
        <div className="bg-white border border-slate-100 rounded-[2rem] p-12 text-center text-slate-400 font-bold font-inter text-xs">No restaurants in this filter.</div>
      )}

      {showAdd && <AddRestaurantModal authHeaders={authHeaders} onClose={() => setShowAdd(false)} onCreated={() => { setShowAdd(false); load(); showToast("🏪 Restaurant created (owner login sent to its email, default password resto123)"); }} />}
      {selected && (
        <RestaurantDrawer
          restaurant={selected}
          authHeaders={authHeaders}
          onClose={() => setSelected(null)}
          onChanged={() => { load(); openDetail(selected.id); }}
          onPatch={patchRestaurant}
          showToast={showToast}
        />
      )}
    </div>
  );
}

function AddRestaurantModal({ authHeaders, onClose, onCreated }: { authHeaders: () => Record<string, string>; onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [wilaya, setWilaya] = useState(DEFAULT_WILAYA);
  const [commune, setCommune] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/restaurants`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ name, phone, email: email || undefined, address, description, wilaya, commune }),
      });
      if (res.ok) onCreated();
      else alert((await res.json()).error || "Failed");
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-5 relative m-4">
        <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400 cursor-pointer"><X size={18} /></button>
        <div>
          <h2 className="text-xl font-black text-slate-800 uppercase">Add Restaurant</h2>
          <p className="text-xs text-slate-400 font-bold font-inter">Creates the restaurant + its owner login account</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <input required placeholder="Restaurant name *" value={name} onChange={e => setName(e.target.value)} className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none text-xs font-semibold" />
          <div className="grid grid-cols-2 gap-3">
            <input required placeholder="Phone *" value={phone} onChange={e => setPhone(e.target.value)} className="px-5 py-4 bg-slate-50 rounded-2xl outline-none text-xs font-semibold" />
            <input placeholder="Email (login)" value={email} onChange={e => setEmail(e.target.value)} className="px-5 py-4 bg-slate-50 rounded-2xl outline-none text-xs font-semibold" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <select value={wilaya} onChange={e => { setWilaya(e.target.value); setCommune(""); }} className="px-5 py-4 bg-slate-50 rounded-2xl outline-none text-xs font-semibold">
              {Object.keys(WILAYAS).map(w => <option key={w} value={w}>{w}</option>)}
            </select>
            <select value={commune} onChange={e => setCommune(e.target.value)} className="px-5 py-4 bg-slate-50 rounded-2xl outline-none text-xs font-semibold">
              <option value="">— Commune —</option>
              {(WILAYAS[wilaya] || []).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <input placeholder="Address" value={address} onChange={e => setAddress(e.target.value)} className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none text-xs font-semibold" />
          <textarea placeholder="Description" rows={2} value={description} onChange={e => setDescription(e.target.value)} className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none text-xs font-semibold resize-none" />
          <button type="submit" disabled={saving} className="w-full py-4 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-wider cursor-pointer disabled:opacity-50 flex justify-center items-center gap-2">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Create Restaurant
          </button>
        </form>
      </div>
    </div>
  );
}

function RestaurantDrawer({ restaurant, authHeaders, onClose, onChanged, onPatch, showToast }: {
  restaurant: Restaurant;
  authHeaders: () => Record<string, string>;
  onClose: () => void;
  onChanged: () => void;
  onPatch: (id: string, fields: Record<string, unknown>, msg: string) => void;
  showToast: (m: string) => void;
}) {
  const [newCatName, setNewCatName] = useState("");
  const [itemForm, setItemForm] = useState<{ categoryId: string; name: string; price: string } | null>(null);
  const [additionForm, setAdditionForm] = useState<{ itemId: string; name: string; price: string } | null>(null);
  const [cashierName, setCashierName] = useState("");

  const api = async (method: string, path: string, body?: unknown) => {
    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers: { "Content-Type": "application/json", ...authHeaders() },
      ...(body !== undefined && { body: JSON.stringify(body) }),
    });
    if (res.ok) onChanged();
    else alert((await res.json().catch(() => ({}))).error || "Failed");
    return res.ok;
  };

  const st = RESTAURANT_STATUS[restaurant.status];

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed top-0 right-0 bottom-0 w-full sm:w-[34rem] bg-white z-50 shadow-2xl p-8 overflow-y-auto animate-slideIn space-y-6 text-left">
        {/* Header */}
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Restaurant</span>
          <button onClick={onClose} className="w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400 cursor-pointer"><X size={18} /></button>
        </div>

        {/* Overview */}
        <div className="flex items-center gap-4 bg-slate-50 p-5 rounded-3xl border border-slate-100">
          {restaurant.image ? (
            <img src={restaurant.image.startsWith("/uploads") ? `${API_URL}${restaurant.image}` : restaurant.image} alt={restaurant.name} className="w-16 h-16 rounded-2xl object-cover" />
          ) : (
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center"><Store size={24} /></div>
          )}
          <div className="space-y-1 min-w-0">
            <h3 className="text-base font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
              {restaurant.name}
              {restaurant.isPremium && <Star size={13} className="text-amber-400 fill-amber-400 shrink-0" />}
            </h3>
            <p className="text-[10px] font-bold text-slate-400 font-inter flex items-center gap-1"><Phone size={11} /> {restaurant.phone}</p>
            <p className="text-[10px] font-bold text-slate-400 font-inter flex items-center gap-1"><MapPin size={11} /> {[restaurant.address, restaurant.commune].filter(Boolean).join(", ")}</p>
            <span className={`inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border ${st.color}`}>{st.label} · {restaurant.availabilityStatus}</span>
          </div>
        </div>

        {/* Admin actions */}
        <div className="grid grid-cols-2 gap-2">
          {restaurant.status !== "APPROVED" && (
            <button onClick={() => onPatch(restaurant.id, { status: "APPROVED" }, "Restaurant approved ✅")} className="py-3 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer hover:bg-emerald-600">Approve</button>
          )}
          {restaurant.status !== "SUSPENDED" && (
            <button onClick={() => onPatch(restaurant.id, { status: "SUSPENDED" }, "Restaurant suspended")} className="py-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer hover:bg-rose-100">Suspend</button>
          )}
          {restaurant.status === "SUSPENDED" && (
            <button onClick={() => onPatch(restaurant.id, { status: "APPROVED" }, "Restaurant reactivated")} className="py-3 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer hover:bg-emerald-600">Reactivate</button>
          )}
          <button onClick={() => onPatch(restaurant.id, { isPremium: !restaurant.isPremium }, restaurant.isPremium ? "Premium removed" : "Premium enabled ★")} className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer border ${restaurant.isPremium ? "bg-amber-400 text-white border-amber-400" : "bg-white text-amber-600 border-amber-200 hover:bg-amber-50"}`}>
            {restaurant.isPremium ? "★ Premium ON" : "☆ Make Premium"}
          </button>
          <select
            value={restaurant.availabilityStatus}
            onChange={e => onPatch(restaurant.id, { availabilityStatus: e.target.value }, `Availability → ${e.target.value}`)}
            className="py-3 px-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase outline-none col-span-2"
          >
            {["OPEN", "CLOSED", "VACATION", "SATURATED", "OTHER"].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* MENU management */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Utensils size={12} /> Menu</span>
          </div>

          {/* add category */}
          <div className="flex gap-2">
            <input placeholder="New category (e.g. Pizzas)" value={newCatName} onChange={e => setNewCatName(e.target.value)} className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold outline-none" />
            <button
              onClick={async () => { if (newCatName.trim() && await api("POST", `/api/restaurants/${restaurant.id}/categories`, { name: newCatName.trim() })) setNewCatName(""); }}
              className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase cursor-pointer"
            >
              Add
            </button>
          </div>

          {(restaurant.categories ?? []).map(cat => {
            const items = (restaurant.menuItems ?? []).filter(mi => mi.categoryId === cat.id);
            return (
              <div key={cat.id} className="border border-slate-100 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-tight">{cat.name} ({items.length})</h4>
                  <div className="flex gap-2">
                    <button onClick={() => setItemForm({ categoryId: cat.id, name: "", price: "" })} className="text-[9px] font-black text-primary uppercase cursor-pointer hover:underline">+ Item</button>
                    <button onClick={() => { if (confirm(`Delete category "${cat.name}"?`)) api("DELETE", `/api/restaurants/${restaurant.id}/categories/${cat.id}`); }} className="text-slate-300 hover:text-rose-500 cursor-pointer"><Trash2 size={12} /></button>
                  </div>
                </div>

                {itemForm?.categoryId === cat.id && (
                  <div className="bg-slate-50 p-3 rounded-xl flex gap-2">
                    <input autoFocus placeholder="Item name" value={itemForm.name} onChange={e => setItemForm({ ...itemForm, name: e.target.value })} className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold outline-none" />
                    <input type="number" placeholder="DZD" value={itemForm.price} onChange={e => setItemForm({ ...itemForm, price: e.target.value })} className="w-20 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-black outline-none" />
                    <button
                      onClick={async () => {
                        if (itemForm.name && itemForm.price && await api("POST", `/api/restaurants/${restaurant.id}/menu-items`, { name: itemForm.name, price: itemForm.price, categoryId: cat.id })) setItemForm(null);
                      }}
                      className="px-3 py-2 bg-primary text-white rounded-lg text-[9px] font-black uppercase cursor-pointer"
                    >
                      Save
                    </button>
                  </div>
                )}

                {items.map(item => (
                  <div key={item.id} className="bg-slate-50/60 rounded-xl p-3 space-y-2">
                    <div className="flex justify-between items-center gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {item.image && <img src={item.image.startsWith("/uploads") ? `${API_URL}${item.image}` : item.image} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />}
                        <div className="min-w-0">
                          <p className={`text-xs font-black truncate ${item.isAvailable ? "text-slate-700" : "text-slate-400 line-through"}`}>{item.name}</p>
                          <p className="text-[10px] font-bold text-slate-400">{dz(item.price)} · {item.prepTime} min</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button onClick={() => api("PUT", `/api/restaurants/${restaurant.id}/menu-items/${item.id}`, { isAvailable: !item.isAvailable })}
                          className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase cursor-pointer border ${item.isAvailable ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-100 text-slate-400 border-slate-200"}`}>
                          {item.isAvailable ? "ON" : "OFF"}
                        </button>
                        <button onClick={() => setAdditionForm({ itemId: item.id, name: "", price: "" })} className="text-[9px] font-black text-primary uppercase cursor-pointer">+Add-on</button>
                        <button onClick={() => { if (confirm(`Delete "${item.name}"?`)) api("DELETE", `/api/restaurants/${restaurant.id}/menu-items/${item.id}`); }} className="text-slate-300 hover:text-rose-500 cursor-pointer"><Trash2 size={12} /></button>
                      </div>
                    </div>
                    {item.additions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {item.additions.map(a => (
                          <span key={a.id} className={`text-[9px] font-bold px-2 py-1 rounded-lg border flex items-center gap-1 ${a.isAvailable ? "bg-white text-slate-500 border-slate-200" : "bg-slate-100 text-slate-300 border-slate-200 line-through"}`}>
                            {a.name} +{a.price}
                            <button onClick={() => api("DELETE", `/api/restaurants/${restaurant.id}/additions/${a.id}`)} className="text-slate-300 hover:text-rose-500 cursor-pointer"><X size={9} /></button>
                          </span>
                        ))}
                      </div>
                    )}
                    {additionForm?.itemId === item.id && (
                      <div className="flex gap-2">
                        <input autoFocus placeholder="Add-on name (e.g. Extra cheese)" value={additionForm.name} onChange={e => setAdditionForm({ ...additionForm, name: e.target.value })} className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold outline-none" />
                        <input type="number" placeholder="DZD" value={additionForm.price} onChange={e => setAdditionForm({ ...additionForm, price: e.target.value })} className="w-20 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-black outline-none" />
                        <button
                          onClick={async () => {
                            if (additionForm.name && await api("POST", `/api/restaurants/${restaurant.id}/menu-items/${item.id}/additions`, { name: additionForm.name, price: additionForm.price || 0 })) setAdditionForm(null);
                          }}
                          className="px-3 py-2 bg-primary text-white rounded-lg text-[9px] font-black uppercase cursor-pointer"
                        >
                          Save
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* CASHIERS */}
        <div className="space-y-3">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Users size={12} /> Cashiers</span>
          <div className="flex gap-2">
            <input placeholder="Cashier name" value={cashierName} onChange={e => setCashierName(e.target.value)} className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold outline-none" />
            <button
              onClick={async () => { if (cashierName.trim() && await api("POST", `/api/restaurants/${restaurant.id}/cashiers`, { name: cashierName.trim() })) { setCashierName(""); showToast("Cashier created"); } }}
              className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase cursor-pointer"
            >
              Add
            </button>
          </div>
          {(restaurant.cashiers ?? []).filter(c => c.isActive).map(c => (
            <div key={c.id} className="flex justify-between items-center border border-slate-100 p-3 rounded-xl">
              <div>
                <p className="text-xs font-black text-slate-700">{c.name} <span className="text-[9px] font-mono text-slate-400">{c.cashierCode}</span></p>
                <p className="text-[10px] font-bold text-slate-400 font-inter">{c.email || c.phone || "—"}</p>
              </div>
              <button onClick={() => { if (confirm(`Remove cashier ${c.name}?`)) api("DELETE", `/api/restaurants/${restaurant.id}/cashiers/${c.id}`); }} className="text-slate-300 hover:text-rose-500 cursor-pointer"><Trash2 size={13} /></button>
            </div>
          ))}
        </div>

        {/* Delete */}
        <button
          onClick={async () => {
            if (confirm(`Delete restaurant "${restaurant.name}" permanently?`)) {
              if (await api("DELETE", `/api/restaurants/${restaurant.id}`)) onClose();
            }
          }}
          className="w-full py-4 bg-rose-100 hover:bg-rose-200 text-rose-700 border border-rose-200/50 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer"
        >
          <Trash2 size={14} /> Delete Restaurant
        </button>
      </div>
    </>
  );
}

// ══════════════════ PAGE: ORDERS ══════════════════

function OrdersPage({ authHeaders, showToast }: PageProps) {
  const [orders, setOrders] = useState<FoodOrder[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<FoodOrder | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/food-orders`, { headers: authHeaders() });
      if (res.ok) setOrders(await res.json());
    } catch (err) { console.error(err); }
  }, [authHeaders]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (selected) {
      const updated = orders.find(o => o.id === selected.id);
      if (updated) setSelected(updated);
    }
  }, [orders]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = orders.filter(o => statusFilter === "all" || o.status === statusFilter);
  const chipStatuses = ["all", "pending", "accepted", "preparing", "assigned", "arrived", "delivering", "delivered", "declined", "cancelled"];

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fadeIn pb-16 text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tighter text-slate-800 uppercase">Food Orders</h1>
          <p className="text-sm text-slate-400 font-medium font-inter">Full lifecycle: accept → prepare → assign driver → deliver</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="px-5 py-3 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all cursor-pointer">
          <Plus size={14} /> New Order
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {chipStatuses.map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
              statusFilter === s ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
            }`}>
            {s === "all" ? `All (${orders.length})` : `${ORDER_STATUS[s].label} (${orders.filter(o => o.status === s).length})`}
          </button>
        ))}
      </div>

      <div className="bg-white border border-slate-100 rounded-[2rem] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table text-left w-full">
            <thead>
              <tr>
                <th>Order</th><th>Client</th><th>Restaurant</th><th>Driver</th><th>Total</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => {
                const st = ORDER_STATUS[o.status] || ORDER_STATUS.pending;
                return (
                  <tr key={o.id} className="cursor-pointer" onClick={() => setSelected(o)}>
                    <td className="font-mono text-[11px] font-black text-primary">{o.orderNumber}</td>
                    <td className="font-black uppercase text-[11px]">{o.clientName}</td>
                    <td className="text-slate-500">{o.restaurant.name}</td>
                    <td className="text-slate-500">{o.driver ? `🏍 ${o.driver.name}` : "—"}</td>
                    <td className="font-black">{dz(o.totalAmount)}</td>
                    <td><span className={`text-[9px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider border ${st.color}`}>{st.label}</span></td>
                    <td><ChevronRight size={14} className="text-slate-300" /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <p className="text-xs text-slate-400 font-bold font-inter text-center py-10">No orders in this filter.</p>}
      </div>

      {showCreate && <CreateOrderModal authHeaders={authHeaders} onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load(); showToast("📦 Order created"); }} />}
      {selected && <OrderDrawer order={selected} authHeaders={authHeaders} onClose={() => setSelected(null)} onChanged={load} showToast={showToast} />}
    </div>
  );
}

function CreateOrderModal({ authHeaders, onClose, onCreated }: { authHeaders: () => Record<string, string>; onClose: () => void; onCreated: () => void }) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [restaurantId, setRestaurantId] = useState("");
  const [menu, setMenu] = useState<Restaurant | null>(null);
  const [cart, setCart] = useState<Record<string, { qty: number; additionIds: string[] }>>({});
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [orderType, setOrderType] = useState<"DELIVERY" | "PICKUP">("DELIVERY");
  const [address, setAddress] = useState("");
  const [wilaya, setWilaya] = useState(DEFAULT_WILAYA);
  const [commune, setCommune] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/restaurants?status=APPROVED`, { headers: authHeaders() })
      .then(r => r.ok ? r.json() : [])
      .then(setRestaurants);
  }, [authHeaders]);

  useEffect(() => {
    setMenu(null); setCart({});
    if (restaurantId) {
      fetch(`${API_URL}/api/restaurants/${restaurantId}`, { headers: authHeaders() })
        .then(r => r.ok ? r.json() : null)
        .then(setMenu);
    }
  }, [restaurantId, authHeaders]);

  const toggleItem = (itemId: string) => {
    setCart(prev => {
      const next = { ...prev };
      if (next[itemId]) delete next[itemId];
      else next[itemId] = { qty: 1, additionIds: [] };
      return next;
    });
  };

  const subtotal = Object.entries(cart).reduce((s, [itemId, c]) => {
    const item = menu?.menuItems?.find(mi => mi.id === itemId);
    if (!item) return s;
    const addTotal = c.additionIds.reduce((a, id) => a + (item.additions.find(x => x.id === id)?.price ?? 0), 0);
    return s + (item.price + addTotal) * c.qty;
  }, 0);

  const submit = async () => {
    if (!restaurantId || !clientName || !clientPhone || Object.keys(cart).length === 0) return;
    if (orderType === "DELIVERY" && !address) { alert("Delivery address is required"); return; }
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/food-orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          restaurantId, orderType, clientName, clientPhone,
          deliveryAddress: address, deliveryWilaya: wilaya, deliveryCommune: commune,
          items: Object.entries(cart).map(([menuItemId, c]) => ({ menuItemId, quantity: c.qty, additionIds: c.additionIds })),
        }),
      });
      if (res.ok) onCreated();
      else alert((await res.json()).error || "Failed");
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-5 relative m-4">
        <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400 cursor-pointer"><X size={18} /></button>
        <div>
          <h2 className="text-xl font-black text-slate-800 uppercase">New Food Order</h2>
          <p className="text-xs text-slate-400 font-bold font-inter">Prices are computed server-side from the menu</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <input required placeholder="Client name *" value={clientName} onChange={e => setClientName(e.target.value)} className="px-5 py-4 bg-slate-50 rounded-2xl outline-none text-xs font-semibold" />
          <input required placeholder="Client phone *" value={clientPhone} onChange={e => setClientPhone(e.target.value)} className="px-5 py-4 bg-slate-50 rounded-2xl outline-none text-xs font-semibold" />
        </div>

        <div className="flex gap-2">
          {(["DELIVERY", "PICKUP"] as const).map(t => (
            <button key={t} onClick={() => setOrderType(t)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider border cursor-pointer ${orderType === t ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-500 border-slate-200"}`}>
              {t === "DELIVERY" ? "🛵 Delivery" : "🥡 Pickup"}
            </button>
          ))}
        </div>

        {orderType === "DELIVERY" && (
          <div className="space-y-3">
            <input placeholder="Delivery address *" value={address} onChange={e => setAddress(e.target.value)} className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none text-xs font-semibold" />
            <div className="grid grid-cols-2 gap-3">
              <select value={wilaya} onChange={e => { setWilaya(e.target.value); setCommune(""); }} className="px-5 py-4 bg-slate-50 rounded-2xl outline-none text-xs font-semibold">
                {Object.keys(WILAYAS).map(w => <option key={w} value={w}>{w}</option>)}
              </select>
              <select value={commune} onChange={e => setCommune(e.target.value)} className="px-5 py-4 bg-slate-50 rounded-2xl outline-none text-xs font-semibold">
                <option value="">— Commune —</option>
                {(WILAYAS[wilaya] || []).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        )}

        <select value={restaurantId} onChange={e => setRestaurantId(e.target.value)} className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none text-xs font-black">
          <option value="">— Choose restaurant —</option>
          {restaurants.map(r => <option key={r.id} value={r.id}>{r.name} ({r.commune})</option>)}
        </select>

        {menu && (
          <div className="space-y-2 max-h-64 overflow-y-auto border border-slate-100 rounded-2xl p-4">
            {(menu.menuItems ?? []).filter(mi => mi.isAvailable).map(item => {
              const inCart = cart[item.id];
              return (
                <div key={item.id} className={`p-3 rounded-xl border cursor-pointer transition-all ${inCart ? "border-primary bg-primary/5" : "border-slate-100 hover:border-slate-200"}`}>
                  <div className="flex justify-between items-center" onClick={() => toggleItem(item.id)}>
                    <div>
                      <p className="text-xs font-black text-slate-700">{item.name}</p>
                      <p className="text-[10px] font-bold text-slate-400">{dz(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {inCart && (
                        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                          <button onClick={() => setCart(p => ({ ...p, [item.id]: { ...p[item.id], qty: Math.max(1, p[item.id].qty - 1) } }))} className="w-6 h-6 bg-slate-100 rounded-lg text-xs font-black cursor-pointer">−</button>
                          <span className="text-xs font-black w-5 text-center">{inCart.qty}</span>
                          <button onClick={() => setCart(p => ({ ...p, [item.id]: { ...p[item.id], qty: p[item.id].qty + 1 } }))} className="w-6 h-6 bg-slate-100 rounded-lg text-xs font-black cursor-pointer">+</button>
                        </div>
                      )}
                      <div className={`w-5 h-5 rounded-lg border flex items-center justify-center ${inCart ? "bg-primary border-primary text-white" : "border-slate-300"}`}>
                        {inCart && <Check size={12} />}
                      </div>
                    </div>
                  </div>
                  {inCart && item.additions.filter(a => a.isAvailable).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2" onClick={e => e.stopPropagation()}>
                      {item.additions.filter(a => a.isAvailable).map(a => {
                        const on = inCart.additionIds.includes(a.id);
                        return (
                          <button key={a.id}
                            onClick={() => setCart(p => ({ ...p, [item.id]: { ...p[item.id], additionIds: on ? p[item.id].additionIds.filter(x => x !== a.id) : [...p[item.id].additionIds, a.id] } }))}
                            className={`text-[9px] font-bold px-2 py-1 rounded-lg border cursor-pointer ${on ? "bg-primary text-white border-primary" : "bg-white text-slate-500 border-slate-200"}`}>
                            {a.name} +{a.price}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-between items-center bg-slate-50 rounded-2xl p-4">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subtotal (+ delivery fee at creation)</span>
          <span className="text-sm font-black text-slate-800">{dz(subtotal)}</span>
        </div>

        <button onClick={submit} disabled={saving || !restaurantId || Object.keys(cart).length === 0 || !clientName || !clientPhone}
          className="w-full py-4 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-wider cursor-pointer disabled:opacity-40 flex justify-center items-center gap-2">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Create Order
        </button>
      </div>
    </div>
  );
}

function OrderDrawer({ order, authHeaders, onClose, onChanged, showToast }: {
  order: FoodOrder;
  authHeaders: () => Record<string, string>;
  onClose: () => void;
  onChanged: () => void;
  showToast: (m: string) => void;
}) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [showAssign, setShowAssign] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [showDecline, setShowDecline] = useState(false);

  const act = async (path: string, body?: unknown, msg?: string) => {
    const res = await fetch(`${API_URL}/api/food-orders/${order.id}/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      ...(body !== undefined && { body: JSON.stringify(body) }),
    });
    if (res.ok) { onChanged(); if (msg) showToast(msg); }
    else alert((await res.json().catch(() => ({}))).error || "Failed");
    return res.ok;
  };

  const loadDrivers = async () => {
    const res = await fetch(`${API_URL}/api/drivers?status=AVAILABLE&verified=true`, { headers: authHeaders() });
    if (res.ok) setDrivers(await res.json());
    setShowAssign(true);
  };

  const st = ORDER_STATUS[order.status] || ORDER_STATUS.pending;
  const timeline = ["pending", "accepted", "preparing", "assigned", "arrived", "delivering", "delivered"];
  const isPickup = order.orderType === "PICKUP";
  const shownTimeline = isPickup ? ["pending", "accepted", "preparing", "delivered"] : timeline;
  const currentIdx = shownTimeline.indexOf(order.status);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed top-0 right-0 bottom-0 w-full sm:w-[32rem] bg-white z-50 shadow-2xl p-8 overflow-y-auto animate-slideIn space-y-6 text-left">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Order</span>
            <span className="font-mono text-xs font-black text-primary px-2 py-0.5 bg-primary/5 rounded-md">{order.orderNumber}</span>
            <span className={`text-[9px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider border ${st.color}`}>{st.label}</span>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400 cursor-pointer"><X size={18} /></button>
        </div>

        {/* Client + restaurant */}
        <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 space-y-2">
          <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{order.clientName}</p>
          <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 font-inter"><Phone size={12} /> {order.clientPhone}</p>
          {order.deliveryAddress && (
            <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 font-inter">
              <MapPin size={12} /> {order.deliveryAddress}
              {(order.deliveryCommune || order.deliveryWilaya) && (
                <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-primary/5 text-primary rounded-lg">{[order.deliveryCommune, order.deliveryWilaya].filter(Boolean).join(", ")}</span>
              )}
            </p>
          )}
          <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 font-inter"><Store size={12} /> {order.restaurant.name} · {order.restaurant.phone}</p>
          {order.driver && <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 font-inter"><Bike size={12} /> {order.driver.name} ({order.driver.driverCode}) · {order.driver.phone}</p>}
          <p className="text-[10px] font-black uppercase text-slate-400">{isPickup ? "🥡 Pickup" : "🛵 Delivery"} · {order.paymentMethod.replace(/_/g, " ")}</p>
          {order.declineReason && <p className="text-[10px] font-bold text-rose-500 font-inter">Reason: {order.declineReason}</p>}
        </div>

        {/* Items */}
        <div className="space-y-2">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Items</span>
          {order.items.map(it => (
            <div key={it.id} className="border border-slate-100 rounded-xl p-3 flex justify-between items-start">
              <div>
                <p className="text-xs font-black text-slate-700">{it.quantity}× {it.menuItem.name}</p>
                {it.additions.length > 0 && (
                  <p className="text-[10px] font-bold text-slate-400 font-inter">+ {it.additions.map(a => a.addition.name).join(", ")}</p>
                )}
              </div>
              <span className="text-xs font-black text-slate-800">{dz(it.totalPrice + it.additions.reduce((s, a) => s + a.totalPrice, 0))}</span>
            </div>
          ))}
          <div className="bg-slate-50 rounded-2xl p-4 space-y-1.5 text-xs font-bold font-inter">
            <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>{dz(order.subtotal)}</span></div>
            <div className="flex justify-between text-slate-500">
              <span>Delivery fee{order.deliveryDistance ? ` (${order.deliveryDistance} km)` : ""}</span>
              <span>{dz(order.deliveryFee)}</span>
            </div>
            <div className="flex justify-between text-slate-900 font-black text-sm pt-1 border-t border-slate-200"><span>Total</span><span>{dz(order.totalAmount)}</span></div>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-3">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Timeline</span>
          <div className="space-y-3 pl-4 border-l border-slate-100">
            {shownTimeline.map((s, i) => (
              <div key={s} className="relative flex items-center gap-3">
                <div className={`absolute -left-6 w-3 h-3 rounded-full border-2 ${i === currentIdx ? "bg-primary border-primary scale-125" : i < currentIdx || order.status === "delivered" && i <= currentIdx ? "bg-slate-700 border-slate-700" : "bg-white border-slate-200"}`} />
                <p className={`text-xs uppercase font-black tracking-tight ${i === currentIdx ? "text-primary" : i < currentIdx ? "text-slate-800" : "text-slate-300"}`}>
                  {ORDER_STATUS[s].label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── LIFECYCLE ACTIONS ── */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          {order.status === "pending" && (
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => act("accept", {}, "Order accepted ✅")} className="py-4 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-emerald-600 flex items-center justify-center gap-2"><Check size={14} /> Accept</button>
              <button onClick={() => setShowDecline(true)} className="py-4 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-rose-100 flex items-center justify-center gap-2"><ThumbsDown size={14} /> Decline</button>
            </div>
          )}
          {showDecline && (
            <div className="bg-rose-50/50 border border-rose-100 p-4 rounded-2xl space-y-2">
              <input autoFocus placeholder="Decline reason *" value={declineReason} onChange={e => setDeclineReason(e.target.value)} className="w-full px-4 py-3 bg-white border border-rose-100 rounded-xl text-xs font-semibold outline-none" />
              <button onClick={async () => { if (declineReason.trim() && await act("decline", { reason: declineReason }, "Order declined")) setShowDecline(false); }}
                className="w-full py-3 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase cursor-pointer">Confirm Decline</button>
            </div>
          )}

          {order.status === "accepted" && (
            <button onClick={() => act("preparing", {}, "Kitchen started 🍳")} className="w-full py-4 bg-orange-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-orange-600 flex items-center justify-center gap-2"><Clock size={14} /> Start Preparing</button>
          )}

          {order.status === "preparing" && (
            isPickup ? (
              <button onClick={() => act("assign-driver", {}, "Pickup completed ✅")} className="w-full py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-emerald-700 flex items-center justify-center gap-2"><CheckCircle2 size={14} /> Client Picked Up — Complete</button>
            ) : (
              <button onClick={loadDrivers} className="w-full py-4 bg-violet-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-violet-700 flex items-center justify-center gap-2"><Bike size={14} /> Assign a Driver</button>
            )
          )}

          {showAssign && (
            <div className="bg-violet-50/50 border border-violet-100 p-4 rounded-2xl space-y-2 max-h-56 overflow-y-auto">
              <span className="text-[9px] font-black text-violet-700 uppercase tracking-widest">Available verified drivers</span>
              {drivers.length === 0 ? (
                <p className="text-[10px] font-bold text-slate-400 font-inter">No available verified drivers right now.</p>
              ) : drivers.map(d => (
                <div key={d.id} onClick={async () => { if (await act("assign-driver", { driverId: d.id }, `Driver ${d.name} assigned 🏍`)) setShowAssign(false); }}
                  className="bg-white border border-slate-100 hover:border-violet-300 p-3 rounded-xl flex justify-between items-center cursor-pointer">
                  <div>
                    <p className="text-xs font-black text-slate-800">{d.name} <span className="font-mono text-[9px] text-slate-400">{d.driverCode}</span></p>
                    <p className="text-[10px] font-bold text-slate-400 font-inter">⭐ {d.rating || "new"} · {VEHICLES[d.vehicleType]} · {d.activeOrdersCount ?? 0}/{d.maxOrdersCapacity} orders</p>
                  </div>
                  <span className="text-[9px] font-black text-violet-600 uppercase">Assign</span>
                </div>
              ))}
            </div>
          )}

          {order.status === "assigned" && (
            <button onClick={() => act("arrived", {}, "Driver arrived at restaurant")} className="w-full py-4 bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-indigo-600">Driver Arrived at Restaurant</button>
          )}
          {(order.status === "assigned" || order.status === "arrived") && (
            <button onClick={() => act("start-delivery", {}, "Delivery started 🛵")} className="w-full py-4 bg-blue-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-blue-600 flex items-center justify-center gap-2"><Truck size={14} /> Start Delivery</button>
          )}
          {order.status === "delivering" && (
            <button onClick={() => act("complete-delivery", {}, "Order delivered ✅")} className="w-full py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-emerald-700 flex items-center justify-center gap-2"><CheckCircle2 size={14} /> Complete Delivery</button>
          )}
          {(order.status === "assigned" || order.status === "arrived") && (
            <button onClick={() => { if (confirm("Cancel this driver's assignment? The order goes back to preparing.")) act("driver-cancel", {}, "Assignment cancelled — back to preparing"); }}
              className="w-full py-3 bg-white border border-slate-200 text-slate-500 rounded-2xl text-[9px] font-black uppercase tracking-widest cursor-pointer hover:bg-slate-50">Unassign Driver (driver cancel)</button>
          )}

          {!["delivered", "declined", "cancelled"].includes(order.status) && (
            <button onClick={() => { if (confirm(`Force-cancel order ${order.orderNumber}?`)) act("cancel", { reason: "Cancelled by admin" }, "Order cancelled"); }}
              className="w-full py-3.5 bg-rose-50 text-rose-600 rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-rose-100 flex items-center justify-center gap-2"><XCircle size={14} /> Force Cancel</button>
          )}

          {order.status === "delivered" && (
            <div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-700 text-xs font-black uppercase justify-center">
              <CheckCircle2 size={16} /> Delivered {order.restaurantRating ? `· ⭐ ${order.restaurantRating}` : ""}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ══════════════════ PAGE: DRIVERS ══════════════════

function DriversPage({ authHeaders, showToast }: PageProps) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/drivers`, { headers: authHeaders() });
      if (res.ok) setDrivers(await res.json());
    } catch (err) { console.error(err); }
  }, [authHeaders]);

  useEffect(() => { load(); }, [load]);

  const patch = async (id: string, method: string, path: string, body: unknown, msg: string) => {
    const res = await fetch(`${API_URL}/api/drivers/${id}${path}`, {
      method,
      headers: { "Content-Type": "application/json", ...authHeaders() },
      ...(body !== undefined && body !== null && { body: JSON.stringify(body) }),
    });
    if (res.ok) { load(); showToast(msg); }
    else alert((await res.json().catch(() => ({}))).error || "Failed");
  };

  const filtered = drivers.filter(d => statusFilter === "all" || d.status === statusFilter);

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fadeIn pb-16 text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tighter text-slate-800 uppercase">Delivery Drivers</h1>
          <p className="text-sm text-slate-400 font-medium font-inter">Verify, suspend and monitor your delivery fleet</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="px-5 py-3 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all cursor-pointer">
          <Plus size={14} /> Add Driver
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["all", "AVAILABLE", "BUSY", "OFFLINE", "SUSPENDED"].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
              statusFilter === s ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
            }`}>
            {s === "all" ? `All (${drivers.length})` : `${DRIVER_STATUS[s].label} (${drivers.filter(d => d.status === s).length})`}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.map(d => {
          const st = DRIVER_STATUS[d.status];
          return (
            <div key={d.id} className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 text-primary font-black rounded-2xl flex items-center justify-center"><Bike size={20} /></div>
                  <div>
                    <p className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
                      {d.name}
                      {d.isVerified && <Shield size={12} className="text-primary fill-primary" />}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 font-inter font-mono">{d.driverCode} · {d.phone}</p>
                  </div>
                </div>
                <span className={`text-[9px] px-3 py-1.5 rounded-full font-black uppercase tracking-wider border ${st.color}`}>{st.label}</span>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center">
                {[
                  { l: "Rating", v: d.rating ? `⭐ ${d.rating}` : "new" },
                  { l: "Deliveries", v: d.totalDeliveries },
                  { l: "Active", v: `${d.activeOrdersCount ?? 0}/${d.maxOrdersCapacity}` },
                  { l: "Cancels", v: d.cancellationCount },
                ].map((x, i) => (
                  <div key={i} className={`bg-slate-50 rounded-xl p-2.5 ${x.l === "Cancels" && Number(x.v) >= 3 ? "bg-rose-50" : ""}`}>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">{x.l}</span>
                    <span className={`text-xs font-black block mt-0.5 ${x.l === "Cancels" && Number(x.v) >= 3 ? "text-rose-600" : "text-slate-700"}`}>{x.v}</span>
                  </div>
                ))}
              </div>

              <p className="text-[10px] font-bold text-slate-400 font-inter">{VEHICLES[d.vehicleType]}{d.vehiclePlate ? ` · ${d.vehiclePlate}` : ""} · {[d.commune, d.wilaya].filter(Boolean).join(", ") || "no zone"}</p>

              <div className="flex flex-wrap gap-2">
                {!d.isVerified && (
                  <button onClick={() => patch(d.id, "PUT", "", { isVerified: true }, `${d.name} verified ✅`)} className="px-3 py-2 bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase cursor-pointer hover:bg-emerald-600">Verify</button>
                )}
                {d.status !== "SUSPENDED" ? (
                  <button onClick={() => patch(d.id, "PATCH", "/status", { status: "SUSPENDED" }, `${d.name} suspended`)} className="px-3 py-2 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-[9px] font-black uppercase cursor-pointer hover:bg-rose-100">Suspend</button>
                ) : (
                  <button onClick={() => patch(d.id, "PATCH", "/status", { status: "OFFLINE" }, `${d.name} reactivated`)} className="px-3 py-2 bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase cursor-pointer hover:bg-emerald-600">Reactivate</button>
                )}
                {d.status !== "SUSPENDED" && (
                  <select value={d.status} onChange={e => patch(d.id, "PATCH", "/status", { status: e.target.value }, `${d.name} → ${e.target.value}`)} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-[9px] font-black uppercase outline-none cursor-pointer">
                    {["AVAILABLE", "BUSY", "OFFLINE"].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                )}
                {d.cancellationCount > 0 && (
                  <button onClick={() => patch(d.id, "POST", "/reset-cancellations", {}, "Cancellation counter reset")} className="px-3 py-2 bg-white border border-slate-200 text-slate-500 rounded-xl text-[9px] font-black uppercase cursor-pointer hover:bg-slate-50">Reset Cancels</button>
                )}
                <button onClick={() => { if (confirm(`Delete driver ${d.name}?`)) patch(d.id, "DELETE", "", null as unknown as undefined, "Driver deleted"); }} className="px-3 py-2 text-slate-300 hover:text-rose-500 cursor-pointer"><Trash2 size={13} /></button>
              </div>
            </div>
          );
        })}
      </div>
      {filtered.length === 0 && (
        <div className="bg-white border border-slate-100 rounded-[2rem] p-12 text-center text-slate-400 font-bold font-inter text-xs">No drivers in this filter.</div>
      )}

      {showAdd && <AddDriverModal authHeaders={authHeaders} onClose={() => setShowAdd(false)} onCreated={() => { setShowAdd(false); load(); showToast("🏍 Driver created (default password driver123)"); }} />}
    </div>
  );
}

function AddDriverModal({ authHeaders, onClose, onCreated }: { authHeaders: () => Record<string, string>; onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [vehicleType, setVehicleType] = useState("MOTORCYCLE");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [wilaya, setWilaya] = useState(DEFAULT_WILAYA);
  const [commune, setCommune] = useState("");
  const [isVerified, setIsVerified] = useState(true);
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/drivers`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ name, phone, email: email || undefined, vehicleType, vehiclePlate, wilaya, commune, isVerified }),
      });
      if (res.ok) onCreated();
      else alert((await res.json()).error || "Failed");
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl p-8 max-w-lg w-full space-y-5 relative m-4">
        <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400 cursor-pointer"><X size={18} /></button>
        <div>
          <h2 className="text-xl font-black text-slate-800 uppercase">Add Driver</h2>
          <p className="text-xs text-slate-400 font-bold font-inter">Creates the driver + their login account</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <input required placeholder="Driver name *" value={name} onChange={e => setName(e.target.value)} className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none text-xs font-semibold" />
          <div className="grid grid-cols-2 gap-3">
            <input required placeholder="Phone *" value={phone} onChange={e => setPhone(e.target.value)} className="px-5 py-4 bg-slate-50 rounded-2xl outline-none text-xs font-semibold" />
            <input placeholder="Email (login)" value={email} onChange={e => setEmail(e.target.value)} className="px-5 py-4 bg-slate-50 rounded-2xl outline-none text-xs font-semibold" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <select value={vehicleType} onChange={e => setVehicleType(e.target.value)} className="px-5 py-4 bg-slate-50 rounded-2xl outline-none text-xs font-semibold">
              {Object.entries(VEHICLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <input placeholder="Plate number" value={vehiclePlate} onChange={e => setVehiclePlate(e.target.value)} className="px-5 py-4 bg-slate-50 rounded-2xl outline-none text-xs font-semibold" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <select value={wilaya} onChange={e => { setWilaya(e.target.value); setCommune(""); }} className="px-5 py-4 bg-slate-50 rounded-2xl outline-none text-xs font-semibold">
              {Object.keys(WILAYAS).map(w => <option key={w} value={w}>{w}</option>)}
            </select>
            <select value={commune} onChange={e => setCommune(e.target.value)} className="px-5 py-4 bg-slate-50 rounded-2xl outline-none text-xs font-semibold">
              <option value="">— Commune —</option>
              {(WILAYAS[wilaya] || []).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer">
            <input type="checkbox" checked={isVerified} onChange={e => setIsVerified(e.target.checked)} />
            Verified (can receive orders immediately)
          </label>
          <button type="submit" disabled={saving} className="w-full py-4 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-wider cursor-pointer disabled:opacity-50 flex justify-center items-center gap-2">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Create Driver
          </button>
        </form>
      </div>
    </div>
  );
}

// ══════════════════ PAGE: SUBSCRIPTIONS ══════════════════

function SubscriptionsPage({ authHeaders, showToast }: PageProps) {
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [month, setMonth] = useState(defaultMonth);
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [payRow, setPayRow] = useState<SubscriptionRow | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/food/subscriptions?month=${month}`, { headers: authHeaders() });
      if (res.ok) setData(await res.json());
    } catch (err) { console.error(err); }
  }, [authHeaders, month]);

  useEffect(() => { load(); }, [load]);

  const recordPayment = async () => {
    if (!payRow || !payAmount) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/food/subscriptions/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ restaurantId: payRow.restaurantId, monthKey: month, amount: parseInt(payAmount) }),
      });
      if (res.ok) { setPayRow(null); load(); showToast("💰 Payment recorded"); }
      else alert((await res.json()).error || "Failed");
    } finally { setSaving(false); }
  };

  const statusChip = (s: string) =>
    s === "paid" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
    s === "partial" ? "bg-amber-50 text-amber-700 border-amber-200" :
    "bg-rose-50 text-rose-700 border-rose-200";

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fadeIn pb-16 text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tighter text-slate-800 uppercase">Restaurant Subscriptions</h1>
          <p className="text-sm text-slate-400 font-medium font-inter">Monthly revenue tiers — how the platform earns from restaurants</p>
        </div>
        <input type="month" value={month} onChange={e => setMonth(e.target.value)} className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-black outline-none" />
      </div>

      {/* Tier grid */}
      <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm">
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-4"><Wallet size={12} /> Tier Grid (monthly revenue → subscription)</span>
        <div className="flex flex-wrap gap-3">
          {(data?.grid ?? []).map((t, i) => (
            <div key={i} className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Tier {i + 1}</span>
              <span className="text-[11px] font-black text-slate-700 block mt-0.5">
                {t.minRevenue.toLocaleString()} – {t.maxRevenue === null ? "∞" : t.maxRevenue.toLocaleString()} DA
              </span>
              <span className="text-xs font-black text-primary block mt-0.5">{t.fee.toLocaleString()} DA/month</span>
            </div>
          ))}
          <div className="bg-slate-900 text-white rounded-2xl px-4 py-3">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Beyond</span>
            <span className="text-[11px] font-black block mt-0.5">+4,000 DA / extra 50,000 DA revenue</span>
          </div>
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { l: "Restaurants Revenue", v: dz(data?.totals.revenue ?? 0), c: "text-slate-800" },
          { l: "Total Due", v: dz(data?.totals.totalDue ?? 0), c: "text-primary" },
          { l: "Collected", v: dz(data?.totals.paid ?? 0), c: "text-emerald-600" },
          { l: "Remaining", v: dz(data?.totals.remaining ?? 0), c: "text-rose-500" },
        ].map((x, i) => (
          <div key={i} className="bg-white border border-slate-100 p-5 rounded-[2rem] shadow-sm">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{x.l}</span>
            <span className={`text-xl font-black tracking-tight block mt-1.5 ${x.c}`}>{x.v}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-100 rounded-[2rem] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table text-left w-full">
            <thead>
              <tr>
                <th>Restaurant</th><th className="text-right">Month Revenue</th><th className="text-center">Orders</th>
                <th className="text-center">Tier</th><th className="text-right">Due</th><th className="text-right">Paid</th>
                <th className="text-right">Remaining</th><th className="text-center">Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {(data?.rows ?? []).map(r => (
                <tr key={r.restaurantId}>
                  <td className="font-black uppercase text-[11px]">{r.restaurantName} {r.isPremium && "★"}</td>
                  <td className="text-right font-black">{dz(r.revenue)}</td>
                  <td className="text-center"><span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-black">{r.ordersCount}</span></td>
                  <td className="text-center font-black text-slate-500">P{r.tierLevel}</td>
                  <td className="text-right font-black text-primary">{dz(r.totalDue)}</td>
                  <td className="text-right font-black text-emerald-600">{dz(r.paidAmount)}</td>
                  <td className="text-right font-black text-rose-500">{dz(r.remainingAmount)}</td>
                  <td className="text-center"><span className={`text-[9px] px-2.5 py-1 rounded-full font-black uppercase border ${statusChip(r.status)}`}>{r.status}</span></td>
                  <td className="text-right">
                    {r.remainingAmount > 0 && (
                      <button onClick={() => { setPayRow(r); setPayAmount(String(r.remainingAmount)); }} className="px-3 py-1.5 bg-primary text-white rounded-lg text-[9px] font-black uppercase cursor-pointer hover:bg-primary/90">+ Payment</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment modal */}
      {payRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl p-8 max-w-sm w-full space-y-5 relative m-4">
            <button onClick={() => setPayRow(null)} className="absolute top-6 right-6 w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400 cursor-pointer"><X size={18} /></button>
            <div>
              <h2 className="text-lg font-black text-slate-800 uppercase">Record Payment</h2>
              <p className="text-xs text-slate-400 font-bold font-inter">{payRow.restaurantName} — {month} · due {dz(payRow.totalDue)}, remaining {dz(payRow.remainingAmount)}</p>
            </div>
            <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} placeholder="Amount DZD" className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none text-sm font-black" />
            <button onClick={recordPayment} disabled={saving || !payAmount} className="w-full py-4 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-wider cursor-pointer disabled:opacity-40 flex justify-center items-center gap-2">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Record Payment
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
