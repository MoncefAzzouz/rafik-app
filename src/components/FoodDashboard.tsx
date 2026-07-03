"use client";

import {
  Store, ShoppingBag, DollarSign, Clock, ArrowDownRight, TrendingUp,
  MoreHorizontal, CheckCircle2, Package, Truck, XCircle, Star, Utensils, Plus, Activity,
} from "lucide-react";

const STATS = [
  { label: "Active Orders", value: "89", sub: "Orders", change: "+8%", up: true, icon: ShoppingBag, color: "amber" },
  { label: "Restaurants", value: "156", sub: "Active", change: "+3", up: true, icon: Store, color: "blue" },
  { label: "Today Revenue", value: "98,400", sub: "DZD", change: "+14.2%", up: true, icon: DollarSign, color: "emerald" },
  { label: "Avg Delivery", value: "28", sub: "min", change: "-4.5%", up: false, icon: Clock, color: "purple" },
];

const RECENT_ORDERS = [
  { id: "FD-7231", customer: "Lina M.", restaurant: "Pizza Palace", items: 3, status: "delivering", total: "2,450 DZD", time: "3 min ago" },
  { id: "FD-7230", customer: "Karim B.", restaurant: "Burger Zone", items: 2, status: "preparing", total: "1,800 DZD", time: "5 min ago" },
  { id: "FD-7229", customer: "Amina S.", restaurant: "Sushi House", items: 5, status: "delivered", total: "4,200 DZD", time: "12 min ago" },
  { id: "FD-7228", customer: "Yassine R.", restaurant: "Taco Bell DZ", items: 1, status: "delivered", total: "950 DZD", time: "18 min ago" },
  { id: "FD-7227", customer: "Nour K.", restaurant: "Le Gourmet", items: 4, status: "cancelled", total: "3,100 DZD", time: "22 min ago" },
  { id: "FD-7226", customer: "Hamza T.", restaurant: "Pizza Palace", items: 2, status: "preparing", total: "1,650 DZD", time: "25 min ago" },
];

const TOP_RESTAURANTS = [
  { name: "Pizza Palace", orders: 1248, rating: 4.8, revenue: "562,000 DZD", category: "Pizza" },
  { name: "Burger Zone", orders: 986, rating: 4.6, revenue: "423,000 DZD", category: "Burgers" },
  { name: "Le Gourmet", orders: 754, rating: 4.9, revenue: "398,000 DZD", category: "Fine Dining" },
  { name: "Sushi House", orders: 632, rating: 4.7, revenue: "312,000 DZD", category: "Japanese" },
];

const STATUS_MAP: Record<string, { label: string; bg: string }> = {
  delivering: { label: "Delivering", bg: "bg-blue-500" },
  preparing: { label: "Preparing", bg: "bg-amber-500" },
  delivered: { label: "Delivered", bg: "bg-emerald-500" },
  cancelled: { label: "Cancelled", bg: "bg-rose-500" },
};

