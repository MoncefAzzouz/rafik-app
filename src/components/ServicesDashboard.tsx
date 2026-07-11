"use client";

import { useState, useEffect } from "react";
import {
  Wrench, Users, DollarSign, CalendarCheck, TrendingUp, ArrowDownRight,
  MoreHorizontal, CheckCircle2, Clock, XCircle, Plus, Activity, Shield, UserCheck, Briefcase,
  Phone, MapPin, Image as ImageIcon, Star, Check, AlertCircle, ExternalLink, X, ChevronRight, Edit2, Calendar,
  MessageSquare, BarChart3, UserCircle, Camera, Trash2, ThumbsUp, ThumbsDown, Filter, Search
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
  availableTimes: string[]; // Worker-specific time slots
}

export type BookingStatus =
  | "pending_review"
  | "contacting_worker"
  | "quote_sent"
  | "quote_approved"
  | "quote_rejected"
  | "both_confirmed"
  | "dispatched"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface Booking {
  id: string;
  clientName: string;
  clientPhone: string;
  clientAddress: string;
  serviceCategory: string;
  workerId: string; // references Professional.id
  status: BookingStatus;
  price: string;
  description: string;
  time: string; // creation relative time, e.g. "2 hours ago"
  bookingDate: string; // Day chosen by client
  bookingTime?: string; // Time confirmed with worker from their availableTimes list
  clientPhotos: string[]; // Photos uploaded by client showing the job
  workerQuote: number | null; // Price proposed by the worker (DZD)
  quoteStatus: "none" | "pending" | "sent" | "approved" | "rejected";
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
    ],
    availableTimes: ["08:00", "10:30", "14:00", "16:30"]
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
    ],
    availableTimes: ["09:00", "11:30", "15:00", "17:30"]
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
    ],
    availableTimes: ["08:30", "13:00", "16:00"]
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
    ],
    availableTimes: ["08:00", "11:00", "14:00", "17:00"]
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
    ],
    availableTimes: ["09:00", "13:30", "16:00"]
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
    ],
    availableTimes: ["08:00", "10:00", "13:00", "15:30"]
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
    ],
    availableTimes: ["09:30", "12:00", "15:00", "17:00"]
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
    bookingDate: "2026-07-12",
    bookingTime: "11:30",
    clientPhotos: [
      "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=300&q=80",
      "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=300&q=80"
    ],
    workerQuote: 4000,
    quoteStatus: "approved",
    statusHistory: [
      { status: "pending_review", timestamp: "3 hours ago" },
      { status: "contacting_worker", timestamp: "2.5 hours ago" },
      { status: "quote_sent", timestamp: "2 hours ago" },
      { status: "quote_approved", timestamp: "1.8 hours ago" },
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
    bookingDate: "2026-07-11",
    bookingTime: "14:00",
    clientPhotos: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=300&q=80"
    ],
    workerQuote: 3600,
    quoteStatus: "approved",
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
    price: "Contact for Quote",
    description: "Living room accent wall painting. Selected paint type is matte off-white.",
    time: "3 hours ago",
    bookingDate: "2026-07-15",
    clientPhotos: [
      "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=300&q=80",
      "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=300&q=80",
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300&q=80"
    ],
    workerQuote: null,
    quoteStatus: "none",
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
    bookingDate: "2026-07-13",
    bookingTime: "09:30",
    clientPhotos: [
      "https://images.unsplash.com/photo-1621905252507-b354bc25edac?w=300&q=80"
    ],
    workerQuote: 5000,
    quoteStatus: "approved",
    statusHistory: [
      { status: "pending_review", timestamp: "6 hours ago" },
      { status: "contacting_worker", timestamp: "5.5 hours ago" },
      { status: "quote_sent", timestamp: "5 hours ago" },
      { status: "quote_approved", timestamp: "4.5 hours ago" },
      { status: "both_confirmed", timestamp: "4 hours ago" }
    ]
  },
  {
    id: "SV-3417",
    clientName: "Nadia Mansouri",
    clientPhone: "+213 665 44 33 22",
    clientAddress: "Résidence El-Firdaous, Bir Mourad Raïs",
    serviceCategory: "Cleaner",
    workerId: "PRO-4",
    status: "quote_sent",
    price: "Contact for Quote",
    description: "Full apartment deep clean before moving in. 3 bedrooms, 2 bathrooms, kitchen and balcony.",
    time: "5 hours ago",
    bookingDate: "2026-07-14",
    clientPhotos: [
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=300&q=80",
      "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=300&q=80"
    ],
    workerQuote: 6000,
    quoteStatus: "sent",
    statusHistory: [
      { status: "pending_review", timestamp: "5 hours ago" },
      { status: "contacting_worker", timestamp: "4.5 hours ago" },
      { status: "quote_sent", timestamp: "4 hours ago" }
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

const STATUS_DETAILS: Record<BookingStatus, { label: string; color: string; bg: string }> = {
  pending_review: { label: "Pending Review", color: "text-amber-700 border-amber-200", bg: "bg-amber-500" },
  contacting_worker: { label: "Contacting Worker", color: "text-blue-700 border-blue-200", bg: "bg-blue-400" },
  quote_sent: { label: "Quote Sent", color: "text-purple-700 border-purple-200", bg: "bg-purple-500" },
  quote_approved: { label: "Quote Approved", color: "text-sky-700 border-sky-200", bg: "bg-sky-500" },
  quote_rejected: { label: "Quote Rejected", color: "text-rose-700 border-rose-200", bg: "bg-rose-400" },
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
  const [showAddWorkerModal, setShowAddWorkerModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [editingCategory, setEditingCategory] = useState<{ name: string; icon: string } | null>(null);
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

  // 1. Simulate client order (selects a Day, but not a confirmed Time)
  const handleSimulateOrder = () => {
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

    // Generate random date within next 7 days
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + Math.floor(Math.random() * 7 + 1));
    const bookingDate = nextDate.toISOString().split("T")[0];

    const newBooking: Booking = {
      id: `SV-${Math.floor(Math.random() * 9000 + 1000)}`,
      clientName,
      clientPhone: `+213 6${Math.floor(Math.random() * 90000000 + 10000000)}`,
      clientAddress: `${Math.floor(Math.random() * 50 + 1)} Rue des Frères, Algiers`,
      serviceCategory: randCategoryObj.name,
      workerId: worker.id,
      status: "pending_review",
      price: "Contact for Quote",
      description,
      time: "Just now",
      bookingDate,
      clientPhotos: [
        "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=300&q=80"
      ],
      workerQuote: null,
      quoteStatus: "none",
      statusHistory: [{ status: "pending_review", timestamp: "Just now" }]
    };

    setBookings([newBooking, ...bookings]);
    
    setCategories(prev =>
      prev.map(c => (c.name === randCategoryObj.name ? { ...c, bookings: c.bookings + 1 } : c))
    );

    showToast(`⚡ New simulated order ${newBooking.id} created! Client selected worker ${worker.name} for ${bookingDate}.`, "info");
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
    bookingDate: string;
    bookingTime?: string;
    clientPhotos?: string[];
  }) => {
    // High-quality task placeholder photos based on category
    const defaultPhotosMap: Record<string, string[]> = {
      Plumber: [
        "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=300&q=80",
        "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=300&q=80"
      ],
      Electrician: [
        "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=300&q=80",
        "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=300&q=80"
      ],
      "AC Repair": [
        "https://images.unsplash.com/photo-1621905252507-b354bc25edac?w=300&q=80"
      ],
      Cleaner: [
        "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=300&q=80"
      ],
      Painter: [
        "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=300&q=80"
      ],
      Carpenter: [
        "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=300&q=80"
      ]
    };

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
      bookingDate: fields.bookingDate,
      bookingTime: fields.bookingTime || undefined,
      clientPhotos: fields.clientPhotos && fields.clientPhotos.length > 0
        ? fields.clientPhotos
        : (defaultPhotosMap[fields.category] || ["https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=300&q=80"]),
      workerQuote: null,
      quoteStatus: "none",
      statusHistory: [{ status: "pending_review", timestamp: "Just now" }]
    };

    setBookings([newBooking, ...bookings]);
    
    setCategories(prev =>
      prev.map(c => (c.name === fields.category ? { ...c, bookings: c.bookings + 1 } : c))
    );

    setShowRegisterModal(false);
    showToast(`📝 Booking ${newBooking.id} registered manually!`, "success");
  };

  // 3. Add Worker (Professional)
  const handleAddWorker = (fields: {
    name: string;
    phone: string;
    category: string;
    rate: string;
    experience: string;
    bio: string;
    availableTimes: string[];
  }) => {
    const newWorker: Professional = {
      id: `PRO-${professionals.length + 1}`,
      name: fields.name,
      phone: fields.phone,
      category: fields.category,
      rate: fields.rate,
      experience: fields.experience,
      bio: fields.bio,
      status: "online",
      verified: false,
      jobs: 0,
      rating: 5.0,
      joined: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      portfolio: ["https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=400&q=80"],
      reviews: [],
      availableTimes: fields.availableTimes.length > 0 ? fields.availableTimes : ["08:00", "10:00", "14:00", "16:00"]
    };

    setProfessionals([...professionals, newWorker]);
    
    setCategories(prev =>
      prev.map(c => (c.name === fields.category ? { ...c, pros: c.pros + 1 } : c))
    );

    setShowAddWorkerModal(false);
    showToast(`👷 New worker ${fields.name} added under category ${fields.category}!`, "success");
  };

  // 4. Add Category
  const handleAddCategory = (name: string, icon: string) => {
    if (categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      alert("Category already exists.");
      return;
    }

    const newCategory = {
      name,
      pros: 0,
      bookings: 0,
      icon: icon || "🛠️"
    };

    setCategories([...categories, newCategory]);
    setShowAddCategoryModal(false);
    showToast(`🗂️ Category ${name} successfully added!`, "success");
  };

  // Edit Category details
  const handleEditCategory = (oldName: string, newName: string, newIcon: string) => {
    setCategories(prev =>
      prev.map(c => 
        c.name === oldName 
          ? { ...c, name: newName, icon: newIcon } 
          : c
      )
    );
    setProfessionals(prev =>
      prev.map(p => 
        p.category === oldName 
          ? { ...p, category: newName } 
          : p
      )
    );
    setBookings(prev =>
      prev.map(b => 
        b.serviceCategory === oldName 
          ? { ...b, serviceCategory: newName } 
          : b
      )
    );
    setEditingCategory(null);
    showToast(`Category ${oldName} updated to ${newName}!`, "success");
  };

  // 5. Edit existing booking details
  const handleEditBooking = (id: string, updatedFields: Partial<Booking>) => {
    setBookings(prev =>
      prev.map(b => {
        if (b.id === id) {
          const statusHistory = [...b.statusHistory];
          if (updatedFields.status && updatedFields.status !== b.status) {
            statusHistory.push({ status: updatedFields.status, timestamp: "Just now" });
          }
          return {
            ...b,
            ...updatedFields,
            statusHistory
          };
        }
        return b;
      })
    );
    setEditingBooking(null);
    showToast(`Booking ${id} updated successfully!`, "success");
  };

  // 6. Update Booking Status (direct inline transitions)
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

  // 7. Reassign worker
  const handleReassignWorker = (bookingId: string, workerId: string) => {
    const worker = professionals.find(p => p.id === workerId);
    if (!worker) return;
    setBookings(prev =>
      prev.map(b => {
        if (b.id === bookingId) {
          return {
            ...b,
            workerId,
            status: "pending_review",
            bookingTime: undefined, // Reset confirmed time since worker changed
            statusHistory: [...b.statusHistory, { status: `Worker changed to ${worker.name}`, timestamp: "Just now" }]
          };
        }
        return b;
      })
    );
    showToast(`Assigned worker updated to ${worker.name}`, "success");
  };

  // 8. Verify / Unverify Professional
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

  // 9. Change worker active status
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

  // Trigger modal controls from any subpage header
  const openManualBooking = () => setShowRegisterModal(true);
  const openAddWorker = () => setShowAddWorkerModal(true);
  const openAddCategory = () => setShowAddCategoryModal(true);

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
          onOpenBooking={openManualBooking}
          onOpenWorker={openAddWorker}
          onOpenCategory={openAddCategory}
        />
      );
    }

    if (activePage === "categories") {
      return (
        <CategoriesPage
          categories={categories}
          bookings={bookings}
          professionals={professionals}
          onSelectCategory={setSelectedCategory}
          onEditCategory={setEditingCategory}
          onOpenBooking={openManualBooking}
          onOpenWorker={openAddWorker}
          onOpenCategory={openAddCategory}
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
          onOpenBooking={openManualBooking}
          onOpenWorker={openAddWorker}
          onOpenCategory={openAddCategory}
        />
      );
    }
    if (activePage === "bookings") {
      return (
        <BookingsPage
          bookings={bookings}
          professionals={professionals}
          onSelectBooking={setSelectedBooking}
          onEditBooking={setEditingBooking}
          onOpenBooking={openManualBooking}
          onOpenWorker={openAddWorker}
          onOpenCategory={openAddCategory}
        />
      );
    }
    if (activePage === "earnings") {
      return <EarningsPage bookings={bookings} professionals={professionals} categories={categories} />;
    }
    if (activePage === "reviews") {
      return (
        <ReviewsPage
          professionals={professionals}
          onDeleteReview={(workerId: string, reviewIdx: number) => {
            setProfessionals(prev =>
              prev.map(p => {
                if (p.id === workerId) {
                  const newReviews = [...p.reviews];
                  newReviews.splice(reviewIdx, 1);
                  const avgRating = newReviews.length > 0 ? parseFloat((newReviews.reduce((s, r) => s + r.rating, 0) / newReviews.length).toFixed(1)) : 5.0;
                  return { ...p, reviews: newReviews, rating: avgRating };
                }
                return p;
              })
            );
            showToast("Review deleted successfully", "success");
          }}
        />
      );
    }
    if (activePage === "clients") {
      return (
        <ClientsPage
          bookings={bookings}
          professionals={professionals}
          onSelectBooking={setSelectedBooking}
        />
      );
    }
    if (activePage === "analytics") {
      return <AnalyticsPage bookings={bookings} professionals={professionals} categories={categories} />;
    }

    return (
      <DashboardOverview
        statsList={statsList}
        categories={categories}
        bookings={bookings}
        professionals={professionals}
        onSelectCategory={setSelectedCategory}
        onSelectBooking={setSelectedBooking}
        onOpenBooking={openManualBooking}
        onOpenWorker={openAddWorker}
        onOpenCategory={openAddCategory}
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

      {/* Creation & Edit Modals */}
      {showRegisterModal && (
        <RegisterBookingModal
          professionals={professionals}
          categories={categories}
          onClose={() => setShowRegisterModal(false)}
          onSubmit={handleCreateManualBooking}
        />
      )}

      {showAddWorkerModal && (
        <AddWorkerModal
          categories={categories}
          onClose={() => setShowAddWorkerModal(false)}
          onSubmit={handleAddWorker}
        />
      )}

      {showAddCategoryModal && (
        <AddCategoryModal
          onClose={() => setShowAddCategoryModal(false)}
          onSubmit={handleAddCategory}
        />
      )}

      {editingCategory && (
        <EditCategoryModal
          category={editingCategory}
          categories={categories}
          onClose={() => setEditingCategory(null)}
          onSubmit={handleEditCategory}
        />
      )}

      {editingBooking && (
        <EditBookingModal
          booking={editingBooking}
          professionals={professionals}
          categories={categories}
          onClose={() => setEditingBooking(null)}
          onSubmit={handleEditBooking}
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
          onEditBooking={(b) => {
            setSelectedBooking(null);
            setEditingBooking(b);
          }}
        />
      )}
    </div>
  );
}

