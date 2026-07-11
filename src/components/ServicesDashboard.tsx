"use client";

import { useState, useEffect } from "react";
import {
  Wrench, Users, DollarSign, CalendarCheck, TrendingUp, ArrowDownRight,
  MoreHorizontal, CheckCircle2, Clock, XCircle, Plus, Activity, Shield, UserCheck, Briefcase,
  Phone, MapPin, Image as ImageIcon, Star, Check, AlertCircle, ExternalLink, X, ChevronRight
} from "lucide-react";

// ==========================================
// TYPES & MOCK DATABASE
// ==========================================

export interface Review {
  clientName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Professional {
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
  reviews: Review[];
}

export interface Booking {
  id: string;
  clientName: string;
  clientPhone: string;
  clientAddress: string;
  serviceCategory: string;
  workerId: string; // references Professional.id
  status:
    | "pending_review"
    | "contacting_worker"
    | "worker_confirmed"
    | "contacting_client"
    | "client_confirmed"
    | "both_confirmed"
    | "dispatched"
    | "in_progress"
    | "completed"
    | "cancelled";
  price: string;
  description: string;
  time: string;
  statusHistory: { status: string; timestamp: string }[];
}

const INITIAL_PROFESSIONALS: Professional[] = [
  {
    id: "PRO-1",
    name: "Lyes K.",
    category: "Electrician",
    phone: "+213 555 12 34 56",
    status: "online",
    verified: true,
    jobs: 164,
    rating: 4.9,
    joined: "Feb 2024",
    rate: "1,800 DZD / Hour",
    experience: "7 Years of residential and industrial electrical work. Specialist in panel boards and short circuit repairs.",
    bio: "Certified technician with hands-on expertise in domestic wiring, lighting fixtures, and power issue diagnostics.",
    portfolio: [
      "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80",
      "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400&q=80",
      "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=400&q=80"
    ],
    reviews: [
      { clientName: "Fodil B.", rating: 5, comment: "Very professional, fixed my distribution board in 30 minutes.", date: "1 week ago" },
      { clientName: "Amine S.", rating: 4.8, comment: "Punctual and clean work. Strongly recommended.", date: "3 weeks ago" }
    ]
  },
  {
    id: "PRO-2",
    name: "Karim M.",
    category: "Plumber",
    phone: "+213 555 98 76 54",
    status: "online",
    verified: true,
    jobs: 186,
    rating: 4.8,
    joined: "Jan 2024",
    rate: "2,000 DZD / Hour",
    experience: "10 Years of experience. Specialist in water pumps, leaking pipes, bathroom installations, and emergency clogging.",
    bio: "Pipes installation specialist. Dedicated to responsive home maintenance and using durable Algerian-standard plumbing fittings.",
    portfolio: [
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&q=80",
      "https://images.unsplash.com/photo-1542013936693-8848e5740a7b?w=400&q=80"
    ],
    reviews: [
      { clientName: "Mourad L.", rating: 5, comment: "Excellent work, resolved pressure issues with the water tank perfectly.", date: "2 days ago" }
    ]
  },
  {
    id: "PRO-3",
    name: "Hassan F.",
    category: "AC Repair",
    phone: "+213 555 45 67 89",
    status: "busy",
    verified: true,
    jobs: 142,
    rating: 4.9,
    joined: "Mar 2024",
    rate: "2,500 DZD fixed diagnose fee",
    experience: "5 Years specializing in split AC installations, gas recharge, and compressor maintenance.",
    bio: "Prompt air conditioning expert. Highly efficient in repairing condenser units and heat pump cycles before hot summers.",
    portfolio: [
      "https://images.unsplash.com/photo-1621905252507-b354bc25edac?w=400&q=80",
      "https://images.unsplash.com/photo-1527689368864-3a821dbccc34?w=400&q=80"
    ],
    reviews: [
      { clientName: "Yasmina R.", rating: 5, comment: "Clean diagnostic. Recharged the cooling gas quickly.", date: "5 days ago" }
    ]
  },
  {
    id: "PRO-4",
    name: "Rachid B.",
    category: "Cleaner",
    phone: "+213 555 33 44 55",
    status: "online",
    verified: false,
    jobs: 128,
    rating: 4.7,
    joined: "Mar 2024",
    rate: "1,200 DZD / Hour",
    experience: "4 Years in deep home cleaning, carpet shampooing, post-renovation disinfection, and window washing.",
    bio: "Detailed cleaner focusing on eco-friendly cleaning supplies and thorough sanitization.",
    portfolio: [
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80",
      "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=400&q=80"
    ],
    reviews: [
      { clientName: "Imane H.", rating: 4, comment: "Nice cleaning job, missed a spot behind the couch but came back and fixed it.", date: "2 weeks ago" }
    ]
  },
  {
    id: "PRO-5",
    name: "Said L.",
    category: "Painter",
    phone: "+213 555 66 77 88",
    status: "offline",
    verified: false,
    jobs: 56,
    rating: 4.5,
    joined: "May 2024",
    rate: "3,000 DZD / Room",
    experience: "6 Years of expertise in wall preparations, decorative coating, wood painting, and wallpaper installation.",
    bio: "Creative painter dedicated to smooth finishes, custom color mixes, and protecting furniture.",
    portfolio: [
      "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&q=80",
      "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=400&q=80"
    ],
    reviews: [
      { clientName: "Omar D.", rating: 4.5, comment: "Did a beautiful modern design in the living room wall.", date: "1 month ago" }
    ]
  },
  {
    id: "PRO-6",
    name: "Mourad T.",
    category: "Carpenter",
    phone: "+213 555 11 22 33",
    status: "online",
    verified: true,
    jobs: 98,
    rating: 4.8,
    joined: "Apr 2024",
    rate: "2,200 DZD / Hour",
    experience: "12 Years in wooden furniture repair, custom cupboard fittings, door locks, and laminate floor installations.",
    bio: "Veteran artisan focusing on solid wood structural modifications and fine cabinet detailing.",
    portfolio: [
      "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=400&q=80",
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80"
    ],
    reviews: [
      { clientName: "Chafik Y.", rating: 5, comment: "Customized our kitchen counters perfectly. Outstanding wood craftsmanship.", date: "3 weeks ago" }
    ]
  },
  {
    id: "PRO-7",
    name: "Sofiane D.",
    category: "Electrician",
    phone: "+213 555 44 88 99",
    status: "online",
    verified: true,
    jobs: 45,
    rating: 4.7,
    joined: "May 2024",
    rate: "1,500 DZD / Hour",
    experience: "3 Years in general home cabling, breaker replacement, and home appliance hookups.",
    bio: "Energetic junior technician offering friendly service and safety compliance checks.",
    portfolio: [
      "https://images.unsplash.com/photo-1558224494-ef3b3b4036f6?w=400&q=80"
    ],
    reviews: [
      { clientName: "Tarek B.", rating: 5, comment: "Very quick in replacing the bathroom switches.", date: "1 month ago" }
    ]
  }
];

const INITIAL_BOOKINGS: Booking[] = [
  {
    id: "SV-3421",
    clientName: "Ahmed Belkacem",
    clientPhone: "+213 661 22 33 44",
    clientAddress: "12 Rue Didouche Mourad, Algiers",
    serviceCategory: "Plumber",
    workerId: "PRO-2",
    status: "in_progress",
    price: "4,000 DZD",
    description: "Bathroom water pipe leak repair. Water is dripping continuously from the main sink joint.",
    time: "1 hour ago",
    statusHistory: [
      { status: "pending_review", timestamp: "3 hours ago" },
      { status: "contacting_worker", timestamp: "2.5 hours ago" },
      { status: "worker_confirmed", timestamp: "2 hours ago" },
      { status: "contacting_client", timestamp: "2 hours ago" },
      { status: "client_confirmed", timestamp: "1.8 hours ago" },
      { status: "both_confirmed", timestamp: "1.5 hours ago" },
      { status: "dispatched", timestamp: "1.2 hours ago" },
      { status: "in_progress", timestamp: "1 hour ago" }
    ]
  },
  {
    id: "SV-3420",
    clientName: "Fatima Zohra",
    clientPhone: "+213 672 55 66 77",
    clientAddress: "Cité 5 Juillet, Bab Ezzouar",
    serviceCategory: "Electrician",
    workerId: "PRO-1",
    status: "completed",
    price: "3,600 DZD",
    description: "Installation of 3 new ceiling lights and testing the kitchen stove power socket.",
    time: "2 hours ago",
    statusHistory: [
      { status: "pending_review", timestamp: "5 hours ago" },
      { status: "both_confirmed", timestamp: "4 hours ago" },
      { status: "in_progress", timestamp: "3 hours ago" },
      { status: "completed", timestamp: "2 hours ago" }
    ]
  },
  {
    id: "SV-3419",
    clientName: "Sara Kouadri",
    clientPhone: "+213 659 99 88 77",
    clientAddress: "Villa 45, Hydra, Algiers",
    serviceCategory: "Painter",
    workerId: "PRO-5",
    status: "pending_review",
    price: "9,000 DZD",
    description: "Living room accent wall painting. Selected paint type is matte off-white.",
    time: "3 hours ago",
    statusHistory: [
      { status: "pending_review", timestamp: "3 hours ago" }
    ]
  },
  {
    id: "SV-3418",
    clientName: "Amine Touati",
    clientPhone: "+213 770 12 34 56",
    clientAddress: "88 Boulevard Colonel Bougara, El Biar",
    serviceCategory: "AC Repair",
    workerId: "PRO-3",
    status: "both_confirmed",
    price: "5,000 DZD",
    description: "AC is turning on but blowing warm air. Gas leakage verification and refill needed.",
    time: "4 hours ago",
    statusHistory: [
      { status: "pending_review", timestamp: "6 hours ago" },
      { status: "contacting_worker", timestamp: "5.5 hours ago" },
      { status: "worker_confirmed", timestamp: "5 hours ago" },
      { status: "client_confirmed", timestamp: "4.5 hours ago" },
      { status: "both_confirmed", timestamp: "4 hours ago" }
    ]
  }
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
  { name: "Mover", pros: 28, bookings: 116, icon: "📦" }
];

const STATUS_DETAILS: Record<string, { label: string; color: string; bg: string }> = {
  pending_review: { label: "Pending Review", color: "text-amber-700 border-amber-200", bg: "bg-amber-500" },
  contacting_worker: { label: "Contacting Worker", color: "text-blue-700 border-blue-200", bg: "bg-blue-400" },
  worker_confirmed: { label: "Worker Confirmed", color: "text-indigo-700 border-indigo-200", bg: "bg-indigo-500" },
  contacting_client: { label: "Contacting Client", color: "text-purple-700 border-purple-200", bg: "bg-purple-400" },
  client_confirmed: { label: "Client Confirmed", color: "text-sky-700 border-sky-200", bg: "bg-sky-500" },
  both_confirmed: { label: "Both Confirmed", color: "text-emerald-700 border-emerald-200", bg: "bg-emerald-500" },
  dispatched: { label: "Dispatched", color: "text-violet-700 border-violet-200", bg: "bg-violet-600" },
  in_progress: { label: "In Progress", color: "text-orange-700 border-orange-200", bg: "bg-orange-500" },
  completed: { label: "Completed", color: "text-emerald-800 border-emerald-300", bg: "bg-emerald-600" },
  cancelled: { label: "Cancelled", color: "text-rose-700 border-rose-200", bg: "bg-rose-500" }
};

const COLOR_MAP: Record<string, { bg: string; text: string; hover: string }> = {
  amber: { bg: "bg-amber-50", text: "text-amber-600", hover: "group-hover:bg-amber-500 group-hover:text-white" },
  blue: { bg: "bg-blue-50", text: "text-blue-600", hover: "group-hover:bg-blue-500 group-hover:text-white" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-600", hover: "group-hover:bg-emerald-500 group-hover:text-white" },
  purple: { bg: "bg-purple-50", text: "text-purple-600", hover: "group-hover:bg-purple-500 group-hover:text-white" }
};

interface ServicesDashboardProps {
  activePage: string;
}

export default function ServicesDashboard({ activePage }: ServicesDashboardProps) {
  // Top level state
  const [professionals, setProfessionals] = useState<Professional[]>(INITIAL_PROFESSIONALS);
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [categories, setCategories] = useState(SERVICE_CATEGORIES);

  // Filter & Detail states
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedWorker, setSelectedWorker] = useState<Professional | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  
  // Modal states
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" } | null>(null);

  // Sync state detail panels if the collection lists change
  useEffect(() => {
    if (selectedWorker) {
      const updated = professionals.find(p => p.id === selectedWorker.id);
      if (updated) setSelectedWorker(updated);
    }
  }, [professionals, selectedWorker]);

  useEffect(() => {
    if (selectedBooking) {
      const updated = bookings.find(b => b.id === selectedBooking.id);
      if (updated) setSelectedBooking(updated);
    }
  }, [bookings, selectedBooking]);

  const showToast = (message: string, type: "success" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // 1. Simulate client order
  const handleSimulateOrder = () => {
    // Pick random category and random worker from that category
    const randCategoryObj = categories[Math.floor(Math.random() * categories.length)];
    const eligibleWorkers = professionals.filter(p => p.category === randCategoryObj.name);
    
    if (eligibleWorkers.length === 0) return;
    const worker = eligibleWorkers[Math.floor(Math.random() * eligibleWorkers.length)];

    const clientNames = ["Amira Merad", "Yacine Rahmani", "Nabila Hachemi", "Brahim Djelloul", "Meriem Cherif"];
    const issues: Record<string, string[]> = {
      Plumber: ["Kitchen sink pipe ruptured", "Water tank pressure valve leaking", "Toilet flush pipe replacement"],
      Electrician: ["Main fuse breaker tripping frequently", "Installing light dimmers in living room", "Balcony wiring checking"],
      "AC Repair": ["AC filter deep clean", "Condenser unit fan makes loud noise", "Gas pressure check"],
      Cleaner: ["Deep kitchen cleaning before holidays", "Living room sofa vacuum washing"],
      Painter: ["Bedroom door repainting", "Hallway wall scraping and painting"],
      Carpenter: ["Door hinge squeaking adjustment", "Fitting new kitchen drawer sliders"]
    };

    const clientName = clientNames[Math.floor(Math.random() * clientNames.length)];
    const issueList = issues[randCategoryObj.name] || ["Emergency request regarding home repair"];
    const description = issueList[Math.floor(Math.random() * issueList.length)];
    const priceRange = ["3,000 DZD", "4,500 DZD", "7,000 DZD", "2,200 DZD"];
    const price = priceRange[Math.floor(Math.random() * priceRange.length)];

    const newBooking: Booking = {
      id: `SV-${Math.floor(Math.random() * 9000 + 1000)}`,
      clientName,
      clientPhone: `+213 6${Math.floor(Math.random() * 90000000 + 10000000)}`,
      clientAddress: `${Math.floor(Math.random() * 50 + 1)} Rue des Frères, Algiers`,
      serviceCategory: randCategoryObj.name,
      workerId: worker.id,
      status: "pending_review",
      price,
      description,
      time: "Just now",
      statusHistory: [{ status: "pending_review", timestamp: "Just now" }]
    };

    setBookings([newBooking, ...bookings]);
    
    // Update stats count locally
    setCategories(prev =>
      prev.map(c => (c.name === randCategoryObj.name ? { ...c, bookings: c.bookings + 1 } : c))
    );

    showToast(`⚡ New order ${newBooking.id} received! Client ${clientName} selected ${worker.name}.`, "info");
  };

  // 2. Add custom manual booking
  const handleCreateManualBooking = (fields: {
    clientName: string;
    clientPhone: string;
    clientAddress: string;
    category: string;
    workerId: string;
    description: string;
    price: string;
  }) => {
    const newBooking: Booking = {
      id: `SV-${Math.floor(Math.random() * 9000 + 1000)}`,
      clientName: fields.clientName,
      clientPhone: fields.clientPhone,
      clientAddress: fields.clientAddress,
      serviceCategory: fields.category,
      workerId: fields.workerId,
      status: "pending_review",
      price: fields.price || "Contact for Quote",
      description: fields.description,
      time: "Just now",
      statusHistory: [{ status: "pending_review", timestamp: "Just now" }]
    };

    setBookings([newBooking, ...bookings]);
    
    // Update count
    setCategories(prev =>
      prev.map(c => (c.name === fields.category ? { ...c, bookings: c.bookings + 1 } : c))
    );

    setShowRegisterModal(false);
    showToast(`📝 Booking ${newBooking.id} registered manually!`, "success");
  };

  // 3. Update Booking Status
  const handleUpdateBookingStatus = (bookingId: string, nextStatus: Booking["status"]) => {
    const timeStr = "Just now";
    setBookings(prev =>
      prev.map(b => {
        if (b.id === bookingId) {
          return {
            ...b,
            status: nextStatus,
            statusHistory: [...b.statusHistory, { status: nextStatus, timestamp: timeStr }]
          };
        }
        return b;
      })
    );
    showToast(`Booking ${bookingId} transitioned to ${STATUS_DETAILS[nextStatus].label}`, "success");
  };

  // 4. Reassign worker
  const handleReassignWorker = (bookingId: string, workerId: string) => {
    const worker = professionals.find(p => p.id === workerId);
    if (!worker) return;
    setBookings(prev =>
      prev.map(b => {
        if (b.id === bookingId) {
          return {
            ...b,
            workerId,
            // Reassigning resets states back to pending review for fresh verification
            status: "pending_review",
            statusHistory: [...b.statusHistory, { status: `Worker changed to ${worker.name}`, timestamp: "Just now" }]
          };
        }
        return b;
      })
    );
    showToast(`Assigned worker updated to ${worker.name}`, "success");
  };

  // 5. Verify / Unverify Professional
  const handleToggleVerifyWorker = (workerId: string) => {
    setProfessionals(prev =>
      prev.map(p => {
        if (p.id === workerId) {
          const nextVal = !p.verified;
          showToast(`${p.name} is now ${nextVal ? "Verified ✅" : "Unverified ❌"}`, "success");
          return { ...p, verified: nextVal };
        }
        return p;
      })
    );
  };

  // 6. Change worker active status
  const handleChangeWorkerStatus = (workerId: string, nextStatus: Professional["status"]) => {
    setProfessionals(prev =>
      prev.map(p => {
        if (p.id === workerId) {
          return { ...p, status: nextStatus };
        }
        return p;
      })
    );
    showToast(`${professionals.find(p => p.id === workerId)?.name} is now ${nextStatus}`, "success");
  };

  // Dynamic values
  const activeBookings = bookings.filter(b => b.status !== "completed" && b.status !== "cancelled").length;
  const verifiedProsCount = professionals.filter(p => p.verified).length;
  
  const statsList = [
    { label: "Active Bookings", value: String(activeBookings), sub: "Jobs", change: "+14%", up: true, icon: CalendarCheck, color: "amber" },
    { label: "Verified Pros", value: `${verifiedProsCount}/${professionals.length}`, sub: "Workers", change: "+3.2%", up: true, icon: Users, color: "blue" },
    { label: "Today Revenue", value: "72,600", sub: "DZD", change: "+9.4%", up: true, icon: DollarSign, color: "emerald" },
    { label: "Total Categories", value: String(categories.length), sub: "Specialties", change: "+2", up: true, icon: Wrench, color: "purple" }
  ];

  // Render correct sub page or dashboard
  const renderView = () => {
    if (selectedCategory) {
      return (
        <CategoryWorkersPage
          category={selectedCategory}
          professionals={professionals}
          onBack={() => setSelectedCategory(null)}
          onSelectWorker={setSelectedWorker}
          onToggleVerify={handleToggleVerifyWorker}
        />
      );
    }

    if (activePage === "categories") {
      return (
        <CategoriesPage
          categories={categories}
          onSelectCategory={setSelectedCategory}
        />
      );
    }
    if (activePage === "professionals") {
      return (
        <ProfessionalsPage
          professionals={professionals}
          onSelectWorker={setSelectedWorker}
          onToggleVerify={handleToggleVerifyWorker}
          onChangeStatus={handleChangeWorkerStatus}
        />
      );
    }
    if (activePage === "bookings") {
      return (
        <BookingsPage
          bookings={bookings}
          professionals={professionals}
          onSelectBooking={setSelectedBooking}
        />
      );
    }
    if (activePage === "earnings") {
      return <EarningsPage />;
    }

    return (
      <DashboardOverview
        statsList={statsList}
        categories={categories}
        bookings={bookings}
        professionals={professionals}
        onSelectCategory={setSelectedCategory}
        onSelectBooking={setSelectedBooking}
        onOpenManualModal={() => setShowRegisterModal(true)}
      />
    );
  };

  return (
    <div className="relative">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-24 right-8 z-50 animate-fadeIn bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-800">
          <Activity size={18} className="text-primary animate-pulse" />
          <span className="text-xs font-bold font-inter">{toast.message}</span>
        </div>
      )}

      {/* Main View Container */}
      {renderView()}

      {/* Floating Order Simulator Button */}
      <button
        onClick={handleSimulateOrder}
        className="fixed bottom-8 right-8 z-40 bg-slate-900 hover:bg-slate-800 text-white rounded-full px-6 py-4 flex items-center gap-3 shadow-2xl transition-all hover:scale-105 active:scale-95 group cursor-pointer border border-slate-700"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
        </span>
        <span className="text-[10px] font-black uppercase tracking-widest">Simulate Client Order ⚡</span>
      </button>

      {/* Modals & Drawers */}
      {showRegisterModal && (
        <RegisterBookingModal
          professionals={professionals}
          categories={categories}
          onClose={() => setShowRegisterModal(false)}
          onSubmit={handleCreateManualBooking}
        />
      )}

      {selectedWorker && (
        <WorkerProfileDrawer
          worker={selectedWorker}
          onClose={() => setSelectedWorker(null)}
          onToggleVerify={handleToggleVerifyWorker}
          onChangeStatus={handleChangeWorkerStatus}
        />
      )}

      {selectedBooking && (
        <BookingDetailDrawer
          booking={selectedBooking}
          professionals={professionals}
          onClose={() => setSelectedBooking(null)}
          onUpdateStatus={handleUpdateBookingStatus}
          onReassignWorker={handleReassignWorker}
        />
      )}
    </div>
  );
}

