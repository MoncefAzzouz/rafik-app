"use client";

import { API_URL } from "@/lib/api";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Car, DollarSign, CheckCircle2, XCircle, Plus, X, Shield, ShieldAlert, Phone, MapPin,
  Check, RefreshCw, Users, AlertTriangle, ChevronRight, Navigation,
  HandCoins, Ban, Flag, Percent,
} from "lucide-react";

// ══════════════════ TYPES ══════════════════

interface TaxiDriverLite {
  id: string; name: string; phone?: string; rating: number; status: string;
  vehicleType?: string; vehicleModel?: string | null; vehicleColor?: string | null; vehiclePlate?: string | null;
  profileImage?: string | null;
}

interface TaxiRide {
  id: string; rideNumber: string;
  clientName: string; clientPhone: string;
  pickupAddress: string; pickupWilaya?: string | null; pickupCommune?: string | null;
  destinationAddress: string; distanceKm?: number | null;
  // Price is calculated by the admin's formula — no negotiation
  estimatedFare?: number | null; promoDiscount?: number | null; promoCodeId?: string | null;
  agreedFare?: number | null;
  status: string;
  driverId?: string | null; driver?: TaxiDriverLite | null;
  commissionPercentSnapshot?: number | null; commissionAmount?: number | null; driverEarnings?: number | null;
  cancelledBy?: string | null; cancelReason?: string | null; cancelStage?: string | null;
  acceptedAt?: string | null; arrivedAt?: string | null; startedAt?: string | null; completedAt?: string | null;
  createdAt: string;
}

interface DriverStats {
  id: string; driverCode: string; name: string; phone: string; status: string; service: string;
  isVerified: boolean; vehicleModel?: string | null; vehicleColor?: string | null; vehiclePlate?: string | null;
  rating: number;
  matchedRides: number; completedRides: number;
  cancelledByDriver: number; cancelledByClient: number; lateCancels: number;
  cancelRate: number; completionRate: number;
  grossFares: number; commissionPaid: number; earnings: number;
  fraudAlerts: { type: string; severity: string }[]; fraudFlagged: boolean;
}

interface FraudAlert {
  id: string; type: string; severity: "LOW" | "MEDIUM" | "HIGH";
  driverId?: string | null; driver?: { id: string; name: string; driverCode: string; phone: string; status: string } | null;
  clientPhone?: string | null; clientName?: string | null; rideId?: string | null;
  message: string; details?: Record<string, number> | null;
  isResolved: boolean; action?: string | null; createdAt: string;
}

interface TaxiStats {
  totalRides: number; activeRides: number; completedRides: number; cancelledRides: number; cancelRate: number;
  grossFares: number; commissionRevenue: number; driverPayouts: number;
  driversTotal: number; driversAvailable: number; driversBusy: number; driversSuspended: number;
  unresolvedAlerts: number; statusBreakdown: Record<string, number>;
}

interface TaxiConfig {
  taxiBaseFare: number; taxiPerKm: number; taxiMinFare: number; taxiCommissionPercent: number;
}