const COLOR_MAP: Record<string, { bg: string; text: string; hover: string }> = {
  amber: { bg: "bg-amber-50", text: "text-amber-600", hover: "group-hover:bg-amber-500 group-hover:text-white" },
  blue: { bg: "bg-blue-50", text: "text-blue-600", hover: "group-hover:bg-blue-500 group-hover:text-white" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-600", hover: "group-hover:bg-emerald-500 group-hover:text-white" },
  purple: { bg: "bg-purple-50", text: "text-purple-600", hover: "group-hover:bg-purple-500 group-hover:text-white" },
};

const CHART_BARS = [42, 58, 35, 72, 65, 48, 80, 55, 68, 75, 62, 85];

interface FoodDashboardProps { activePage: string; }

export default function FoodDashboard({ activePage }: FoodDashboardProps) {
  if (activePage === "restaurants") return <RestaurantsPage />;
  if (activePage === "orders") return <OrdersPage />;
  if (activePage === "menu") return <MenuPage />;
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
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Live Food Operations</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-800 uppercase italic">
            Food <span className="text-primary">Dashboard</span>
          </h1>
          <p className="text-sm text-slate-400 font-medium">Track orders, restaurants, and delivery performance.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button className="px-5 py-3 border border-slate-200 hover:border-slate-300 text-slate-600 bg-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all active:scale-[0.98] cursor-pointer">Refresh Data</button>
          <button className="px-5 py-3 bg-primary hover:bg-primary/95 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-lg active:scale-[0.98] flex items-center gap-2 cursor-pointer" style={{ boxShadow: `0 8px 24px color-mix(in srgb, var(--primary) 15%, transparent)` }}>
            <Plus size={14} /> Manage Orders
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
            <h2 className="text-lg font-black uppercase tracking-tight text-slate-800">Orders Volume</h2>
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
            <h2 className="text-lg font-black uppercase tracking-tight text-slate-800">Top Restaurants</h2>
            <p className="text-xs text-slate-400 font-bold">Best performers this month</p>
          </div>
          <div className="space-y-4 flex-1 flex flex-col justify-center">
            {TOP_RESTAURANTS.map((r, i) => (
              <div key={i} className="flex items-center gap-4 cursor-pointer">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-black" style={{ background: "var(--primary)" }}>{r.name.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-slate-800 truncate">{r.name}</p>
                  <p className="text-[10px] font-bold text-slate-400">{r.orders} orders · ⭐ {r.rating}</p>
                </div>
                <span className="text-xs font-black text-primary">{r.revenue}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <ShoppingBag size={16} className="text-primary" />
            <h2 className="text-lg font-black uppercase tracking-tight text-slate-800">Recent Orders</h2>
          </div>
          <button className="text-[10px] font-black text-primary uppercase tracking-wider hover:underline cursor-pointer">All Orders</button>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>ID</th><th>Customer</th><th>Restaurant</th><th>Items</th><th>Status</th><th>Total</th><th>Time</th><th></th></tr></thead>
            <tbody>
              {RECENT_ORDERS.map((o) => {
                const st = STATUS_MAP[o.status];
                return (
                  <tr key={o.id}>
                    <td className="font-mono font-black text-primary">{o.id}</td>
                    <td className="font-black text-slate-800">{o.customer}</td>
                    <td>{o.restaurant}</td>
                    <td>{o.items} items</td>
                    <td><div className="flex items-center gap-2"><span className={`w-2.5 h-2.5 rounded-full ${st.bg}`} /><span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">{st.label}</span></div></td>
                    <td className="font-mono font-black text-slate-800">{o.total}</td>
                    <td className="text-[10px] font-bold text-slate-400">{o.time}</td>
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

function RestaurantsPage() {
  const restaurants = [
    { name: "Pizza Palace", address: "23 Rue Didouche Mourad", category: "Pizza", status: "open", orders: 1248, rating: 4.8 },
    { name: "Burger Zone", address: "45 Bd Mohamed V", category: "Burgers", status: "open", orders: 986, rating: 4.6 },
    { name: "Le Gourmet", address: "12 Rue Larbi Ben M'hidi", category: "Fine Dining", status: "closed", orders: 754, rating: 4.9 },
    { name: "Sushi House", address: "78 Av. Pasteur", category: "Japanese", status: "open", orders: 632, rating: 4.7 },
    { name: "Taco Bell DZ", address: "3 Place Audin", category: "Mexican", status: "open", orders: 428, rating: 4.4 },
    { name: "Chez Mama", address: "56 Rue de la Liberté", category: "Traditional", status: "closed", orders: 892, rating: 4.8 },
  ];
  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fadeIn pb-16">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tighter text-slate-800 uppercase">Restaurants</h1>
          <p className="text-sm text-slate-400 font-medium">Manage registered restaurants</p>
        </div>
        <button className="px-5 py-3 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-lg active:scale-[0.98] flex items-center gap-2 cursor-pointer" style={{ boxShadow: `0 8px 24px color-mix(in srgb, var(--primary) 15%, transparent)` }}><Plus size={14} /> Add Restaurant</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 stagger">
        {restaurants.map((r, i) => (
          <div key={i} className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm hover:-translate-y-1 transition-all animate-fadeIn cursor-pointer group">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg font-black transition-transform group-hover:scale-105" style={{ background: "var(--primary)" }}>{r.name.charAt(0)}</div>
              <div className="flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${r.status === "open" ? "bg-emerald-500" : "bg-slate-300"}`} /><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{r.status}</span></div>
            </div>
            <h4 className="text-sm font-black text-slate-800 mt-4 uppercase tracking-tight">{r.name}</h4>
            <p className="text-[10px] text-slate-400 font-bold mt-1">{r.address}</p>
            <div className="flex items-center gap-4 mt-4 text-[10px] text-slate-400 font-bold">
              <span className="flex items-center gap-1"><Utensils size={11} /> {r.category}</span>
              <span className="flex items-center gap-1"><Star size={11} className="text-amber-400" /> {r.rating}</span>
              <span className="flex items-center gap-1"><ShoppingBag size={11} /> {r.orders}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OrdersPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fadeIn pb-16">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tighter text-slate-800 uppercase">All Orders</h1>
          <p className="text-sm text-slate-400 font-medium">Track and manage food delivery orders</p>
        </div>
        <div className="flex gap-2">
          {["All", "Preparing", "Delivering", "Delivered", "Cancelled"].map(f => (
            <button key={f} className="text-[10px] px-4 py-2.5 rounded-xl font-black uppercase tracking-wider bg-white border border-slate-100 hover:bg-primary/5 hover:border-primary/20 hover:text-primary text-slate-500 transition-all cursor-pointer">{f}</button>
          ))}
        </div>
      </div>
      <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>ID</th><th>Customer</th><th>Restaurant</th><th>Items</th><th>Status</th><th>Total</th><th>Time</th><th></th></tr></thead>
            <tbody>
              {[...RECENT_ORDERS, ...RECENT_ORDERS].map((o, i) => {
                const st = STATUS_MAP[o.status];
                return (
                  <tr key={`${o.id}-${i}`}>
                    <td className="font-mono font-black text-primary">{o.id}</td>
                    <td className="font-black text-slate-800">{o.customer}</td>
                    <td>{o.restaurant}</td>
                    <td>{o.items} items</td>
                    <td><div className="flex items-center gap-2"><span className={`w-2.5 h-2.5 rounded-full ${st.bg}`} /><span className="text-[10px] font-bold uppercase">{st.label}</span></div></td>
                    <td className="font-mono font-black">{o.total}</td>
                    <td className="text-[10px] text-slate-400 font-bold">{o.time}</td>
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

function MenuPage() {
  const categories = [
    { name: "Pizza", items: 24, icon: "🍕" }, { name: "Burgers", items: 18, icon: "🍔" },
    { name: "Sushi", items: 32, icon: "🍱" }, { name: "Salads", items: 15, icon: "🥗" },
    { name: "Desserts", items: 20, icon: "🍰" }, { name: "Drinks", items: 28, icon: "🥤" },
    { name: "Traditional", items: 22, icon: "🍲" }, { name: "Grilled", items: 16, icon: "🥩" },
  ];
  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fadeIn pb-16">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tighter text-slate-800 uppercase">Menu & Categories</h1>
          <p className="text-sm text-slate-400 font-medium">Manage food categories across all restaurants</p>
        </div>
        <button className="px-5 py-3 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-lg active:scale-[0.98] flex items-center gap-2 cursor-pointer" style={{ boxShadow: `0 8px 24px color-mix(in srgb, var(--primary) 15%, transparent)` }}><Plus size={14} /> Add Category</button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 stagger">
        {categories.map((c, i) => (
          <div key={i} className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm text-center animate-fadeIn cursor-pointer group hover:-translate-y-1 transition-all">
            <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{c.icon}</div>
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">{c.name}</h4>
            <p className="text-[10px] text-slate-400 font-bold mt-1">{c.items} items</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function EarningsPage() {
  const data = [
    { period: "Today", revenue: "98,400", count: 89, unit: "orders", avg: "1,105 DZD" },
    { period: "This Week", revenue: "689,200", count: 623, unit: "orders", avg: "1,106 DZD" },
    { period: "This Month", revenue: "2,956,800", count: 2674, unit: "orders", avg: "1,106 DZD" },
  ];
  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fadeIn pb-16">
      <div className="space-y-2">
        <h1 className="text-3xl font-black tracking-tighter text-slate-800 uppercase">Earnings</h1>
        <p className="text-sm text-slate-400 font-medium">Food delivery revenue and analytics</p>
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
          {[38, 55, 42, 68, 52, 75, 60, 48, 82, 70, 58, 88, 72, 65].map((h, i) => (
            <div key={i} className="flex-1 rounded-t-lg transition-all duration-300 cursor-pointer hover:opacity-80" style={{ height: `${h}%`, background: "var(--primary)", opacity: 0.3 + (h / 130) }} />
          ))}
        </div>
      </div>
    </div>
  );
}
