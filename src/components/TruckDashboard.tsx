"use client";

import { API_URL } from "@/lib/api";
import { WILAYAS, DEFAULT_WILAYA } from "@/lib/locations";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Truck, Package, DollarSign, CheckCircle2, XCircle, Plus, X, MapPin, Navigation, Check,
  RefreshCw, ClipboardList, FolderKanban, Percent, FileText, Calendar, HandCoins, Ban,
  Shield, Trash2, Edit2, Layers, Loader2, ImagePlus,
} from "lucide-react";

// Reusable image picker: uploads to the backend (which stores it in R2) and returns the URL.
function ImageUploadField({ label, value, onChange }: { label: string; value: string; onChange: (url: string) => void }) {
  const { token } = useAuth();
  const [uploading, setUploading] = useState(false);
  const preview = value ? (value.startsWith("/uploads") ? `${API_URL}${value}` : value) : "";

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${API_URL}/api/upload?type=categories`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form,
      });
      if (res.ok) { const d = await res.json(); onChange(d.url); }
      else alert("Upload failed (images only, max 5MB)");
    } catch (e) { console.error(e); alert("Upload failed"); }
    finally { setUploading(false); }
  };

  return (
    <div>
      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">{label}</label>
      <div className="flex items-center gap-3">
        <label className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-200 hover:border-teal-300 bg-slate-50 flex items-center justify-center cursor-pointer overflow-hidden shrink-0 transition-colors">
          {preview
            ? <img src={preview} alt="preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            : <ImagePlus size={22} className="text-slate-300" />}
          <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
        </label>
        <div className="text-[10px] font-bold text-slate-400 font-inter">
          {uploading ? <span className="text-teal-600 animate-pulse">Uploading…</span> : (preview ? "Click the image to change it" : "Click to upload a picture")}
        </div>
      </div>
    </div>
  );
}

// ══════════════════ TYPES ══════════════════

interface TruckType {
  id: string; name: string; description?: string | null; capacityLabel?: string | null;
  priceMultiplier: number; isActive: boolean; image?: string | null;
  _count?: { trucks: number };
}
interface TruckCategory {
  id: string; name: string; description?: string | null; isActive: boolean; image?: string | null;
  truckTypes?: TruckType[]; _count?: { orders: number };
}
interface TruckVehicle {
  id: string; truckCode: string; driverName: string; phone: string; plate?: string | null;
  truckTypeId?: string | null; truckType?: { name: string } | null; profileImage?: string | null;
  status: string; isVerified: boolean; isActive: boolean; rating: number; totalTrips: number;
  wilaya?: string | null; commune?: string | null;
}
interface TruckOrder {
  id: string; orderNumber: string; clientName: string; clientPhone: string;
  category?: { id: string; name: string } | null;
  truckType?: { id: string; name: string; priceMultiplier: number; capacityLabel?: string | null } | null;
  pickupAddress: string; pickupWilaya?: string | null; pickupCommune?: string | null;
  destinationAddress: string; distanceKm?: number | null;
  description: string; invoiceStatus: string; scheduledType: string; scheduledDate?: string | null;
  estimatedPrice?: number | null; promoDiscount?: number | null; agreedPrice?: number | null;
  commissionPercentSnapshot?: number | null; commissionAmount?: number | null; driverEarnings?: number | null;
  status: string;
  truckId?: string | null;
  truck?: { id: string; truckCode: string; driverName: string; phone: string; plate?: string | null; status: string; rating: number; truckType?: { name: string } | null } | null;
  cancelledBy?: string | null; cancelReason?: string | null; cancelStage?: string | null;
  createdAt: string;
}
interface TruckStats {
  totalOrders: number; activeOrders: number; completedOrders: number; cancelledOrders: number;
  grossRevenue: number; commissionRevenue: number; driverPayouts: number;
  trucksTotal: number; trucksAvailable: number; trucksBusy: number; categories: number; types: number;
}
interface TruckConfig { truckBaseFare: number; truckPerKm: number; truckMinFare: number; truckCommissionPercent: number; }

const STATUS_META: Record<string, { label: string; cls: string }> = {
  requested: { label: "Requested", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  accepted: { label: "Accepted", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  arrived: { label: "At Pickup", cls: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  loading: { label: "Loading", cls: "bg-violet-50 text-violet-700 border-violet-200" },
  in_transit: { label: "In Transit", cls: "bg-orange-50 text-orange-700 border-orange-200" },
  delivered: { label: "Delivered", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  cancelled_by_client: { label: "Cancelled (Client)", cls: "bg-rose-50 text-rose-700 border-rose-200" },
  cancelled_by_driver: { label: "Cancelled (Driver)", cls: "bg-rose-50 text-rose-700 border-rose-200" },
  cancelled_by_admin: { label: "Cancelled (Admin)", cls: "bg-rose-50 text-rose-700 border-rose-200" },
  expired: { label: "Expired", cls: "bg-slate-50 text-slate-500 border-slate-200" },
};
const INVOICE_META: Record<string, string> = {
  HAS_INVOICE: "✅ Has invoice",
  NO_INVOICE: "⚠️ No invoice",
  NOT_REQUIRED: "— Not required",
};
const dzd = (n: number | null | undefined) => `${(n ?? 0).toLocaleString()} DZD`;

// ══════════════════ MAIN ══════════════════

export default function TruckDashboard({ activePage }: { activePage: string }) {
  const { token } = useAuth();
  const auth = useCallback(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const [stats, setStats] = useState<TruckStats | null>(null);
  const [orders, setOrders] = useState<TruckOrder[]>([]);
  const [categories, setCategories] = useState<TruckCategory[]>([]);
  const [types, setTypes] = useState<TruckType[]>([]);
  const [trucks, setTrucks] = useState<TruckVehicle[]>([]);
  const [config, setConfig] = useState<TruckConfig | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 4000); };

  const fetchAll = useCallback(async () => {
    try {
      const h = { headers: auth() };
      const [rS, rO, rC, rT, rTr, rCfg] = await Promise.all([
        fetch(`${API_URL}/api/truck/stats`, h),
        fetch(`${API_URL}/api/truck/orders`, h),
        fetch(`${API_URL}/api/truck/categories`, h),
        fetch(`${API_URL}/api/truck/types`, h),
        fetch(`${API_URL}/api/truck/trucks`, h),
        fetch(`${API_URL}/api/truck/config`, h),
      ]);
      if (rS.ok) setStats(await rS.json());
      if (rO.ok) setOrders(await rO.json());
      if (rC.ok) setCategories(await rC.json());
      if (rT.ok) setTypes(await rT.json());
      if (rTr.ok) setTrucks(await rTr.json());
      if (rCfg.ok) setConfig(await rCfg.json());
    } catch (err) { console.error("Truck fetch error:", err); }
  }, [auth]);

  useEffect(() => { if (token) fetchAll(); }, [token, fetchAll]);

  const post = async (path: string, body?: object) => {
    const res = await fetch(`${API_URL}${path}`, { method: "POST", headers: { "Content-Type": "application/json", ...auth() }, body: JSON.stringify(body ?? {}) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { showToast(`⚠ ${data.error || "Action failed"}`); return null; }
    fetchAll(); return data;
  };
  const put = async (path: string, body: object) => {
    const res = await fetch(`${API_URL}${path}`, { method: "PUT", headers: { "Content-Type": "application/json", ...auth() }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { showToast(`⚠ ${data.error || "Failed"}`); return null; }
    fetchAll(); return data;
  };
  const del = async (path: string) => {
    const res = await fetch(`${API_URL}${path}`, { method: "DELETE", headers: auth() });
    if (res.ok) { fetchAll(); showToast("Deleted ✓"); } else { const d = await res.json().catch(() => ({})); showToast(`⚠ ${d.error || "Failed"}`); }
  };

  const view = () => {
    if (activePage === "orders") return <OrdersPage orders={orders} categories={categories} types={types} trucks={trucks} config={config} post={post} showToast={showToast} />;
    if (activePage === "categories") return <CategoriesPage categories={categories} types={types} onSave={(f, id) => (id ? put(`/api/truck/categories/${id}`, f) : post(`/api/truck/categories`, f))} onDelete={(id) => del(`/api/truck/categories/${id}`)} showToast={showToast} />;
    if (activePage === "types") return <TypesPage types={types} onSave={(f, id) => (id ? put(`/api/truck/types/${id}`, f) : post(`/api/truck/types`, f))} onDelete={(id) => del(`/api/truck/types/${id}`)} />;
    if (activePage === "trucks") return <TrucksPage trucks={trucks} types={types} onCreate={(f) => post(`/api/truck/trucks`, f)} onUpdate={(id, f) => put(`/api/truck/trucks/${id}`, f)} onSetStatus={async (id, status) => { const r = await fetch(`${API_URL}/api/truck/trucks/${id}/status`, { method: "PATCH", headers: { "Content-Type": "application/json", ...auth() }, body: JSON.stringify({ status }) }); if (r.ok) { fetchAll(); showToast(`Truck ${status} ✓`); } }} onDelete={(id) => del(`/api/truck/trucks/${id}`)} />;
    if (activePage === "pricing") return <PricingPage stats={stats} trucks={trucks} orders={orders} config={config} onSave={async (c) => { const r = await put(`/api/truck/config`, c); if (r) showToast("Pricing saved ✓"); }} />;
    return <OverviewPage stats={stats} orders={orders} />;
  };

  return (
    <div className="relative">
      {toast && (
        <div className="fixed top-24 right-8 z-50 animate-fadeIn bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-800">
          <Truck size={16} className="text-teal-400" />
          <span className="text-xs font-bold font-inter">{toast}</span>
        </div>
      )}
      {view()}
    </div>
  );
}

// ══════════════════ OVERVIEW ══════════════════

function OverviewPage({ stats, orders }: { stats: TruckStats | null; orders: TruckOrder[] }) {
  const tiles = [
    { label: "Total Freight Orders", value: String(stats?.totalOrders ?? 0), sub: `${stats?.activeOrders ?? 0} active now`, icon: ClipboardList, color: "bg-teal-50 text-teal-600" },
    { label: "Commission Revenue", value: dzd(stats?.commissionRevenue), sub: "Platform earnings", icon: DollarSign, color: "bg-emerald-50 text-emerald-600" },
    { label: "Trucks Available", value: `${stats?.trucksAvailable ?? 0}/${stats?.trucksTotal ?? 0}`, sub: `${stats?.trucksBusy ?? 0} busy`, icon: Truck, color: "bg-blue-50 text-blue-600" },
    { label: "Catalog", value: `${stats?.categories ?? 0} cat · ${stats?.types ?? 0} types`, sub: "Categories & truck types", icon: Layers, color: "bg-violet-50 text-violet-600" },
  ];
  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fadeIn pb-16 text-left">
      <div className="space-y-2">
        <h1 className="text-3xl font-black tracking-tighter text-slate-800 uppercase">Truck Freight Dashboard</h1>
        <p className="text-sm text-slate-400 font-medium font-inter">Cargo & freight delivery — house moving, construction, refrigerated, fuels and more</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {tiles.map(t => { const I = t.icon; return (
          <div key={t.label} className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm flex items-center justify-between">
            <div className="space-y-1.5">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{t.label}</span>
              <span className="text-2xl font-black text-slate-800 tracking-tight block">{t.value}</span>
              <p className="text-[10px] text-slate-400 font-bold font-inter">{t.sub}</p>
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${t.color}`}><I size={20} /></div>
          </div>
        ); })}
      </div>
      <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm space-y-5">
        <h3 className="text-sm font-black uppercase tracking-tight text-slate-800">Recent Freight Orders</h3>
        {orders.length === 0 ? <p className="text-xs text-slate-400 font-bold font-inter text-center py-8">No orders yet.</p> : (
          <div className="space-y-3">
            {orders.slice(0, 6).map(o => { const st = STATUS_META[o.status] || STATUS_META.requested; return (
              <div key={o.id} className="border border-slate-100 p-5 rounded-2xl flex justify-between items-center">
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-slate-400 font-mono">{o.orderNumber}</span>
                  <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{o.clientName} · {o.category?.name}</p>
                  <p className="text-[10px] text-slate-500 font-bold font-inter flex items-center gap-1"><MapPin size={10} /> {o.pickupAddress} → {o.destinationAddress}</p>
                </div>
                <div className="text-right space-y-1">
                  <span className={`text-[9px] px-3 py-1.5 rounded-full font-black uppercase tracking-wider border ${st.cls}`}>{st.label}</span>
                  <p className="text-xs font-black text-slate-700">{dzd(o.agreedPrice ?? o.estimatedPrice)}</p>
                </div>
              </div>
            ); })}
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════ ORDERS ══════════════════

function OrdersPage({ orders, categories, types, trucks, config, post, showToast }: {
  orders: TruckOrder[]; categories: TruckCategory[]; types: TruckType[]; trucks: TruckVehicle[]; config: TruckConfig | null;
  post: (path: string, body?: object) => Promise<any>; showToast: (m: string) => void;
}) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<TruckOrder | null>(null);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => { if (selected) { const u = orders.find(o => o.id === selected.id); if (u) setSelected(u); } }, [orders, selected]);

  const filtered = orders.filter(o =>
    (statusFilter === "all" || o.status === statusFilter || (statusFilter === "cancelled" && o.status.startsWith("cancelled"))) &&
    (!search || o.orderNumber.toLowerCase().includes(search.toLowerCase()) || o.clientName.toLowerCase().includes(search.toLowerCase()) || o.clientPhone.includes(search))
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fadeIn pb-16 text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tighter text-slate-800 uppercase">Freight Orders</h1>
          <p className="text-sm text-slate-400 font-medium font-inter">Cargo requests with pickup/destination, invoice status, and dispatch</p>
        </div>
        <button onClick={() => setShowNew(true)} className="px-5 py-2.5 bg-teal-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-teal-700 shadow-lg shadow-teal-600/20 transition-all cursor-pointer flex items-center gap-2">
          <Plus size={14} /> New Freight Order
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search number, client, phone…" className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none w-64 font-inter" />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase outline-none text-slate-700">
          <option value="all">All statuses</option>
          <option value="requested">Requested</option><option value="accepted">Accepted</option>
          <option value="arrived">At Pickup</option><option value="loading">Loading</option>
          <option value="in_transit">In Transit</option><option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm overflow-x-auto">
        {filtered.length === 0 ? <p className="text-xs text-slate-400 font-bold font-inter text-center py-8">No orders match.</p> : (
          <table className="data-table text-left">
            <thead><tr className="border-b border-slate-50 text-[10px] uppercase tracking-widest text-slate-400">
              <th className="pb-4 font-black">Order</th><th className="pb-4 font-black">Client</th>
              <th className="pb-4 font-black">Category / Truck</th><th className="pb-4 font-black">Route</th>
              <th className="pb-4 font-black text-center">Invoice</th><th className="pb-4 font-black text-right">Price</th>
              <th className="pb-4 font-black">Truck</th><th className="pb-4 font-black text-center">Status</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-50 text-xs font-semibold text-slate-700">
              {filtered.map(o => { const st = STATUS_META[o.status] || STATUS_META.requested; return (
                <tr key={o.id} onClick={() => setSelected(o)} className="hover:bg-slate-50/60 transition-colors cursor-pointer">
                  <td className="py-4 font-mono font-black text-teal-600">{o.orderNumber}</td>
                  <td className="py-4"><p className="font-black text-slate-800 uppercase text-[11px]">{o.clientName}</p><p className="text-[10px] text-slate-400">{o.clientPhone}</p></td>
                  <td className="py-4 text-[11px]"><p className="font-black">{o.category?.name}</p><p className="text-slate-400">{o.truckType?.name || "Any truck"}</p></td>
                  <td className="py-4 text-[11px] max-w-52 truncate">{o.pickupAddress} → {o.destinationAddress}</td>
                  <td className="py-4 text-center text-[10px]">{INVOICE_META[o.invoiceStatus]?.split(" ")[0]}</td>
                  <td className="py-4 text-right font-black text-slate-800">{dzd(o.agreedPrice ?? o.estimatedPrice)}</td>
                  <td className="py-4 text-[11px] font-black">{o.truck?.driverName ?? "—"}</td>
                  <td className="py-4 text-center"><span className={`text-[9px] px-3 py-1.5 rounded-full font-black uppercase tracking-wider border ${st.cls}`}>{st.label}</span></td>
                </tr>
              ); })}
            </tbody>
          </table>
        )}
      </div>

      {selected && <OrderDrawer order={selected} trucks={trucks} onClose={() => setSelected(null)} onAction={async (id, action, body, label) => { const r = await post(`/api/truck/orders/${id}/${action}`, body); if (r) showToast(label || "Done ✓"); }} />}
      {showNew && <NewOrderModal categories={categories} types={types} config={config} onClose={() => setShowNew(false)} onSubmit={async (fields) => { const r = await post(`/api/truck/orders`, fields); if (r) { setShowNew(false); showToast("🚚 Freight order created!"); } }} />}
    </div>
  );
}