// ==========================================
// SUB-VIEWS COMPONENTS
// ==========================================

interface DashboardOverviewProps {
  statsList: any[];
  categories: any[];
  bookings: Booking[];
  professionals: Professional[];
  onSelectCategory: (cat: string) => void;
  onSelectBooking: (b: Booking) => void;
  onOpenManualModal: () => void;
}

function DashboardOverview({
  statsList,
  categories,
  bookings,
  professionals,
  onSelectCategory,
  onSelectBooking,
  onOpenManualModal
}: DashboardOverviewProps) {
  return (
    <div className="space-y-10 max-w-7xl mx-auto animate-fadeIn pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-primary/5 px-4 py-2 rounded-full border border-primary/10">
            <Activity size={14} className="text-primary animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Live Services Control</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-800 uppercase italic">
            Services <span className="text-primary">Dashboard</span>
          </h1>
          <p className="text-sm text-slate-400 font-medium font-inter">Manage on-demand listings, category filters, and verify incoming client jobs.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onOpenManualModal}
            className="px-5 py-3 bg-primary hover:bg-primary/95 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-lg active:scale-[0.98] flex items-center gap-2 cursor-pointer"
            style={{ boxShadow: `0 8px 24px color-mix(in srgb, var(--primary) 15%, transparent)` }}
          >
            <Plus size={14} /> Register New Booking
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsList.map((s, i) => {
          const Icon = s.icon;
          const c = COLOR_MAP[s.color] || COLOR_MAP.blue;
          return (
            <div key={i} className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm flex items-center justify-between group transition-all hover:-translate-y-1">
              <div className="space-y-2.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{s.label}</span>
                <div className="space-y-0.5">
                  <span className="text-2xl font-black text-slate-800 tracking-tight block">
                    {s.value} <span className="text-xs font-bold text-slate-400">{s.sub}</span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1 font-inter">
                    <TrendingUp size={12} /> {s.change} this month
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

      {/* Service Categories Grid */}
      <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <h2 className="text-lg font-black uppercase tracking-tight text-slate-800">Service Categories</h2>
            <p className="text-xs text-slate-400 font-bold font-inter">Click a specialty to view enrolled workers profiles</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-4">
          {categories.map((c, i) => (
            <div
              key={i}
              onClick={() => onSelectCategory(c.name)}
              className="text-center p-4 rounded-2xl bg-slate-50 hover:bg-primary/5 hover:border-primary/20 hover:scale-[1.02] transition-all cursor-pointer group border border-transparent"
            >
              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{c.icon}</div>
              <p className="text-[10px] font-black text-slate-700 uppercase tracking-tight truncate">{c.name}</p>
              <p className="text-[9px] text-slate-400 font-bold mt-0.5 font-inter">View Workers</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Bookings Queue */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <CalendarCheck size={16} className="text-primary" />
            <h2 className="text-lg font-black uppercase tracking-tight text-slate-800">Incoming Client Bookings</h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Client</th>
                <th>Selected Worker</th>
                <th>Service Type</th>
                <th>Price/Rate</th>
                <th>Time</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {bookings.slice(0, 6).map((b) => {
                const worker = professionals.find(p => p.id === b.workerId);
                const st = STATUS_DETAILS[b.status] || STATUS_DETAILS.pending_review;
                return (
                  <tr key={b.id}>
                    <td className="font-mono font-black text-primary">{b.id}</td>
                    <td className="font-black text-slate-800">{b.clientName}</td>
                    <td className="font-semibold">{worker ? worker.name : "Unassigned"}</td>
                    <td>
                      <span className="flex items-center gap-1.5 font-inter text-xs">
                        <Wrench size={12} className="text-slate-400" /> {b.serviceCategory}
                      </span>
                    </td>
                    <td className="font-mono font-black text-slate-800">{b.price}</td>
                    <td className="text-[10px] font-bold text-slate-400 font-inter">{b.time}</td>
                    <td>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-wider ${st.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${st.bg}`} />
                        {st.label}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => onSelectBooking(b)}
                        className="px-3 py-1.5 bg-slate-50 border border-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-primary/5 hover:text-primary transition-all cursor-pointer"
                      >
                        Manage Pipeline
                      </button>
                    </td>
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

// ==========================================
// CATEGORY WORKERS FILTERED VIEW
// ==========================================

interface CategoryWorkersPageProps {
  category: string;
  professionals: Professional[];
  onBack: () => void;
  onSelectWorker: (p: Professional) => void;
  onToggleVerify: (id: string) => void;
}

function CategoryWorkersPage({
  category,
  professionals,
  onBack,
  onSelectWorker,
  onToggleVerify
}: CategoryWorkersPageProps) {
  const filtered = professionals.filter(p => p.category.toLowerCase() === category.toLowerCase());

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fadeIn pb-16">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
        >
          ← Categories
        </button>
        <h1 className="text-2xl font-black text-slate-800 uppercase">
          {category} <span className="text-primary">Workers</span>
        </h1>
      </div>

      <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm">
        {filtered.length === 0 ? (
          <p className="text-center py-12 text-slate-400 font-bold font-inter text-xs">
            No registered professionals found in this category.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((p) => (
              <div
                key={p.id}
                className="border border-slate-100 hover:border-primary/20 rounded-[2rem] p-6 space-y-4 hover:-translate-y-1 transition-all group relative cursor-pointer"
                onClick={() => onSelectWorker(p)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 text-primary font-black uppercase rounded-2xl flex items-center justify-center text-sm">
                      {p.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
                        {p.name}
                        {p.verified && <Shield size={12} className="text-primary fill-primary" />}
                      </h4>
                      <p className="text-[9px] font-bold text-slate-400 font-inter">{p.experience}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-black text-slate-700">⭐ {p.rating}</span>
                  </div>
                </div>

                <div className="border-t border-slate-50 pt-3 flex justify-between items-center text-[10px] font-bold text-slate-500">
                  <span>Rate: <strong className="text-slate-700">{p.rate}</strong></span>
                  <span>Jobs: <strong className="text-slate-700">{p.jobs} jobs</strong></span>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${p.status === "online" ? "bg-emerald-500" : p.status === "busy" ? "bg-amber-500" : "bg-slate-300"}`} />
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 font-inter">{p.status}</span>
                  </div>
                  <span className="text-[9px] font-black text-primary uppercase tracking-widest group-hover:translate-x-1 transition-transform flex items-center gap-1 font-inter">
                    Profile Drawer →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// CATEGORIES PAGE
// ==========================================

interface CategoriesPageProps {
  categories: any[];
  onSelectCategory: (name: string) => void;
}

function CategoriesPage({ categories, onSelectCategory }: CategoriesPageProps) {
  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fadeIn pb-16">
      <div className="space-y-2">
        <h1 className="text-3xl font-black tracking-tighter text-slate-800 uppercase">Service Specialties</h1>
        <p className="text-sm text-slate-400 font-medium font-inter">Active client-facing categories on the mobile client</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {categories.map((c, i) => (
          <div
            key={i}
            onClick={() => onSelectCategory(c.name)}
            className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm hover:scale-[1.01] transition-all cursor-pointer group flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="text-4xl bg-slate-50 p-3 rounded-2xl group-hover:scale-105 transition-transform">
                {c.icon}
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">{c.name}</h4>
                <p className="text-[10px] text-slate-400 font-bold font-inter mt-0.5">{c.pros} active professionals</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// PROFESSIONALS DIRECTORY VIEW
// ==========================================

interface ProfessionalsPageProps {
  professionals: Professional[];
  onSelectWorker: (p: Professional) => void;
  onToggleVerify: (id: string) => void;
  onChangeStatus: (id: string, s: Professional["status"]) => void;
}

function ProfessionalsPage({
  professionals,
  onSelectWorker,
  onToggleVerify,
  onChangeStatus
}: ProfessionalsPageProps) {
  const statusColors: Record<string, string> = { online: "bg-emerald-500", busy: "bg-amber-500", offline: "bg-slate-300" };

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fadeIn pb-16">
      <div className="space-y-2">
        <h1 className="text-3xl font-black tracking-tighter text-slate-800 uppercase">Professionals Directory</h1>
        <p className="text-sm text-slate-400 font-medium font-inter">Manage account validation, status override, and details review</p>
      </div>

      <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Professional</th>
                <th>Specialty</th>
                <th>Contact</th>
                <th>Base Rate</th>
                <th>Experience</th>
                <th>Verified</th>
                <th>Rating</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {professionals.map((p) => (
                <tr key={p.id}>
                  <td className="font-black text-slate-800">{p.name}</td>
                  <td>
                    <span className="flex items-center gap-1.5 font-inter text-xs">
                      <Wrench size={12} className="text-slate-400" /> {p.category}
                    </span>
                  </td>
                  <td className="text-slate-400 font-mono text-xs">{p.phone}</td>
                  <td className="font-mono text-slate-700 font-bold">{p.rate}</td>
                  <td className="max-w-[200px] truncate text-[11px] font-medium text-slate-500">{p.experience}</td>
                  <td>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleVerify(p.id);
                      }}
                      className={`px-3 py-1.5 border rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                        p.verified
                          ? "bg-emerald-50/50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
                          : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {p.verified ? "✓ Verified" : "Verify account"}
                    </button>
                  </td>
                  <td className="font-black text-slate-700">⭐ {p.rating}</td>
                  <td>
                    <select
                      value={p.status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        e.stopPropagation();
                        onChangeStatus(p.id, e.target.value as Professional["status"]);
                      }}
                      className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-black uppercase outline-none"
                    >
                      <option value="online">Online</option>
                      <option value="busy">Busy</option>
                      <option value="offline">Offline</option>
                    </select>
                  </td>
                  <td>
                    <button
                      onClick={() => onSelectWorker(p)}
                      className="px-3 py-1.5 bg-slate-50 border border-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-primary/5 hover:text-primary transition-all cursor-pointer"
                    >
                      View Profile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// CLIENT BOOKINGS TABLE VIEW
// ==========================================

interface BookingsPageProps {
  bookings: Booking[];
  professionals: Professional[];
  onSelectBooking: (b: Booking) => void;
}

function BookingsPage({ bookings, professionals, onSelectBooking }: BookingsPageProps) {
  const [activeTab, setActiveTab] = useState<string>("all");

  const filtered = bookings.filter(b => {
    if (activeTab === "all") return true;
    if (activeTab === "active") return b.status !== "completed" && b.status !== "cancelled";
    return b.status === activeTab;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fadeIn pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tighter text-slate-800 uppercase">Bookings Pipeline</h1>
          <p className="text-sm text-slate-400 font-medium font-inter">Manage customer orders and workflow validation states</p>
        </div>
        
        {/* State filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 select-none">
          {[
            { id: "all", label: "All" },
            { id: "active", label: "Active" },
            { id: "pending_review", label: "Pending" },
            { id: "completed", label: "Completed" },
            { id: "cancelled", label: "Cancelled" }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setActiveTab(f.id)}
              className={`text-[10px] px-4 py-2.5 rounded-xl font-black uppercase tracking-wider transition-all border cursor-pointer ${
                activeTab === f.id
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white border-slate-100 text-slate-500 hover:bg-slate-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Client Name</th>
                <th>Requested Worker</th>
                <th>Specialty</th>
                <th>Price/Rate</th>
                <th>Status</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => {
                const worker = professionals.find(p => p.id === b.workerId);
                const st = STATUS_DETAILS[b.status] || STATUS_DETAILS.pending_review;
                return (
                  <tr key={b.id}>
                    <td className="font-mono font-black text-primary">{b.id}</td>
                    <td className="font-black text-slate-800">{b.clientName}</td>
                    <td>{worker ? worker.name : "Unassigned"}</td>
                    <td>{b.serviceCategory}</td>
                    <td className="font-mono font-black text-slate-800">{b.price}</td>
                    <td>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-wider ${st.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${st.bg}`} />
                        {st.label}
                      </span>
                    </td>
                    <td className="text-[10px] font-bold text-slate-400 font-inter">{b.time}</td>
                    <td>
                      <button
                        onClick={() => onSelectBooking(b)}
                        className="px-3 py-1.5 bg-slate-50 border border-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-primary/5 hover:text-primary transition-all cursor-pointer"
                      >
                        Manage Pipeline
                      </button>
                    </td>
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

// ==========================================
// EARNINGS VIEW
// ==========================================

function EarningsPage() {
  const data = [
    { period: "Today", revenue: "72,600", count: 64, unit: "bookings", avg: "1,134 DZD" },
    { period: "This Week", revenue: "508,200", count: 448, unit: "bookings", avg: "1,134 DZD" },
    { period: "This Month", revenue: "2,174,800", count: 1918, unit: "bookings", avg: "1,134 DZD" }
  ];
  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fadeIn pb-16">
      <div className="space-y-2">
        <h1 className="text-3xl font-black tracking-tighter text-slate-800 uppercase">Earnings</h1>
        <p className="text-sm text-slate-400 font-medium font-inter">Service provider revenue and financial analytics</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {data.map((e, i) => (
          <div key={i} className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm group transition-all hover:-translate-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{e.period}</span>
            <span className="text-2xl font-black text-slate-800 tracking-tight block mt-2">{e.revenue} <span className="text-xs font-bold text-slate-400">DZD</span></span>
            <div className="flex gap-4 mt-3 text-[10px] text-slate-400 font-bold font-inter"><span>{e.count} {e.unit}</span><span>Avg: {e.avg}</span></div>
            <div className="w-full h-2 bg-slate-50 border border-slate-100 rounded-full overflow-hidden mt-4"><div className="h-full rounded-full transition-all duration-1000" style={{ width: `${30 + i * 25}%`, background: "var(--primary)" }} /></div>
          </div>
        ))}
      </div>
      <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm">
        <h2 className="text-lg font-black uppercase tracking-tight text-slate-800 mb-6">Revenue Trend</h2>
        <div className="flex items-end gap-2 h-40">
          {[32, 48, 35, 58, 45, 72, 55, 42, 78, 62, 50, 82, 68, 58].map((h, i) => (
            <div key={i} className="flex-1 rounded-t-lg transition-all duration-300" style={{ height: `${h}%`, background: "var(--primary)", opacity: 0.3 + (h / 130) }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// MODAL: REGISTER BOOKING
// ==========================================

interface RegisterBookingModalProps {
  categories: any[];
  professionals: Professional[];
  onClose: () => void;
  onSubmit: (fields: any) => void;
}

function RegisterBookingModal({ categories, professionals, onClose, onSubmit }: RegisterBookingModalProps) {
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [category, setCategory] = useState(categories[0]?.name || "");
  const [workerId, setWorkerId] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");

  const filteredWorkers = professionals.filter(p => p.category === category && p.status === "online");

  useEffect(() => {
    if (filteredWorkers.length > 0) {
      setWorkerId(filteredWorkers[0].id);
    } else {
      setWorkerId("");
    }
  }, [category, professionals]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientPhone || !clientAddress || !workerId || !description) {
      alert("Please fill in all required fields and select an online worker.");
      return;
    }
    onSubmit({
      clientName,
      clientPhone,
      clientAddress,
      category,
      workerId,
      description,
      price
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl p-8 max-w-lg w-full max-h-[85vh] overflow-y-auto space-y-6 relative m-4">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400 hover:text-slate-800 cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="space-y-1 text-left">
          <h2 className="text-xl font-black text-slate-800 uppercase">Register Booking</h2>
          <p className="text-xs text-slate-400 font-bold font-inter">Create a manual request and assign a professional</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 block mb-2">Client Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Mourad Azzouz"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full px-5 py-4 bg-slate-50 border border-transparent focus:border-primary/20 rounded-2xl outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all font-semibold text-xs text-slate-700"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 block mb-2">Client Phone *</label>
              <input
                type="text"
                required
                placeholder="e.g. +213 655 12 34 56"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border border-transparent focus:border-primary/20 rounded-2xl outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all font-semibold text-xs text-slate-700"
              />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 block mb-2">Estimated Price (DZD)</label>
              <input
                type="text"
                placeholder="e.g. 3,500 DZD"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border border-transparent focus:border-primary/20 rounded-2xl outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all font-semibold text-xs text-slate-700"
              />
            </div>
          </div>

          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 block mb-2">Client Address *</label>
            <input
              type="text"
              required
              placeholder="e.g. Villa 14, Cité Les Dunes, Cheraga"
              value={clientAddress}
              onChange={(e) => setClientAddress(e.target.value)}
              className="w-full px-5 py-4 bg-slate-50 border border-transparent focus:border-primary/20 rounded-2xl outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all font-semibold text-xs text-slate-700"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 block mb-2">Service Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all font-semibold text-xs text-slate-700"
              >
                {categories.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 block mb-2">Select Worker (Online Only) *</label>
              <select
                value={workerId}
                required
                onChange={(e) => setWorkerId(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all font-semibold text-xs text-slate-700"
              >
                {filteredWorkers.length === 0 ? (
                  <option value="">No online workers</option>
                ) : (
                  filteredWorkers.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.rate})
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 block mb-2">Job Description *</label>
            <textarea
              required
              rows={3}
              placeholder="Provide job details or problems reported..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-5 py-4 bg-slate-50 border border-transparent focus:border-primary/20 rounded-2xl outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all font-semibold text-xs text-slate-700 resize-none"
            />
          </div>

          <div className="pt-4 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 border border-slate-200 text-slate-500 rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-slate-50 active:scale-[0.98] transition-all cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-4 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-primary/95 transition-all shadow-lg shadow-primary/20 active:scale-[0.98] cursor-pointer"
            >
              Save Booking
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// DRAWER: WORKER PROFILE
// ==========================================

interface WorkerProfileDrawerProps {
  worker: Professional;
  onClose: () => void;
  onToggleVerify: (id: string) => void;
  onChangeStatus: (id: string, s: Professional["status"]) => void;
}

function WorkerProfileDrawer({ worker, onClose, onToggleVerify, onChangeStatus }: WorkerProfileDrawerProps) {
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      {/* Drawer */}
      <div className="fixed top-0 right-0 bottom-0 w-full sm:w-112 bg-white z-50 shadow-2xl p-8 flex flex-col justify-between overflow-y-auto animate-slideIn">
        <div className="space-y-6 text-left">
          {/* Header */}
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Worker Profile</span>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400 hover:text-slate-800 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Profile overview Card */}
          <div className="flex items-center gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
            <div className="w-16 h-16 bg-primary text-white font-black text-xl uppercase rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-primary/20">
              {worker.name.split(" ").map(n => n[0]).join("")}
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                {worker.name}
                {worker.verified && <Shield size={14} className="text-primary fill-primary flex-shrink-0" />}
              </h3>
              <p className="text-[10px] font-black text-primary uppercase tracking-widest">{worker.category}</p>
              <div className="flex items-center gap-2 font-inter text-[10px] text-slate-400 font-bold">
                <span>Joined {worker.joined}</span>
                <span>•</span>
                <span>⭐ {worker.rating}</span>
              </div>
            </div>
          </div>

          {/* Status and verification config */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Availability Status</label>
              <select
                value={worker.status}
                onChange={(e) => onChangeStatus(worker.id, e.target.value as Professional["status"])}
                className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-black uppercase outline-none"
              >
                <option value="online">Online</option>
                <option value="busy">Busy</option>
                <option value="offline">Offline</option>
              </select>
            </div>
            <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Account Check</span>
              <button
                onClick={() => onToggleVerify(worker.id)}
                className={`w-full py-2 border rounded-xl text-[10px] font-black uppercase tracking-wider transition-all mt-2 cursor-pointer ${
                  worker.verified
                    ? "bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {worker.verified ? "Verified ✓" : "Unverified ✗"}
              </button>
            </div>
          </div>

          {/* Pricing and Details */}
          <div className="space-y-4">
            <div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Pricing / Rate</span>
              <p className="text-xs font-black text-slate-800 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">{worker.rate}</p>
            </div>

            <div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Experience Summary</span>
              <p className="text-xs font-bold text-slate-600 leading-normal font-inter bg-slate-50 p-4 rounded-xl border border-slate-100">
                {worker.experience}
              </p>
            </div>

            <div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Detailed Bio</span>
              <p className="text-xs font-medium text-slate-500 leading-relaxed font-inter">
                {worker.bio}
              </p>
            </div>
          </div>

          {/* Portfolio Pictures */}
          <div className="space-y-2">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Portfolio Images</span>
            <div className="grid grid-cols-3 gap-3">
              {worker.portfolio.map((imgUrl, i) => (
                <div key={i} className="aspect-video bg-slate-100 rounded-xl overflow-hidden relative group border border-slate-100">
                  <img
                    src={imgUrl}
                    alt={`work-${i}`}
                    className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Client Reviews */}
          <div className="space-y-3">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Customer Reviews ({worker.reviews.length})</span>
            <div className="space-y-3">
              {worker.reviews.map((r, i) => (
                <div key={i} className="border border-slate-50 bg-slate-50/20 p-4 rounded-2xl space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className="text-slate-700 font-black">{r.clientName}</span>
                    <span className="text-slate-400 font-inter">{r.date}</span>
                  </div>
                  <div className="flex text-amber-400 text-xs">
                    {Array.from({ length: r.rating }).map((_, j) => (
                      <span key={j}>★</span>
                    ))}
                  </div>
                  <p className="text-[11px] font-medium text-slate-500 font-inter leading-normal">
                    "{r.comment}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 mt-8">
          <a
            href={`tel:${worker.phone}`}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-slate-800 active:scale-[0.98] transition-all"
          >
            <Phone size={14} /> Contact Worker ({worker.phone})
          </a>
        </div>
      </div>
    </>
  );
}

// ==========================================
// DRAWER: BOOKING PIPELINE DETAIL & WORKER REASSIGN
// ==========================================

interface BookingDetailDrawerProps {
  booking: Booking;
  professionals: Professional[];
  onClose: () => void;
  onUpdateStatus: (id: string, s: Booking["status"]) => void;
  onReassignWorker: (id: string, wId: string) => void;
}

function BookingDetailDrawer({
  booking,
  professionals,
  onClose,
  onUpdateStatus,
  onReassignWorker
}: BookingDetailDrawerProps) {
  const [showReassign, setShowReassign] = useState(false);
  const worker = professionals.find(p => p.id === booking.workerId);
  const eligibleWorkers = professionals.filter(
    p => p.category === booking.serviceCategory && p.id !== booking.workerId
  );

  const statusList: { id: Booking["status"]; label: string; action: string }[] = [
    { id: "pending_review", label: "Pending Review", action: "Reset to Pending" },
    { id: "contacting_worker", label: "Contacting Worker", action: "Call Worker" },
    { id: "worker_confirmed", label: "Worker Confirmed", action: "Confirm Worker" },
    { id: "contacting_client", label: "Contacting Client", action: "Call Client" },
    { id: "client_confirmed", label: "Client Confirmed", action: "Confirm Client" },
    { id: "both_confirmed", label: "Both Confirmed", action: "Mark Confirmed" },
    { id: "dispatched", label: "Dispatched", action: "Dispatch Worker" },
    { id: "in_progress", label: "In Progress", action: "Start Job" },
    { id: "completed", label: "Completed", action: "Complete Job" }
  ];

  const currentIdx = statusList.findIndex(s => s.id === booking.status);
  const nextStateObj = currentIdx < statusList.length - 1 ? statusList[currentIdx + 1] : null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed top-0 right-0 bottom-0 w-full sm:w-120 bg-white z-50 shadow-2xl p-8 flex flex-col justify-between overflow-y-auto animate-slideIn">
        <div className="space-y-6 text-left">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Details</span>
              <span className="font-mono text-xs font-black text-primary px-2 py-0.5 bg-primary/5 rounded-md">
                {booking.id}
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400 hover:text-slate-800 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Client Details Section */}
          <div className="space-y-3">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Client Information</span>
            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 space-y-2">
              <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{booking.clientName}</p>
              <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 font-inter">
                <Phone size={12} /> {booking.clientPhone}
              </p>
              <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 font-inter">
                <MapPin size={12} /> {booking.clientAddress}
              </p>
              <div className="border-t border-slate-100 pt-2.5 mt-2.5">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Issue Description</p>
                <p className="text-xs text-slate-600 font-bold leading-normal font-inter bg-white p-3 rounded-xl border border-slate-50">
                  {booking.description}
                </p>
              </div>
            </div>
          </div>

          {/* Selected Worker snapshot */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Assigned Professional</span>
              <button
                onClick={() => setShowReassign(!showReassign)}
                className="text-[9px] font-black text-primary uppercase tracking-wider hover:underline cursor-pointer"
              >
                {showReassign ? "Cancel Reassignment" : "Change Worker"}
              </button>
            </div>

            {showReassign ? (
              <div className="bg-primary/5 border border-primary/10 p-5 rounded-3xl space-y-3">
                <p className="text-xs font-black uppercase text-primary">Select New {booking.serviceCategory} Worker</p>
                {eligibleWorkers.length === 0 ? (
                  <p className="text-[10px] text-slate-400 font-bold font-inter">No other workers available in this category.</p>
                ) : (
                  <div className="space-y-2">
                    {eligibleWorkers.map(w => (
                      <div
                        key={w.id}
                        onClick={() => {
                          onReassignWorker(booking.id, w.id);
                          setShowReassign(false);
                        }}
                        className="bg-white border border-slate-100 hover:border-primary/20 p-3 rounded-xl flex items-center justify-between cursor-pointer transition-all hover:scale-[1.01]"
                      >
                        <div>
                          <p className="text-xs font-black text-slate-800">{w.name}</p>
                          <p className="text-[9px] text-slate-400 font-bold font-inter">⭐ {w.rating} · {w.rate}</p>
                        </div>
                        <span className="text-[9px] font-black text-primary uppercase tracking-widest">Select</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 flex items-center justify-between">
                {worker ? (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary/10 text-primary font-black rounded-xl flex items-center justify-center text-xs uppercase">
                        {worker.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
                          {worker.name}
                          {worker.verified && <Shield size={12} className="text-primary fill-primary" />}
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 font-inter">Rate: {worker.rate}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-slate-700">⭐ {worker.rating}</p>
                      <span className="text-[9px] font-black text-slate-400 uppercase font-inter">{worker.status}</span>
                    </div>
                  </>
                ) : (
                  <p className="text-xs font-black text-rose-500 uppercase tracking-tight">No worker assigned</p>
                )}
              </div>
            )}
          </div>

          {/* Timeline workflow */}
          <div className="space-y-4">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Workflow Timeline</span>
            
            <div className="space-y-4 pl-4 border-l border-slate-100 relative">
              {statusList.map((st, i) => {
                const isPast = i <= currentIdx;
                const isCurrent = i === currentIdx;

                return (
                  <div key={st.id} className="relative flex items-start gap-4">
                    {/* Bullet dot */}
                    <div
                      className={`absolute -left-6 w-3 h-3 rounded-full border-2 transition-all mt-1 ${
                        isCurrent
                          ? "bg-primary border-primary scale-125 shadow-lg"
                          : isPast
                          ? "bg-slate-700 border-slate-700"
                          : "bg-white border-slate-200"
                      }`}
                    />
                    
                    <div className="space-y-0.5">
                      <p className={`text-xs uppercase font-black tracking-tight ${isCurrent ? "text-primary" : isPast ? "text-slate-800" : "text-slate-400"}`}>
                        {st.label}
                      </p>
                      {isCurrent && (
                        <p className="text-[9px] text-slate-400 font-bold font-inter">Active state</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action button transitions */}
        <div className="pt-6 border-t border-slate-100 mt-8 flex flex-col gap-3">
          {booking.status !== "completed" && booking.status !== "cancelled" && nextStateObj && (
            <button
              onClick={() => onUpdateStatus(booking.id, nextStateObj.id)}
              className="w-full py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-primary-600 active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-primary/10"
            >
              <Check size={14} /> Progress: {nextStateObj.action}
            </button>
          )}

          {booking.status !== "completed" && booking.status !== "cancelled" && (
            <button
              onClick={() => onUpdateStatus(booking.id, "cancelled")}
              className="w-full py-4 bg-rose-50 text-rose-600 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-rose-100 active:scale-[0.98] transition-all cursor-pointer"
            >
              <XCircle size={14} /> Cancel Booking
            </button>
          )}

          {booking.status === "completed" && (
            <div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-700 text-xs font-black uppercase justify-center">
              <CheckCircle2 size={16} /> Job Completed Successfully
            </div>
          )}

          {booking.status === "cancelled" && (
            <div className="flex items-center gap-2 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs font-black uppercase justify-center">
              <XCircle size={16} /> Booking Cancelled
            </div>
          )}
        </div>
      </div>
    </>
  );
}
