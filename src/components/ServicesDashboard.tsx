"use client";

import {
  Wrench, Users, DollarSign, CalendarCheck, TrendingUp, ArrowDownRight,
  MoreHorizontal, CheckCircle2, Clock, XCircle, Plus, Activity, Shield, UserCheck, Briefcase,
} from "lucide-react";

const STATS = [
  { label: "Active Bookings", value: "64", sub: "Jobs", change: "+11%", up: true, icon: CalendarCheck, color: "amber" },
  { label: "Professionals", value: "438", sub: "Active", change: "+24", up: true, icon: Users, color: "blue" },
  { label: "Today Revenue", value: "72,600", sub: "DZD", change: "+9.4%", up: true, icon: DollarSign, color: "emerald" },
  { label: "Categories", value: "18", sub: "Services", change: "+2", up: true, icon: Wrench, color: "purple" },
];

const SERVICE_CATEGORIES = [
  { name: "Plumber", pros: 68, bookings: 342, icon: "🔧" },
  { name: "Electrician", pros: 54, bookings: 298, icon: "⚡" },
  { name: "Painter", pros: 42, bookings: 186, icon: "🎨" },
  { name: "Carpenter", pros: 38, bookings: 164, icon: "🪚" },
  { name: "Cleaner", pros: 76, bookings: 428, icon: "🧹" },
  { name: "AC Repair", pros: 32, bookings: 142, icon: "❄️" },
  { name: "Locksmith", pros: 24, bookings: 98, icon: "🔑" },
  { name: "Gardener", pros: 18, bookings: 72, icon: "🌱" },
  { name: "Mover", pros: 28, bookings: 116, icon: "📦" },
];

const RECENT_BOOKINGS = [
  { id: "SV-3421", client: "Ahmed B.", professional: "Karim M.", service: "Plumber", status: "in-progress", price: "3,500 DZD", time: "1h ago" },
  { id: "SV-3420", client: "Fatima Z.", professional: "Lyes K.", service: "Electrician", status: "completed", price: "2,800 DZD", time: "2h ago" },
  { id: "SV-3419", client: "Sara K.", professional: "Pending", service: "Painter", status: "pending", price: "12,000 DZD", time: "3h ago" },
  { id: "SV-3418", client: "Amine T.", professional: "Hassan F.", service: "AC Repair", status: "completed", price: "4,500 DZD", time: "4h ago" },
  { id: "SV-3417", client: "Nadia H.", professional: "Rachid B.", service: "Cleaner", status: "cancelled", price: "2,000 DZD", time: "5h ago" },
  { id: "SV-3416", client: "Mohamed S.", professional: "Omar D.", service: "Carpenter", status: "in-progress", price: "8,000 DZD", time: "5h ago" },
];

const TOP_PROS = [
  { name: "Karim M.", service: "Plumber", jobs: 186, rating: 4.9, verified: true },
  { name: "Lyes K.", service: "Electrician", jobs: 164, rating: 4.8, verified: true },
  { name: "Hassan F.", service: "AC Repair", jobs: 142, rating: 4.9, verified: true },
  { name: "Rachid B.", service: "Cleaner", jobs: 128, rating: 4.7, verified: false },
];

const STATUS_MAP: Record<string, { label: string; bg: string }> = {
  "in-progress": { label: "In Progress", bg: "bg-blue-500" },
  pending: { label: "Pending", bg: "bg-amber-500" },
  completed: { label: "Completed", bg: "bg-emerald-500" },
  cancelled: { label: "Cancelled", bg: "bg-rose-500" },
};