function OrderDrawer({ order, trucks, onClose, onAction }: {
  order: TruckOrder; trucks: TruckVehicle[];
  onClose: () => void;
  onAction: (id: string, action: string, body?: object, label?: string) => Promise<void>;
}) {
  const [assignTruckId, setAssignTruckId] = useState("");
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const st = STATUS_META[order.status] || STATUS_META.requested;
  const isOpen = order.status === "requested";
  const finished = order.status === "delivered" || order.status.startsWith("cancelled") || order.status === "expired";
  // Only trucks matching the order's truck type (if the client chose one) + not suspended
  const eligible = trucks.filter(t => t.status !== "suspended" && t.isActive && (!order.truckType || t.truckTypeId === order.truckType?.id));

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed top-0 right-0 bottom-0 w-full sm:w-130 bg-white z-50 shadow-2xl p-8 flex flex-col gap-6 overflow-y-auto animate-slideIn text-left">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-inter">Freight</span>
            <span className="font-mono text-xs font-black text-teal-600 px-2 py-0.5 bg-teal-50 rounded-md">{order.orderNumber}</span>
            <span className={`text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-wider border ${st.cls}`}>{st.label}</span>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400 hover:text-slate-800 cursor-pointer"><X size={18} /></button>
        </div>

        {/* Client */}
        <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 space-y-2">
          <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{order.clientName}</p>
          <p className="text-xs text-slate-500 font-medium font-inter">{order.clientPhone}</p>
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-white text-teal-700 rounded-lg border border-slate-100">{order.category?.name}</span>
            {order.truckType && <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-white text-slate-500 rounded-lg border border-slate-100">{order.truckType.name}</span>}
          </div>
        </div>

        {/* Route */}
        <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 space-y-2">
          <p className="text-xs font-bold text-slate-600 font-inter flex items-start gap-1.5"><MapPin size={12} className="text-emerald-500 mt-0.5 shrink-0" /> {order.pickupAddress}{order.pickupCommune && <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-white text-slate-500 rounded-lg border border-slate-100 ml-1">{order.pickupCommune}</span>}</p>
          <p className="text-xs font-bold text-slate-600 font-inter flex items-start gap-1.5"><Navigation size={12} className="text-rose-500 mt-0.5 shrink-0" /> {order.destinationAddress}</p>
          {order.distanceKm != null && <p className="text-[10px] font-black text-slate-400 uppercase">Distance: {order.distanceKm} km</p>}
        </div>

        {/* Cargo details */}
        <div className="space-y-3">
          <div className="bg-white border border-slate-100 p-4 rounded-2xl">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cargo Description</span>
            <p className="text-xs font-bold text-slate-600 font-inter mt-1">{order.description}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-slate-100 p-4 rounded-2xl">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><FileText size={10} /> Invoice</span>
              <p className="text-xs font-black text-slate-700 mt-1">{INVOICE_META[order.invoiceStatus]}</p>
            </div>
            <div className="bg-white border border-slate-100 p-4 rounded-2xl">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Calendar size={10} /> Schedule</span>
              <p className="text-xs font-black text-slate-700 mt-1">{order.scheduledType === "scheduled" ? order.scheduledDate : "As soon as possible"}</p>
            </div>
          </div>
        </div>

        {/* Money */}
        <div className="bg-emerald-50/60 border border-emerald-100 p-5 rounded-3xl space-y-2">
          <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-1.5"><HandCoins size={12} /> Price (calculated)</span>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div><p className="text-[9px] font-black text-slate-400 uppercase">Calculated</p><p className="text-sm font-black text-slate-700">{dzd(order.estimatedPrice)}</p></div>
            <div><p className="text-[9px] font-black text-slate-400 uppercase">Promo</p><p className="text-sm font-black text-amber-600">{order.promoDiscount ? `− ${dzd(order.promoDiscount)}` : "—"}</p></div>
            <div><p className="text-[9px] font-black text-slate-400 uppercase">Client Pays</p><p className="text-sm font-black text-emerald-600">{dzd(order.agreedPrice ?? order.estimatedPrice)}</p></div>
          </div>
          {order.status === "delivered" && (
            <div className="border-t border-emerald-100 pt-2 grid grid-cols-2 gap-3 text-center">
              <div><p className="text-[9px] font-black text-slate-400 uppercase">Platform ({order.commissionPercentSnapshot}%)</p><p className="text-sm font-black text-emerald-700">{dzd(order.commissionAmount)}</p></div>
              <div><p className="text-[9px] font-black text-slate-400 uppercase">Driver Keeps</p><p className="text-sm font-black text-slate-700">{dzd(order.driverEarnings)}</p></div>
            </div>
          )}
        </div>

        {order.truck && (
          <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 flex items-center justify-between">
            <div><p className="text-xs font-black text-slate-800 uppercase">{order.truck.driverName}</p><p className="text-[10px] font-bold text-slate-400 font-inter">{order.truck.truckCode} · {order.truck.truckType?.name} · {order.truck.plate}</p></div>
            <p className="text-xs font-black text-slate-700">⭐ {order.truck.rating}</p>
          </div>
        )}

        {/* Dispatch */}
        {isOpen && (
          <div className="bg-teal-50/50 border border-teal-100 p-4 rounded-2xl space-y-2">
            <span className="text-[9px] font-black text-teal-700 uppercase tracking-widest">Dispatch a truck</span>
            {eligible.length === 0 ? (
              <p className="text-[10px] font-bold text-slate-500 font-inter">No available truck{order.truckType ? ` of type "${order.truckType.name}"` : ""}.</p>
            ) : (
              <>
                <select value={assignTruckId} onChange={e => setAssignTruckId(e.target.value)} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black outline-none">
                  <option value="">Choose a truck…</option>
                  {eligible.map(t => <option key={t.id} value={t.id}>{t.driverName} ({t.truckCode} · {t.truckType?.name || "—"})</option>)}
                </select>
                <button onClick={() => assignTruckId && onAction(order.id, "assign", { truckId: assignTruckId }, "Truck dispatched ✓")} disabled={!assignTruckId} className="w-full py-2.5 bg-teal-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-teal-700 transition-all cursor-pointer disabled:opacity-40">Dispatch Truck</button>
              </>
            )}
          </div>
        )}

        {/* Lifecycle */}
        {!finished && !isOpen && (
          <div className="space-y-2">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Progress the job</span>
            {order.status === "accepted" && <button onClick={() => onAction(order.id, "arrived", undefined, "Truck at pickup")} className="w-full py-3.5 bg-cyan-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-cyan-700 cursor-pointer">Truck Arrived at Pickup</button>}
            {order.status === "arrived" && <button onClick={() => onAction(order.id, "loading", undefined, "Loading cargo")} className="w-full py-3.5 bg-violet-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-violet-700 cursor-pointer">Start Loading Cargo</button>}
            {order.status === "loading" && <button onClick={() => onAction(order.id, "start", undefined, "In transit")} className="w-full py-3.5 bg-orange-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 cursor-pointer">Depart — In Transit</button>}
            {order.status === "in_transit" && <button onClick={() => onAction(order.id, "complete", {}, "Delivered — commission collected ✓")} className="w-full py-3.5 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 cursor-pointer flex items-center justify-center gap-2"><CheckCircle2 size={14} /> Mark Delivered</button>}
          </div>
        )}

        {order.status.startsWith("cancelled") && (
          <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl space-y-1">
            <span className="text-[9px] font-black text-rose-700 uppercase tracking-widest flex items-center gap-1.5"><Ban size={12} /> Cancelled by {order.cancelledBy?.toLowerCase()}</span>
            <p className="text-[10px] font-bold text-slate-500 font-inter">Stage: {order.cancelStage?.replace(/_/g, " ")} {order.cancelReason ? `· "${order.cancelReason}"` : ""}</p>
          </div>
        )}

        {!finished && (
          <div className="pt-4 border-t border-slate-100">
            {!showCancel ? (
              <button onClick={() => setShowCancel(true)} className="w-full py-3.5 bg-rose-50 text-rose-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 cursor-pointer flex items-center justify-center gap-2"><XCircle size={14} /> Cancel Order</button>
            ) : (
              <div className="space-y-2">
                <input value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="Cancellation reason…" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none font-inter" />
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setShowCancel(false)} className="py-3 border border-slate-200 text-slate-500 rounded-xl text-[10px] font-black uppercase cursor-pointer hover:bg-slate-50">Back</button>
                  <button onClick={() => onAction(order.id, "cancel", { reason: cancelReason }, "Order cancelled")} className="py-3 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase cursor-pointer hover:bg-rose-700">Confirm</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// New freight order modal — the full client flow
function NewOrderModal({ categories, types, config, onClose, onSubmit }: {
  categories: TruckCategory[]; types: TruckType[]; config: TruckConfig | null;
  onClose: () => void; onSubmit: (fields: object) => void;
}) {
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [truckTypeId, setTruckTypeId] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [pickupWilaya, setPickupWilaya] = useState(DEFAULT_WILAYA);
  const [pickupCommune, setPickupCommune] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [km, setKm] = useState("");
  const [description, setDescription] = useState("");
  const [invoiceStatus, setInvoiceStatus] = useState("NOT_REQUIRED");
  const [scheduledType, setScheduledType] = useState("now");
  const [scheduledDate, setScheduledDate] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [quote, setQuote] = useState<number | null>(null);

  // Truck types allowed in the chosen category
  const selectedCat = categories.find(c => c.id === categoryId);
  const allowedTypes = selectedCat?.truckTypes ?? [];

  // Live price quote whenever inputs change
  useEffect(() => {
    if (!categoryId) { setQuote(null); return; }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/api/truck/quote`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ categoryId, truckTypeId: truckTypeId || undefined, distanceKm: km ? parseFloat(km) : undefined }),
        });
        if (res.ok) { const d = await res.json(); setQuote(d.estimatedPrice); }
      } catch { /* ignore */ }
    }, 300);
    return () => clearTimeout(t);
  }, [categoryId, truckTypeId, km]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeIn p-4">
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-5 relative text-left">
        <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400 hover:text-slate-800 cursor-pointer"><X size={18} /></button>
        <div className="space-y-1"><h2 className="text-xl font-black text-slate-800 uppercase">New Freight Order</h2><p className="text-xs text-slate-400 font-bold font-inter">Cargo pickup and delivery request</p></div>

        {/* Client */}
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Client Name *</label>
            <input value={clientName} onChange={e => setClientName(e.target.value)} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:bg-white" /></div>
          <div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Client Phone *</label>
            <input value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="+213 …" className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:bg-white" /></div>
        </div>

        {/* Category + truck type (type list depends on category) */}
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Service Category *</label>
            <select value={categoryId} onChange={e => { setCategoryId(e.target.value); setTruckTypeId(""); }} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black outline-none focus:bg-white">
              <option value="">Choose…</option>
              {categories.filter(c => c.isActive).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select></div>
          <div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Truck Type</label>
            <select value={truckTypeId} onChange={e => setTruckTypeId(e.target.value)} disabled={!categoryId} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black outline-none focus:bg-white disabled:opacity-50">
              <option value="">{categoryId ? "Any allowed truck" : "Pick a category first"}</option>
              {allowedTypes.filter(t => t.isActive).map(t => <option key={t.id} value={t.id}>{t.name}{t.capacityLabel ? ` — ${t.capacityLabel}` : ""}</option>)}
            </select></div>
        </div>

        {/* Positions */}
        <div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2 flex items-center gap-1"><MapPin size={10} className="text-emerald-500" /> Pickup (your position) *</label>
          <input value={pickupAddress} onChange={e => setPickupAddress(e.target.value)} placeholder="e.g. Cité El Hidhab, Sétif" className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:bg-white" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Wilaya</label>
            <select value={pickupWilaya} onChange={e => { setPickupWilaya(e.target.value); setPickupCommune(""); }} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black outline-none focus:bg-white">
              {Object.keys(WILAYAS).map(w => <option key={w} value={w}>{w}</option>)}</select></div>
          <div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Commune</label>
            <select value={pickupCommune} onChange={e => setPickupCommune(e.target.value)} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black outline-none focus:bg-white">
              <option value="">— Select —</option>{(WILAYAS[pickupWilaya] || []).map(c => <option key={c} value={c}>{c}</option>)}</select></div>
        </div>
        <div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2 flex items-center gap-1"><Navigation size={10} className="text-rose-500" /> Destination (next move) *</label>
          <input value={destinationAddress} onChange={e => setDestinationAddress(e.target.value)} placeholder="e.g. Zone industrielle, El Eulma" className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:bg-white" /></div>
        <div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Distance (km)</label>
          <input type="number" value={km} onChange={e => setKm(e.target.value)} placeholder="e.g. 27" className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:bg-white" /></div>

        {/* Description */}
        <div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Cargo Description *</label>
          <textarea rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder="What are you transporting?" className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:bg-white resize-none" /></div>

        {/* Invoice question */}
        <div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2 flex items-center gap-1"><FileText size={10} /> Do you have the required invoice for the cargo? *</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { v: "HAS_INVOICE", label: "Yes, I have" },
              { v: "NO_INVOICE", label: "No…" },
              { v: "NOT_REQUIRED", label: "Doesn't need one" },
            ].map(opt => (
              <button key={opt.v} onClick={() => setInvoiceStatus(opt.v)} className={`py-3 px-2 rounded-2xl border text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${invoiceStatus === opt.v ? "bg-teal-600 text-white border-teal-600" : "bg-white text-slate-500 border-slate-200 hover:border-teal-300"}`}>{opt.label}</button>
            ))}
          </div>
        </div>

        {/* Schedule */}
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2 flex items-center gap-1"><Calendar size={10} /> When?</label>
            <div className="grid grid-cols-2 gap-2">
              {[{ v: "now", label: "Now" }, { v: "scheduled", label: "Pick a day" }].map(opt => (
                <button key={opt.v} onClick={() => setScheduledType(opt.v)} className={`py-3 rounded-2xl border text-[10px] font-black uppercase transition-all cursor-pointer ${scheduledType === opt.v ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-500 border-slate-200"}`}>{opt.label}</button>
              ))}
            </div></div>
          <div className={scheduledType === "scheduled" ? "" : "opacity-40 pointer-events-none"}>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Day</label>
            <input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black outline-none focus:bg-white" /></div>
        </div>

        {/* Promo */}
        <div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Promo Code (optional)</label>
          <input value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())} placeholder="e.g. TRUCK10" className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black font-mono uppercase outline-none focus:bg-white" /></div>

        {quote !== null && (
          <p className="text-[11px] font-bold text-slate-600 font-inter bg-teal-50 border border-teal-100 rounded-xl px-4 py-3">
            📐 Calculated price: <strong className="text-teal-700">{quote.toLocaleString()} DZD</strong>
            {promoCode && <span className="text-emerald-700"> — promo discount applied automatically</span>}
          </p>
        )}

        <button
          onClick={() => {
            if (!clientName || !clientPhone || !categoryId || !pickupAddress || !destinationAddress || !description) { alert("Please fill all required fields."); return; }
            onSubmit({
              clientName, clientPhone, categoryId, ...(truckTypeId && { truckTypeId }),
              pickupAddress, pickupWilaya, pickupCommune, destinationAddress,
              ...(km && { distanceKm: parseFloat(km) }),
              description, invoiceStatus, scheduledType, ...(scheduledType === "scheduled" && { scheduledDate }),
              ...(promoCode && { promoCode }),
            });
          }}
          className="w-full py-4 bg-teal-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-teal-700 shadow-lg shadow-teal-600/20 transition-all cursor-pointer">
          Create Freight Order
        </button>
      </div>
    </div>
  );
}

// ══════════════════ CATEGORIES ══════════════════

function CategoriesPage({ categories, types, onSave, onDelete, showToast }: {
  categories: TruckCategory[]; types: TruckType[];
  onSave: (fields: object, id?: string) => Promise<any>; onDelete: (id: string) => void; showToast: (m: string) => void;
}) {
  const [editing, setEditing] = useState<TruckCategory | null>(null);
  const [showNew, setShowNew] = useState(false);
  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fadeIn pb-16 text-left">
      <div className="flex justify-between items-start">
        <div className="space-y-2"><h1 className="text-3xl font-black tracking-tighter text-slate-800 uppercase">Freight Categories</h1>
          <p className="text-sm text-slate-400 font-medium font-inter">Each category defines which truck types are allowed to serve it</p></div>
        <button onClick={() => setShowNew(true)} className="px-5 py-2.5 bg-teal-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-teal-700 shadow-lg shadow-teal-600/20 cursor-pointer flex items-center gap-2"><Plus size={14} /> New Category</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {categories.map(c => (
          <div key={c.id} className={`bg-white border rounded-[2rem] p-6 shadow-sm ${c.isActive ? "border-slate-100" : "border-slate-100 opacity-60"}`}>
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                {c.image
                  ? <img src={c.image.startsWith("/uploads") ? `${API_URL}${c.image}` : c.image} alt={c.name} className="w-11 h-11 rounded-2xl object-cover border border-slate-100" />
                  : <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center"><FolderKanban size={18} /></div>}
                <div><p className="text-sm font-black text-slate-800 uppercase tracking-tight">{c.name}</p><p className="text-[10px] font-bold text-slate-400 font-inter">{c.description || "—"}</p></div>
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => setEditing(c)} className="w-8 h-8 rounded-lg hover:bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-500 cursor-pointer"><Edit2 size={13} /></button>
                <button onClick={() => { if (confirm(`Delete ${c.name}?`)) onDelete(c.id); }} className="w-8 h-8 rounded-lg hover:bg-rose-50 flex items-center justify-center border border-slate-100 text-rose-500 cursor-pointer"><Trash2 size={13} /></button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(c.truckTypes ?? []).map(t => <span key={t.id} className="text-[9px] font-black uppercase px-2 py-1 bg-slate-100 text-slate-600 rounded-lg">{t.name}</span>)}
              {(c.truckTypes ?? []).length === 0 && <span className="text-[9px] font-bold text-rose-500 italic">No truck types assigned</span>}
            </div>
          </div>
        ))}
      </div>
      {(showNew || editing) && <CategoryModal category={editing} types={types} onClose={() => { setShowNew(false); setEditing(null); }} onSave={async (f) => { const r = await onSave(f, editing?.id); if (r) { setShowNew(false); setEditing(null); showToast(editing ? "Category updated ✓" : "Category created ✓"); } }} />}
    </div>
  );
}

function CategoryModal({ category, types, onClose, onSave }: {
  category: TruckCategory | null; types: TruckType[]; onClose: () => void; onSave: (f: object) => void;
}) {
  const [name, setName] = useState(category?.name ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [image, setImage] = useState(category?.image ?? "");
  const [isActive, setIsActive] = useState(category?.isActive ?? true);
  const [selectedTypes, setSelectedTypes] = useState<string[]>((category?.truckTypes ?? []).map(t => t.id));
  const toggle = (id: string) => setSelectedTypes(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeIn p-4">
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-5 relative text-left">
        <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400 cursor-pointer"><X size={18} /></button>
        <h2 className="text-xl font-black text-slate-800 uppercase">{category ? "Edit Category" : "New Category"}</h2>
        <div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Name *</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. House Moving" className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:bg-white" /></div>
        <div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Description</label>
          <input value={description ?? ""} onChange={e => setDescription(e.target.value)} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:bg-white" /></div>
        <ImageUploadField label="Category Picture" value={image} onChange={setImage} />
        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="w-4 h-4 accent-teal-600" /><span className="text-[10px] font-black text-slate-600 uppercase">Active</span></label>
        <div>
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Allowed Truck Types (select which can serve this category)</label>
          <div className="grid grid-cols-2 gap-2">
            {types.map(t => (
              <button key={t.id} onClick={() => toggle(t.id)} className={`py-2.5 px-3 rounded-xl border text-[10px] font-black uppercase tracking-wider text-left transition-all cursor-pointer flex items-center gap-2 ${selectedTypes.includes(t.id) ? "bg-teal-600 text-white border-teal-600" : "bg-white text-slate-500 border-slate-200"}`}>
                {selectedTypes.includes(t.id) && <Check size={11} />} {t.name}
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => { if (!name) { alert("Name required"); return; } onSave({ name, description, image, isActive, truckTypeIds: selectedTypes }); }}
          className="w-full py-4 bg-teal-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-teal-700 cursor-pointer flex items-center justify-center gap-2"><Check size={14} /> {category ? "Save" : "Create"}</button>
      </div>
    </div>
  );
}

// ══════════════════ TRUCK TYPES ══════════════════

function TypesPage({ types, onSave, onDelete }: {
  types: TruckType[]; onSave: (fields: object, id?: string) => Promise<any>; onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState<TruckType | null>(null);
  const [showNew, setShowNew] = useState(false);
  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fadeIn pb-16 text-left">
      <div className="flex justify-between items-start">
        <div className="space-y-2"><h1 className="text-3xl font-black tracking-tighter text-slate-800 uppercase">Truck Types</h1>
          <p className="text-sm text-slate-400 font-medium font-inter">Each type has a price multiplier used by the pricing formula</p></div>
        <button onClick={() => setShowNew(true)} className="px-5 py-2.5 bg-teal-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-teal-700 shadow-lg shadow-teal-600/20 cursor-pointer flex items-center gap-2"><Plus size={14} /> New Truck Type</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {types.map(t => (
          <div key={t.id} className={`bg-white border rounded-[2rem] p-6 shadow-sm ${t.isActive ? "border-slate-100" : "border-slate-100 opacity-60"}`}>
            <div className="flex justify-between items-start">
              {t.image
                ? <img src={t.image.startsWith("/uploads") ? `${API_URL}${t.image}` : t.image} alt={t.name} className="w-11 h-11 rounded-2xl object-cover border border-slate-100" />
                : <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center"><Truck size={18} /></div>}
              <div className="flex gap-1.5">
                <button onClick={() => setEditing(t)} className="w-8 h-8 rounded-lg hover:bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-500 cursor-pointer"><Edit2 size={13} /></button>
                <button onClick={() => { if (confirm(`Delete ${t.name}?`)) onDelete(t.id); }} className="w-8 h-8 rounded-lg hover:bg-rose-50 flex items-center justify-center border border-slate-100 text-rose-500 cursor-pointer"><Trash2 size={13} /></button>
              </div>
            </div>
            <p className="text-sm font-black text-slate-800 uppercase tracking-tight mt-3">{t.name}</p>
            <p className="text-[10px] font-bold text-slate-400 font-inter">{t.description || "—"}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {t.capacityLabel && <span className="text-[9px] font-black uppercase px-2 py-1 bg-slate-100 text-slate-600 rounded-lg">{t.capacityLabel}</span>}
              <span className="text-[9px] font-black uppercase px-2 py-1 bg-teal-50 text-teal-700 rounded-lg">× {t.priceMultiplier} price</span>
              <span className="text-[9px] font-black uppercase px-2 py-1 bg-slate-100 text-slate-500 rounded-lg">{t._count?.trucks ?? 0} trucks</span>
            </div>
          </div>
        ))}
      </div>
      {(showNew || editing) && <TypeModal type={editing} onClose={() => { setShowNew(false); setEditing(null); }} onSave={async (f) => { const r = await onSave(f, editing?.id); if (r) { setShowNew(false); setEditing(null); } }} />}
    </div>
  );
}

function TypeModal({ type, onClose, onSave }: { type: TruckType | null; onClose: () => void; onSave: (f: object) => void; }) {
  const [name, setName] = useState(type?.name ?? "");
  const [description, setDescription] = useState(type?.description ?? "");
  const [capacityLabel, setCapacityLabel] = useState(type?.capacityLabel ?? "");
  const [priceMultiplier, setPriceMultiplier] = useState(String(type?.priceMultiplier ?? 1));
  const [image, setImage] = useState(type?.image ?? "");
  const [isActive, setIsActive] = useState(type?.isActive ?? true);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeIn p-4">
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl p-8 max-w-md w-full space-y-5 relative text-left">
        <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400 cursor-pointer"><X size={18} /></button>
        <h2 className="text-xl font-black text-slate-800 uppercase">{type ? "Edit Truck Type" : "New Truck Type"}</h2>
        <div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Name *</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Flatbed 5T" className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:bg-white" /></div>
        <div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Description</label>
          <input value={description ?? ""} onChange={e => setDescription(e.target.value)} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:bg-white" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Capacity label</label>
            <input value={capacityLabel ?? ""} onChange={e => setCapacityLabel(e.target.value)} placeholder="up to 5 tons" className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:bg-white" /></div>
          <div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Price multiplier</label>
            <input type="number" step="0.1" value={priceMultiplier} onChange={e => setPriceMultiplier(e.target.value)} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black outline-none focus:bg-white" /></div>
        </div>
        <ImageUploadField label="Truck Type Picture" value={image} onChange={setImage} />
        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="w-4 h-4 accent-teal-600" /><span className="text-[10px] font-black text-slate-600 uppercase">Active</span></label>
        <button onClick={() => { if (!name) { alert("Name required"); return; } onSave({ name, description, capacityLabel, priceMultiplier: parseFloat(priceMultiplier) || 1, image, isActive }); }}
          className="w-full py-4 bg-teal-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-teal-700 cursor-pointer flex items-center justify-center gap-2"><Check size={14} /> {type ? "Save" : "Create"}</button>
      </div>
    </div>
  );
}

// ══════════════════ TRUCKS ══════════════════

function TrucksPage({ trucks, types, onCreate, onUpdate, onSetStatus, onDelete }: {
  trucks: TruckVehicle[]; types: TruckType[];
  onCreate: (f: object) => Promise<any>; onUpdate: (id: string, f: object) => Promise<any>;
  onSetStatus: (id: string, status: string) => void; onDelete: (id: string) => void;
}) {
  const [showNew, setShowNew] = useState(false);
  const [editing, setEditing] = useState<TruckVehicle | null>(null);
  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fadeIn pb-16 text-left">
      <div className="flex justify-between items-start">
        <div className="space-y-2"><h1 className="text-3xl font-black tracking-tighter text-slate-800 uppercase">Trucks</h1>
          <p className="text-sm text-slate-400 font-medium font-inter">Each truck is a driver account (default password: trucker123). Drivers can also sign up themselves and pick their truck.</p></div>
        <button onClick={() => setShowNew(true)} className="px-5 py-2.5 bg-teal-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-teal-700 shadow-lg shadow-teal-600/20 cursor-pointer flex items-center gap-2"><Plus size={14} /> Add Truck</button>
      </div>
      <div className="space-y-4">
        {trucks.map(t => (
          <div key={t.id} className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {t.profileImage
                ? <img src={t.profileImage.startsWith("/uploads") ? `${API_URL}${t.profileImage}` : t.profileImage} alt={t.driverName} className="w-12 h-12 rounded-2xl object-cover border border-slate-100" />
                : <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-black text-sm uppercase">{t.driverName.split(" ").map(n => n[0]).join("")}</div>}
              <div>
                <p className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">{t.driverName}{t.isVerified && <Shield size={12} className="text-emerald-500 fill-emerald-500" />}</p>
                <p className="text-[10px] font-bold text-slate-400 font-inter">{t.truckCode} · {t.truckType?.name || "No type"} · {t.plate || "no plate"} · ⭐ {t.rating}</p>
                <span className={`inline-block mt-1 text-[9px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider border ${t.status === "available" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : t.status === "busy" ? "bg-amber-50 text-amber-700 border-amber-200" : t.status === "suspended" ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-slate-50 text-slate-500 border-slate-200"}`}>{t.status}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <p className="text-[10px] font-bold text-slate-400 font-inter">{t.totalTrips} trips</p>
              {!t.isVerified && <button onClick={() => onUpdate(t.id, { isVerified: true })} className="px-3 py-2 bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase tracking-wider hover:bg-emerald-600 cursor-pointer">Verify</button>}
              <button onClick={() => setEditing(t)} className="px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-[9px] font-black uppercase tracking-wider hover:bg-slate-50 cursor-pointer flex items-center gap-1.5"><Edit2 size={11} /> Edit</button>
              {t.status === "suspended" ? (
                <button onClick={() => onSetStatus(t.id, "available")} className="px-3 py-2 bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase tracking-wider hover:bg-blue-700 cursor-pointer">Reactivate</button>
              ) : (
                <button onClick={() => { if (confirm(`Suspend ${t.driverName}?`)) onSetStatus(t.id, "suspended"); }} className="px-3 py-2 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-[9px] font-black uppercase tracking-wider hover:bg-rose-100 cursor-pointer">Suspend</button>
              )}
              <button onClick={() => { if (confirm(`Delete ${t.driverName}?`)) onDelete(t.id); }} className="w-8 h-8 rounded-lg hover:bg-rose-50 flex items-center justify-center border border-slate-100 text-rose-500 cursor-pointer"><Trash2 size={13} /></button>
            </div>
          </div>
        ))}
        {trucks.length === 0 && <p className="text-xs text-slate-400 font-bold font-inter text-center py-10 bg-white border border-slate-100 rounded-[2rem]">No trucks yet.</p>}
      </div>
      {showNew && <TruckModal truck={null} types={types} onClose={() => setShowNew(false)} onSave={async (f) => { const r = await onCreate(f); if (r) setShowNew(false); }} />}
      {editing && <TruckModal truck={editing} types={types} onClose={() => setEditing(null)} onSave={async (f) => { const r = await onUpdate(editing.id, f); if (r) setEditing(null); }} />}
    </div>
  );
}

function TruckModal({ truck, types, onClose, onSave }: { truck: TruckVehicle | null; types: TruckType[]; onClose: () => void; onSave: (f: object) => void; }) {
  const editMode = !!truck;
  const [driverName, setDriverName] = useState(truck?.driverName ?? "");
  const [phone, setPhone] = useState(truck?.phone ?? "");
  const [plate, setPlate] = useState(truck?.plate ?? "");
  const [truckTypeId, setTruckTypeId] = useState(truck?.truckTypeId ?? "");
  const [profileImage, setProfileImage] = useState(truck?.profileImage ?? "");
  const [isVerified, setIsVerified] = useState(truck?.isVerified ?? true);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeIn p-4">
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl p-8 max-w-md w-full space-y-5 relative text-left">
        <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400 cursor-pointer"><X size={18} /></button>
        <h2 className="text-xl font-black text-slate-800 uppercase">{editMode ? `Edit ${truck!.truckCode}` : "Add Truck"}</h2>
        <div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Driver Name *</label>
          <input value={driverName} onChange={e => setDriverName(e.target.value)} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:bg-white" /></div>
        <div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Phone *</label>
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+213 …" className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:bg-white" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Truck Type</label>
            <select value={truckTypeId ?? ""} onChange={e => setTruckTypeId(e.target.value)} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black outline-none focus:bg-white">
              <option value="">—</option>{types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
          <div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Plate</label>
            <input value={plate ?? ""} onChange={e => setPlate(e.target.value)} placeholder="00111-119-19" className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:bg-white" /></div>
        </div>
        <ImageUploadField label="Truck / Driver Photo" value={profileImage} onChange={setProfileImage} />
        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={isVerified} onChange={e => setIsVerified(e.target.checked)} className="w-4 h-4 accent-teal-600" /><span className="text-xs font-bold text-slate-600 font-inter">Documents checked — verified</span></label>
        <button onClick={() => {
            if (!driverName || !phone) { alert("Name and phone required"); return; }
            const fields: Record<string, unknown> = { driverName, phone, plate, truckTypeId: truckTypeId || null, profileImage: profileImage || null, isVerified };
            if (!editMode) { fields.wilaya = "Sétif"; fields.commune = "Sétif"; }
            onSave(fields);
          }}
          className="w-full py-4 bg-teal-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-teal-700 cursor-pointer">{editMode ? "Save Changes" : "Register Truck"}</button>
      </div>
    </div>
  );
}

// ══════════════════ PRICING & EARNINGS ══════════════════

function PricingPage({ stats, trucks, orders, config, onSave }: {
  stats: TruckStats | null; trucks: TruckVehicle[]; orders: TruckOrder[]; config: TruckConfig | null;
  onSave: (c: TruckConfig) => void;
}) {
  const [base, setBase] = useState("");
  const [perKm, setPerKm] = useState("");
  const [minFare, setMinFare] = useState("");
  const [commission, setCommission] = useState("");
  useEffect(() => { if (config) { setBase(String(config.truckBaseFare)); setPerKm(String(config.truckPerKm)); setMinFare(String(config.truckMinFare)); setCommission(String(config.truckCommissionPercent)); } }, [config]);

  // example: 20 km, ×1.6 flatbed
  const exKm = 20, exMult = 1.6;
  const exPrice = Math.max(parseInt(minFare || "0") || 0, Math.round((((parseInt(base || "0") || 0) + exKm * (parseFloat(perKm || "0") || 0)) * exMult) / 10) * 10);
  const exCom = Math.round((exPrice * (parseFloat(commission || "0") || 0)) / 100);

  // per-truck payouts from completed orders
  const payoutByTruck = new Map<string, { name: string; code: string; jobs: number; gross: number; commission: number; net: number }>();
  for (const o of orders.filter(o => o.status === "delivered" && o.truck)) {
    const key = o.truck!.id;
    const cur = payoutByTruck.get(key) || { name: o.truck!.driverName, code: o.truck!.truckCode, jobs: 0, gross: 0, commission: 0, net: 0 };
    cur.jobs++; cur.gross += o.agreedPrice ?? 0; cur.commission += o.commissionAmount ?? 0; cur.net += o.driverEarnings ?? 0;
    payoutByTruck.set(key, cur);
  }
  const payouts = [...payoutByTruck.values()].sort((a, b) => b.gross - a.gross);

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fadeIn pb-16 text-left">
      <div className="space-y-2"><h1 className="text-3xl font-black tracking-tighter text-slate-800 uppercase">Truck Pricing & Earnings</h1>
        <p className="text-sm text-slate-400 font-medium font-inter">The editable freight pricing formula and what each truck earns</p></div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Gross Revenue", value: dzd(stats?.grossRevenue), sub: `${stats?.completedOrders ?? 0} delivered`, cls: "text-slate-800" },
          { label: `Commission (${config?.truckCommissionPercent ?? 12}%)`, value: dzd(stats?.commissionRevenue), sub: "Platform earnings", cls: "text-emerald-600" },
          { label: "Driver Payouts", value: dzd(stats?.driverPayouts), sub: "What drivers kept", cls: "text-blue-600" },
          { label: "Cancelled", value: String(stats?.cancelledOrders ?? 0), sub: "Lost jobs", cls: "text-rose-600" },
        ].map(t => (
          <div key={t.label} className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{t.label}</span>
            <span className={`text-2xl font-black tracking-tight block mt-2 ${t.cls}`}>{t.value}</span>
            <p className="text-[10px] text-slate-400 font-bold font-inter mt-1">{t.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center"><Percent size={20} /></div>
          <div><h3 className="text-sm font-black uppercase tracking-tight text-slate-800">Freight Pricing Formula</h3>
            <p className="text-xs text-slate-400 font-bold font-inter">price = max(min, (base + km × per-km) × truck-type multiplier)</p></div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[{ label: "Base Fare (DZD)", value: base, set: setBase }, { label: "Per Km (DZD)", value: perKm, set: setPerKm }, { label: "Minimum (DZD)", value: minFare, set: setMinFare }, { label: "Commission (%)", value: commission, set: setCommission }].map(f => (
            <div key={f.label}><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">{f.label}</label>
              <input type="number" value={f.value} onChange={e => f.set(e.target.value)} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black outline-none focus:bg-white focus:ring-4 focus:ring-teal-500/10" /></div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-teal-50/60 border border-teal-100 rounded-2xl p-4">
          <p className="text-[11px] font-bold text-slate-600 font-inter">📐 Example — 20 km with a Flatbed 5T (×1.6): client pays <strong className="text-teal-700">{exPrice.toLocaleString()} DZD</strong>, platform takes <strong className="text-emerald-700">{exCom.toLocaleString()} DZD</strong>, driver keeps <strong className="text-blue-700">{(exPrice - exCom).toLocaleString()} DZD</strong></p>
          <button onClick={() => onSave({ truckBaseFare: parseInt(base) || 0, truckPerKm: parseFloat(perKm) || 0, truckMinFare: parseInt(minFare) || 0, truckCommissionPercent: parseFloat(commission) || 0 })}
            className="px-8 py-3.5 bg-teal-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-teal-700 shadow-lg shadow-teal-600/20 cursor-pointer flex items-center gap-2 shrink-0"><Check size={14} /> Save Formula</button>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
        <h3 className="text-sm font-black uppercase tracking-tight text-slate-800 mb-6">Truck Payouts</h3>
        {payouts.length === 0 ? <p className="text-xs text-slate-400 font-bold font-inter text-center py-6">No completed jobs yet.</p> : (
          <div className="overflow-x-auto">
            <table className="data-table text-left">
              <thead><tr className="border-b border-slate-50 text-[10px] uppercase tracking-widest text-slate-400">
                <th className="pb-4 font-black">Truck</th><th className="pb-4 font-black text-center">Jobs</th>
                <th className="pb-4 font-black text-right">Gross</th><th className="pb-4 font-black text-right">Commission</th><th className="pb-4 font-black text-right">Driver Keeps</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-50 text-xs font-semibold text-slate-700">
                {payouts.map(p => (
                  <tr key={p.code} className="hover:bg-slate-50/60"><td className="py-4 font-black text-slate-800 uppercase">{p.name} <span className="text-slate-400 font-bold normal-case">({p.code})</span></td>
                    <td className="py-4 text-center"><span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-black">{p.jobs}</span></td>
                    <td className="py-4 text-right font-black text-slate-800">{dzd(p.gross)}</td>
                    <td className="py-4 text-right font-black text-emerald-600">{dzd(p.commission)}</td>
                    <td className="py-4 text-right font-black text-blue-600">{dzd(p.net)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
