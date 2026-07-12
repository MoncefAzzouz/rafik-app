"use client";

import { Wrench, Car, Pizza, ArrowRight, ShieldCheck, Zap, Users, Star, Clock, MapPin, CheckCircle2 } from "lucide-react";

interface LandingPageProps {
  onGoToLogin: () => void;
}

export default function LandingPage({ onGoToLogin }: LandingPageProps) {
  const serviceCards = [
    {
      title: "Ride Transport",
      subtitle: "Taxi & Ridesharing",
      desc: "Fast, reliable rides around the clock. Book city taxi trips, express transit and intercity journeys with vetted drivers.",
      icon: Car,
      gradient: "from-amber-500 to-orange-500",
      lightBg: "bg-amber-50",
      lightBorder: "border-amber-100",
      lightText: "text-amber-600",
      stat: "2,400+",
      statLabel: "Rides / Month"
    },
    {
      title: "Food & Meals",
      subtitle: "Superfast Delivery",
      desc: "Delivering your favorite dishes from local restaurants and premium dining spots right to your doorstep in minutes.",
      icon: Pizza,
      gradient: "from-rose-500 to-pink-500",
      lightBg: "bg-rose-50",
      lightBorder: "border-rose-100",
      lightText: "text-rose-600",
      stat: "180+",
      statLabel: "Restaurants"
    },
    {
      title: "Home & Pro Services",
      subtitle: "On-Demand Specialists",
      desc: "Instant booking for certified plumbers, painters, AC repairers, cleaners, and carpenters with transparent quoting.",
      icon: Wrench,
      gradient: "from-indigo-500 to-blue-500",
      lightBg: "bg-indigo-50",
      lightBorder: "border-indigo-100",
      lightText: "text-indigo-600",
      stat: "350+",
      statLabel: "Pro Workers"
    }
  ];

  const trustItems = [
    { icon: ShieldCheck, title: "Secure & Encrypted", desc: "All data protected with industry-standard encryption", color: "text-indigo-500", bg: "bg-indigo-50 border-indigo-100" },
    { icon: Clock, title: "24/7 Availability", desc: "Services available around the clock, every day", color: "text-emerald-500", bg: "bg-emerald-50 border-emerald-100" },
    { icon: Star, title: "Top-Rated Pros", desc: "Every professional is vetted and reviewed by clients", color: "text-amber-500", bg: "bg-amber-50 border-amber-100" },
    { icon: MapPin, title: "Local Coverage", desc: "Operating across major cities in Algeria", color: "text-rose-500", bg: "bg-rose-50 border-rose-100" }
  ];

  return (
    <div className="min-h-screen bg-white text-slate-700 flex flex-col selection:bg-indigo-500 selection:text-white overflow-x-hidden">

      {/* ══════════════════ NAVBAR ══════════════════ */}
      <nav className="fixed top-0 w-full z-50 bg-white/85 backdrop-blur-xl border-b border-slate-100/80 shadow-sm shadow-slate-100/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="bg-gradient-to-tr from-indigo-600 to-blue-500 p-2.5 rounded-2xl group-hover:rotate-6 transition-transform shadow-lg shadow-indigo-500/20">
              <span className="text-white font-black text-lg italic">R</span>
            </div>
            <span className="text-xl font-black tracking-tighter uppercase text-indigo-600">RAFIK</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {["Services", "How it Works", "About"].map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(/ /g, '-')}`} className="text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors">
                {item}
              </a>
            ))}
          </div>

          <button
            onClick={onGoToLogin}
            className="px-6 py-3 bg-indigo-600 text-white text-[10px] font-extrabold uppercase tracking-[0.2em] rounded-full shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            Sign In
          </button>
        </div>
      </nav>

      {/* ══════════════════ HERO ══════════════════ */}
      <section className="relative pt-40 pb-28 overflow-hidden">
        <div className="absolute inset-0 hero-gradient pointer-events-none" />
        {/* Decorative blobs */}
        <div className="absolute top-20 right-[10%] w-72 h-72 bg-indigo-200/20 rounded-full blur-[6rem] pointer-events-none" />
        <div className="absolute bottom-10 left-[5%] w-96 h-96 bg-blue-200/15 rounded-full blur-[8rem] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left: Text Content */}
            <div className="animate-fadeIn">
              <div className="inline-flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100 mb-8">
                <Zap size={13} className="text-indigo-500 fill-indigo-500" />
                <span className="text-[9px] font-extrabold uppercase tracking-[0.25em] text-indigo-600">Premium Service Platform</span>
              </div>

              <h1 className="text-5xl lg:text-7xl font-black leading-[0.95] tracking-tighter text-slate-900 mb-8 uppercase">
                Your Companion{" "}
                <span className="text-indigo-600 block sm:inline">For Every Job.</span>
              </h1>

              <p className="text-sm sm:text-base text-slate-500 font-medium leading-relaxed max-w-lg mb-10">
                From fast city rides to food deliveries and certified home services — Rafik connects you with top vetted professionals in seconds.
              </p>

              <div className="flex flex-wrap gap-4">
                <button
                  onClick={onGoToLogin}
                  className="px-8 py-4 bg-indigo-600 text-white text-[10px] font-extrabold uppercase tracking-[0.2em] rounded-full shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 cursor-pointer"
                >
                  Access Dashboard
                  <ArrowRight size={14} strokeWidth={3} />
                </button>
                <a
                  href="#services"
                  className="px-8 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-extrabold uppercase tracking-[0.2em] rounded-full transition-all cursor-pointer flex items-center justify-center border border-slate-200/60"
                >
                  Explore Services
                </a>
              </div>

              {/* Mini stats */}
              <div className="flex gap-8 mt-12 pt-8 border-t border-slate-100">
                {[
                  { value: "2.8K+", label: "Active Users" },
                  { value: "350+", label: "Pro Workers" },
                  { value: "4.9", label: "Avg. Rating" }
                ].map((s) => (
                  <div key={s.label}>
                    <span className="text-2xl font-black text-slate-900 tracking-tight">{s.value}</span>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Floating Cards */}
            <div className="hidden lg:flex relative justify-center items-center h-[480px]">
              {/* Main worker card */}
              <div className="absolute z-20 animate-float-slow">
                <div className="bg-white border border-slate-100 p-7 rounded-[2rem] shadow-2xl shadow-slate-200/60 w-72 space-y-5 animate-pulse-glow">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-tr from-indigo-500 to-blue-400 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-lg shadow-indigo-500/20">LK</div>
                    <div>
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Lyes K.</h3>
                      <span className="text-[10px] bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded-lg font-bold uppercase">Electrician</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 font-medium">Rating</span>
                      <span className="font-bold text-slate-700 flex items-center gap-1"><Star size={11} className="text-amber-400 fill-amber-400" /> 4.9</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 font-medium">Jobs Done</span>
                      <span className="font-bold text-slate-700">164</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                    <span className="text-[10px] text-slate-500 font-medium">Available now — Algiers</span>
                  </div>
                </div>
              </div>

              {/* Floating accent cards */}
              <div className="absolute top-4 right-4 z-10 animate-float-delay">
                <div className="bg-white border border-slate-100 px-5 py-3.5 rounded-2xl shadow-xl shadow-slate-200/40 flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100">
                    <CheckCircle2 size={14} className="text-emerald-500" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-slate-800 uppercase block">Booking Confirmed</span>
                    <span className="text-[9px] text-slate-400 font-medium">Just now</span>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-8 left-0 z-10 animate-float">
                <div className="bg-white border border-slate-100 px-5 py-3.5 rounded-2xl shadow-xl shadow-slate-200/40 flex items-center gap-3">
                  <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center border border-amber-100">
                    <Star size={14} className="text-amber-500 fill-amber-500" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-slate-800 uppercase block">5-Star Review</span>
                    <span className="text-[9px] text-slate-400 font-medium">"Excellent work!"</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════ SERVICES CARDS ══════════════════ */}
      <section id="services" className="max-w-7xl mx-auto w-full px-6 py-24">
        <div className="text-center max-w-lg mx-auto space-y-3 mb-16">
          <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-[0.3em] block">What We Offer</span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 uppercase tracking-tight">Three Integrated Segments</h2>
          <p className="text-sm text-slate-400 font-medium leading-relaxed">
            One platform serving customers, transporters, and home service providers seamlessly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {serviceCards.map((c, i) => {
            const Icon = c.icon;
            return (
              <div
                key={i}
                className="bg-white border border-slate-100 rounded-[2rem] p-8 space-y-6 hover:shadow-2xl hover:shadow-slate-200/60 hover:-translate-y-1 transition-all duration-500 group relative overflow-hidden"
              >
                {/* Gradient overlay on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${c.gradient} opacity-0 group-hover:opacity-[0.02] transition-opacity duration-500 rounded-[2rem]`} />

                <div className="relative z-10 space-y-6">
                  <div className={`w-14 h-14 ${c.lightBg} ${c.lightBorder} rounded-2xl flex items-center justify-center border group-hover:scale-110 transition-transform duration-300`}>
                    <Icon size={24} className={c.lightText} />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-slate-400 block">{c.subtitle}</span>
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{c.title}</h3>
                  </div>

                  <p className="text-xs text-slate-500 font-medium leading-relaxed">{c.desc}</p>

                  <div className="pt-5 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-lg font-black text-slate-800">{c.stat}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mt-0.5">{c.statLabel}</span>
                    </div>
                    <div className={`w-8 h-8 ${c.lightBg} rounded-full flex items-center justify-center border ${c.lightBorder} group-hover:scale-110 transition-transform`}>
                      <ArrowRight size={14} className={c.lightText} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ══════════════════ HOW IT WORKS ══════════════════ */}
      <section id="how-it-works" className="bg-slate-50/70 py-24 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-lg mx-auto space-y-3 mb-16">
            <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-[0.3em] block">Process</span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 uppercase tracking-tight">How It Works</h2>
            <p className="text-sm text-slate-400 font-medium leading-relaxed">
              From booking to completion in four simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { step: "01", title: "Choose", desc: "Select your service type and describe what you need.", color: "text-indigo-600", bg: "bg-indigo-50 border-indigo-100" },
              { step: "02", title: "Match", desc: "We instantly match you with the best available professional.", color: "text-blue-600", bg: "bg-blue-50 border-blue-100" },
              { step: "03", title: "Confirm", desc: "Review the quote, confirm timing, and get started.", color: "text-violet-600", bg: "bg-violet-50 border-violet-100" },
              { step: "04", title: "Done", desc: "Rate your experience and enjoy peace of mind.", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100" }
            ].map((s) => (
              <div key={s.step} className="text-center space-y-4 group">
                <div className={`w-14 h-14 mx-auto ${s.bg} rounded-2xl flex items-center justify-center border font-black text-sm ${s.color} group-hover:scale-110 transition-transform duration-300`}>
                  {s.step}
                </div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">{s.title}</h3>
                <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-[200px] mx-auto">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ TRUST BADGES ══════════════════ */}
      <section id="about" className="py-20">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {trustItems.map((t) => {
            const Icon = t.icon;
            return (
              <div key={t.title} className="flex items-start gap-4 bg-white border border-slate-100 p-5 rounded-2xl hover:shadow-lg hover:shadow-slate-100/60 transition-all">
                <div className={`w-10 h-10 ${t.bg} rounded-xl flex items-center justify-center border shrink-0`}>
                  <Icon size={18} className={t.color} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">{t.title}</h4>
                  <p className="text-[10px] text-slate-400 font-medium mt-1 leading-relaxed">{t.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ══════════════════ CTA BAND ══════════════════ */}
      <section className="bg-gradient-to-r from-indigo-600 to-blue-500 py-16">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-8">
          <div className="text-center sm:text-left">
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Ready to Get Started?</h2>
            <p className="text-sm text-indigo-100 font-medium mt-2">Sign in to your dashboard and manage everything in one place.</p>
          </div>
          <button
            onClick={onGoToLogin}
            className="px-8 py-4 bg-white text-indigo-600 text-[10px] font-extrabold uppercase tracking-[0.2em] rounded-full shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-3 shrink-0"
          >
            Sign In Now
            <ArrowRight size={14} strokeWidth={3} />
          </button>
        </div>
      </section>

      {/* ══════════════════ FOOTER ══════════════════ */}
      <footer className="py-8 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-xs italic">R</span>
            </div>
            <span className="text-sm font-black text-slate-800 uppercase tracking-tight">Rafik</span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium">
            &copy; {new Date().getFullYear()} Rafik App. All rights reserved. v1.0.0
          </p>
        </div>
      </footer>
    </div>
  );
}