// ==========================================
// REUSABLE PAGE HEADER WITH QUICK ACTIONS
// ==========================================

interface PageHeaderWithActionsProps {
  title: string;
  subtitle: string;
  badgeText: string;
  actionType: "booking" | "professional" | "specialty" | "all" | "none";
  onOpenBooking: () => void;
  onOpenWorker: () => void;
  onOpenCategory: () => void;
}

function PageHeaderWithActions({
  title,
  subtitle,
  badgeText,
  actionType,
  onOpenBooking,
  onOpenWorker,
  onOpenCategory
}: PageHeaderWithActionsProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6">
      <div className="space-y-2 text-left">
        <div className="inline-flex items-center gap-2 bg-primary/5 px-4 py-2 rounded-full border border-primary/10">
          <Activity size={14} className="text-primary animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">{badgeText}</span>
        </div>
        <h1 className="text-4xl font-black tracking-tighter text-slate-800 uppercase italic">
          {title}
        </h1>
        <p className="text-sm text-slate-400 font-medium font-inter">{subtitle}</p>
      </div>

      {/* Relevant Quick Actions based on page context */}
      <div className="flex flex-wrap gap-2">
        {(actionType === "booking" || actionType === "all") && (
          <button
            onClick={onOpenBooking}
            className="px-4 py-3 bg-primary hover:bg-primary/95 text-white rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md hover:scale-102 active:scale-98 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={12} /> Add Booking
          </button>
        )}
        {(actionType === "professional" || actionType === "all") && (
          <button
            onClick={onOpenWorker}
            className="px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md hover:scale-102 active:scale-98 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={12} /> Add Professional
          </button>
        )}
        {(actionType === "specialty" || actionType === "all") && (
          <button
            onClick={onOpenCategory}
            className="px-4 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all shadow-sm hover:scale-102 active:scale-98 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={12} /> Add Specialty
          </button>
        )}
      </div>
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
  onOpenBooking: () => void;
  onOpenWorker: () => void;
  onOpenCategory: () => void;
}

