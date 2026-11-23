"use client";

import { useState, useEffect, FormEvent } from "react";
import Link from "next/link";
import { API_URL } from "@/lib/api";
import { WILAYAS, DEFAULT_WILAYA } from "@/lib/locations";
import {
  ArrowRight, MapPin, Wrench, Car, UtensilsCrossed, Truck, Star, Plus, Check,
} from "lucide-react";

interface LandingPageProps {
  onGoToLogin: () => void;
}

interface Category {
  id: string;
  name: string;
}

// Brand palette (bold, two-tone — deep teal + warm amber)
const DARK = "#0B3B36";
const ACCENT = "#FFC53D";

const FALLBACK_CATEGORIES = [
  "Plumber", "Electrician", "Painter", "Carpenter", "Cleaner", "AC Repair", "Locksmith", "Gardener",
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

const COMMUNES = WILAYAS[DEFAULT_WILAYA] ?? [];

const normalize = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

const HELP = [
  { q: "Une fuite d'eau un vendredi soir ?", a: "Un plombier vérifié, près de chez vous !" },
  { q: "Besoin d'aller à la gare d'El Eulma ?", a: "Un taxi au prix fixe, sans négocier !" },
  { q: "Un déménagement ou une marchandise à livrer ?", a: "Le bon camion, à la bonne date !" },
];

const FAQ = [
  {
    q: "Quels services propose Rafik ?",
    a: "Rafik réunit quatre services dans une seule application : des artisans à domicile (plombiers, électriciens, peintres…), des taxis, la livraison de repas depuis les restaurants de votre ville et le transport de marchandises par camion.",
  },
  {
    q: "Dans quelles villes Rafik est-il disponible ?",
    a: "Nous démarrons dans la wilaya de Sétif — Sétif ville, El Eulma, Aïn Arnat et les communes voisines. D'autres wilayas suivront très bientôt.",
  },
  {
    q: "Comment sont fixés les prix ?",
    a: "Pour le taxi et le camion, le prix est calculé automatiquement selon la distance et affiché avant de confirmer — pas de négociation. Pour les artisans, vous recevez un devis clair avant le début des travaux.",
  },
  {
    q: "Les professionnels sont-ils vérifiés ?",
    a: "Oui. Chaque artisan, chauffeur et transporteur est contrôlé par notre équipe (identité, permis, documents du véhicule) avant de pouvoir recevoir des commandes. Les avis clients restent visibles sur chaque profil.",
  },
  {
    q: "Comment puis-je payer ?",
    a: "Le paiement se fait en dinars algériens, en espèces à la fin de la course, de la livraison ou de l'intervention. Les codes promo sont appliqués directement sur le prix affiché.",
  },
  {
    q: "Comment devenir partenaire ou chauffeur ?",
    a: "Inscrivez-vous depuis l'application Rafik en choisissant votre profil (artisan, chauffeur, transporteur ou restaurant). Notre équipe vérifie vos documents puis active votre compte.",
  },
];

function Heading({ children, light = false, className = "" }: { children: React.ReactNode; light?: boolean; className?: string }) {
  return (
    <h2
      className={`text-3xl md:text-5xl font-black uppercase tracking-tighter leading-[0.95] ${className}`}
      style={{ color: light ? "#fff" : DARK }}
    >
      {children}
    </h2>
  );
}

export default function LandingPage({ onGoToLogin }: LandingPageProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [address, setAddress] = useState("");
  const [coverage, setCoverage] = useState<null | { ok: boolean; name: string }>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    fetch(`${API_URL}/api/categories`)
      .then(res => (res.ok ? res.json() : []))
      .then((data: Category[]) => Array.isArray(data) && data.length > 0 && setCategories(data))
      .catch(() => {});
  }, []);

  const categoryNames = categories.length > 0 ? categories.map(c => c.name) : FALLBACK_CATEGORIES;

  const checkCoverage = (e: FormEvent) => {
    e.preventDefault();
    const q = normalize(address);
    if (!q) return;
    const match = COMMUNES.find(c => normalize(c) === q) ?? COMMUNES.find(c => q.includes(normalize(c)) || normalize(c).includes(q));
    setCoverage(match ? { ok: true, name: match } : { ok: false, name: address.trim() });
  };

  return (
    <div className="min-h-screen bg-white text-[#111] overflow-x-hidden" style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
      <h1 className="sr-only">Rafik — artisans, taxi, repas et camions à Sétif, Algérie</h1>

      {/* ── HERO (nav sits inside the dark band) ── */}
      <section className="relative overflow-hidden" style={{ backgroundColor: DARK }}>
        <nav className="relative z-10 w-full px-6 md:px-12 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-lg"
              style={{ backgroundColor: ACCENT, color: DARK }}
            >
              R
            </div>
            <span className="text-2xl font-black uppercase tracking-tighter text-white">Rafik</span>
            <span className="text-sm font-bold text-white/40" dir="rtl">رفيق</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {[
              ["#services", "Services"],
              ["#zones", "Zones"],
              ["#rejoindre", "Nous rejoindre"],
              ["#faq", "FAQ"],
            ].map(([href, label]) => (
              <a key={href} href={href} className="text-sm font-semibold uppercase tracking-widest text-white/80 hover:text-white transition-colors">
                {label}
              </a>
            ))}
          </div>

          <button
            onClick={onGoToLogin}
            className="rounded-full bg-white px-5 py-2 text-sm font-bold shadow transition hover:shadow-md active:scale-[0.97] cursor-pointer"
            style={{ color: DARK }}
          >
            Connexion
          </button>
        </nav>

        <div className="relative max-w-6xl mx-auto px-6 md:px-12 pt-10 md:pt-16 pb-0 grid md:grid-cols-2 gap-10 items-end">
          {/* left: headline + address */}
          <div className="pb-14 md:pb-24 text-center md:text-left">
            <p className="text-white font-black text-5xl md:text-7xl uppercase leading-[0.88] tracking-tighter">
              Tout Sétif
              <br />
              <span style={{ color: ACCENT }}>dans une app</span>
            </p>
            <p className="mt-6 text-lg md:text-xl font-semibold text-white/60 max-w-md mx-auto md:mx-0">
              Artisans, taxi, repas et camions — un seul compte, des pros vérifiés, des prix clairs.
            </p>

            <form onSubmit={checkCoverage} className="mt-8 max-w-md mx-auto md:mx-0">
              <p className="mb-2 text-xs text-white/60">Entrez votre commune pour vérifier que Rafik est disponible chez vous.</p>
              <div className="flex items-center rounded-full bg-white shadow-lg">
                <MapPin size={20} className="ml-4 text-gray-400 shrink-0" />
                <input
                  type="text"
                  list="rafik-communes"
                  value={address}
                  onChange={e => { setAddress(e.target.value); setCoverage(null); }}
                  placeholder="Ex. El Eulma, Aïn Arnat…"
                  className="flex-1 min-w-0 bg-transparent px-3 py-3.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
                />
                <datalist id="rafik-communes">
                  {COMMUNES.map(c => <option key={c} value={c} />)}
                </datalist>
                <button
                  type="submit"
                  aria-label="Vérifier"
                  className="m-1.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white transition hover:opacity-90 cursor-pointer"
                  style={{ backgroundColor: DARK }}
                >
                  <ArrowRight size={18} />
                </button>
              </div>
              {coverage && (
                <p className={`mt-3 text-sm font-bold ${coverage.ok ? "" : "text-white/70"}`} style={coverage.ok ? { color: ACCENT } : undefined}>
                  {coverage.ok
                    ? `✓ Rafik est disponible à ${coverage.name} !`
                    : `Pas encore à ${coverage.name} — on arrive bientôt.`}
                </p>
              )}
            </form>
          </div>

          {/* right: phone mockup */}
          <div className="hidden md:flex justify-center">
            <div className="relative w-[290px] h-[520px] rounded-t-[44px] border-[10px] border-b-0 border-black bg-[#F5F5F2] overflow-hidden shadow-2xl">
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-6 rounded-full bg-black" />
              <div className="pt-12 px-5 space-y-4">
                <div>
                  <p className="text-[11px] font-semibold text-gray-400">Bonjour 👋</p>
                  <p className="text-xl font-black uppercase tracking-tight" style={{ color: DARK }}>On fait quoi ?</p>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-sm">
                  <MapPin size={14} className="text-gray-400" />
                  <span className="text-[11px] font-semibold text-gray-500">Cité 1014, Sétif</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: Wrench, label: "Artisans", bg: DARK, fg: "#fff" },
                    { icon: Car, label: "Taxi", bg: ACCENT, fg: DARK },
                    { icon: UtensilsCrossed, label: "Repas", bg: "#FF6B4A", fg: "#fff" },
                    { icon: Truck, label: "Camions", bg: "#2C6E63", fg: "#fff" },
                  ].map(({ icon: Icon, label, bg, fg }) => (
                    <div key={label} className="rounded-2xl p-3 h-24 flex flex-col justify-between" style={{ backgroundColor: bg, color: fg }}>
                      <Icon size={22} />
                      <span className="text-xs font-black uppercase">{label}</span>
                    </div>
                  ))}
                </div>
                <div className="rounded-2xl bg-white p-3 shadow-sm flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
                    <Star size={16} className="fill-amber-500 text-amber-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] font-black text-gray-800">Lyes · Électricien</p>
                    <p className="text-[10px] font-semibold text-gray-400">4,9 ★ · arrive dans 20 min</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW RAFIK HELPS ── */}
      <section className="bg-white pt-16 pb-8 px-6 md:px-12">
        <div className="max-w-5xl mx-auto">
          <Heading className="mb-10">Comment Rafik peut vous aider ?</Heading>
          <div className="grid md:grid-cols-3 gap-8">
            {HELP.map(({ q, a }) => (
              <div key={q} className="border-t-4 pt-5" style={{ borderColor: ACCENT }}>
                <p className="text-xl md:text-2xl font-bold text-black/75 leading-snug">{q}</p>
                <p className="mt-2 text-xl md:text-2xl font-black" style={{ color: DARK }}>{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVICES BENTO ── */}
      <section id="services" className="bg-white pb-16 pt-8 px-6 md:px-12 scroll-mt-4">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <Heading>Quatre services, une seule app</Heading>
            <p className="mt-3 text-lg text-black/50 font-medium">Prix affichés à l&apos;avance — pas de surprises.</p>
          </div>

          <div className="grid md:grid-cols-3 md:grid-rows-2 gap-4">
            {/* big card: artisans */}
            <div className="relative md:row-span-2 md:col-span-2 rounded-[22px] overflow-hidden p-7 md:p-9 min-h-[300px] flex flex-col justify-end" style={{ backgroundColor: DARK }}>
              <Wrench aria-hidden className="absolute -top-6 -right-6 text-white/5" size={260} />
              <div className="relative">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] mb-2" style={{ color: ACCENT }}>N°1 sur Rafik</p>
                <h3 className="text-3xl md:text-5xl font-black uppercase text-white leading-none tracking-tighter">Artisans à domicile</h3>
                <p className="mt-3 text-white/55 font-medium max-w-md">Des pros vérifiés et notés par de vrais clients, avec un devis clair avant chaque intervention.</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {categoryNames.slice(0, 8).map(name => (
                    <span key={name} className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white/85">
                      {CATEGORY_FR[name] || name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {[
              { icon: Car, title: "Taxi", desc: "Prix fixe calculé à la distance.", bg: ACCENT, fg: DARK, sub: "rgba(11,59,54,0.65)" },
              { icon: UtensilsCrossed, title: "Repas", desc: "Vos restos préférés, livrés.", bg: "#FF6B4A", fg: "#fff", sub: "rgba(255,255,255,0.75)" },
            ].map(({ icon: Icon, title, desc, bg, fg, sub }) => (
              <div key={title} className="group relative rounded-[18px] overflow-hidden p-6 min-h-[150px] flex flex-col justify-between" style={{ backgroundColor: bg, color: fg }}>
                <Icon size={34} className="transition-transform duration-500 group-hover:scale-110 origin-left" />
                <div>
                  <h3 className="text-2xl font-black uppercase leading-none tracking-tight">{title}</h3>
                  <p className="mt-1 text-sm font-semibold" style={{ color: sub }}>{desc}</p>
                </div>
              </div>
            ))}

            <div className="group md:col-span-3 relative rounded-[18px] overflow-hidden p-6 md:p-7 flex flex-col md:flex-row md:items-center justify-between gap-4" style={{ backgroundColor: "#2C6E63" }}>
              <div className="flex items-center gap-5 text-white">
                <Truck size={40} className="shrink-0 transition-transform duration-500 group-hover:translate-x-2" />
                <div>
                  <h3 className="text-2xl md:text-3xl font-black uppercase leading-none tracking-tight">Camions & marchandises</h3>
                  <p className="mt-1 text-sm font-semibold text-white/70">Déménagement, matériaux, livraisons pro — maintenant ou à la date de votre choix.</p>
                </div>
              </div>
              <span className="text-sm font-black uppercase tracking-wider shrink-0" style={{ color: ACCENT }}>Nouveau</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── ZONES ── */}
      <section id="zones" className="py-16 px-6 md:px-12 scroll-mt-4" style={{ backgroundColor: "#F4F1EA" }}>
        <div className="max-w-5xl mx-auto">
          <Heading className="text-left md:text-center mb-4">Zones desservies</Heading>
          <p className="text-lg text-left md:text-center font-medium text-black/60 mb-8 md:mb-12">
            On démarre dans la wilaya de Sétif. Vérifiez si Rafik est disponible dans votre commune.
          </p>
          <div className="flex flex-wrap justify-start md:justify-center gap-2.5">
            {COMMUNES.map(c => (
              <span
                key={c}
                className="rounded-full px-4 md:px-5 py-2.5 text-sm font-bold uppercase tracking-wide border-2 transition-colors hover:text-white cursor-default"
                style={{ borderColor: DARK, color: DARK }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = DARK; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = ""; e.currentTarget.style.color = DARK; }}
              >
                {c}
              </span>
            ))}
            <span className="rounded-full px-4 md:px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-black/40 border-2 border-dashed border-black/20">
              + Bientôt d&apos;autres wilayas
            </span>
          </div>
        </div>
      </section>

      {/* ── JOIN ── */}
      <section id="rejoindre" className="py-16 bg-white px-6 md:px-12 scroll-mt-4">
        <div className="max-w-5xl mx-auto">
          <Heading className="mb-8">Travailler avec Rafik</Heading>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { title: "Devenir\nArtisan", desc: "Recevez des demandes de clients près de chez vous et développez votre activité." },
              { title: "Devenir\nChauffeur", desc: "Taxi, livreur ou transporteur : roulez quand vous voulez et gagnez bien dans votre ville." },
              { title: "Devenir\nPartenaire", desc: "Vous avez un restaurant ? Rejoignez Rafik et touchez des milliers de clients à Sétif." },
            ].map(({ title, desc }) => (
              <button
                key={title}
                onClick={onGoToLogin}
                className="group relative text-left flex flex-col justify-end rounded-3xl overflow-hidden p-8 min-h-[280px] md:min-h-[340px] cursor-pointer"
                style={{ backgroundColor: DARK }}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ backgroundColor: "rgba(255,197,61,0.08)" }} />
                <div className="relative">
                  <h3 className="text-4xl font-black uppercase leading-tight whitespace-pre-line tracking-tighter text-white">{title}</h3>
                  <p className="mt-4 text-base text-white/55 font-medium leading-relaxed">{desc}</p>
                  <span className="mt-8 inline-flex items-center gap-2 text-sm font-black uppercase tracking-wider" style={{ color: ACCENT }}>
                    En savoir plus <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-16 px-6 md:px-12 scroll-mt-4">
        <div className="max-w-4xl mx-auto">
          <Heading className="mb-6">Foire aux questions</Heading>
          <div className="divide-y divide-black/10">
            {FAQ.map(({ q, a }, i) => {
              const open = openFaq === i;
              return (
                <div key={q}>
                  <button
                    onClick={() => setOpenFaq(open ? null : i)}
                    aria-expanded={open}
                    className="w-full flex items-center justify-between py-6 text-left group cursor-pointer"
                  >
                    <span className="text-lg md:text-xl font-black tracking-tight leading-snug" style={{ color: DARK }}>{q}</span>
                    <span
                      className={`ml-4 shrink-0 w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${open ? "rotate-45" : ""}`}
                      style={{ borderColor: DARK, color: DARK, backgroundColor: open ? ACCENT : "transparent" }}
                    >
                      <Plus size={20} strokeWidth={3} />
                    </span>
                  </button>
                  <div className={`grid transition-all duration-500 ease-out ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                    <div className="overflow-hidden">
                      <p className="pb-6 pr-16 text-lg md:text-xl leading-relaxed text-black/65">{a}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="px-6 md:px-12" style={{ backgroundColor: DARK }}>
        <div className="py-16 max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-7xl font-black uppercase tracking-tighter leading-none text-white">
            Rafik, <span style={{ color: ACCENT }}>ton compagnon</span>
          </h2>
          <p className="mt-3 text-2xl font-bold text-white/40" dir="rtl">رفيق — رفيقك في كل خدمة</p>
          <p className="text-lg md:text-2xl font-semibold my-10 text-white/55">
            Ce dont vous avez besoin, quand vous en avez besoin.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={onGoToLogin}
              className="rounded-full px-8 py-4 text-sm font-black uppercase tracking-wider transition hover:opacity-90 active:scale-[0.97] inline-flex items-center gap-2 cursor-pointer"
              style={{ backgroundColor: ACCENT, color: DARK }}
            >
              Espace pro & admin <ArrowRight size={16} />
            </button>
            <span className="rounded-full px-8 py-4 text-sm font-black uppercase tracking-wider border-2 border-white/20 text-white/70 inline-flex items-center gap-2">
              <Check size={16} /> App mobile bientôt
            </span>
          </div>
        </div>
        <div className="max-w-6xl mx-auto py-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-xl font-black uppercase tracking-tighter text-white/50">Rafik</span>
          <div className="flex flex-wrap justify-center gap-6 text-sm font-semibold text-white">
            <a href="#faq" className="hover:text-white/70">FAQ</a>
            <Link href="/privacy-policy" className="hover:text-white/70">Confidentialité</Link>
            <Link href="/terms" className="hover:text-white/70">CGU</Link>
            <Link href="/support" className="hover:text-white/70">Support</Link>
          </div>
          <p className="text-sm text-white/30 font-medium">© {new Date().getFullYear()} Rafik · Sétif, Algérie</p>
        </div>
      </footer>
    </div>
  );
}