const COLOR_MAP: Record<string, { bg: string; text: string; hover: string }> = {
  amber: { bg: "bg-amber-50", text: "text-amber-600", hover: "group-hover:bg-amber-500 group-hover:text-white" },
  blue: { bg: "bg-blue-50", text: "text-blue-600", hover: "group-hover:bg-blue-500 group-hover:text-white" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-600", hover: "group-hover:bg-emerald-500 group-hover:text-white" },
  purple: { bg: "bg-purple-50", text: "text-purple-600", hover: "group-hover:bg-purple-500 group-hover:text-white" },
};

const CHART_BARS = [28, 45, 38, 62, 55, 42, 72, 48, 58, 68, 52, 78];

interface ServicesDashboardProps { activePage: string; }

export default function ServicesDashboard({ activePage }: ServicesDashboardProps) {
  if (activePage === "categories") return <CategoriesPage />;
  if (activePage === "professionals") return <ProfessionalsPage />;
  if (activePage === "bookings") return <BookingsPage />;
  if (activePage === "earnings") return <EarningsPage />;
  return <DashboardOverview />;
}

function DashboardOverview() {
  return (
    <div className="space-y-10 max-w-7xl mx-auto animate-fadeIn pb-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-primary/5 px-4 py-2 rounded-full border border-primary/10">
            <Activity size={14} className="text-primary animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Live Services Hub</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-800 uppercase italic">
            Services <span className="text-primary">Dashboard</span>
          </h1>
          <p className="text-sm text-slate-400 font-medium">On-demand services overview — plumbers, electricians, and more.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button className="px-5 py-3 border border-slate-200 hover:border-slate-300 text-slate-600 bg-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all active:scale-[0.98] cursor-pointer">Refresh Data</button>
          <button className="px-5 py-3 bg-primary hover:bg-primary/95 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-lg active:scale-[0.98] flex items-center gap-2 cursor-pointer" style={{ boxShadow: `0 8px 24px color-mix(in srgb, var(--primary) 15%, transparent)` }}>
            <Plus size={14} /> Manage Bookings
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 stagger">
        {STATS.map((s, i) => {
          const Icon = s.icon; const c = COLOR_MAP[s.color];
          return (
            <div key={i} className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm flex items-center justify-between group transition-all hover:-translate-y-1 animate-fadeIn cursor-pointer">
              <div className="space-y-2.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{s.label}</span>
                <div className="space-y-0.5">
                  <span className="text-2xl font-black text-slate-800 tracking-tight block">{s.value} <span className="text-xs font-bold text-slate-400">{s.sub}</span></span>
                  <span className={`text-[10px] font-bold flex items-center gap-1 ${s.up ? "text-emerald-500" : "text-rose-500"}`}>{s.up ? <TrendingUp size={12} /> : <ArrowDownRight size={12} />}{s.change} this month</span>
                </div>
              </div>
              <div className={`w-12 h-12 ${c.bg} ${c.text} rounded-2xl flex items-center justify-center transition-colors ${c.hover}`}><Icon size={20} /></div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-7 bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm flex flex-col justify-between">
          <div className="space-y-1 mb-6">
            <h2 className="text-lg font-black uppercase tracking-tight text-slate-800">Bookings Volume</h2>
            <p className="text-xs text-slate-400 font-bold">Last 12 hours</p>
          </div>
          <div className="flex items-end gap-2 h-36 flex-1">
            {CHART_BARS.map((h, i) => (
              <div key={i} className="flex-1 rounded-t-lg transition-all duration-300 cursor-pointer hover:opacity-80" style={{ height: `${h}%`, background: "var(--primary)", opacity: 0.3 + (h / 120) }} />
            ))}
          </div>
        </div>
        <div className="lg:col-span-5 bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-black uppercase tracking-tight text-slate-800">Top Professionals</h2>
            <p className="text-xs text-slate-400 font-bold">Best performers this month</p>
          </div>
          <div className="space-y-4 flex-1 flex flex-col justify-center">
            {TOP_PROS.map((p, i) => (
              <div key={i} className="flex items-center gap-4 cursor-pointer">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-black" style={{ background: "var(--primary)" }}>
                  {p.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-black text-slate-800 truncate">{p.name}</p>
                    {p.verified && <Shield size={12} className="text-primary flex-shrink-0" />}
                  </div>
                  <p className="text-[10px] font-bold text-slate-400">{p.service} · {p.jobs} jobs · ⭐ {p.rating}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Service Categories */}
      <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <h2 className="text-lg font-black uppercase tracking-tight text-slate-800">Service Categories</h2>
            <p className="text-xs text-slate-400 font-bold">Available service types on the platform</p>
          </div>
          <button className="text-[10px] font-black text-primary uppercase tracking-wider hover:underline cursor-pointer">Manage All →</button>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-4">
          {SERVICE_CATEGORIES.map((c, i) => (
            <div key={i} className="text-center p-4 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer group border border-transparent hover:border-slate-100">
              <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">{c.icon}</div>
              <p className="text-[10px] font-black text-slate-700 uppercase tracking-tight">{c.name}</p>
              <p className="text-[9px] text-slate-400 font-bold mt-0.5">{c.pros} pros</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <CalendarCheck size={16} className="text-primary" />
            <h2 className="text-lg font-black uppercase tracking-tight text-slate-800">Recent Bookings</h2>
          </div>
          <button className="text-[10px] font-black text-primary uppercase tracking-wider hover:underline cursor-pointer">All Bookings</button>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>ID</th><th>Client</th><th>Professional</th><th>Service</th><th>Status</th><th>Price</th><th>Time</th><th></th></tr></thead>
            <tbody>
              {RECENT_BOOKINGS.map((b) => {
                const st = STATUS_MAP[b.status];
                return (
                  <tr key={b.id}>
                    <td className="font-mono font-black text-primary">{b.id}</td>
                    <td className="font-black text-slate-800">{b.client}</td>
                    <td className={b.professional === "Pending" ? "text-slate-400 italic" : ""}>{b.professional}</td>
                    <td><span className="flex items-center gap-1.5"><Wrench size={12} className="text-slate-400" />{b.service}</span></td>
                    <td><div className="flex items-center gap-2"><span className={`w-2.5 h-2.5 rounded-full ${st.bg}`} /><span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">{st.label}</span></div></td>
                    <td className="font-mono font-black text-slate-800">{b.price}</td>
                    <td className="text-[10px] font-bold text-slate-400">{b.time}</td>
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

function CategoriesPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fadeIn pb-16">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tighter text-slate-800 uppercase">Service Categories</h1>
          <p className="text-sm text-slate-400 font-medium">Add, edit, or remove service types</p>
        </div>
        <button className="px-5 py-3 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-lg active:scale-[0.98] flex items-center gap-2 cursor-pointer" style={{ boxShadow: `0 8px 24px color-mix(in srgb, var(--primary) 15%, transparent)` }}><Plus size={14} /> Add Category</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 stagger">
        {SERVICE_CATEGORIES.map((c, i) => (
          <div key={i} className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm animate-fadeIn cursor-pointer group hover:-translate-y-1 transition-all">
            <div className="flex items-start justify-between">
              <div className="text-4xl group-hover:scale-110 transition-transform">{c.icon}</div>
              <button className="w-8 h-8 rounded-xl hover:bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal size={16} className="text-slate-400" /></button>
            </div>
            <h4 className="text-sm font-black text-slate-800 mt-4 uppercase tracking-tight text-lg">{c.name}</h4>
            <div className="flex items-center gap-4 mt-3 text-[10px] text-slate-400 font-bold">
              <span className="flex items-center gap-1"><UserCheck size={11} /> {c.pros} professionals</span>
              <span className="flex items-center gap-1"><Briefcase size={11} /> {c.bookings} bookings</span>
            </div>
            <div className="w-full h-2 bg-slate-50 border border-slate-100 rounded-full overflow-hidden mt-4">
              <div className="h-full rounded-full" style={{ width: `${(c.bookings / 430) * 100}%`, background: "var(--primary)" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfessionalsPage() {
  const pros = [
    { name: "Karim M.", service: "Plumber", phone: "+213 555 1234", status: "active", verified: true, jobs: 186, rating: 4.9, joined: "Jan 2024" },
    { name: "Lyes K.", service: "Electrician", phone: "+213 555 5678", status: "active", verified: true, jobs: 164, rating: 4.8, joined: "Feb 2024" },
    { name: "Hassan F.", service: "AC Repair", phone: "+213 555 9012", status: "busy", verified: true, jobs: 142, rating: 4.9, joined: "Mar 2024" },
    { name: "Rachid B.", service: "Cleaner", phone: "+213 555 3456", status: "active", verified: false, jobs: 128, rating: 4.7, joined: "Mar 2024" },
    { name: "Said L.", service: "Painter", phone: "+213 555 7890", status: "inactive", verified: false, jobs: 56, rating: 4.3, joined: "May 2024" },
    { name: "Mourad T.", service: "Carpenter", phone: "+213 555 2345", status: "active", verified: true, jobs: 98, rating: 4.6, joined: "Apr 2024" },
  ];
  const statusColors: Record<string, string> = { active: "bg-emerald-500", busy: "bg-amber-500", inactive: "bg-slate-300" };
  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fadeIn pb-16">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tighter text-slate-800 uppercase">Professionals</h1>
          <p className="text-sm text-slate-400 font-medium">Manage service provider profiles and verifications</p>
        </div>
        <div className="flex gap-2">
          {["All", "Active", "Pending", "Inactive"].map(f => (
            <button key={f} className="text-[10px] px-4 py-2.5 rounded-xl font-black uppercase tracking-wider bg-white border border-slate-100 hover:bg-primary/5 hover:border-primary/20 hover:text-primary text-slate-500 transition-all cursor-pointer">{f}</button>
          ))}
        </div>
      </div>
      <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>Professional</th><th>Service</th><th>Phone</th><th>Status</th><th>Verified</th><th>Jobs</th><th>Rating</th><th>Joined</th><th></th></tr></thead>
            <tbody>
              {pros.map((p, i) => (
                <tr key={i}>
                  <td className="font-black text-slate-800">{p.name}</td>
                  <td><span className="flex items-center gap-1.5"><Wrench size={12} className="text-slate-400" />{p.service}</span></td>
                  <td className="text-slate-400">{p.phone}</td>
                  <td><div className="flex items-center gap-2"><span className={`w-2.5 h-2.5 rounded-full ${statusColors[p.status]}`} /><span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">{p.status}</span></div></td>
                  <td>
                    {p.verified ? (
                      <span className="flex items-center gap-1 text-primary text-[10px] font-black"><Shield size={14} /> Verified</span>
                    ) : (
                      <button className="text-[10px] font-black text-amber-600 uppercase tracking-wider hover:underline cursor-pointer">Verify</button>
                    )}
                  </td>
                  <td className="font-mono font-black">{p.jobs}</td>
                  <td>⭐ {p.rating}</td>
                  <td className="text-[10px] text-slate-400 font-bold">{p.joined}</td>
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

function BookingsPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fadeIn pb-16">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tighter text-slate-800 uppercase">All Bookings</h1>
          <p className="text-sm text-slate-400 font-medium">Manage service booking requests and appointments</p>
        </div>
        <div className="flex gap-2">
          {["All", "Pending", "In Progress", "Completed", "Cancelled"].map(f => (
            <button key={f} className="text-[10px] px-4 py-2.5 rounded-xl font-black uppercase tracking-wider bg-white border border-slate-100 hover:bg-primary/5 hover:border-primary/20 hover:text-primary text-slate-500 transition-all cursor-pointer">{f}</button>
          ))}
        </div>
      </div>
      <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>ID</th><th>Client</th><th>Professional</th><th>Service</th><th>Status</th><th>Price</th><th>Time</th><th></th></tr></thead>
            <tbody>
              {[...RECENT_BOOKINGS, ...RECENT_BOOKINGS].map((b, i) => {
                const st = STATUS_MAP[b.status];
                return (
                  <tr key={`${b.id}-${i}`}>
                    <td className="font-mono font-black text-primary">{b.id}</td>
                    <td className="font-black text-slate-800">{b.client}</td>
                    <td className={b.professional === "Pending" ? "text-slate-400 italic" : ""}>{b.professional}</td>
                    <td>{b.service}</td>
                    <td><div className="flex items-center gap-2"><span className={`w-2.5 h-2.5 rounded-full ${st.bg}`} /><span className="text-[10px] font-bold uppercase">{st.label}</span></div></td>
                    <td className="font-mono font-black">{b.price}</td>
                    <td className="text-[10px] text-slate-400 font-bold">{b.time}</td>
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

function EarningsPage() {
  const data = [
    { period: "Today", revenue: "72,600", count: 64, unit: "bookings", avg: "1,134 DZD" },
    { period: "This Week", revenue: "508,200", count: 448, unit: "bookings", avg: "1,134 DZD" },
    { period: "This Month", revenue: "2,174,800", count: 1918, unit: "bookings", avg: "1,134 DZD" },
  ];
  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fadeIn pb-16">
      <div className="space-y-2">
        <h1 className="text-3xl font-black tracking-tighter text-slate-800 uppercase">Earnings</h1>
        <p className="text-sm text-slate-400 font-medium">Service provider revenue and financial analytics</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger">
        {data.map((e, i) => (
          <div key={i} className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm group transition-all hover:-translate-y-1 animate-fadeIn cursor-pointer">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{e.period}</span>
            <span className="text-2xl font-black text-slate-800 tracking-tight block mt-2">{e.revenue} <span className="text-xs font-bold text-slate-400">DZD</span></span>
            <div className="flex gap-4 mt-3 text-[10px] text-slate-400 font-bold"><span>{e.count} {e.unit}</span><span>Avg: {e.avg}</span></div>
            <div className="w-full h-2 bg-slate-50 border border-slate-100 rounded-full overflow-hidden mt-4"><div className="h-full rounded-full transition-all duration-1000" style={{ width: `${30 + i * 25}%`, background: "var(--primary)" }} /></div>
          </div>
        ))}
      </div>
      <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm">
        <h2 className="text-lg font-black uppercase tracking-tight text-slate-800 mb-6">Revenue Trend</h2>
        <div className="flex items-end gap-2 h-40">
          {[32, 48, 35, 58, 45, 72, 55, 42, 78, 62, 50, 82, 68, 58].map((h, i) => (
            <div key={i} className="flex-1 rounded-t-lg transition-all duration-300 cursor-pointer hover:opacity-80" style={{ height: `${h}%`, background: "var(--primary)", opacity: 0.3 + (h / 130) }} />
          ))}
        </div>
      </div>
    </div>
  );
}