function DashboardOverview({
  statsList,
  categories,
  bookings,
  professionals,
  onSelectCategory,
  onSelectBooking,
  onOpenBooking,
  onOpenWorker,
  onOpenCategory
}: DashboardOverviewProps) {
  return (
    <div className="space-y-10 max-w-7xl mx-auto animate-fadeIn pb-16">
      <PageHeaderWithActions
        title="Services Overview"
        subtitle="Manage on-demand listings, category filters, and verify incoming client jobs."
        badgeText="Live Services Hub"
        actionType="booking"
        onOpenBooking={onOpenBooking}
        onOpenWorker={onOpenWorker}
        onOpenCategory={onOpenCategory}
      />

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
          <div className="space-y-1 text-left">
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
                <th>Scheduled Day</th>
                <th>Confirmed Time</th>
                <th>Price/Rate</th>
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
                    <td className="font-semibold text-slate-700">{b.bookingDate}</td>
                    <td className="font-mono font-bold text-primary">{b.bookingTime || "Awaiting Conf."}</td>
                    <td className="font-mono font-black text-slate-800">{b.price}</td>
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
  onOpenBooking: () => void;
  onOpenWorker: () => void;
  onOpenCategory: () => void;
}

function CategoryWorkersPage({
  category,
  professionals,
  onBack,
  onSelectWorker,
  onToggleVerify,
  onOpenBooking,
  onOpenWorker,
  onOpenCategory
}: CategoryWorkersPageProps) {
  const filtered = professionals.filter(p => p.category.toLowerCase() === category.toLowerCase());

  // Statistics calculation for filtered category workers
  const categoryBookings = 290 + filtered.length * 15; // mock calculated stats
  const onlinePros = filtered.filter(p => p.status === "online").length;
  const verifiedPros = filtered.filter(p => p.verified).length;

  const categoryStats = [
    { label: "Active Workers", value: String(filtered.length), sub: "Pros", color: "blue", icon: Users },
    { label: "Online Now", value: String(onlinePros), sub: "Ready", color: "emerald", icon: Check },
    { label: "Verified Crew", value: `${verifiedPros}/${filtered.length}`, sub: "Checked", color: "amber", icon: Shield },
    { label: "Jobs Completed", value: String(categoryBookings), sub: "Orders", color: "purple", icon: Briefcase }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fadeIn pb-16">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
        >
          ← Categories
        </button>
      </div>

      <PageHeaderWithActions
        title={`${category} Specialists`}
        subtitle={`Roster configuration and validation panels for ${category} providers.`}
        badgeText={`${category} Directory`}
        actionType="professional"
        onOpenBooking={onOpenBooking}
        onOpenWorker={onOpenWorker}
        onOpenCategory={onOpenCategory}
      />

      {/* Category Worker stats block */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {categoryStats.map((s, i) => {
          const Icon = s.icon;
          const c = COLOR_MAP[s.color] || COLOR_MAP.blue;
          return (
            <div key={i} className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm flex items-center justify-between group transition-all">
              <div className="space-y-2.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{s.label}</span>
                <span className="text-2xl font-black text-slate-800 tracking-tight block">
                  {s.value} <span className="text-xs font-bold text-slate-400">{s.sub}</span>
                </span>
              </div>
              <div className={`w-12 h-12 ${c.bg} ${c.text} rounded-2xl flex items-center justify-center transition-colors ${c.hover}`}>
                <Icon size={20} />
              </div>
            </div>
          );
        })}
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
                    <div className="text-left">
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
// CATEGORIES PAGE WITH STATS
// ==========================================

interface CategoriesPageProps {
  categories: any[];
  bookings: Booking[];
  professionals: Professional[];
  onSelectCategory: (name: string) => void;
  onEditCategory: (category: { name: string; icon: string }) => void;
  onOpenBooking: () => void;
  onOpenWorker: () => void;
  onOpenCategory: () => void;
}

function CategoriesPage({
  categories,
  bookings,
  professionals,
  onSelectCategory,
  onEditCategory,
  onOpenBooking,
  onOpenWorker,
  onOpenCategory
}: CategoriesPageProps) {
  // Statistics Calculations
  const totalSpecialties = categories.length;
  const totalBookings = categories.reduce((sum, c) => sum + c.bookings, 0);
  const avgPros = (professionals.length / categories.length).toFixed(1);
  const mostBooked = categories.reduce((prev, curr) => (prev.bookings > curr.bookings ? prev : curr), categories[0])?.name || "None";

  const categoriesStats = [
    { label: "Total Specialties", value: String(totalSpecialties), sub: "Categories", color: "blue", icon: Wrench },
    { label: "Specialties Bookings", value: String(totalBookings), sub: "Total", color: "emerald", icon: CalendarCheck },
    { label: "Avg Workers/Category", value: String(avgPros), sub: "Pros", color: "amber", icon: Users },
    { label: "Top Service Type", value: mostBooked, sub: "Popular", color: "purple", icon: TrendingUp }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fadeIn pb-16">
      <PageHeaderWithActions
        title="Specialties Manager"
        subtitle="Configure client-facing categories, icons, and worker capacities."
        badgeText="Categories Configuration"
        actionType="specialty"
        onOpenBooking={onOpenBooking}
        onOpenWorker={onOpenWorker}
        onOpenCategory={onOpenCategory}
      />

      {/* Categories stats block */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {categoriesStats.map((s, i) => {
          const Icon = s.icon;
          const c = COLOR_MAP[s.color] || COLOR_MAP.blue;
          return (
            <div key={i} className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm flex items-center justify-between group transition-all">
              <div className="space-y-2.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{s.label}</span>
                <span className="text-2xl font-black text-slate-800 tracking-tight block truncate max-w-[150px]">
                  {s.value} <span className="text-xs font-bold text-slate-400">{s.sub}</span>
                </span>
              </div>
              <div className={`w-12 h-12 ${c.bg} ${c.text} rounded-2xl flex items-center justify-center transition-colors ${c.hover}`}>
                <Icon size={20} />
              </div>
            </div>
          );
        })}
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
              <div className="text-left">
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">{c.name}</h4>
                <p className="text-[10px] text-slate-400 font-bold font-inter mt-0.5">{c.pros} active professionals</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditCategory(c);
                }}
                className="p-2 text-slate-400 hover:text-primary rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                title="Edit Category Name and Icon"
              >
                <Edit2 size={14} />
              </button>
              <ChevronRight size={16} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// PROFESSIONALS DIRECTORY VIEW WITH STATS
// ==========================================

interface ProfessionalsPageProps {
  professionals: Professional[];
  onSelectWorker: (p: Professional) => void;
  onToggleVerify: (id: string) => void;
  onChangeStatus: (id: string, s: Professional["status"]) => void;
  onOpenBooking: () => void;
  onOpenWorker: () => void;
  onOpenCategory: () => void;
}

function ProfessionalsPage({
  professionals,
  onSelectWorker,
  onToggleVerify,
  onChangeStatus,
  onOpenBooking,
  onOpenWorker,
  onOpenCategory
}: ProfessionalsPageProps) {
  // Statistics Calculations
  const totalPros = professionals.length;
  const onlinePros = professionals.filter(p => p.status === "online").length;
  const verifiedPros = professionals.filter(p => p.verified).length;
  const avgRating = (professionals.reduce((sum, p) => sum + p.rating, 0) / professionals.length).toFixed(1);

  const prosStats = [
    { label: "Enrolled Workers", value: String(totalPros), sub: "Pros", color: "blue", icon: Users },
    { label: "Online Now", value: String(onlinePros), sub: "Active", color: "emerald", icon: UserCheck },
    { label: "Verified Accounts", value: `${verifiedPros}/${totalPros}`, sub: "Valid", color: "amber", icon: Shield },
    { label: "Avg Platform Rating", value: `⭐ ${avgRating}`, sub: "Rating", color: "purple", icon: Star }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fadeIn pb-16">
      <PageHeaderWithActions
        title="Workers Directory"
        subtitle="Manage safety validation, verified credentials, and active statuses."
        badgeText="Professionals Registry"
        actionType="professional"
        onOpenBooking={onOpenBooking}
        onOpenWorker={onOpenWorker}
        onOpenCategory={onOpenCategory}
      />

      {/* Professionals stats block */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {prosStats.map((s, i) => {
          const Icon = s.icon;
          const c = COLOR_MAP[s.color] || COLOR_MAP.blue;
          return (
            <div key={i} className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm flex items-center justify-between group transition-all">
              <div className="space-y-2.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{s.label}</span>
                <span className="text-2xl font-black text-slate-800 tracking-tight block">
                  {s.value} <span className="text-xs font-bold text-slate-400">{s.sub}</span>
                </span>
              </div>
              <div className={`w-12 h-12 ${c.bg} ${c.text} rounded-2xl flex items-center justify-center transition-colors ${c.hover}`}>
                <Icon size={20} />
              </div>
            </div>
          );
        })}
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
// CLIENT BOOKINGS TABLE VIEW WITH STATS
// ==========================================

interface BookingsPageProps {
  bookings: Booking[];
  professionals: Professional[];
  onSelectBooking: (b: Booking) => void;
  onEditBooking: (b: Booking) => void;
  onOpenBooking: () => void;
  onOpenWorker: () => void;
  onOpenCategory: () => void;
}

function BookingsPage({
  bookings,
  professionals,
  onSelectBooking,
  onEditBooking,
  onOpenBooking,
  onOpenWorker,
  onOpenCategory
}: BookingsPageProps) {
  const [activeTab, setActiveTab] = useState<string>("all");

  const filtered = bookings.filter(b => {
    if (activeTab === "all") return true;
    if (activeTab === "active") return b.status !== "completed" && b.status !== "cancelled";
    return b.status === activeTab;
  });

  // Statistics Calculations
  const totalCommands = bookings.length;
  const activePipelines = bookings.filter(b => b.status !== "completed" && b.status !== "cancelled").length;
  const pendingReview = bookings.filter(b => b.status === "pending_review").length;
  const completedJobs = bookings.filter(b => b.status === "completed").length;

  const bookingsStats = [
    { label: "Total Commands", value: String(totalCommands), sub: "Bookings", color: "blue", icon: CalendarCheck },
    { label: "Active Pipelines", value: String(activePipelines), sub: "Jobs", color: "emerald", icon: Clock },
    { label: "Pending Review", value: String(pendingReview), sub: "Alerts", color: "amber", icon: AlertCircle },
    { label: "Completed Jobs", value: String(completedJobs), sub: "Archived", color: "purple", icon: CheckCircle2 }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fadeIn pb-16">
      <PageHeaderWithActions
        title="Bookings Pipeline"
        subtitle="Manage customer orders, schedule days, and verified time slots."
        badgeText="Job Workflows"
        actionType="booking"
        onOpenBooking={onOpenBooking}
        onOpenWorker={onOpenWorker}
        onOpenCategory={onOpenCategory}
      />

      {/* Bookings stats block */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {bookingsStats.map((s, i) => {
          const Icon = s.icon;
          const c = COLOR_MAP[s.color] || COLOR_MAP.blue;
          return (
            <div key={i} className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm flex items-center justify-between group transition-all">
              <div className="space-y-2.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{s.label}</span>
                <span className="text-2xl font-black text-slate-800 tracking-tight block">
                  {s.value} <span className="text-xs font-bold text-slate-400">{s.sub}</span>
                </span>
              </div>
              <div className={`w-12 h-12 ${c.bg} ${c.text} rounded-2xl flex items-center justify-center transition-colors ${c.hover}`}>
                <Icon size={20} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-4 mt-6">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filter status</span>
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
                <th>Worker Assigned</th>
                <th>Category</th>
                <th>Scheduled Day</th>
                <th>Confirmed Time</th>
                <th>Price/Rate</th>
                <th>Status</th>
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
                    <td className="font-black text-slate-800 text-left">{b.clientName}</td>
                    <td>{worker ? worker.name : "Unassigned"}</td>
                    <td>{b.serviceCategory}</td>
                    <td className="font-bold text-slate-600">{b.bookingDate}</td>
                    <td className="font-mono font-black text-primary">{b.bookingTime || "Awaiting Conf."}</td>
                    <td className="font-mono font-black text-slate-800">{b.price}</td>
                    <td>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-wider ${st.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${st.bg}`} />
                        {st.label}
                      </span>
                    </td>
                    <td className="flex gap-2">
                      <button
                        onClick={() => onSelectBooking(b)}
                        className="px-3 py-1.5 bg-slate-50 border border-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-primary/5 hover:text-primary transition-all cursor-pointer"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => onEditBooking(b)}
                        className="p-2 bg-slate-50 border border-slate-100 text-slate-600 rounded-xl hover:bg-primary/5 hover:text-primary transition-all cursor-pointer"
                        title="Edit Command"
                      >
                        <Edit2 size={12} />
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
// EARNINGS VIEW WITH REVENUE TRENDS
// ==========================================

interface EarningsPageProps {
  bookings: Booking[];
  professionals: Professional[];
  categories: any[];
}

function EarningsPage({ bookings, professionals, categories }: EarningsPageProps) {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredBookings = bookings.filter(b => 
    selectedCategory === "all" || b.serviceCategory === selectedCategory
  );

  // Revenue metrics
  const completedJobs = filteredBookings.filter(b => b.status === "completed");
  const activeJobs = filteredBookings.filter(b => 
    b.status !== "completed" && b.status !== "cancelled" && b.status !== "pending_review"
  );

  const confirmedRevenue = completedJobs.reduce((sum, b) => sum + (b.workerQuote || 0), 0);
  const pendingRevenue = activeJobs.reduce((sum, b) => sum + (b.workerQuote || 0), 0);
  const platformFee = Math.round(confirmedRevenue * 0.15); // 15% platform commission
  const netWorkerPayouts = confirmedRevenue - platformFee;

  // Earnings by Worker
  const workerEarnings = professionals.map(pro => {
    const proBookings = completedJobs.filter(b => b.workerId === pro.id);
    const totalRevenue = proBookings.reduce((sum, b) => sum + (b.workerQuote || 0), 0);
    const payout = Math.round(totalRevenue * 0.85); // 85% goes to worker
    const fee = totalRevenue - payout;
    return {
      name: pro.name,
      category: pro.category,
      jobsCount: proBookings.length,
      gross: totalRevenue,
      payout,
      platformFee: fee
    };
  }).filter(w => w.gross > 0).sort((a, b) => b.gross - a.gross);

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fadeIn pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left">
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tighter text-slate-800 uppercase">Earnings</h1>
          <p className="text-sm text-slate-400 font-medium font-inter">Platform commission billing and worker payout accounts</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-inter">Specialty</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase outline-none text-slate-700 focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">All Categories</option>
            {categories.map(c => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Financial Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Gross Confirmed Revenue</span>
          <span className="text-2xl font-black text-slate-800 tracking-tight block mt-2">
            {confirmedRevenue.toLocaleString()} <span className="text-xs text-slate-400 font-bold">DZD</span>
          </span>
          <p className="text-[10px] text-slate-400 font-bold font-inter mt-1">{completedJobs.length} completed jobs</p>
        </div>
        <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Platform Commission (15%)</span>
          <span className="text-2xl font-black text-primary tracking-tight block mt-2">
            {platformFee.toLocaleString()} <span className="text-xs text-slate-400 font-bold">DZD</span>
          </span>
          <p className="text-[10px] text-emerald-500 font-bold font-inter mt-1">Net platform earnings</p>
        </div>
        <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Net Worker Payouts</span>
          <span className="text-2xl font-black text-emerald-600 tracking-tight block mt-2">
            {netWorkerPayouts.toLocaleString()} <span className="text-xs text-slate-400 font-bold">DZD</span>
          </span>
          <p className="text-[10px] text-slate-400 font-bold font-inter mt-1">Disbursed to professionals</p>
        </div>
        <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Pending / Escrow Volume</span>
          <span className="text-2xl font-black text-amber-600 tracking-tight block mt-2">
            {pendingRevenue.toLocaleString()} <span className="text-xs text-slate-400 font-bold">DZD</span>
          </span>
          <p className="text-[10px] text-slate-400 font-bold font-inter mt-1">{activeJobs.length} active quotes/orders</p>
        </div>
      </div>

      {/* Payout Breakdown Table */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
        <h3 className="text-sm font-black uppercase tracking-tight text-slate-800 mb-6 text-left">Worker Billing Details</h3>
        {workerEarnings.length === 0 ? (
          <p className="text-slate-400 font-bold font-inter text-center py-6">No completed payouts recorded in this category selection.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table text-left">
              <thead>
                <tr className="border-b border-slate-50 text-[10px] uppercase tracking-widest text-slate-400">
                  <th className="pb-4 font-black">Worker Name</th>
                  <th className="pb-4 font-black">Specialty</th>
                  <th className="pb-4 font-black text-center">Completed Jobs</th>
                  <th className="pb-4 font-black text-right">Gross Billing</th>
                  <th className="pb-4 font-black text-right">Platform Fee (15%)</th>
                  <th className="pb-4 font-black text-right">Net Payout (85%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs font-semibold text-slate-700">
                {workerEarnings.map((w, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 font-black text-slate-800 uppercase tracking-tight">{w.name}</td>
                    <td className="py-4 text-slate-500 font-medium">{w.category}</td>
                    <td className="py-4 text-center font-black">
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px]">
                        {w.jobsCount}
                      </span>
                    </td>
                    <td className="py-4 text-right font-black text-slate-800">{w.gross.toLocaleString()} DZD</td>
                    <td className="py-4 text-right font-black text-rose-500">-{w.platformFee.toLocaleString()} DZD</td>
                    <td className="py-4 text-right font-black text-emerald-600">{w.payout.toLocaleString()} DZD</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Revenue Trend chart */}
      <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm">
        <h2 className="text-lg font-black uppercase tracking-tight text-slate-800 mb-6 text-left">Confirmed Billings Trend</h2>
        <div className="flex items-end gap-2 h-40">
          {[32, 48, 35, 58, 45, 72, 55, 42, 78, 62, 50, 82, 68, 58].map((h, i) => (
            <div key={i} className="flex-1 rounded-t-lg transition-all duration-300 hover:opacity-100" style={{ height: `${h}%`, background: "var(--primary)", opacity: 0.3 + (h / 130) }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// MODAL: REGISTER NEW BOOKING
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
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");

  const filteredWorkers = professionals.filter(p => p.category === category);

  useEffect(() => {
    if (filteredWorkers.length > 0) {
      setWorkerId(filteredWorkers[0].id);
    } else {
      setWorkerId("");
    }
  }, [category]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientPhone || !clientAddress || !workerId || !description || !bookingDate) {
      alert("Please fill in all required fields.");
      return;
    }
    onSubmit({
      clientName,
      clientPhone,
      clientAddress,
      category,
      workerId,
      description,
      price,
      bookingDate,
      bookingTime: bookingTime || undefined
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-6 relative m-4">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400 hover:text-slate-800 cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="space-y-1 text-left">
          <h2 className="text-xl font-black text-slate-800 uppercase">Register Booking</h2>
          <p className="text-xs text-slate-400 font-bold font-inter">Create a manual request with schedule inputs</p>
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
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 block mb-2">Price (DZD)</label>
              <input
                type="text"
                placeholder="e.g. 3,500 DZD"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border border-transparent focus:border-primary/20 rounded-2xl outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all font-semibold text-xs text-slate-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 block mb-2">Scheduled Day *</label>
              <input
                type="date"
                required
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all font-semibold text-xs text-slate-700"
              />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 block mb-2">Confirmed Time (Optional)</label>
              <input
                type="time"
                value={bookingTime}
                onChange={(e) => setBookingTime(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all font-semibold text-xs text-slate-700"
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
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 block mb-2">Assign Worker *</label>
              <select
                value={workerId}
                required
                onChange={(e) => setWorkerId(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all font-semibold text-xs text-slate-700"
              >
                {filteredWorkers.length === 0 ? (
                  <option value="">No workers available</option>
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
              className="flex-1 py-4 border border-slate-200 text-slate-500 rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-slate-50 active:scale-[0.98] transition-all cursor-pointer text-center text-slate-500"
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
// MODAL: REGISTER NEW WORKER
// ==========================================

interface AddWorkerModalProps {
  categories: any[];
  onClose: () => void;
  onSubmit: (workerData: any) => void;
}

function AddWorkerModal({ categories, onClose, onSubmit }: AddWorkerModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState(categories[0]?.name || "");
  const [rate, setRate] = useState("");
  const [experience, setExperience] = useState("");
  const [bio, setBio] = useState("");
  
  // Available times state checkboxes
  const timeSlots = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];
  const [selectedSlots, setSelectedSlots] = useState<string[]>(["08:00", "10:00", "14:00", "16:00"]);

  const handleToggleSlot = (slot: string) => {
    if (selectedSlots.includes(slot)) {
      setSelectedSlots(selectedSlots.filter(s => s !== slot));
    } else {
      setSelectedSlots([...selectedSlots, slot].sort());
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !category || !rate || !experience || !bio) {
      alert("Please fill in all fields.");
      return;
    }
    onSubmit({
      name,
      phone,
      category,
      rate,
      experience,
      bio,
      availableTimes: selectedSlots
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-6 relative m-4">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400 hover:text-slate-800 cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="space-y-1 text-left">
          <h2 className="text-xl font-black text-slate-800 uppercase">Add Professional</h2>
          <p className="text-xs text-slate-400 font-bold font-inter">Register a new service provider profile</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 block mb-2">Worker Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Youcef Latreche"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-5 py-4 bg-slate-50 border border-transparent focus:border-primary/20 rounded-2xl outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all font-semibold text-xs text-slate-700"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 block mb-2">Worker Phone *</label>
              <input
                type="text"
                required
                placeholder="e.g. +213 550 99 88 77"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border border-transparent focus:border-primary/20 rounded-2xl outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all font-semibold text-xs text-slate-700"
              />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 block mb-2">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all font-semibold text-xs text-slate-700 font-bold text-slate-700"
              >
                {categories.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 block mb-2">Availability Time Slots *</label>
            <div className="flex flex-wrap gap-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              {timeSlots.map(s => {
                const active = selectedSlots.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleToggleSlot(s)}
                    className={`px-3 py-1.5 rounded-lg border text-[10px] font-black tracking-wide transition-all ${
                      active ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 block mb-2">Base Pricing Rate *</label>
            <input
              type="text"
              required
              placeholder="e.g. 1,600 DZD / Hour"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className="w-full px-5 py-4 bg-slate-50 border border-transparent focus:border-primary/20 rounded-2xl outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all font-semibold text-xs text-slate-700"
            />
          </div>

          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 block mb-2">Experience Summary *</label>
            <input
              type="text"
              required
              placeholder="e.g. 5 Years in AC maintenance, certified at INSFP"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              className="w-full px-5 py-4 bg-slate-50 border border-transparent focus:border-primary/20 rounded-2xl outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all font-semibold text-xs text-slate-700"
            />
          </div>

          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 block mb-2">Detailed Bio *</label>
            <textarea
              required
              rows={3}
              placeholder="Provide a detailed description of skills and focus..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-5 py-4 bg-slate-50 border border-transparent focus:border-primary/20 rounded-2xl outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all font-semibold text-xs text-slate-700 resize-none"
            />
          </div>

          <div className="pt-4 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 border border-slate-200 text-slate-500 rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-slate-50 active:scale-[0.98] transition-all cursor-pointer text-center text-slate-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-slate-800 transition-all shadow-lg active:scale-[0.98] cursor-pointer"
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// MODAL: ADD SERVICE CATEGORY
// ==========================================

interface AddCategoryModalProps {
  onClose: () => void;
  onSubmit: (name: string, icon: string) => void;
}

function AddCategoryModal({ onClose, onSubmit }: AddCategoryModalProps) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🛠️");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      alert("Category name is required.");
      return;
    }
    onSubmit(name, icon);
  };

  const icons = ["🛠️", "🔧", "🔌", "🎨", "🧹", "❄️", "🔑", "🌱", "📦", "🪵", "🚗", "🏠", "💻", "🧱"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl p-8 max-w-md w-full relative m-4">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400 hover:text-slate-800 cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="space-y-1 text-left">
          <h2 className="text-xl font-black text-slate-800 uppercase">Add Specialty Category</h2>
          <p className="text-xs text-slate-400 font-bold font-inter">Create a new service category for clients</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-left mt-4">
          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 block mb-2">Category Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Locksmith"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-5 py-4 bg-slate-50 border border-transparent focus:border-primary/20 rounded-2xl outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all font-semibold text-xs text-slate-700"
            />
          </div>

          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 block mb-2">Select Icon / Emoji *</label>
            <div className="grid grid-cols-7 gap-2">
              {icons.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  className={`w-10 h-10 text-xl rounded-xl flex items-center justify-center border transition-all ${
                    icon === emoji ? "border-primary bg-primary/5 scale-110 shadow-sm" : "border-slate-100 bg-slate-50 hover:bg-slate-100"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 border border-slate-200 text-slate-500 rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-slate-50 active:scale-[0.98] transition-all cursor-pointer text-center text-slate-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-slate-800 transition-all shadow-lg active:scale-[0.98] cursor-pointer"
            >
              Create Category
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// MODAL: EDIT SERVICE CATEGORY
// ==========================================
interface EditCategoryModalProps {
  category: { name: string; icon: string };
  categories: any[];
  onClose: () => void;
  onSubmit: (oldName: string, newName: string, newIcon: string) => void;
}

function EditCategoryModal({ category, categories, onClose, onSubmit }: EditCategoryModalProps) {
  const [name, setName] = useState(category.name);
  const [icon, setIcon] = useState(category.icon);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      alert("Category name is required.");
      return;
    }
    if (name.toLowerCase() !== category.name.toLowerCase() &&
        categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      alert("Category name already exists.");
      return;
    }
    onSubmit(category.name, name, icon);
  };

  const icons = ["🛠️", "🔧", "🔌", "🎨", "🧹", "❄️", "🔑", "🌱", "📦", "🪵", "🚗", "🏠", "💻", "🧱"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl p-8 max-w-md w-full relative m-4">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400 hover:text-slate-800 cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="space-y-1 text-left">
          <h2 className="text-xl font-black text-slate-800 uppercase">Edit Category</h2>
          <p className="text-xs text-slate-400 font-bold font-inter">Update service category name and icon</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-left mt-4">
          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 block mb-2">Category Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Locksmith"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-5 py-4 bg-slate-50 border border-transparent focus:border-primary/20 rounded-2xl outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all font-semibold text-xs text-slate-700"
            />
          </div>

          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 block mb-2">Select Icon / Emoji *</label>
            <div className="grid grid-cols-7 gap-2">
              {icons.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  className={`w-10 h-10 text-xl rounded-xl flex items-center justify-center border transition-all ${
                    icon === emoji ? "border-primary bg-primary/5 scale-110 shadow-sm" : "border-slate-100 bg-slate-50 hover:bg-slate-100"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 border border-slate-200 text-slate-500 rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-slate-50 active:scale-[0.98] transition-all cursor-pointer text-center text-slate-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-slate-800 transition-all shadow-lg active:scale-[0.98] cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// MODAL: EDIT BOOKING / COMMAND DETAILS
// ==========================================

interface EditBookingModalProps {
  booking: Booking;
  professionals: Professional[];
  categories: any[];
  onClose: () => void;
  onSubmit: (id: string, updatedFields: Partial<Booking>) => void;
}

function EditBookingModal({
  booking,
  professionals,
  categories,
  onClose,
  onSubmit
}: EditBookingModalProps) {
  const [clientName, setClientName] = useState(booking.clientName);
  const [clientPhone, setClientPhone] = useState(booking.clientPhone);
  const [clientAddress, setClientAddress] = useState(booking.clientAddress);
  const [category, setCategory] = useState(booking.serviceCategory);
  const [workerId, setWorkerId] = useState(booking.workerId);
  const [description, setDescription] = useState(booking.description);
  const [price, setPrice] = useState(booking.price);
  const [bookingDate, setBookingDate] = useState(booking.bookingDate);
  const [bookingTime, setBookingTime] = useState(booking.bookingTime || "");
  const [status, setStatus] = useState<BookingStatus>(booking.status);

  const filteredWorkers = professionals.filter(p => p.category === category);
  const selectedWorkerObj = professionals.find(p => p.id === workerId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(booking.id, {
      clientName,
      clientPhone,
      clientAddress,
      serviceCategory: category,
      workerId,
      description,
      price,
      bookingDate,
      bookingTime: bookingTime || undefined,
      status
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-6 relative m-4">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400 hover:text-slate-800 cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="space-y-1 text-left">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-800 uppercase">Edit Command</h2>
            <span className="font-mono text-xs font-black text-primary px-2 py-0.5 bg-primary/5 rounded-md">
              {booking.id}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-bold font-inter">Modify details or change status directly</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 block mb-2">Client Full Name</label>
            <input
              type="text"
              required
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full px-5 py-4 bg-slate-50 border border-transparent focus:border-primary/20 rounded-2xl outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all font-semibold text-xs text-slate-700"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 block mb-2">Client Phone</label>
              <input
                type="text"
                required
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border border-transparent focus:border-primary/20 rounded-2xl outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all font-semibold text-xs text-slate-700"
              />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 block mb-2">Price (DZD)</label>
              <input
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border border-transparent focus:border-primary/20 rounded-2xl outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all font-semibold text-xs text-slate-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 block mb-2">Scheduled Day</label>
              <input
                type="date"
                required
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all font-semibold text-xs text-slate-700"
              />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 block mb-2">Confirmed Time Slot</label>
              <select
                value={bookingTime}
                onChange={(e) => setBookingTime(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all font-semibold text-xs text-slate-700 font-bold"
              >
                <option value="">Awaiting slot selection...</option>
                {(selectedWorkerObj?.availableTimes || []).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 block mb-2">Client Address</label>
            <input
              type="text"
              required
              value={clientAddress}
              onChange={(e) => setClientAddress(e.target.value)}
              className="w-full px-5 py-4 bg-slate-50 border border-transparent focus:border-primary/20 rounded-2xl outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all font-semibold text-xs text-slate-700"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 block mb-2">Service Specialty</label>
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
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 block mb-2">Assign Worker</label>
              <select
                value={workerId}
                required
                onChange={(e) => setWorkerId(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all font-semibold text-xs text-slate-700"
              >
                {filteredWorkers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.rate})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 block mb-2">Status Override</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as BookingStatus)}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all font-semibold text-xs text-slate-700 text-primary font-black uppercase tracking-wider"
            >
              {Object.keys(STATUS_DETAILS).map((k) => (
                <option key={k} value={k}>
                  {STATUS_DETAILS[k as BookingStatus].label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 block mb-2">Job Description</label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-5 py-4 bg-slate-50 border border-transparent focus:border-primary/20 rounded-2xl outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all font-semibold text-xs text-slate-700 resize-none"
            />
          </div>

          <div className="pt-4 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 border border-slate-200 text-slate-500 rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-slate-50 active:scale-[0.98] transition-all cursor-pointer text-center text-slate-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-slate-800 transition-all shadow-lg active:scale-[0.98] cursor-pointer"
            >
              Apply Updates
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
              <div className="flex items-center gap-2 font-inter text-[10px] text-slate-400 font-bold font-inter">
                <span>Joined {worker.joined}</span>
                <span>•</span>
                <span>⭐ {worker.rating}</span>
              </div>
            </div>
          </div>

          {/* Availability schedule */}
          <div className="space-y-2">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Availability Slots ({worker.availableTimes.length})</span>
            <div className="flex flex-wrap gap-1.5 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              {worker.availableTimes.map((t, idx) => (
                <span key={idx} className="px-2.5 py-1 bg-white border border-slate-150 rounded-lg text-[10px] font-black text-slate-600 font-mono">
                  {t}
                </span>
              ))}
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
                {worker.verified ? "Verified ✓" : "Verify account"}
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
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-slate-800 active:scale-[0.98] transition-all animate-fadeIn"
          >
            <Phone size={14} /> Contact Worker ({worker.phone})
          </a>
        </div>
      </div>
    </>
  );
}

// ==========================================
// DRAWER: BOOKING DETAILS PIPELINE CONTROL
// ==========================================

interface BookingDetailDrawerProps {
  booking: Booking;
  professionals: Professional[];
  onClose: () => void;
  onUpdateStatus: (id: string, s: Booking["status"]) => void;
  onReassignWorker: (id: string, wId: string) => void;
  onEditBooking: (b: Booking) => void;
}

function BookingDetailDrawer({
  booking,
  professionals,
  onClose,
  onUpdateStatus,
  onReassignWorker,
  onEditBooking
}: BookingDetailDrawerProps) {
  const [showReassign, setShowReassign] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [quoteAmount, setQuoteAmount] = useState(booking.workerQuote ? String(booking.workerQuote) : "");

  const worker = professionals.find(p => p.id === booking.workerId);
  const eligibleWorkers = professionals.filter(
    p => p.category === booking.serviceCategory && p.id !== booking.workerId
  );

  const statusList: { id: BookingStatus; label: string; action: string }[] = [
    { id: "pending_review", label: "Pending Review", action: "Review Booking" },
    { id: "contacting_worker", label: "Contacting Worker", action: "Contact Worker" },
    { id: "quote_sent", label: "Quote Sent", action: "Send Quote" },
    { id: "quote_approved", label: "Quote Approved", action: "Approve Quote" },
    { id: "both_confirmed", label: "Both Confirmed", action: "Confirm Both" },
    { id: "dispatched", label: "Dispatched", action: "Dispatch Worker" },
    { id: "in_progress", label: "In Progress", action: "Start Job" },
    { id: "completed", label: "Completed", action: "Complete Job" }
  ];

  const currentIdx = statusList.findIndex(s => s.id === booking.status);
  const nextStateObj = currentIdx < statusList.length - 1 ? statusList[currentIdx + 1] : null;

  // Direct status override dropdown change
  const handleDirectStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdateStatus(booking.id, e.target.value as BookingStatus);
  };

  // Confirm worker with time slot AND price together, then send to client
  const handleSendQuoteToClient = () => {
    if (!selectedSlot || !quoteAmount) return;
    booking.bookingTime = selectedSlot;
    booking.workerQuote = parseInt(quoteAmount);
    booking.quoteStatus = "sent";
    booking.price = `${parseInt(quoteAmount).toLocaleString()} DZD`;
    onUpdateStatus(booking.id, "quote_sent");
  };

  // Client approves the quote
  const handleClientApproveQuote = () => {
    booking.quoteStatus = "approved";
    onUpdateStatus(booking.id, "both_confirmed");
  };

  // Client rejects the quote
  const handleClientRejectQuote = () => {
    booking.quoteStatus = "rejected";
    onUpdateStatus(booking.id, "quote_rejected");
  };

  // Re-quote after rejection
  const handleReQuote = () => {
    booking.quoteStatus = "pending";
    booking.workerQuote = null;
    booking.bookingTime = undefined;
    onUpdateStatus(booking.id, "contacting_worker");
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed top-0 right-0 bottom-0 w-full sm:w-120 bg-white z-50 shadow-2xl p-8 flex flex-col justify-between overflow-y-auto animate-slideIn">
        <div className="space-y-6 text-left">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-inter">Order Details</span>
              <span className="font-mono text-xs font-black text-primary px-2 py-0.5 bg-primary/5 rounded-md">
                {booking.id}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onEditBooking(booking)}
                className="w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-600 hover:text-slate-800 cursor-pointer"
                title="Edit details"
              >
                <Edit2 size={14} />
              </button>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400 hover:text-slate-800 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Client Details Section */}
          <div className="space-y-3">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-inter font-bold">Client Information</span>
            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 space-y-2">
              <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{booking.clientName}</p>
              <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 font-inter">
                <Phone size={12} /> {booking.clientPhone}
              </p>
              <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 font-inter">
                <MapPin size={12} /> {booking.clientAddress}
              </p>
              <div className="border-t border-slate-100 pt-2.5 mt-2.5 space-y-1.5">
                <div className="flex gap-4 text-xs font-bold font-inter text-slate-500">
                  <span className="flex items-center gap-1"><Calendar size={12} className="text-slate-400" /> Day: <strong className="text-slate-700">{booking.bookingDate}</strong></span>
                  <span className="flex items-center gap-1"><Clock size={12} className="text-slate-400" /> Time: <strong className="text-primary">{booking.bookingTime || "Awaiting Conf."}</strong></span>
                </div>
                {booking.workerQuote && (
                  <div className="flex items-center gap-1 text-xs font-bold font-inter text-slate-500">
                    <DollarSign size={12} className="text-slate-400" /> Quote: <strong className="text-emerald-600">{booking.workerQuote.toLocaleString()} DZD</strong>
                    <span className={`ml-2 text-[9px] font-black uppercase px-2 py-0.5 rounded-lg ${
                      booking.quoteStatus === "approved" ? "bg-emerald-50 text-emerald-600" :
                      booking.quoteStatus === "rejected" ? "bg-rose-50 text-rose-600" :
                      booking.quoteStatus === "sent" ? "bg-purple-50 text-purple-600" :
                      "bg-slate-100 text-slate-400"
                    }`}>{booking.quoteStatus}</span>
                  </div>
                )}
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Issue Description</p>
                <p className="text-xs text-slate-600 font-bold leading-normal font-inter bg-white p-3 rounded-xl border border-slate-50">
                  {booking.description}
                </p>
              </div>
            </div>
          </div>

          {/* Client Photos Gallery */}
          {booking.clientPhotos.length > 0 && (
            <div className="space-y-3">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-inter font-bold flex items-center gap-1.5">
                <Camera size={12} /> Client Job Photos ({booking.clientPhotos.length})
              </span>
              <div className="grid grid-cols-3 gap-2">
                {booking.clientPhotos.map((photo, i) => (
                  <div key={i} className="aspect-square rounded-2xl overflow-hidden border border-slate-100 group">
                    <img
                      src={photo}
                      alt={`Job photo ${i + 1}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Selected Worker snapshot */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-inter font-bold">Selected Professional</span>
              <button
                onClick={() => setShowReassign(!showReassign)}
                className="text-[9px] font-black text-primary uppercase tracking-wider hover:underline cursor-pointer"
              >
                {showReassign ? "Cancel Reassignment" : "Change Worker"}
              </button>
            </div>

            {showReassign ? (
              <div className="bg-primary/5 border border-primary/10 p-5 rounded-3xl space-y-3">
                <p className="text-xs font-black uppercase text-primary">Reassign {booking.serviceCategory} Professional</p>
                {eligibleWorkers.length === 0 ? (
                  <p className="text-[10px] text-slate-400 font-bold font-inter">No other workers available in this category.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
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
                        <span className="text-[9px] font-black text-primary uppercase tracking-widest">Assign</span>
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
                        <p className="text-xs font-black text-slate-800 uppercase tracking-tight flex items-center gap-1.5 font-bold">
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

          {/* CONTACTING WORKER: Combined time slot + price selection */}
          {booking.status === "contacting_worker" && worker && (
            <div className="bg-primary/5 border border-primary/15 p-5 rounded-3xl space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <Clock size={16} />
                <h4 className="text-xs font-black uppercase tracking-tight">Set Time Slot + Price for Client</h4>
              </div>
              <p className="text-[10px] text-slate-500 font-bold font-inter leading-relaxed">
                Select <strong className="text-slate-700">{worker.name}</strong>&apos;s available slot for <strong className="text-slate-700">{booking.bookingDate}</strong> and enter the worker&apos;s price. Both will be sent to the client for approval.
              </p>

              {/* Time slot buttons */}
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Available Times</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {worker.availableTimes.map(slot => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`py-3 px-2 rounded-xl border text-sm font-black font-mono text-center transition-all cursor-pointer ${
                        selectedSlot === slot
                          ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105"
                          : "bg-white text-slate-700 border-slate-200 hover:border-primary/30 hover:bg-primary/5"
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price input */}
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Worker Price (DZD)</p>
                <input
                  type="number"
                  placeholder="e.g. 4500"
                  value={quoteAmount}
                  onChange={(e) => setQuoteAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-black outline-none focus:ring-2 focus:ring-primary/20 text-slate-700"
                />
              </div>

              {/* Send to client button */}
              {selectedSlot && quoteAmount ? (
                <button
                  type="button"
                  onClick={handleSendQuoteToClient}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-primary/20"
                >
                  <Check size={14} /> Send Quote: {parseInt(quoteAmount).toLocaleString()} DZD at {selectedSlot} to Client
                </button>
              ) : (
                <div className="w-full py-4 bg-slate-100 text-slate-400 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 border border-slate-200">
                  <AlertCircle size={14} /> Select time + enter price to continue
                </div>
              )}
            </div>
          )}

          {/* QUOTE SENT: Waiting for client response */}
          {booking.status === "quote_sent" && (
            <div className="bg-purple-50 border border-purple-100 p-5 rounded-3xl space-y-4">
              <div className="flex items-center gap-2 text-purple-700">
                <DollarSign size={16} />
                <h4 className="text-xs font-black uppercase tracking-tight">Quote Sent — Awaiting Client Response</h4>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-purple-50 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-500 font-inter">Time Slot</span>
                  <span className="text-sm font-black font-mono text-slate-800">{booking.bookingTime}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-500 font-inter">Quoted Price</span>
                  <span className="text-sm font-black text-emerald-600">{booking.workerQuote?.toLocaleString()} DZD</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleClientApproveQuote}
                  className="py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-emerald-600 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <ThumbsUp size={14} /> Client Approved
                </button>
                <button
                  onClick={handleClientRejectQuote}
                  className="py-4 bg-rose-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-rose-600 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <ThumbsDown size={14} /> Client Rejected
                </button>
              </div>
            </div>
          )}

          {/* QUOTE REJECTED: Option to re-quote */}
          {booking.status === "quote_rejected" && (
            <div className="bg-rose-50 border border-rose-100 p-5 rounded-3xl space-y-3">
              <div className="flex items-center gap-2 text-rose-700">
                <XCircle size={16} />
                <h4 className="text-xs font-black uppercase tracking-tight">Quote Rejected by Client</h4>
              </div>
              <p className="text-[10px] text-slate-500 font-bold font-inter leading-relaxed">
                The client did not accept the quote of <strong className="text-rose-600">{booking.workerQuote?.toLocaleString()} DZD</strong> at <strong>{booking.bookingTime}</strong>. You can send a new quote or cancel the booking.
              </p>
              <button
                onClick={handleReQuote}
                className="w-full py-4 bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-blue-600 active:scale-[0.98] transition-all cursor-pointer"
              >
                <Edit2 size={14} /> Re-Quote with New Price
              </button>
            </div>
          )}

          {/* Direct State Override */}
          <div className="space-y-2 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-inter">Direct State Override</label>
            <select
              value={booking.status}
              onChange={handleDirectStatusChange}
              className="w-full mt-1 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase outline-none text-primary font-black"
            >
              {Object.keys(STATUS_DETAILS).map((k) => (
                <option key={k} value={k}>
                  {STATUS_DETAILS[k as BookingStatus].label}
                </option>
              ))}
            </select>
          </div>

          {/* Timeline workflow */}
          <div className="space-y-4">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-inter font-bold">Workflow Timeline</span>
            
            <div className="space-y-4 pl-4 border-l border-slate-100 relative">
              {statusList.map((st, i) => {
                const isPast = i <= currentIdx;
                const isCurrent = i === currentIdx;

                return (
                  <div key={st.id} className="relative flex items-start gap-4">
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

          {/* Standard status progression button */}
          {booking.status !== "completed" && booking.status !== "cancelled" && booking.status !== "quote_rejected" && nextStateObj && booking.status !== "contacting_worker" && booking.status !== "quote_sent" && (
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
// ==========================================
// PAGE: REVIEWS MANAGEMENT
// ==========================================
interface ReviewsPageProps {
  professionals: Professional[];
  onDeleteReview: (workerId: string, idx: number) => void;
}

function ReviewsPage({ professionals, onDeleteReview }: ReviewsPageProps) {
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"individual" | "workers">("workers");

  const allReviews = professionals.flatMap(p =>
    p.reviews.map((r, idx) => ({
      ...r,
      workerId: p.id,
      workerName: p.name,
      workerCategory: p.category,
      reviewIdx: idx
    }))
  ).sort((a, b) => b.date.localeCompare(a.date));

  const filteredReviews = allReviews.filter(r => {
    const matchesSearch = r.clientName.toLowerCase().includes(search.toLowerCase()) ||
                          r.workerName.toLowerCase().includes(search.toLowerCase()) ||
                          r.comment.toLowerCase().includes(search.toLowerCase());
    const matchesRating = ratingFilter === "all" || r.rating === parseInt(ratingFilter);
    return matchesSearch && matchesRating;
  });

  const avgRating = allReviews.length > 0
    ? parseFloat((allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1))
    : 5.0;

  const fiveStarCount = allReviews.filter(r => r.rating === 5).length;
  const criticalCount = allReviews.filter(r => r.rating < 3).length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fadeIn pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left">
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tighter text-slate-800 uppercase">Reviews & Ratings</h1>
          <p className="text-sm text-slate-400 font-medium font-inter">Manage customer feedback and worker quality control</p>
        </div>
        
        {/* Toggle Mode Tab */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <button
            type="button"
            onClick={() => setViewMode("workers")}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              viewMode === "workers"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Worker Breakdown
          </button>
          <button
            type="button"
            onClick={() => setViewMode("individual")}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              viewMode === "individual"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            All Reviews
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Total Reviews</span>
          <span className="text-2xl font-black text-slate-800 tracking-tight block mt-2">{allReviews.length}</span>
          <p className="text-[10px] text-slate-400 font-bold font-inter mt-1">Across all services</p>
        </div>
        <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Average Rating</span>
          <span className="text-2xl font-black text-slate-800 tracking-tight block mt-2">⭐ {avgRating} / 5.0</span>
          <p className="text-[10px] text-slate-400 font-bold font-inter mt-1">Global worker score</p>
        </div>
        <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">5-Star Feedback</span>
          <span className="text-2xl font-black text-slate-800 tracking-tight block mt-2">{fiveStarCount}</span>
          <p className="text-[10px] text-emerald-500 font-bold font-inter mt-1">
            {allReviews.length > 0 ? ((fiveStarCount / allReviews.length) * 100).toFixed(0) : 0}% Positive rate
          </p>
        </div>
        <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Critical Alerts</span>
          <span className="text-2xl font-black text-rose-600 tracking-tight block mt-2">{criticalCount}</span>
          <p className="text-[10px] text-slate-400 font-bold font-inter mt-1">Ratings below 3 stars</p>
        </div>
      </div>

      {/* Filters (only for All Reviews or Search) */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50 p-4 rounded-3xl border border-slate-100">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search reviews, client or worker..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-5 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 text-xs font-semibold text-slate-700"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto">
          {["all", "5", "4", "3", "2", "1"].map(rating => (
            <button
              key={rating}
              onClick={() => setRatingFilter(rating)}
              className={`text-[10px] px-4 py-2.5 rounded-xl font-black uppercase tracking-wider transition-all border cursor-pointer ${
                ratingFilter === rating
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
              }`}
            >
              {rating === "all" ? "All Stars" : `${rating} ★`}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews Render Container */}
      {viewMode === "workers" ? (
        <div className="space-y-8">
          {professionals
            .filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase()))
            .map(worker => {
              // Calculate specific ratings distribution
              const totalRating = worker.reviews.reduce((sum, r) => sum + r.rating, 0);
              const workerAvg = worker.reviews.length > 0 ? (totalRating / worker.reviews.length).toFixed(1) : "5.0";
              
              // Filter reviews for this worker
              const workerReviewsFiltered = worker.reviews.map((r, idx) => ({ ...r, originalIdx: idx }))
                .filter(r => ratingFilter === "all" || r.rating === parseInt(ratingFilter));

              return (
                <div key={worker.id} className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm text-left space-y-6">
                  {/* Worker Summary Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-50 pb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 text-primary font-black rounded-2xl flex items-center justify-center text-sm uppercase">
                        {worker.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                          {worker.name}
                          {worker.verified && <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-lg">Verified</span>}
                        </h3>
                        <p className="text-[10px] text-slate-400 font-bold font-inter mt-0.5">{worker.category} · {worker.reviews.length} reviews</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Average Rating</span>
                        <span className="text-xl font-black text-slate-800 block mt-0.5">⭐ {workerAvg} / 5.0</span>
                      </div>
                    </div>
                  </div>

                  {/* Worker's Reviews List */}
                  {workerReviewsFiltered.length === 0 ? (
                    <p className="text-xs text-slate-400 font-bold font-inter py-2 pl-4">No matching reviews for this professional.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {workerReviewsFiltered.map((review) => (
                        <div key={review.originalIdx} className="bg-slate-50/50 border border-slate-100 p-5 rounded-3xl space-y-3 relative group">
                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => onDeleteReview(worker.id, review.originalIdx)}
                            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                            title="Delete this review"
                          >
                            <Trash2 size={14} />
                          </button>

                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="text-xs font-black text-slate-700 uppercase tracking-tight">{review.clientName}</h4>
                              <span className="text-[9px] text-slate-400 font-bold font-inter">{review.date}</span>
                            </div>
                            
                            {/* Stars */}
                            <div className="flex text-amber-400 text-[10px] mr-6">
                              {Array.from({ length: 5 }).map((_, idx) => (
                                <span key={idx}>{idx < review.rating ? "★" : "☆"}</span>
                              ))}
                            </div>
                          </div>
                          <p className="text-xs text-slate-500 font-medium font-inter leading-relaxed bg-white p-3 rounded-xl border border-slate-50">
                            &ldquo;{review.comment}&rdquo;
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      ) : (
        /* Individual Reviews List View */
        filteredReviews.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-[2.5rem] p-12 text-center text-slate-400 font-bold font-inter">
            No matching reviews found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredReviews.map((r, i) => (
              <div key={i} className="bg-white border border-slate-100 p-6 rounded-[2.5rem] shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow relative">
                <button
                  onClick={() => onDeleteReview(r.workerId, r.reviewIdx)}
                  className="absolute top-6 right-6 p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Delete review"
                >
                  <Trash2 size={16} />
                </button>

                <div className="space-y-3">
                  {/* User/Worker context */}
                  <div className="flex justify-between items-start text-left">
                    <div>
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">{r.clientName}</h4>
                      <p className="text-[9px] text-slate-400 font-bold font-inter">{r.date}</p>
                    </div>
                    <div className="text-right mr-8">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Reviewing</span>
                      <span className="text-xs font-black text-primary uppercase tracking-tight block mt-0.5">{r.workerName}</span>
                      <span className="text-[9px] text-slate-400 font-bold font-inter block">{r.workerCategory}</span>
                    </div>
                  </div>

                  {/* Stars */}
                  <div className="flex text-amber-400 text-xs">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <span key={idx}>{idx < r.rating ? "★" : "☆"}</span>
                    ))}
                  </div>

                  {/* Comment */}
                  <p className="text-xs text-slate-500 font-medium font-inter leading-relaxed text-left bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                    &ldquo;{r.comment}&rdquo;
                  </p>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}

// ==========================================
// PAGE: CLIENTS DIRECTORY
// ==========================================
interface ClientsPageProps {
  bookings: Booking[];
  professionals: Professional[];
  onSelectBooking: (b: Booking) => void;
}

function ClientsPage({ bookings, professionals, onSelectBooking }: ClientsPageProps) {
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<any | null>(null);

  // Group bookings by client phone
  const clientsMap: Record<string, {
    name: string;
    phone: string;
    address: string;
    bookings: Booking[];
    totalSpent: number;
    lastBookingDate: string;
  }> = {};

  bookings.forEach(b => {
    const key = b.clientPhone;
    const spent = b.workerQuote || 0;
    if (!clientsMap[key]) {
      clientsMap[key] = {
        name: b.clientName,
        phone: b.clientPhone,
        address: b.clientAddress,
        bookings: [b],
        totalSpent: spent,
        lastBookingDate: b.bookingDate
      };
    } else {
      clientsMap[key].bookings.push(b);
      clientsMap[key].totalSpent += spent;
      if (b.bookingDate > clientsMap[key].lastBookingDate) {
        clientsMap[key].lastBookingDate = b.bookingDate;
      }
    }
  });

  const clientsList = Object.values(clientsMap);

  const filteredClients = clientsList.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    c.address.toLowerCase().includes(search.toLowerCase())
  );

  // Stats calculation
  const totalClients = clientsList.length;
  const repeatClients = clientsList.filter(c => c.bookings.length > 1).length;
  const topSpender = clientsList.length > 0
    ? clientsList.reduce((max, c) => c.totalSpent > max.totalSpent ? c : max, clientsList[0])
    : null;
  const totalAllSpent = clientsList.reduce((sum, c) => sum + c.totalSpent, 0);
  const avgSpend = totalClients > 0 ? Math.round(totalAllSpent / totalClients) : 0;

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fadeIn pb-16 relative">
      {/* Header */}
      <div className="space-y-2 text-left">
        <h1 className="text-3xl font-black tracking-tighter text-slate-800 uppercase">Clients</h1>
        <p className="text-sm text-slate-400 font-medium font-inter">Manage customer details, history, and engagement</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Total Clients</span>
          <span className="text-2xl font-black text-slate-800 tracking-tight block mt-2">{totalClients}</span>
          <p className="text-[10px] text-slate-400 font-bold font-inter mt-1">Registered users</p>
        </div>
        <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Repeat Customers</span>
          <span className="text-2xl font-black text-slate-800 tracking-tight block mt-2">{repeatClients}</span>
          <p className="text-[10px] text-emerald-500 font-bold font-inter mt-1">
            {totalClients > 0 ? ((repeatClients / totalClients) * 100).toFixed(0) : 0}% Return rate
          </p>
        </div>
        <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Top Spender</span>
          <span className="text-2xl font-black text-emerald-600 tracking-tight block mt-2 truncate">
            {topSpender ? `${topSpender.totalSpent.toLocaleString()} DZD` : "0 DZD"}
          </span>
          <p className="text-[10px] text-slate-400 font-bold font-inter mt-1 truncate">
            {topSpender ? topSpender.name : "None"}
          </p>
        </div>
        <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Avg Spend / Client</span>
          <span className="text-2xl font-black text-slate-800 tracking-tight block mt-2">
            {avgSpend.toLocaleString()} <span className="text-xs text-slate-400 font-bold">DZD</span>
          </span>
          <p className="text-[10px] text-slate-400 font-bold font-inter mt-1">Life-time value</p>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="flex justify-between items-center bg-slate-50 p-4 rounded-3xl border border-slate-100">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search by name, phone or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-5 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 text-xs font-semibold text-slate-700"
          />
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table text-left">
            <thead>
              <tr className="border-b border-slate-50 text-[10px] uppercase tracking-widest text-slate-400">
                <th className="pb-4 font-black">Client Name</th>
                <th className="pb-4 font-black">Phone Number</th>
                <th className="pb-4 font-black">Default Address</th>
                <th className="pb-4 font-black text-center">Orders</th>
                <th className="pb-4 font-black text-right">Total Spent</th>
                <th className="pb-4 font-black text-right">Last Job</th>
                <th className="pb-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs font-semibold text-slate-700">
              {filteredClients.map((client, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="py-4 font-black text-slate-800 uppercase tracking-tight">{client.name}</td>
                  <td className="py-4 font-mono text-slate-500">{client.phone}</td>
                  <td className="py-4 text-slate-500 font-medium truncate max-w-xs">{client.address}</td>
                  <td className="py-4 text-center font-black">
                    <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg text-[10px]">
                      {client.bookings.length}
                    </span>
                  </td>
                  <td className="py-4 text-right font-black text-emerald-600">{client.totalSpent.toLocaleString()} DZD</td>
                  <td className="py-4 text-right text-slate-500 font-mono">{client.lastBookingDate}</td>
                  <td className="py-4 text-right">
                    <button
                      onClick={() => setSelectedClient(client)}
                      className="px-3 py-2 bg-slate-50 hover:bg-primary hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer text-slate-600"
                    >
                      History
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Client Detail Drawer */}
      {selectedClient && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedClient(null)} />
          <div className="fixed top-0 right-0 bottom-0 w-full sm:w-120 bg-white z-50 shadow-2xl p-8 flex flex-col justify-between overflow-y-auto animate-slideIn">
            <div className="space-y-6 text-left">
              {/* Header */}
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-inter block">Client File</span>
                  <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight block mt-1">{selectedClient.name}</h3>
                </div>
                <button
                  onClick={() => setSelectedClient(null)}
                  className="w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400 hover:text-slate-800 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Contact Card */}
              <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 space-y-2">
                <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 font-inter">
                  <Phone size={12} /> {selectedClient.phone}
                </p>
                <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 font-inter">
                  <MapPin size={12} /> {selectedClient.address}
                </p>
                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 mt-4">
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-inter">Total Jobs</span>
                    <span className="text-lg font-black text-slate-800">{selectedClient.bookings.length}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-inter">Total Spending</span>
                    <span className="text-lg font-black text-emerald-600">{selectedClient.totalSpent.toLocaleString()} DZD</span>
                  </div>
                </div>
              </div>

              {/* Order History */}
              <div className="space-y-3">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-inter font-bold">Booking History</span>
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {selectedClient.bookings.map((b: Booking) => {
                    const statusConfig = STATUS_DETAILS[b.status];
                    const assignedPro = professionals.find(p => p.id === b.workerId);
                    return (
                      <div
                        key={b.id}
                        onClick={() => {
                          setSelectedClient(null);
                          onSelectBooking(b);
                        }}
                        className="bg-white border border-slate-100 hover:border-primary/20 p-4 rounded-2xl space-y-3 cursor-pointer transition-all hover:shadow-sm"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-mono text-[10px] font-black text-primary bg-primary/5 px-2 py-0.5 rounded">
                            {b.id}
                          </span>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${statusConfig?.color}`}>
                            {statusConfig?.label}
                          </span>
                        </div>
                        <div className="text-xs space-y-1">
                          <p className="font-black text-slate-800 uppercase tracking-tight">{b.serviceCategory}</p>
                          <p className="text-slate-400 font-bold font-inter text-[10px] flex justify-between">
                            <span>Worker: <strong className="text-slate-600">{assignedPro?.name || "Unassigned"}</strong></span>
                            <span>Date: <strong className="text-slate-600">{b.bookingDate}</strong></span>
                          </p>
                          <p className="text-slate-500 font-medium font-inter mt-1 truncate">{b.description}</p>
                        </div>
                        <div className="border-t border-slate-50 pt-2 flex justify-between items-center">
                          <span className="text-[9px] font-black text-slate-400 uppercase">Paid / Quoted</span>
                          <span className="text-xs font-black text-emerald-600">{b.workerQuote ? `${b.workerQuote.toLocaleString()} DZD` : "Pending Quote"}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ==========================================
// PAGE: SERVICE ANALYTICS
// ==========================================
interface AnalyticsPageProps {
  bookings: Booking[];
  professionals: Professional[];
  categories: any[];
}

function AnalyticsPage({ bookings, professionals, categories }: AnalyticsPageProps) {
  // Statistics variables
  const completedBookings = bookings.filter(b => b.status === "completed");
  const cancelledBookings = bookings.filter(b => b.status === "cancelled");
  const approvedQuotes = bookings.filter(b => b.quoteStatus === "approved");
  const rejectedQuotes = bookings.filter(b => b.quoteStatus === "rejected");

  const totalRevenue = bookings.reduce((sum, b) => sum + (b.workerQuote || 0), 0);
  const conversionRate = bookings.length > 0
    ? ((completedBookings.length / bookings.length) * 100).toFixed(0)
    : "0";
  const quoteApprovalRate = (approvedQuotes.length + rejectedQuotes.length) > 0
    ? ((approvedQuotes.length / (approvedQuotes.length + rejectedQuotes.length)) * 100).toFixed(0)
    : "0";

  // Category revenue breakdown
  const categoryStats = categories.map(cat => {
    const catBookings = bookings.filter(b => b.serviceCategory === cat.name);
    const catRevenue = catBookings.reduce((sum, b) => sum + (b.workerQuote || 0), 0);
    return {
      name: cat.name,
      bookings: catBookings.length,
      revenue: catRevenue
    };
  }).sort((a, b) => b.revenue - a.revenue);

  const maxRevenue = Math.max(...categoryStats.map(c => c.revenue), 1);

  // Top workers by completed jobs
  const workerStats = professionals.map(pro => {
    const proBookings = bookings.filter(b => b.workerId === pro.id && b.status === "completed");
    const proRevenue = bookings.filter(b => b.workerId === pro.id).reduce((sum, b) => sum + (b.workerQuote || 0), 0);
    return {
      name: pro.name,
      category: pro.category,
      jobs: proBookings.length,
      revenue: proRevenue
    };
  }).sort((a, b) => b.jobs - a.jobs).slice(0, 4);

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fadeIn pb-16">
      {/* Page Header */}
      <div className="space-y-2 text-left">
        <h1 className="text-3xl font-black tracking-tighter text-slate-800 uppercase">Analytics</h1>
        <p className="text-sm text-slate-400 font-medium font-inter">Key performance indicators and business distribution metrics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Total Revenue</span>
          <span className="text-2xl font-black text-emerald-600 tracking-tight block mt-2">
            {totalRevenue.toLocaleString()} <span className="text-xs text-emerald-400 font-bold">DZD</span>
          </span>
          <p className="text-[10px] text-slate-400 font-bold font-inter mt-1">Confirmed booking fees</p>
        </div>
        <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Job Completion Rate</span>
          <span className="text-2xl font-black text-slate-800 tracking-tight block mt-2">{conversionRate}%</span>
          <p className="text-[10px] text-slate-400 font-bold font-inter mt-1">{completedBookings.length} completed / {cancelledBookings.length} cancelled</p>
        </div>
        <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Quote Approval Rate</span>
          <span className="text-2xl font-black text-slate-800 tracking-tight block mt-2">{quoteApprovalRate}%</span>
          <p className="text-[10px] text-purple-500 font-bold font-inter mt-1">
            {approvedQuotes.length} approved / {rejectedQuotes.length} rejected
          </p>
        </div>
        <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Avg Ticket Size</span>
          <span className="text-2xl font-black text-slate-800 tracking-tight block mt-2">
            {bookings.length > 0 ? Math.round(totalRevenue / bookings.length).toLocaleString() : 0} <span className="text-xs text-slate-400 font-bold">DZD</span>
          </span>
          <p className="text-[10px] text-slate-400 font-bold font-inter mt-1">Per requested order</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Category Share chart */}
        <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm space-y-6">
          <h3 className="text-sm font-black uppercase tracking-tight text-slate-800 text-left">Revenue distribution by Specialty</h3>
          <div className="space-y-4">
            {categoryStats.map((c, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-600 font-inter">
                  <span className="uppercase">{c.name} ({c.bookings} jobs)</span>
                  <span>{c.revenue.toLocaleString()} DZD</span>
                </div>
                <div className="w-full h-3 bg-slate-50 border border-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${(c.revenue / maxRevenue) * 100}%`,
                      background: "var(--primary)"
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Professionals */}
        <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-black uppercase tracking-tight text-slate-800 text-left mb-6">Top performing Workers</h3>
            <div className="space-y-4">
              {workerStats.map((w, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-slate-200 text-slate-700 font-black rounded-lg flex items-center justify-center text-[10px]">
                      {w.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{w.name}</p>
                      <p className="text-[9px] text-slate-400 font-bold font-inter">{w.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-slate-800">{w.jobs} completed</p>
                    <p className="text-[10px] text-emerald-600 font-bold font-mono">{w.revenue.toLocaleString()} DZD earned</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