const RIDE_STATUS: Record<string, { label: string; cls: string }> = {
  requested: { label: "Requested", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  accepted: { label: "Accepted", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  driver_arrived: { label: "Driver Arrived", cls: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  in_ride: { label: "In Ride", cls: "bg-orange-50 text-orange-700 border-orange-200" },
  completed: { label: "Completed", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  cancelled_by_client: { label: "Cancelled (Client)", cls: "bg-rose-50 text-rose-700 border-rose-200" },
  cancelled_by_driver: { label: "Cancelled (Driver)", cls: "bg-rose-50 text-rose-700 border-rose-200" },
  cancelled_by_admin: { label: "Cancelled (Admin)", cls: "bg-rose-50 text-rose-700 border-rose-200" },
  expired: { label: "Expired", cls: "bg-slate-50 text-slate-500 border-slate-200" },
};

const ALERT_TYPE: Record<string, { label: string; hint: string }> = {
  DRIVER_EXCESSIVE_CANCELLATIONS: { label: "Driver cancels too much", hint: "Driver keeps cancelling accepted rides" },
  CLIENT_EXCESSIVE_CANCELLATIONS: { label: "Client cancels too much", hint: "Same phone number cancelling repeatedly" },
  PAIR_COLLUSION: { label: "Driver + Client collusion", hint: "Same pair matches then cancels — likely doing the ride in cash off-app" },
  LATE_CANCEL_PATTERN: { label: "Cancels after arrival", hint: "Rides cancelled after the driver already arrived at pickup" },
};

const dzd = (n: number | null | undefined) => `${(n ?? 0).toLocaleString()} DZD`;

// ══════════════════ MAIN ══════════════════

interface TaxiDashboardProps {
  activePage: string;
}

export default function TaxiDashboard({ activePage }: TaxiDashboardProps) {
  const { token } = useAuth();

  const [stats, setStats] = useState<TaxiStats | null>(null);
  const [rides, setRides] = useState<TaxiRide[]>([]);
  const [driverStats, setDriverStats] = useState<DriverStats[]>([]);
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [config, setConfig] = useState<TaxiConfig | null>(null);

  const [selectedRide, setSelectedRide] = useState<TaxiRide | null>(null);
  const [showNewRide, setShowNewRide] = useState(false);
  const [showAddDriver, setShowAddDriver] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 4000); };

  const fetchAll = useCallback(async () => {
    try {
      const h = { headers: { Authorization: `Bearer ${token}` } };
      const [rS, rR, rD, rA, rC] = await Promise.all([
        fetch(`${API_URL}/api/taxi/stats`, h),
        fetch(`${API_URL}/api/taxi/rides`, h),
        fetch(`${API_URL}/api/taxi/driver-stats`, h),
        fetch(`${API_URL}/api/taxi/alerts`, h),
        fetch(`${API_URL}/api/taxi/config`, h),
      ]);
      if (rS.ok) setStats(await rS.json());
      if (rR.ok) setRides(await rR.json());
      if (rD.ok) setDriverStats(await rD.json());
      if (rA.ok) setAlerts(await rA.json());
      if (rC.ok) setConfig(await rC.json());
    } catch (err) {
      console.error("Taxi fetch error:", err);
    }
  }, [token]);

  useEffect(() => { if (token) fetchAll(); }, [token, fetchAll]);

  // Keep the drawer in sync after refetches
  useEffect(() => {
    if (selectedRide) {
      const updated = rides.find(r => r.id === selectedRide.id);
      if (updated) setSelectedRide(updated);
    }
  }, [rides, selectedRide]);

  // ── API actions ──
  const post = async (path: string, body?: object) => {
    const res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body ?? {}),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { showToast(`⚠ ${data.error || "Action failed"}`); return null; }
    fetchAll();
    return data;
  };

  const rideAction = async (rideId: string, action: string, body?: object, label?: string) => {
    const out = await post(`/api/taxi/rides/${rideId}/${action}`, body);
    if (out) showToast(label || `Ride ${action} ✓`);
    return out;
  };

  const renderView = () => {
    if (activePage === "rides") return (
      <RidesPage rides={rides} onSelect={setSelectedRide} onNewRide={() => setShowNewRide(true)} onRefresh={fetchAll} />
    );
    if (activePage === "drivers") return (
      <DriversPage drivers={driverStats} onAddDriver={() => setShowAddDriver(true)} onRefresh={fetchAll}
        onDriverUpdate={async (id, fields) => {
          const res = await fetch(`${API_URL}/api/drivers/${id}`, {
            method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(fields),
          });
          if (res.ok) { fetchAll(); showToast("Driver updated ✓"); }
        }}
        onSetStatus={async (id, status) => {
          const res = await fetch(`${API_URL}/api/drivers/${id}/status`, {
            method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ status }),
          });
          if (res.ok) { fetchAll(); showToast(`Driver ${status.toLowerCase()} ✓`); }
        }}
      />
    );
    if (activePage === "security") return (
      <SecurityPage alerts={alerts}
        onResolve={async (id, action) => {
          const out = await post(`/api/taxi/alerts/${id}/resolve`, { action });
          if (out) showToast(action === "suspended" ? "🚫 Driver suspended" : "Alert resolved ✓");
        }}
      />
    );
    if (activePage === "earnings") return (
      <TaxiEarningsPage stats={stats} drivers={driverStats} config={config}
        onSaveConfig={async (c) => {
          const res = await fetch(`${API_URL}/api/taxi/config`, {
            method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(c),
          });
          if (res.ok) { setConfig(await res.json()); showToast("Fare settings saved ✓"); }
        }}
      />
    );
    return <OverviewPage stats={stats} rides={rides} alerts={alerts} onSelect={setSelectedRide} onRefresh={fetchAll} />;
  };

  return (
    <div className="relative">
      {toast && (
        <div className="fixed top-24 right-8 z-50 animate-fadeIn bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-800">
          <Car size={16} className="text-amber-400" />
          <span className="text-xs font-bold font-inter">{toast}</span>
        </div>
      )}

      {renderView()}

      {selectedRide && (
        <RideDrawer
          ride={selectedRide}
          drivers={driverStats}
          onClose={() => setSelectedRide(null)}
          onAction={rideAction}
        />
      )}

      {showNewRide && (
        <NewRideModal
          config={config}
          onClose={() => setShowNewRide(false)}
          onSubmit={async (fields) => {
            const res = await fetch(`${API_URL}/api/taxi/rides`, {
              method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(fields),
            });
            if (res.ok) { setShowNewRide(false); fetchAll(); showToast("🚕 Ride request created!"); }
            else { const d = await res.json().catch(() => ({})); showToast(`⚠ ${d.error || "Failed"}`); }
          }}
        />
      )}

      {showAddDriver && (
        <AddTaxiDriverModal
          onClose={() => setShowAddDriver(false)}
          onSubmit={async (fields) => {
            const res = await fetch(`${API_URL}/api/drivers`, {
              method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({ ...fields, vehicleType: "CAR", service: "TAXI" }),
            });
            if (res.ok) { setShowAddDriver(false); fetchAll(); showToast("🚗 Taxi driver registered!"); }
            else { const d = await res.json().catch(() => ({})); showToast(`⚠ ${d.error || "Failed"}`); }
          }}
        />
      )}
    </div>
  );
}

// ══════════════════ OVERVIEW ══════════════════

