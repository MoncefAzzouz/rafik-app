"use client";

import {
  Car, Users, DollarSign, TrendingUp, Clock, CheckCircle2, XCircle, MapPin,
  ArrowUpRight, ArrowDownRight, MoreHorizontal, Activity, Plus, ArrowRight,
} from "lucide-react";

const STATS = [
  { label: "Active Rides", value: "247", sub: "Rides", change: "+12%", up: true, icon: Car, color: "amber" },
  { label: "Online Drivers", value: "1,832", sub: "Drivers", change: "+5.3%", up: true, icon: Users, color: "blue" },
  { label: "Today Revenue", value: "184,200", sub: "DZD", change: "+18.7%", up: true, icon: DollarSign, color: "emerald" },
  { label: "Avg Trip Time", value: "14", sub: "min", change: "-2.1%", up: false, icon: Clock, color: "purple" },
];

const RECENT_RIDES = [
  { id: "TX-4821", passenger: "Ahmed B.", driver: "Karim M.", from: "Bab El Oued", to: "Hydra", status: "active", fare: "450 DZD", time: "2 min ago" },
  { id: "TX-4820", passenger: "Fatima Z.", driver: "Youcef L.", from: "Kouba", to: "Bir Mourad Raïs", status: "completed", fare: "320 DZD", time: "8 min ago" },
  { id: "TX-4819", passenger: "Mohamed S.", driver: "Ali R.", from: "El Harrach", to: "Hussein Dey", status: "completed", fare: "280 DZD", time: "12 min ago" },
  { id: "TX-4818", passenger: "Sara K.", driver: "Omar D.", from: "Bab Ezzouar", to: "Bordj El Kiffan", status: "cancelled", fare: "0 DZD", time: "15 min ago" },
  { id: "TX-4817", passenger: "Amine T.", driver: "Rachid B.", from: "Sidi M'hamed", to: "El Biar", status: "completed", fare: "380 DZD", time: "22 min ago" },
  { id: "TX-4816", passenger: "Nadia H.", driver: "Hassan F.", from: "Ain Benian", to: "Staoueli", status: "active", fare: "520 DZD", time: "25 min ago" },
];

const TOP_DRIVERS = [
  { name: "Karim M.", rides: 342, rating: 4.9, earnings: "86,400 DZD" },
  { name: "Youcef L.", rides: 298, rating: 4.8, earnings: "74,200 DZD" },
  { name: "Ali R.", rides: 276, rating: 4.7, earnings: "68,100 DZD" },
  { name: "Omar D.", rides: 251, rating: 4.9, earnings: "63,500 DZD" },
];

const CHART_BARS = [35, 52, 44, 68, 55, 72, 60, 48, 78, 65, 82, 70];

