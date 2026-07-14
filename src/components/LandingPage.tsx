"use client";

import { useState, useEffect } from "react";
import { API_URL } from "@/lib/api";
import {
  ArrowRight, ShieldCheck, MapPin, MessageSquare, Star,
  Wrench, ClipboardList, UserCheck, CheckCircle2, Banknote, Clock, Phone
} from "lucide-react";

interface LandingPageProps {
  onGoToLogin: () => void;
}

interface Category {
  id: string;
  name: string;
  image: string;
}

// Static fallback so the page looks complete even when the API is offline
const FALLBACK_CATEGORIES = [
  "Plumber", "Electrician", "Painter", "Carpenter", "Cleaner",
  "AC Repair", "Locksmith", "Gardener", "Mover",
];

const CATEGORY_FR: Record<string, string> = {
  Plumber: "Plomberie",
  Electrician: "Électricité",
  Painter: "Peinture",
  Carpenter: "Menuiserie",
  Cleaner: "Nettoyage",
  "AC Repair": "Climatisation",
  Locksmith: "Serrurerie",
  Gardener: "Jardinage",
  Mover: "Déménagement",
};

const CATEGORY_EMOJI: Record<string, string> = {
  Plumber: "🔧",
  Electrician: "⚡",
  Painter: "🎨",
  Carpenter: "🪚",
  Cleaner: "🧹",
  "AC Repair": "❄️",
  Locksmith: "🔑",
  Gardener: "🌱",
  Mover: "📦",
};