function OverviewPage({ stats, rides, alerts, onSelect, onRefresh }: {
  stats: TaxiStats | null; rides: TaxiRide[]; alerts: FraudAlert[];
  onSelect: (r: TaxiRide) => void; onRefresh: () => void;
}) {
  const unresolved = alerts.filter(a => !a.isResolved);
  const tiles = [
    { label: "Total Rides", value: String(stats?.totalRides ?? 0), sub: `${stats?.activeRides ?? 0} active now`, icon: Car, color: "bg-amber-50 text-amber-600" },
    { label: "Commission Revenue", value: dzd(stats?.commissionRevenue), sub: "Platform earnings", icon: DollarSign, color: "bg-emerald-50 text-emerald-600" },
    { label: "Drivers Available", value: `${stats?.driversAvailable ?? 0}/${stats?.driversTotal ?? 0}`, sub: `${stats?.driversBusy ?? 0} busy · ${stats?.driversSuspended ?? 0} suspended`, icon: Users, color: "bg-blue-50 text-blue-600" },
    { label: "Cancel Rate", value: `${stats?.cancelRate ?? 0}%`, sub: `${stats?.cancelledRides ?? 0} cancelled rides`, icon: XCircle, color: "bg-rose-50 text-rose-600" },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fadeIn pb-16 text-left">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tighter text-slate-800 uppercase">Taxi Dashboard</h1>
          <p className="text-sm text-slate-400 font-medium font-inter">Ride requests, price negotiation, and platform commission — inDrive-style</p>
        </div>
        <button onClick={onRefresh} className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase text-slate-600 hover:bg-slate-50 transition-all cursor-pointer flex items-center gap-2">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Fraud banner */}
      {unresolved.length > 0 && (
        <div className="bg-rose-600 text-white p-5 rounded-[2rem] flex items-center justify-between shadow-lg shadow-rose-600/20">
          <div className="flex items-center gap-3">
            <ShieldAlert size={22} />
            <div>
              <p className="text-sm font-black uppercase tracking-tight">{unresolved.length} anti-scam alert{unresolved.length > 1 ? "s" : ""} need your attention</p>
              <p className="text-[11px] font-bold text-rose-100">Possible off-app cash deals or abusive cancellations detected — check the Anti-Scam page</p>
            </div>
          </div>
          <ChevronRight size={18} />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {tiles.map((t) => {
          const Icon = t.icon;
          return (
            <div key={t.label} className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm flex items-center justify-between">
              <div className="space-y-1.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{t.label}</span>
                <span className="text-2xl font-black text-slate-800 tracking-tight block">{t.value}</span>
                <p className="text-[10px] text-slate-400 font-bold font-inter">{t.sub}</p>
              </div>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${t.color}`}>
                <Icon size={20} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent rides */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm space-y-5">
        <h3 className="text-sm font-black uppercase tracking-tight text-slate-800">Recent Rides</h3>
        {rides.length === 0 ? (
          <p className="text-xs text-slate-400 font-bold font-inter text-center py-8">No rides yet — create one from the Rides page.</p>
        ) : (
          <div className="space-y-3">
            {rides.slice(0, 6).map(r => {
              const st = RIDE_STATUS[r.status] || RIDE_STATUS.requested;
              return (
                <div key={r.id} onClick={() => onSelect(r)} className="border border-slate-100 p-5 rounded-2xl flex justify-between items-center hover:bg-slate-50 transition-colors cursor-pointer">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-slate-400 font-mono">{r.rideNumber}</span>
                    <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{r.clientName}</p>
                    <p className="text-[10px] text-slate-500 font-bold font-inter flex items-center gap-1">
                      <MapPin size={10} /> {r.pickupAddress} → {r.destinationAddress}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <span className={`text-[9px] px-3 py-1.5 rounded-full font-black uppercase tracking-wider border ${st.cls}`}>{st.label}</span>
                    <p className="text-xs font-black text-slate-700">{dzd(r.agreedFare ?? r.estimatedFare)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════ RIDES ══════════════════

function RidesPage({ rides, onSelect, onNewRide, onRefresh }: {
  rides: TaxiRide[]; onSelect: (r: TaxiRide) => void; onNewRide: () => void; onRefresh: () => void;
}) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = rides.filter(r =>
    (statusFilter === "all" || r.status === statusFilter ||
      (statusFilter === "cancelled" && r.status.startsWith("cancelled"))) &&
    (!search || r.rideNumber.toLowerCase().includes(search.toLowerCase()) ||
      r.clientName.toLowerCase().includes(search.toLowerCase()) || r.clientPhone.includes(search))
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fadeIn pb-16 text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tighter text-slate-800 uppercase">Rides</h1>
          <p className="text-sm text-slate-400 font-medium font-inter">Requests, driver offers, negotiation and dispatch</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onRefresh} className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase text-slate-600 hover:bg-slate-50 transition-all cursor-pointer">
            <RefreshCw size={13} />
          </button>
          <button onClick={onNewRide} className="px-5 py-2.5 bg-amber-500 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-amber-600 shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center gap-2">
            <Plus size={14} /> New Ride
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search number, client, phone…"
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none w-64 font-inter"
        />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase outline-none text-slate-700">
          <option value="all">All statuses</option>
          <option value="requested">Requested</option>
          <option value="accepted">Accepted</option>
          <option value="driver_arrived">Driver Arrived</option>
          <option value="in_ride">In Ride</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm overflow-x-auto">
        {filtered.length === 0 ? (
          <p className="text-xs text-slate-400 font-bold font-inter text-center py-8">No rides match your filters.</p>
        ) : (
          <table className="data-table text-left">
            <thead>
              <tr className="border-b border-slate-50 text-[10px] uppercase tracking-widest text-slate-400">
                <th className="pb-4 font-black">Ride</th>
                <th className="pb-4 font-black">Client</th>
                <th className="pb-4 font-black">Route</th>
                <th className="pb-4 font-black text-center">Km</th>
                <th className="pb-4 font-black text-right">Price</th>
                <th className="pb-4 font-black text-center">Promo</th>
                <th className="pb-4 font-black">Driver</th>
                <th className="pb-4 font-black text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs font-semibold text-slate-700">
              {filtered.map(r => {
                const st = RIDE_STATUS[r.status] || RIDE_STATUS.requested;
                return (
                  <tr key={r.id} onClick={() => onSelect(r)} className="hover:bg-slate-50/60 transition-colors cursor-pointer">
                    <td className="py-4 font-mono font-black text-amber-600">{r.rideNumber}</td>
                    <td className="py-4">
                      <p className="font-black text-slate-800 uppercase text-[11px]">{r.clientName}</p>
                      <p className="text-[10px] text-slate-400">{r.clientPhone}</p>
                    </td>
                    <td className="py-4 text-[11px] max-w-56 truncate">{r.pickupAddress} → {r.destinationAddress}</td>
                    <td className="py-4 text-center">{r.distanceKm ?? "—"}</td>
                    <td className="py-4 text-right font-black text-slate-800">{dzd(r.agreedFare ?? r.estimatedFare)}</td>
                    <td className="py-4 text-center">
                      {r.promoDiscount ? (
                        <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-lg text-[10px] font-black">−{r.promoDiscount}</span>
                      ) : "—"}
                    </td>
                    <td className="py-4 text-[11px] font-black">{r.driver?.name ?? "—"}</td>
                    <td className="py-4 text-center">
                      <span className={`text-[9px] px-3 py-1.5 rounded-full font-black uppercase tracking-wider border ${st.cls}`}>{st.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ══════════════════ RIDE DRAWER (negotiation + lifecycle) ══════════════════

function RideDrawer({ ride, drivers, onClose, onAction }: {
  ride: TaxiRide; drivers: DriverStats[];
  onClose: () => void;
  onAction: (id: string, action: string, body?: object, label?: string) => Promise<unknown>;
}) {
  const [assignDriverId, setAssignDriverId] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [showCancel, setShowCancel] = useState(false);

  const st = RIDE_STATUS[ride.status] || RIDE_STATUS.requested;
  const eligibleDrivers = drivers.filter(d => d.status !== "SUSPENDED");
  const isOpen = ride.status === "requested";
  const finished = ride.status === "completed" || ride.status.startsWith("cancelled") || ride.status === "expired";

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed top-0 right-0 bottom-0 w-full sm:w-130 bg-white z-50 shadow-2xl p-8 flex flex-col gap-6 overflow-y-auto animate-slideIn text-left">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-inter">Ride</span>
            <span className="font-mono text-xs font-black text-amber-600 px-2 py-0.5 bg-amber-50 rounded-md">{ride.rideNumber}</span>
            <span className={`text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-wider border ${st.cls}`}>{st.label}</span>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400 hover:text-slate-800 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Client + route */}
        <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 space-y-2">
          <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{ride.clientName}</p>
          <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 font-inter"><Phone size={12} /> {ride.clientPhone}</p>
          <div className="border-t border-slate-100 pt-3 mt-2 space-y-2">
            <p className="text-xs font-bold text-slate-600 font-inter flex items-start gap-1.5">
              <MapPin size={12} className="text-emerald-500 mt-0.5 shrink-0" /> {ride.pickupAddress}
              {ride.pickupCommune && <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-white text-slate-500 rounded-lg border border-slate-100 ml-1">{ride.pickupCommune}</span>}
            </p>
            <p className="text-xs font-bold text-slate-600 font-inter flex items-start gap-1.5">
              <Navigation size={12} className="text-rose-500 mt-0.5 shrink-0" /> {ride.destinationAddress}
            </p>
            {ride.distanceKm != null && <p className="text-[10px] font-black text-slate-400 uppercase">Distance: {ride.distanceKm} km</p>}
          </div>
        </div>

        {/* Money box — price is calculated by the formula, never negotiated */}
        <div className="bg-emerald-50/60 border border-emerald-100 p-5 rounded-3xl space-y-2">
          <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-1.5"><HandCoins size={12} /> Fixed Price (calculated)</span>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div><p className="text-[9px] font-black text-slate-400 uppercase">Calculated</p><p className="text-sm font-black text-slate-700">{dzd(ride.estimatedFare)}</p></div>
            <div><p className="text-[9px] font-black text-slate-400 uppercase">Promo</p><p className="text-sm font-black text-amber-600">{ride.promoDiscount ? `− ${dzd(ride.promoDiscount)}` : "—"}</p></div>
            <div><p className="text-[9px] font-black text-slate-400 uppercase">Client Pays</p><p className="text-sm font-black text-emerald-600">{dzd(ride.agreedFare ?? ride.estimatedFare)}</p></div>
          </div>
          {ride.status === "completed" && (
            <div className="border-t border-emerald-100 pt-2 grid grid-cols-2 gap-3 text-center">
              <div><p className="text-[9px] font-black text-slate-400 uppercase">Platform ({ride.commissionPercentSnapshot}%)</p><p className="text-sm font-black text-emerald-700">{dzd(ride.commissionAmount)}</p></div>
              <div><p className="text-[9px] font-black text-slate-400 uppercase">Driver Keeps</p><p className="text-sm font-black text-slate-700">{dzd(ride.driverEarnings)}</p></div>
            </div>
          )}
        </div>

        {/* Assigned driver */}
        {ride.driver && (
          <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{ride.driver.name}</p>
              <p className="text-[10px] font-bold text-slate-400 font-inter">
                {[ride.driver.vehicleModel, ride.driver.vehicleColor, ride.driver.vehiclePlate].filter(Boolean).join(" · ") || "Taxi driver"}
              </p>
            </div>
            <p className="text-xs font-black text-slate-700">⭐ {ride.driver.rating}</p>
          </div>
        )}

        {/* OPEN REQUEST: dispatch a driver — the fare is already fixed by the formula */}
        {isOpen && (
          <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl space-y-2">
            <span className="text-[9px] font-black text-blue-700 uppercase tracking-widest">Dispatch a driver</span>
            <p className="text-[10px] font-bold text-slate-500 font-inter">
              The client pays the calculated price of <strong className="text-slate-800">{dzd(ride.agreedFare ?? ride.estimatedFare)}</strong> — no negotiation.
            </p>
            <select value={assignDriverId} onChange={e => setAssignDriverId(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black outline-none">
              <option value="">Choose a driver…</option>
              {eligibleDrivers.map(d => <option key={d.id} value={d.id}>{d.name} ({d.status})</option>)}
            </select>
            <button
              onClick={() => assignDriverId && onAction(ride.id, "assign", { driverId: assignDriverId }, "Driver dispatched ✓")}
              disabled={!assignDriverId}
              className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all cursor-pointer disabled:opacity-40"
            >
              Dispatch Driver
            </button>
          </div>
        )}

        {/* Lifecycle buttons */}
        {!finished && !isOpen && (
          <div className="space-y-2">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Progress the ride</span>
            {ride.status === "accepted" && (
              <button onClick={() => onAction(ride.id, "arrived", undefined, "Driver marked as arrived")}
                className="w-full py-3.5 bg-cyan-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-cyan-700 transition-all cursor-pointer">
                Driver Arrived at Pickup
              </button>
            )}
            {ride.status === "driver_arrived" && (
              <button onClick={() => onAction(ride.id, "start", undefined, "Ride started")}
                className="w-full py-3.5 bg-orange-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all cursor-pointer">
                Start the Ride
              </button>
            )}
            {ride.status === "in_ride" && (
              <button onClick={() => onAction(ride.id, "complete", {}, "Ride completed — commission collected ✓")}
                className="w-full py-3.5 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all cursor-pointer flex items-center justify-center gap-2">
                <CheckCircle2 size={14} /> Complete Ride
              </button>
            )}
          </div>
        )}

        {/* Cancellation info / cancel action */}
        {ride.status.startsWith("cancelled") && (
          <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl space-y-1">
            <span className="text-[9px] font-black text-rose-700 uppercase tracking-widest flex items-center gap-1.5"><Ban size={12} /> Cancelled by {ride.cancelledBy?.toLowerCase()}</span>
            <p className="text-[10px] font-bold text-slate-500 font-inter">Stage: {ride.cancelStage?.replace(/_/g, " ")} {ride.cancelReason ? `· Reason: "${ride.cancelReason}"` : ""}</p>
          </div>
        )}

        {!finished && (
          <div className="pt-4 border-t border-slate-100">
            {!showCancel ? (
              <button onClick={() => setShowCancel(true)}
                className="w-full py-3.5 bg-rose-50 text-rose-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all cursor-pointer flex items-center justify-center gap-2">
                <XCircle size={14} /> Cancel Ride
              </button>
            ) : (
              <div className="space-y-2">
                <input type="text" value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="Cancellation reason…"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none font-inter" />
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setShowCancel(false)} className="py-3 border border-slate-200 text-slate-500 rounded-xl text-[10px] font-black uppercase cursor-pointer hover:bg-slate-50">Back</button>
                  <button onClick={() => onAction(ride.id, "cancel", { reason: cancelReason }, "Ride cancelled")}
                    className="py-3 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase cursor-pointer hover:bg-rose-700">Confirm Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ══════════════════ DRIVERS (per-driver cancel/approve statistics) ══════════════════

function DriversPage({ drivers, onAddDriver, onRefresh, onDriverUpdate, onSetStatus }: {
  drivers: DriverStats[]; onAddDriver: () => void; onRefresh: () => void;
  onDriverUpdate: (id: string, fields: object) => void;
  onSetStatus: (id: string, status: string) => void;
}) {
  const [filter, setFilter] = useState("all");
  const filtered = drivers.filter(d =>
    filter === "all" ||
    (filter === "flagged" && d.fraudFlagged) ||
    (filter === "suspended" && d.status === "SUSPENDED") ||
    (filter === "available" && d.status === "AVAILABLE")
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fadeIn pb-16 text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tighter text-slate-800 uppercase">Taxi Drivers</h1>
          <p className="text-sm text-slate-400 font-medium font-inter">Every driver with his full record: offers, approvals, cancellations, earnings</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onRefresh} className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"><RefreshCw size={13} /></button>
          <button onClick={onAddDriver} className="px-5 py-2.5 bg-amber-500 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-amber-600 shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center gap-2">
            <Plus size={14} /> Add Taxi Driver
          </button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {[
          { v: "all", label: `All (${drivers.length})` },
          { v: "available", label: "Available" },
          { v: "flagged", label: `⚠ Flagged (${drivers.filter(d => d.fraudFlagged).length})` },
          { v: "suspended", label: "Suspended" },
        ].map(f => (
          <button key={f.v} onClick={() => setFilter(f.v)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer ${filter === f.v ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"}`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map(d => (
          <div key={d.id} className={`bg-white border rounded-[2rem] p-6 shadow-sm ${d.fraudFlagged ? "border-rose-200" : "border-slate-100"}`}>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Identity */}
              <div className="flex items-center gap-4 min-w-60">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm uppercase ${d.fraudFlagged ? "bg-rose-100 text-rose-600" : "bg-amber-50 text-amber-600"}`}>
                  {d.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <p className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                    {d.name}
                    {d.isVerified && <Shield size={12} className="text-emerald-500 fill-emerald-500" />}
                    {d.fraudFlagged && <span className="text-[8px] font-black uppercase bg-rose-600 text-white px-2 py-0.5 rounded-lg flex items-center gap-1"><Flag size={8} /> Fraud Alert</span>}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 font-inter">
                    {d.driverCode} · {[d.vehicleModel, d.vehicleColor, d.vehiclePlate].filter(Boolean).join(" · ") || "No vehicle info"} · ⭐ {d.rating}
                  </p>
                  <span className={`inline-block mt-1 text-[9px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider border ${
                    d.status === "AVAILABLE" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                    d.status === "BUSY" ? "bg-amber-50 text-amber-700 border-amber-200" :
                    d.status === "SUSPENDED" ? "bg-rose-50 text-rose-700 border-rose-200" :
                    "bg-slate-50 text-slate-500 border-slate-200"
                  }`}>{d.status}</span>
                </div>
              </div>

              {/* Statistics — approvals & cancels */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 flex-1 text-center">
                {[
                  { label: "Matched", value: d.matchedRides, cls: "" },
                  { label: "Completed", value: d.completedRides, cls: "text-emerald-600" },
                  { label: "He Cancelled", value: d.cancelledByDriver, cls: d.cancelledByDriver > 0 ? "text-rose-600" : "" },
                  { label: "Late Cancels", value: d.lateCancels, cls: d.lateCancels > 0 ? "text-rose-600" : "" },
                  { label: "Cancel %", value: `${d.cancelRate}%`, cls: d.cancelRate >= 30 ? "text-rose-600" : "" },
                  { label: "Complete %", value: `${d.completionRate}%`, cls: "text-emerald-600" },
                ].map(s => (
                  <div key={s.label} className="bg-slate-50/70 rounded-xl px-1.5 py-2.5">
                    <p className={`text-sm font-black ${s.cls || "text-slate-800"}`}>{s.value}</p>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider leading-tight">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Money + actions */}
              <div className="flex lg:flex-col items-center lg:items-end gap-3 shrink-0">
                <div className="text-right">
                  <p className="text-xs font-black text-emerald-600">{dzd(d.earnings)} earned</p>
                  <p className="text-[10px] font-bold text-slate-400 font-inter">{dzd(d.commissionPaid)} commission paid</p>
                </div>
                <div className="flex gap-2">
                  {!d.isVerified && (
                    <button onClick={() => onDriverUpdate(d.id, { isVerified: true })}
                      className="px-3 py-2 bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase tracking-wider hover:bg-emerald-600 cursor-pointer">Verify</button>
                  )}
                  {d.status === "SUSPENDED" ? (
                    <button onClick={() => onSetStatus(d.id, "AVAILABLE")}
                      className="px-3 py-2 bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase tracking-wider hover:bg-blue-700 cursor-pointer">Reactivate</button>
                  ) : (
                    <button onClick={() => { if (confirm(`Suspend driver ${d.name}?`)) onSetStatus(d.id, "SUSPENDED"); }}
                      className="px-3 py-2 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-[9px] font-black uppercase tracking-wider hover:bg-rose-100 cursor-pointer">Suspend</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-xs text-slate-400 font-bold font-inter text-center py-10 bg-white border border-slate-100 rounded-[2rem]">No drivers in this filter.</p>
        )}
      </div>
    </div>
  );
}

// ══════════════════ ANTI-SCAM ══════════════════

function SecurityPage({ alerts, onResolve }: {
  alerts: FraudAlert[]; onResolve: (id: string, action: "suspended" | "warned" | "dismissed") => void;
}) {
  const [showResolved, setShowResolved] = useState(false);
  const list = alerts.filter(a => (showResolved ? a.isResolved : !a.isResolved));

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn pb-16 text-left">
      <div className="space-y-2">
        <h1 className="text-3xl font-black tracking-tighter text-slate-800 uppercase flex items-center gap-3">
          <ShieldAlert className="text-rose-600" size={28} /> Anti-Scam Center
        </h1>
        <p className="text-sm text-slate-400 font-medium font-inter">
          Automatic detection of drivers and clients who match in the app, cancel, and finish the ride in cash outside it.
        </p>
      </div>

      {/* How it works */}
      <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 space-y-3">
        <h3 className="text-xs font-black uppercase tracking-widest text-rose-400 flex items-center gap-2"><AlertTriangle size={14} /> How detection works</h3>
        <div className="grid sm:grid-cols-2 gap-4 text-[11px] font-bold text-slate-300 font-inter leading-relaxed">
          <p>🔴 <strong className="text-white">Driver + Client collusion</strong> — the same pair matches then cancels 2+ times: the classic &quot;cancel and pay me cash&quot; deal.</p>
          <p>🟠 <strong className="text-white">Cancels after arrival</strong> — the driver reached the pickup then the ride was cancelled: usually the ride still happened, off the app.</p>
          <p>🟡 <strong className="text-white">Excessive driver cancels</strong> — 3 cancels raises an alert, <strong className="text-rose-400">5 cancels auto-suspends the driver</strong>.</p>
          <p>🟡 <strong className="text-white">Excessive client cancels</strong> — the same phone number cancelling 3+ rides gets flagged.</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setShowResolved(false)}
          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border cursor-pointer ${!showResolved ? "bg-rose-600 text-white border-rose-600" : "bg-white text-slate-500 border-slate-200"}`}>
          Open ({alerts.filter(a => !a.isResolved).length})
        </button>
        <button onClick={() => setShowResolved(true)}
          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border cursor-pointer ${showResolved ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-500 border-slate-200"}`}>
          Resolved ({alerts.filter(a => a.isResolved).length})
        </button>
      </div>

      {list.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-12 text-center space-y-2">
          <Shield className="mx-auto text-emerald-300" size={36} />
          <p className="text-sm font-black text-slate-400 uppercase">No {showResolved ? "resolved" : "open"} alerts</p>
        </div>
      ) : (
        <div className="space-y-4">
          {list.map(a => {
            const t = ALERT_TYPE[a.type] || { label: a.type, hint: "" };
            return (
              <div key={a.id} className={`bg-white border rounded-[2rem] p-6 shadow-sm space-y-3 ${a.severity === "HIGH" && !a.isResolved ? "border-rose-300" : "border-slate-100"}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-wider ${
                    a.severity === "HIGH" ? "bg-rose-600 text-white" : a.severity === "MEDIUM" ? "bg-amber-500 text-white" : "bg-slate-200 text-slate-600"
                  }`}>{a.severity}</span>
                  <span className="text-xs font-black text-slate-800 uppercase tracking-tight">{t.label}</span>
                  {a.action && <span className="text-[9px] font-black uppercase text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg">{a.action.replace(/_/g, " ")}</span>}
                  <span className="text-[9px] font-bold text-slate-400 font-inter ml-auto">{new Date(a.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-xs font-bold text-slate-600 font-inter leading-relaxed">{a.message}</p>
                <div className="flex flex-wrap gap-3 text-[10px] font-bold text-slate-400 font-inter">
                  {a.driver && <span>🚗 {a.driver.name} ({a.driver.driverCode}) — {a.driver.status}</span>}
                  {a.clientPhone && <span>👤 {a.clientName || "Client"} ({a.clientPhone})</span>}
                </div>
                {!a.isResolved && (
                  <div className="flex gap-2 pt-2 border-t border-slate-50 flex-wrap">
                    {a.driverId && a.driver?.status !== "SUSPENDED" && (
                      <button onClick={() => { if (confirm(`Suspend driver ${a.driver?.name}?`)) onResolve(a.id, "suspended"); }}
                        className="px-4 py-2.5 bg-rose-600 text-white rounded-xl text-[9px] font-black uppercase tracking-wider hover:bg-rose-700 cursor-pointer flex items-center gap-1.5">
                        <Ban size={11} /> Suspend Driver
                      </button>
                    )}
                    <button onClick={() => onResolve(a.id, "warned")}
                      className="px-4 py-2.5 bg-amber-500 text-white rounded-xl text-[9px] font-black uppercase tracking-wider hover:bg-amber-600 cursor-pointer">
                      Mark as Warned
                    </button>
                    <button onClick={() => onResolve(a.id, "dismissed")}
                      className="px-4 py-2.5 bg-slate-100 text-slate-500 rounded-xl text-[9px] font-black uppercase tracking-wider hover:bg-slate-200 cursor-pointer">
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ══════════════════ EARNINGS (money calculation system) ══════════════════

function TaxiEarningsPage({ stats, drivers, config, onSaveConfig }: {
  stats: TaxiStats | null; drivers: DriverStats[]; config: TaxiConfig | null;
  onSaveConfig: (c: TaxiConfig) => void;
}) {
  const [base, setBase] = useState("");
  const [perKm, setPerKm] = useState("");
  const [minFare, setMinFare] = useState("");
  const [commission, setCommission] = useState("");

  useEffect(() => {
    if (config) {
      setBase(String(config.taxiBaseFare));
      setPerKm(String(config.taxiPerKm));
      setMinFare(String(config.taxiMinFare));
      setCommission(String(config.taxiCommissionPercent));
    }
  }, [config]);

  // Live example: 5 km ride
  const exampleKm = 5;
  const exFare = Math.max(parseInt(minFare || "0") || 0, Math.round(((parseInt(base || "0") || 0) + exampleKm * (parseFloat(perKm || "0") || 0)) / 10) * 10);
  const exCommission = Math.round((exFare * (parseFloat(commission || "0") || 0)) / 100);

  const earners = drivers.filter(d => d.grossFares > 0).sort((a, b) => b.grossFares - a.grossFares);

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fadeIn pb-16 text-left">
      <div className="space-y-2">
        <h1 className="text-3xl font-black tracking-tighter text-slate-800 uppercase">Taxi Earnings</h1>
        <p className="text-sm text-slate-400 font-medium font-inter">Fares, platform commission, and driver payouts — computed from completed rides</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Gross Fares", value: dzd(stats?.grossFares), sub: `${stats?.completedRides ?? 0} completed rides`, cls: "text-slate-800" },
          { label: `Commission Revenue (${config?.taxiCommissionPercent ?? 10}%)`, value: dzd(stats?.commissionRevenue), sub: "What the platform earned", cls: "text-emerald-600" },
          { label: "Driver Payouts", value: dzd(stats?.driverPayouts), sub: "What drivers kept", cls: "text-blue-600" },
          { label: "Cancelled Rides", value: String(stats?.cancelledRides ?? 0), sub: `${stats?.cancelRate ?? 0}% cancel rate — lost revenue`, cls: "text-rose-600" },
        ].map(t => (
          <div key={t.label} className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{t.label}</span>
            <span className={`text-2xl font-black tracking-tight block mt-2 ${t.cls}`}>{t.value}</span>
            <p className="text-[10px] text-slate-400 font-bold font-inter mt-1">{t.sub}</p>
          </div>
        ))}
      </div>

      {/* Fare calculator config */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center"><Percent size={20} /></div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-tight text-slate-800">Money Calculation System</h3>
            <p className="text-xs text-slate-400 font-bold font-inter">Estimated fare = max(min fare, base + km × per-km) · Platform takes the commission % of every completed ride</p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Base Fare (DZD)", value: base, set: setBase },
            { label: "Per Km (DZD)", value: perKm, set: setPerKm },
            { label: "Minimum Fare (DZD)", value: minFare, set: setMinFare },
            { label: "Commission (%)", value: commission, set: setCommission },
          ].map(f => (
            <div key={f.label}>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">{f.label}</label>
              <input type="number" value={f.value} onChange={e => f.set(e.target.value)}
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black outline-none focus:bg-white focus:ring-4 focus:ring-amber-500/10 transition-all" />
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-amber-50/60 border border-amber-100 rounded-2xl p-4">
          <p className="text-[11px] font-bold text-slate-600 font-inter">
            📐 Example — a {exampleKm} km ride: client pays <strong className="text-slate-900">{exFare.toLocaleString()} DZD</strong>,
            platform takes <strong className="text-emerald-700">{exCommission.toLocaleString()} DZD</strong>,
            driver keeps <strong className="text-blue-700">{(exFare - exCommission).toLocaleString()} DZD</strong>
          </p>
          <button
            onClick={() => onSaveConfig({
              taxiBaseFare: parseInt(base) || 0, taxiPerKm: parseFloat(perKm) || 0,
              taxiMinFare: parseInt(minFare) || 0, taxiCommissionPercent: parseFloat(commission) || 0,
            })}
            className="px-8 py-3.5 bg-amber-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-amber-600 shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center gap-2 shrink-0"
          >
            <Check size={14} /> Save Settings
          </button>
        </div>
      </div>

      {/* Per-driver payout table */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
        <h3 className="text-sm font-black uppercase tracking-tight text-slate-800 mb-6">Driver Payouts</h3>
        {earners.length === 0 ? (
          <p className="text-xs text-slate-400 font-bold font-inter text-center py-6">No completed rides yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table text-left">
              <thead>
                <tr className="border-b border-slate-50 text-[10px] uppercase tracking-widest text-slate-400">
                  <th className="pb-4 font-black">Driver</th>
                  <th className="pb-4 font-black text-center">Completed</th>
                  <th className="pb-4 font-black text-right">Gross Fares</th>
                  <th className="pb-4 font-black text-right">Commission</th>
                  <th className="pb-4 font-black text-right">Driver Keeps</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs font-semibold text-slate-700">
                {earners.map(d => (
                  <tr key={d.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 font-black text-slate-800 uppercase tracking-tight">{d.name} <span className="text-slate-400 font-bold normal-case">({d.driverCode})</span></td>
                    <td className="py-4 text-center"><span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-black">{d.completedRides}</span></td>
                    <td className="py-4 text-right font-black text-slate-800">{dzd(d.grossFares)}</td>
                    <td className="py-4 text-right font-black text-emerald-600">{dzd(d.commissionPaid)}</td>
                    <td className="py-4 text-right font-black text-blue-600">{dzd(d.earnings)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════ MODALS ══════════════════

function NewRideModal({ config, onClose, onSubmit }: {
  config: TaxiConfig | null; onClose: () => void; onSubmit: (fields: object) => void;
}) {
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [km, setKm] = useState("");
  const [promoCode, setPromoCode] = useState("");

  const est = config && km
    ? Math.max(config.taxiMinFare, Math.round((config.taxiBaseFare + parseFloat(km) * config.taxiPerKm) / 10) * 10)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-5 relative m-4 text-left">
        <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400 hover:text-slate-800 cursor-pointer"><X size={18} /></button>
        <div className="space-y-1">
          <h2 className="text-xl font-black text-slate-800 uppercase">New Ride Request</h2>
          <p className="text-xs text-slate-400 font-bold font-inter">Register a ride for a client (phone booking)</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Client Name *</label>
            <input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="e.g. Ahmed B."
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:bg-white" />
          </div>
          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Client Phone *</label>
            <input value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="+213 …"
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:bg-white" />
          </div>
        </div>
        <div>
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Pickup Address *</label>
          <input value={pickupAddress} onChange={e => setPickupAddress(e.target.value)} placeholder="e.g. Cité El Hidhab, Sétif"
            className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:bg-white" />
        </div>
        <div>
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Destination *</label>
          <input value={destinationAddress} onChange={e => setDestinationAddress(e.target.value)} placeholder="e.g. Gare routière"
            className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:bg-white" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Distance (km)</label>
            <input type="number" value={km} onChange={e => setKm(e.target.value)} placeholder="e.g. 5"
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:bg-white" />
          </div>
          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Promo Code (optional)</label>
            <input value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())} placeholder="e.g. TAXI50"
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black font-mono uppercase outline-none focus:bg-white" />
          </div>
        </div>
        {est !== null && (
          <p className="text-[11px] font-bold text-slate-500 font-inter bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
            📐 Calculated price for {km} km: <strong className="text-amber-700">{est.toLocaleString()} DZD</strong>
            {promoCode && <span className="text-emerald-700"> — the promo code discount is applied automatically</span>}
          </p>
        )}

        <button
          onClick={() => {
            if (!clientName || !clientPhone || !pickupAddress || !destinationAddress) { alert("Please fill the required fields."); return; }
            onSubmit({
              clientName, clientPhone, pickupAddress, destinationAddress,
              pickupWilaya: "Sétif", pickupCommune: "Sétif",
              ...(km && { distanceKm: parseFloat(km) }),
              ...(promoCode && { promoCode }),
            });
          }}
          className="w-full py-4 bg-amber-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-amber-600 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
        >
          Create Ride Request
        </button>
      </div>
    </div>
  );
}

function AddTaxiDriverModal({ onClose, onSubmit }: {
  onClose: () => void; onSubmit: (fields: object) => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleColor, setVehicleColor] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [isVerified, setIsVerified] = useState(true);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl p-8 max-w-md w-full space-y-5 relative m-4 text-left">
        <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400 hover:text-slate-800 cursor-pointer"><X size={18} /></button>
        <div className="space-y-1">
          <h2 className="text-xl font-black text-slate-800 uppercase">Add Taxi Driver</h2>
          <p className="text-xs text-slate-400 font-bold font-inter">Creates a DRIVER account (default password: driver123)</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Full Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Walid Benali"
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:bg-white" />
          </div>
          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Phone *</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+213 …"
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:bg-white" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Car Model</label>
              <input value={vehicleModel} onChange={e => setVehicleModel(e.target.value)} placeholder="Hyundai i10"
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:bg-white" />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Color</label>
              <input value={vehicleColor} onChange={e => setVehicleColor(e.target.value)} placeholder="White"
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:bg-white" />
            </div>
          </div>
          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Plate Number</label>
            <input value={vehiclePlate} onChange={e => setVehiclePlate(e.target.value)} placeholder="01234-119-19"
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:bg-white" />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={isVerified} onChange={e => setIsVerified(e.target.checked)} className="w-4 h-4 accent-amber-500" />
            <span className="text-xs font-bold text-slate-600 font-inter">Documents checked — mark as verified</span>
          </label>
        </div>

        <button
          onClick={() => {
            if (!name || !phone) { alert("Name and phone are required."); return; }
            onSubmit({ name, phone, vehicleModel, vehicleColor, vehiclePlate, isVerified, wilaya: "Sétif", commune: "Sétif" });
          }}
          className="w-full py-4 bg-amber-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-amber-600 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
        >
          Register Driver
        </button>
      </div>
    </div>
  );
}