const COLOR_MAP: Record<string, { bg: string; text: string; hover: string }> = {
  amber: { bg: "bg-amber-50", text: "text-amber-600", hover: "group-hover:bg-amber-500 group-hover:text-white" },
  blue: { bg: "bg-blue-50", text: "text-blue-600", hover: "group-hover:bg-blue-500 group-hover:text-white" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-600", hover: "group-hover:bg-emerald-500 group-hover:text-white" },
  purple: { bg: "bg-purple-50", text: "text-purple-600", hover: "group-hover:bg-purple-500 group-hover:text-white" },
};

const STATUS_MAP: Record<string, { label: string; bg: string }> = {
  active: { label: "Active", bg: "bg-amber-500" },
  completed: { label: "Completed", bg: "bg-emerald-500" },
  cancelled: { label: "Cancelled", bg: "bg-rose-500" },
};

interface TaxiDashboardProps { activePage: string; }

export default function TaxiDashboard({ activePage }: TaxiDashboardProps) {
  if (activePage === "rides") return <RidesPage />;
  if (activePage === "drivers") return <DriversPage />;
  if (activePage === "zones") return <ZonesPage />;
  if (activePage === "earnings") return <EarningsPage />;
  return <DashboardOverview />;
}

function DashboardOverview() {
  return (
    <div className="space-y-10 max-w-7xl mx-auto animate-fadeIn pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-primary/5 px-4 py-2 rounded-full border border-primary/10">
            <Activity size={14} className="text-primary animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Live Taxi Operations</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-800 uppercase italic">
            Taxi <span className="text-primary">Dashboard</span>
          </h1>
          <p className="text-sm text-slate-400 font-medium">Monitor rides, track drivers, and audit revenue in real-time.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button className="px-5 py-3 border border-slate-200 hover:border-slate-300 text-slate-600 bg-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all active:scale-[0.98] cursor-pointer">Refresh Data</button>
          <button className="px-5 py-3 bg-primary hover:bg-primary/95 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-lg active:scale-[0.98] flex items-center gap-2 cursor-pointer" style={{ boxShadow: `0 8px 24px color-mix(in srgb, var(--primary) 15%, transparent)` }}>
            <Plus size={14} /> Manage Rides
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 stagger">
        {STATS.map((s, i) => {
          const Icon = s.icon;
          const c = COLOR_MAP[s.color];
          return (
            <div key={i} className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm flex items-center justify-between group transition-all hover:-translate-y-1 animate-fadeIn cursor-pointer">
              <div className="space-y-2.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{s.label}</span>
                <div className="space-y-0.5">
                  <span className="text-2xl font-black text-slate-800 tracking-tight block">
                    {s.value} <span className="text-xs font-bold text-slate-400">{s.sub}</span>
                  </span>
                  <span className={`text-[10px] font-bold flex items-center gap-1 ${s.up ? "text-emerald-500" : "text-rose-500"}`}>
                    {s.up ? <TrendingUp size={12} /> : <ArrowDownRight size={12} />}
                    {s.change} this month
                  </span>
                </div>
              </div>
              <div className={`w-12 h-12 ${c.bg} ${c.text} rounded-2xl flex items-center justify-center transition-colors ${c.hover}`}>
                <Icon size={20} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart + Top Drivers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-7 bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm flex flex-col justify-between">
          <div className="space-y-1 mb-6">
            <h2 className="text-lg font-black uppercase tracking-tight text-slate-800">Rides Volume</h2>
            <p className="text-xs text-slate-400 font-bold">Last 12 hours breakdown</p>
          </div>
          <div className="flex items-end gap-2 h-36 flex-1">
            {CHART_BARS.map((h, i) => (
              <div key={i} className="flex-1 rounded-t-lg transition-all duration-300 cursor-pointer hover:opacity-80" style={{ height: `${h}%`, background: `var(--primary)`, opacity: 0.3 + (h / 120) }} />
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-black uppercase tracking-tight text-slate-800">Top Drivers</h2>
            <p className="text-xs text-slate-400 font-bold">Best performers this month</p>
          </div>
          <div className="space-y-4 flex-1 flex flex-col justify-center">
            {TOP_DRIVERS.map((d, i) => (
              <div key={i} className="flex items-center gap-4 group cursor-pointer">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-black" style={{ background: `var(--primary)` }}>
                  {d.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-slate-800 truncate">{d.name}</p>
                  <p className="text-[10px] font-bold text-slate-400">{d.rides} rides · ⭐ {d.rating}</p>
                </div>
                <span className="text-xs font-black text-primary">{d.earnings}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Rides Table */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Car size={16} className="text-primary" />
            <h2 className="text-lg font-black uppercase tracking-tight text-slate-800">Recent Rides</h2>
          </div>
          <button className="text-[10px] font-black text-primary uppercase tracking-wider hover:underline cursor-pointer">All Rides</button>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>ID</th><th>Passenger</th><th>Driver</th><th>Route</th><th>Status</th><th>Fare</th><th>Time</th><th></th></tr></thead>
            <tbody>
              {RECENT_RIDES.map((r) => {
                const st = STATUS_MAP[r.status];
                return (
                  <tr key={r.id}>
                    <td className="font-mono font-black text-primary">{r.id}</td>
                    <td className="font-black text-slate-800">{r.passenger}</td>
                    <td>{r.driver}</td>
                    <td><span className="text-xs flex items-center gap-1.5"><MapPin size={12} className="text-slate-400" />{r.from} → {r.to}</span></td>
                    <td><div className="flex items-center gap-2"><span className={`w-2.5 h-2.5 rounded-full ${st.bg}`} /><span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">{st.label}</span></div></td>
                    <td className="font-mono font-black text-slate-800">{r.fare}</td>
                    <td className="text-[10px] font-bold text-slate-400">{r.time}</td>
                    <td><button className="w-8 h-8 rounded-xl hover:bg-slate-50 flex items-center justify-center cursor-pointer"><MoreHorizontal size={14} className="text-slate-400" /></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function RidesPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fadeIn pb-16">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tighter text-slate-800 uppercase">All Rides</h1>
          <p className="text-sm text-slate-400 font-medium">Manage and track all ride requests</p>
        </div>
        <div className="flex gap-2">
          {["All", "Active", "Completed", "Cancelled"].map((f) => (
            <button key={f} className="text-[10px] px-4 py-2.5 rounded-xl font-black uppercase tracking-wider bg-white border border-slate-100 hover:bg-primary/5 hover:border-primary/20 hover:text-primary text-slate-500 transition-all cursor-pointer">{f}</button>
          ))}
        </div>
      </div>
      <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>ID</th><th>Passenger</th><th>Driver</th><th>Route</th><th>Status</th><th>Fare</th><th>Time</th><th></th></tr></thead>
            <tbody>
              {[...RECENT_RIDES, ...RECENT_RIDES].map((r, i) => {
                const st = STATUS_MAP[r.status];
                return (
                  <tr key={`${r.id}-${i}`}>
                    <td className="font-mono font-black text-primary">{r.id}</td>
                    <td className="font-black text-slate-800">{r.passenger}</td>
                    <td>{r.driver}</td>
                    <td><span className="text-xs"><MapPin size={12} className="inline mr-1 text-slate-400" />{r.from} → {r.to}</span></td>
                    <td><div className="flex items-center gap-2"><span className={`w-2.5 h-2.5 rounded-full ${st.bg}`} /><span className="text-[10px] font-bold uppercase">{st.label}</span></div></td>
                    <td className="font-mono font-black">{r.fare}</td>
                    <td className="text-[10px] text-slate-400 font-bold">{r.time}</td>
                    <td><button className="w-8 h-8 rounded-xl hover:bg-slate-50 flex items-center justify-center"><MoreHorizontal size={14} className="text-slate-400" /></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DriversPage() {
  const drivers = [
    { name: "Karim M.", phone: "+213 555 1234", vehicle: "Hyundai Accent 2020", plate: "00125-116-16", status: "online", rides: 342, rating: 4.9 },
    { name: "Youcef L.", phone: "+213 555 5678", vehicle: "Renault Symbol 2019", plate: "00234-116-16", status: "online", rides: 298, rating: 4.8 },
    { name: "Ali R.", phone: "+213 555 9012", vehicle: "Peugeot 208 2021", plate: "00345-116-16", status: "offline", rides: 276, rating: 4.7 },
    { name: "Omar D.", phone: "+213 555 3456", vehicle: "Dacia Logan 2022", plate: "00456-116-16", status: "on-ride", rides: 251, rating: 4.9 },
    { name: "Hassan F.", phone: "+213 555 7890", vehicle: "Seat Ibiza 2020", plate: "00567-116-16", status: "online", rides: 218, rating: 4.6 },
    { name: "Rachid B.", phone: "+213 555 2345", vehicle: "VW Polo 2021", plate: "00678-116-16", status: "offline", rides: 195, rating: 4.5 },
  ];

  const statusColors: Record<string, string> = { online: "bg-emerald-500", "on-ride": "bg-amber-500", offline: "bg-slate-300" };

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fadeIn pb-16">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tighter text-slate-800 uppercase">Drivers</h1>
          <p className="text-sm text-slate-400 font-medium">Manage driver accounts and approvals</p>
        </div>
        <button className="px-5 py-3 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-lg active:scale-[0.98] flex items-center gap-2 cursor-pointer" style={{ boxShadow: `0 8px 24px color-mix(in srgb, var(--primary) 15%, transparent)` }}>
          <Plus size={14} /> Add Driver
        </button>
      </div>
      <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>Driver</th><th>Phone</th><th>Vehicle</th><th>Plate</th><th>Status</th><th>Rides</th><th>Rating</th><th></th></tr></thead>
            <tbody>
              {drivers.map((d, i) => (
                <tr key={i}>
                  <td className="font-black text-slate-800">{d.name}</td>
                  <td className="text-slate-400">{d.phone}</td>
                  <td>{d.vehicle}</td>
                  <td className="font-mono text-xs">{d.plate}</td>
                  <td><div className="flex items-center gap-2"><span className={`w-2.5 h-2.5 rounded-full ${statusColors[d.status]}`} /><span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">{d.status}</span></div></td>
                  <td className="font-mono font-black">{d.rides}</td>
                  <td>⭐ {d.rating}</td>
                  <td><button className="w-8 h-8 rounded-xl hover:bg-slate-50 flex items-center justify-center"><MoreHorizontal size={14} className="text-slate-400" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ZonesPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fadeIn pb-16">
      <div className="space-y-2">
        <h1 className="text-3xl font-black tracking-tighter text-slate-800 uppercase">Zones & Maps</h1>
        <p className="text-sm text-slate-400 font-medium">Configure service zones, pricing areas, and coverage maps</p>
      </div>
      <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm h-96 flex items-center justify-center">
        <div className="text-center space-y-3">
          <MapPin size={48} className="text-slate-200 mx-auto" />
          <p className="text-slate-400 font-bold text-sm">Map integration will be configured with the backend</p>
          <p className="text-xs text-slate-300 font-bold">Google Maps or Mapbox coming soon</p>
        </div>
      </div>
    </div>
  );
}

function EarningsPage() {
  const data = [
    { period: "Today", revenue: "184,200", count: 247, unit: "rides", avg: "745 DZD" },
    { period: "This Week", revenue: "1,289,400", count: 1732, unit: "rides", avg: "744 DZD" },
    { period: "This Month", revenue: "5,432,100", count: 7284, unit: "rides", avg: "746 DZD" },
  ];
  const bars = [45, 62, 38, 71, 55, 83, 68, 52, 90, 74, 65, 78, 85, 60];

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fadeIn pb-16">
      <div className="space-y-2">
        <h1 className="text-3xl font-black tracking-tighter text-slate-800 uppercase">Earnings</h1>
        <p className="text-sm text-slate-400 font-medium">Revenue breakdown and financial analytics</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger">
        {data.map((e, i) => (
          <div key={i} className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm group transition-all hover:-translate-y-1 animate-fadeIn cursor-pointer">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{e.period}</span>
            <span className="text-2xl font-black text-slate-800 tracking-tight block mt-2">{e.revenue} <span className="text-xs font-bold text-slate-400">DZD</span></span>
            <div className="flex gap-4 mt-3 text-[10px] text-slate-400 font-bold">
              <span>{e.count} {e.unit}</span><span>Avg: {e.avg}</span>
            </div>
            <div className="w-full h-2 bg-slate-50 border border-slate-100 rounded-full overflow-hidden mt-4">
              <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${30 + i * 25}%`, background: "var(--primary)" }} />
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm">
        <h2 className="text-lg font-black uppercase tracking-tight text-slate-800 mb-6">Revenue Trend</h2>
        <div className="flex items-end gap-2 h-40">
          {bars.map((h, i) => (
            <div key={i} className="flex-1 rounded-t-lg transition-all duration-300 cursor-pointer hover:opacity-80" style={{ height: `${h}%`, background: "var(--primary)", opacity: 0.3 + (h / 130) }} />
          ))}
        </div>
      </div>
    </div>
  );
}