export default function LandingPage({ onGoToLogin }: LandingPageProps) {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/api/categories`)
      .then(res => (res.ok ? res.json() : []))
      .then((data: Category[]) => Array.isArray(data) && data.length > 0 && setCategories(data))
      .catch(() => {});
  }, []);

  const categoryNames = categories.length > 0 ? categories.map(c => c.name) : FALLBACK_CATEGORIES;

  const steps = [
    {
      icon: ClipboardList,
      title: "Décrivez votre besoin",
      desc: "Une fuite, une panne, un mur à repeindre… expliquez le problème et ajoutez des photos.",
    },
    {
      icon: MapPin,
      title: "Indiquez votre quartier",
      desc: "Choisissez votre commune à Sétif — nous vous montrons les professionnels proches de chez vous.",
    },
    {
      icon: UserCheck,
      title: "Choisissez votre pro",
      desc: "Comparez les notes, les avis et les tarifs, puis sélectionnez le professionnel qui vous convient.",
    },
    {
      icon: CheckCircle2,
      title: "Recevez votre devis",
      desc: "Un prix clair avant le travail. Payez en dinars, cash accepté — sans surprise.",
    },
  ];

  const trust = [
    { icon: ShieldCheck, title: "Professionnels vérifiés", desc: "Identité et métier contrôlés par notre équipe" },
    { icon: Banknote, title: "Paiement en DZD", desc: "Devis clair, espèces acceptées" },
    { icon: MapPin, title: "Couverture Sétif", desc: "Bientôt dans toute l'Algérie" },
    { icon: Clock, title: "Support 7j/7", desc: "Une équipe locale à votre écoute" },
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-800 overflow-x-hidden" style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>

      {/* ── NAVBAR ── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-[#FAF9F6]/85 backdrop-blur-md border-b border-teal-900/5">
        <div className="max-w-6xl mx-auto px-6 h-18 flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-700 text-white flex items-center justify-center font-black text-lg shadow-lg shadow-teal-600/20">
              R
            </div>
            <div className="leading-tight">
              <span className="block text-lg font-black tracking-tight text-teal-900">Rafik</span>
              <span className="block text-[10px] font-semibold text-teal-700/60" dir="rtl">رفيق</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-500">
            <a href="#services" className="hover:text-teal-700 transition-colors">Services</a>
            <a href="#comment" className="hover:text-teal-700 transition-colors">Comment ça marche</a>
            <a href="#confiance" className="hover:text-teal-700 transition-colors">Confiance</a>
          </div>

          <button
            onClick={onGoToLogin}
            className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-full text-sm font-bold transition-all shadow-md shadow-teal-700/20 active:scale-[0.97] cursor-pointer"
          >
            Se connecter
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <header className="relative pt-36 pb-20 px-6">
        {/* soft warm background shapes */}
        <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-[480px] h-[480px] rounded-full bg-gradient-to-br from-teal-100/60 to-emerald-100/30" />
          <div className="absolute top-64 -left-40 w-[380px] h-[380px] rounded-full bg-gradient-to-tr from-amber-100/50 to-orange-50/30" />
        </div>

        <div className="relative max-w-6xl mx-auto grid lg:grid-cols-2 gap-14 items-center">
          <div className="space-y-7 text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-teal-100 rounded-full shadow-sm">
              <MapPin size={14} className="text-teal-600" />
              <span className="text-xs font-bold text-teal-800">Sétif, Algérie — on démarre chez vous</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-[1.05]">
                Un bon artisan,
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-600">près de chez vous.</span>
              </h1>
              <p className="text-xl font-bold text-teal-800/70" dir="rtl">رفيق — رفيقك في كل خدمة</p>
            </div>

            <p className="text-base text-slate-500 font-medium leading-relaxed max-w-lg">
              Électriciens, plombiers, peintres et plus encore — des professionnels vérifiés,
              notés par de vrais clients, avec un devis clair avant chaque intervention.
              D&apos;abord à Sétif, bientôt partout en Algérie.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={onGoToLogin}
                className="group px-7 py-4 bg-teal-700 hover:bg-teal-800 text-white rounded-2xl text-sm font-black transition-all shadow-xl shadow-teal-700/25 active:scale-[0.97] flex items-center gap-2 cursor-pointer"
              >
                Accéder au tableau de bord
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <a
                href="#services"
                className="px-7 py-4 bg-white border border-slate-200 hover:border-teal-200 hover:bg-teal-50/50 text-slate-700 rounded-2xl text-sm font-bold transition-all"
              >
                Découvrir les services
              </a>
            </div>
          </div>

          {/* Visual: real category tiles */}
          <div className="hidden lg:block relative">
            <div className="grid grid-cols-3 gap-4">
              {categoryNames.slice(0, 9).map((name, i) => {
                const cat = categories.find(c => c.name === name);
                const img = cat?.image;
                return (
                  <div
                    key={name}
                    className={`bg-white border border-slate-100 rounded-3xl p-5 flex flex-col items-center justify-center gap-2.5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all ${
                      i % 3 === 1 ? "translate-y-6" : ""
                    }`}
                  >
                    {img ? (
                      <img
                        src={img.startsWith("/uploads") ? `${API_URL}${img}` : img}
                        alt={name}
                        className="w-12 h-12 object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    ) : (
                      <span className="text-3xl">{CATEGORY_EMOJI[name] || "🛠️"}</span>
                    )}
                    <span className="text-[11px] font-black text-slate-700 text-center leading-tight">
                      {CATEGORY_FR[name] || name}
                    </span>
                  </div>
                );
              })}
            </div>
            {/* floating review card */}
            <div className="absolute -bottom-6 -left-8 bg-white rounded-3xl shadow-xl border border-slate-100 p-4 flex items-center gap-3 animate-float">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
                <Star size={18} className="fill-amber-500 text-amber-500" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-800">Avis vérifiés</p>
                <p className="text-[10px] font-semibold text-slate-400">Notés par de vrais clients</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── SERVICES ── */}
      <section id="services" className="py-20 px-6 bg-white border-y border-slate-100">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-black uppercase tracking-[0.25em] text-teal-600">Nos services</span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
              Tous les métiers de la maison
            </h2>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              Choisissez un service, on vous met en relation avec un professionnel proche de votre quartier.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {categoryNames.map((name) => {
              const cat = categories.find(c => c.name === name);
              const img = cat?.image;
              return (
                <div
                  key={name}
                  className="group bg-[#FAF9F6] hover:bg-teal-50/60 border border-slate-100 hover:border-teal-100 rounded-3xl p-6 flex flex-col items-center gap-3 transition-all hover:-translate-y-1 cursor-default"
                >
                  {img ? (
                    <img
                      src={img.startsWith("/uploads") ? `${API_URL}${img}` : img}
                      alt={name}
                      className="w-14 h-14 object-contain group-hover:scale-110 transition-transform"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  ) : (
                    <span className="text-4xl group-hover:scale-110 transition-transform">{CATEGORY_EMOJI[name] || "🛠️"}</span>
                  )}
                  <div className="text-center">
                    <p className="text-sm font-black text-slate-800">{CATEGORY_FR[name] || name}</p>
                    <p className="text-[10px] font-semibold text-slate-400">{name}</p>
                  </div>
                </div>
              );
            })}
            {/* "more coming" tile */}
            <div className="bg-gradient-to-br from-teal-700 to-emerald-800 rounded-3xl p-6 flex flex-col items-center justify-center gap-2 text-white">
              <Wrench size={26} />
              <p className="text-sm font-black text-center leading-tight">Et bientôt<br />plus encore</p>
              <p className="text-[10px] font-semibold text-teal-100/80">Taxi · Repas · Courses</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="comment" className="py-20 px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-black uppercase tracking-[0.25em] text-teal-600">Comment ça marche</span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
              Simple comme bonjour
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="relative bg-white border border-slate-100 rounded-[2rem] p-7 space-y-4 shadow-sm hover:shadow-md transition-shadow text-left">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center">
                      <Icon size={22} />
                    </div>
                    <span className="text-4xl font-black text-slate-100">{i + 1}</span>
                  </div>
                  <h3 className="text-base font-black text-slate-800">{step.title}</h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">{step.desc}</p>
                </div>
              );
            })}
          </div>

          {/* chat + follow-up note */}
          <div className="bg-white border border-slate-100 rounded-[2rem] p-8 flex flex-col sm:flex-row items-center gap-6 shadow-sm">
            <div className="w-14 h-14 shrink-0 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <MessageSquare size={24} />
            </div>
            <div className="text-center sm:text-left">
              <h3 className="text-base font-black text-slate-800 mb-1">Restez en contact, du devis à la fin des travaux</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                Discutez directement avec votre professionnel dans l&apos;application, ou laissez notre équipe
                s&apos;occuper de tout — chaque commande est suivie étape par étape jusqu&apos;à ce que le travail soit terminé.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST ── */}
      <section id="confiance" className="py-20 px-6 bg-teal-900">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-black uppercase tracking-[0.25em] text-teal-300">Pourquoi Rafik</span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              La confiance avant tout
            </h2>
            <p className="text-lg font-bold text-teal-200/80" dir="rtl">الثقة قبل كل شيء</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {trust.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="bg-white/5 border border-white/10 rounded-[2rem] p-7 space-y-3 text-left backdrop-blur-sm">
                  <div className="w-11 h-11 rounded-2xl bg-teal-400/15 text-teal-300 flex items-center justify-center">
                    <Icon size={20} />
                  </div>
                  <h3 className="text-sm font-black text-white">{item.title}</h3>
                  <p className="text-xs text-teal-100/60 font-medium leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-teal-700 via-teal-800 to-emerald-900 rounded-[3rem] p-12 sm:p-16 text-center space-y-6 shadow-2xl shadow-teal-900/20 relative overflow-hidden">
          <div aria-hidden className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-amber-400/10" />
          <div aria-hidden className="absolute -bottom-24 -left-16 w-72 h-72 rounded-full bg-teal-400/10" />
          <h2 className="relative text-3xl sm:text-4xl font-black tracking-tight text-white">
            Prêt à commencer ?
          </h2>
          <p className="relative text-sm text-teal-100/80 font-medium max-w-md mx-auto leading-relaxed">
            Espace administrateur et professionnels — gérez vos commandes, vos devis et vos revenus au même endroit.
          </p>
          <button
            onClick={onGoToLogin}
            className="relative px-9 py-4 bg-white text-teal-800 rounded-2xl text-sm font-black hover:bg-teal-50 transition-all shadow-xl active:scale-[0.97] inline-flex items-center gap-2 cursor-pointer"
          >
            Se connecter maintenant
            <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-slate-100 bg-white py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-600 to-emerald-700 text-white flex items-center justify-center font-black text-sm">
              R
            </div>
            <div className="leading-tight text-left">
              <span className="block text-sm font-black text-teal-900">Rafik · رفيق</span>
              <span className="block text-[10px] font-semibold text-slate-400">Sétif, Algérie</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <Phone size={13} />
            <span>Support : contact@rafik.app</span>
          </div>
          <p className="text-[11px] font-semibold text-slate-400">
            © {new Date().getFullYear()} Rafik — v1.0.0
          </p>
        </div>
      </footer>
    </div>
  );
}
