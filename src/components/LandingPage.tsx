"use client";

import { Wrench, Car, Pizza, ArrowRight, ShieldCheck, Zap, Users, CheckCircle } from "lucide-react";

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
      emoji: "🚕",
      bgLight: "bg-amber-50 border-amber-100",
      textCol: "text-amber-600",
      shadow: "hover:shadow-amber-500/5 hover:border-amber-200"
    },
    {
      title: "Food & Meals",
      subtitle: "Superfast Delivery",
      desc: "Delivering your favorite dishes from local restaurants and premium dining spots right to your doorstep.",
      icon: Pizza,
      emoji: "🍕",
      bgLight: "bg-rose-50 border-rose-100",
      textCol: "text-rose-600",
      shadow: "hover:shadow-rose-500/5 hover:border-rose-200"
    },
    {
      title: "Home & Pro Services",
      subtitle: "On-Demand Specialists",
      desc: "Instant booking for certified plumbers, painters, AC repairers, cleaners, and carpenters with custom quoting.",
      icon: Wrench,
      emoji: "🔧",
      bgLight: "bg-blue-50 border-blue-100",
      textCol: "text-blue-600",
      shadow: "hover:shadow-blue-500/5 hover:border-blue-200"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-700 flex flex-col font-inter selection:bg-blue-500 selection:text-white overflow-x-hidden">
      
      {/* Header Navigation */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100/80">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center font-black text-xl italic tracking-tighter text-white shadow-md shadow-blue-500/10">
              R
            </div>
            <div>
              <span className="text-sm font-black tracking-widest uppercase italic text-slate-800 block leading-tight">RAFIK</span>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mt-0.5">Platform</span>
            </div>
          </div>
          <button
            onClick={onGoToLogin}
            className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-md shadow-slate-900/10"
          >
            Sign In Portal
          </button>
        </div>
      </header>

      {/* Hero Banner Section */}
      <section className="bg-white py-20 relative overflow-hidden">
        {/* Soft Background Gradients */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[60rem] h-[30rem] bg-gradient-to-tr from-blue-200/20 to-indigo-200/20 rounded-full blur-[8rem] pointer-events-none -z-1"></div>

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6 text-left relative z-10">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-full border border-blue-100">
              <Zap size={14} className="text-blue-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest">Premium Service Platform</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 leading-tight uppercase">
              Your Companion For <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Every Job</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-500 font-bold font-inter leading-relaxed max-w-xl">
              From fast city rides to food deliveries and certified home services. Rafik matches you with top vetted professionals instantly.
            </p>

            <div className="pt-4 flex flex-wrap gap-4">
              <button
                onClick={onGoToLogin}
                className="px-8 py-4.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 cursor-pointer"
              >
                Access Dashboard
                <ArrowRight size={14} strokeWidth={3} />
              </button>
              <a
                href="#offerings"
                className="px-8 py-4.5 bg-slate-100 hover:bg-slate-200 border border-slate-200/60 text-slate-700 text-xs font-black uppercase tracking-wider rounded-2xl transition-all cursor-pointer flex items-center justify-center"
              >
                Learn More
              </a>
            </div>
          </div>

          <div className="lg:col-span-5 relative flex justify-center">
            {/* Visual representation card */}
            <div className="bg-gradient-to-tr from-slate-50 to-white border border-slate-100 p-8 rounded-[3rem] shadow-xl w-full max-w-sm space-y-6 relative hover:scale-[1.02] transition-transform">
              <div className="absolute -top-3 -right-3 bg-emerald-500 text-white w-8 h-8 rounded-xl flex items-center justify-center font-bold shadow-md shadow-emerald-500/20">
                ✓
              </div>
              <div className="space-y-2">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Featured Worker</span>
                <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">Lyes K.</h3>
                <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-100 px-2.5 py-1 rounded-lg font-black uppercase">Electrician</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium font-inter">Average Score</span>
                  <span className="font-bold text-slate-700">⭐ 4.9 / 5.0</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium font-inter">Total completed</span>
                  <span className="font-bold text-slate-700">164 Jobs</span>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping mt-1.5"></div>
                <span className="text-[10px] text-slate-500 font-bold font-inter">Available right now in Algiers</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Showcase Cards */}
      <section id="offerings" className="max-w-7xl mx-auto w-full px-6 py-20">
        <div className="text-left max-w-md space-y-2 mb-12">
          <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block">Available Options</span>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Three Integrated Segments</h2>
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
                className={`bg-white border border-slate-100 p-8 rounded-[2.5rem] flex flex-col justify-between space-y-8 transition-all hover:scale-[1.01] hover:shadow-xl text-left relative overflow-hidden group ${c.shadow}`}
              >
                <div className="space-y-4">
                  <div className={`w-14 h-14 ${c.bgLight} rounded-2xl flex items-center justify-center text-2xl border`}>
                    <Icon size={24} className={c.textCol} />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">{c.subtitle}</span>
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                      {c.title} <span className="text-sm font-normal">{c.emoji}</span>
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 font-bold font-inter leading-relaxed">
                    {c.desc}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Status Active</span>
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Trust Badges */}
      <section className="bg-white py-12 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div className="flex items-center gap-4 text-left">
            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 text-blue-600">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-800 uppercase">Secure Platform</h4>
              <p className="text-[10px] text-slate-400 font-bold mt-0.5">Encrypted logins & backend storage</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-left">
            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 text-amber-600">
              <Zap size={20} />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-800 uppercase">Fast Operations</h4>
              <p className="text-[10px] text-slate-400 font-bold mt-0.5">Real-time status changes</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-left">
            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 text-indigo-600">
              <Users size={20} />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-800 uppercase">Qualified Pros</h4>
              <p className="text-[10px] text-slate-400 font-bold mt-0.5">Vetted home services experts</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-100 bg-slate-50 text-center text-[10px] text-slate-400 font-bold">
        &copy; {new Date().getFullYear()} Rafik App. All rights reserved. V1.0.0
      </footer>
      
    </div>
  );
}
