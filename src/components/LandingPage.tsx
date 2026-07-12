"use client";

import { Wrench, Car, Pizza, ArrowRight, ShieldCheck, Zap, Users } from "lucide-react";

interface LandingPageProps {
  onGoToLogin: () => void;
}

export default function LandingPage({ onGoToLogin }: LandingPageProps) {
  const serviceCards = [
    {
      title: "Ride Transport",
      subtitle: "Taxi & Ridesharing",
      desc: "Fast, reliable rides around the clock. Book city taxi trips, express transit and intercity journeys.",
      icon: Car,
      color: "from-amber-400 to-amber-600",
      emoji: "🚕",
      bgLight: "bg-amber-500/5 border-amber-500/10",
      textCol: "text-amber-500"
    },
    {
      title: "Food & Meals",
      subtitle: "Superfast Delivery",
      desc: "Delivering your favorite dishes from local restaurants and premium dining spots right to your doorstep.",
      icon: Pizza,
      color: "from-rose-400 to-rose-600",
      emoji: "🍕",
      bgLight: "bg-rose-500/5 border-rose-500/10",
      textCol: "text-rose-500"
    },
    {
      title: "Home & Pro Services",
      subtitle: "On-Demand Specialists",
      desc: "Instant booking for certified plumbers, painters, AC repairers, cleaners, and carpenters with custom quoting.",
      icon: Wrench,
      color: "from-blue-400 to-blue-600",
      emoji: "🔧",
      bgLight: "bg-blue-500/5 border-blue-500/10",
      textCol: "text-blue-500"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-inter selection:bg-primary selection:text-white">
      
      {/* Header Navigation */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center font-black text-xl italic tracking-tighter text-white shadow-md">
            R
          </div>
          <span className="text-lg font-black tracking-widest uppercase italic text-white">RAFIK</span>
        </div>
        <button
          onClick={onGoToLogin}
          className="px-6 py-3 bg-white/10 hover:bg-white/15 border border-white/10 hover:border-white/20 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
        >
          Sign In
        </button>
      </header>

      {/* Hero Banner Section */}
      <section className="flex-1 max-w-7xl mx-auto w-full px-6 flex flex-col justify-center py-16 relative">
        <div className="absolute top-1/4 left-1/3 w-[30rem] h-[30rem] bg-indigo-600/10 rounded-full blur-[8rem] pointer-events-none -z-1"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[25rem] h-[25rem] bg-emerald-500/5 rounded-full blur-[8rem] pointer-events-none -z-1"></div>

        <div className="max-w-3xl space-y-6 text-left relative z-1">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 px-4 py-2 rounded-full border border-blue-500/20">
            <Zap size={14} className="text-blue-400 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">All-in-One Service Hub</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight uppercase">
            Your Local Companion For <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Every Need</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-400 font-medium leading-relaxed max-w-2xl">
            Welcome to Rafik platform. Manage rides, orchestrate restaurant bookings, and hire certified home technicians with state-of-the-art quoting workflows.
          </p>

          <div className="pt-4 flex flex-wrap gap-4">
            <button
              onClick={onGoToLogin}
              className="px-8 py-5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-xl shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 cursor-pointer"
            >
              Access Portal
              <ArrowRight size={14} strokeWidth={3} />
            </button>
            <a
              href="#offerings"
              className="px-8 py-5 bg-slate-800/60 hover:bg-slate-850 border border-slate-700/60 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-black uppercase tracking-wider rounded-2xl transition-all cursor-pointer"
            >
              Explore Solutions
            </a>
          </div>
        </div>
      </section>

      {/* Services Showcase Cards */}
      <section id="offerings" className="max-w-7xl mx-auto w-full px-6 py-20 border-t border-slate-800/50">
        <div className="text-left max-w-md space-y-2 mb-12">
          <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block">Available Options</span>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Three Integrated Segments</h2>
          <p className="text-xs text-slate-400 font-bold font-inter leading-relaxed">
            Consolidated platform segments serving customers, transporters, and home service providers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {serviceCards.map((c, i) => {
            const Icon = c.icon;
            return (
              <div
                key={i}
                className="bg-slate-850/50 border border-slate-800/80 p-8 rounded-[2.5rem] flex flex-col justify-between space-y-8 hover:border-slate-750 transition-all hover:scale-[1.01] hover:shadow-lg text-left relative overflow-hidden group"
              >
                {/* Visual Accent */}
                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${c.color} opacity-0 group-hover:opacity-5 blur-2xl transition-opacity`}></div>

                <div className="space-y-4">
                  <div className={`w-14 h-14 ${c.bgLight} rounded-2xl flex items-center justify-center text-2xl border`}>
                    <Icon size={24} className={c.textCol} />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block">{c.subtitle}</span>
                    <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                      {c.title} <span className="text-sm font-normal">{c.emoji}</span>
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 font-bold font-inter leading-relaxed">
                    {c.desc}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800/60 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Status Active</span>
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Trust Badges */}
      <section className="bg-slate-950/40 py-12 border-t border-slate-800/30">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div className="flex items-center gap-4 text-left">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center border border-slate-800 text-blue-400">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h4 className="text-xs font-black text-white uppercase">Secure Platform</h4>
              <p className="text-[10px] text-slate-500 font-bold mt-0.5">Encrypted logins & ledger data</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-left">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center border border-slate-800 text-amber-400">
              <Zap size={20} />
            </div>
            <div>
              <h4 className="text-xs font-black text-white uppercase">Fast Operations</h4>
              <p className="text-[10px] text-slate-500 font-bold mt-0.5">Real-time status updates</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-left">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center border border-slate-800 text-indigo-400">
              <Users size={20} />
            </div>
            <div>
              <h4 className="text-xs font-black text-white uppercase">Qualified Pros</h4>
              <p className="text-[10px] text-slate-500 font-bold mt-0.5">Vetted home services experts</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-900 bg-slate-950 text-center text-[10px] text-slate-600 font-bold">
        &copy; {new Date().getFullYear()} Rafik App. All rights reserved. V1.0.0
      </footer>
      
    </div>
  );
}
