"use client";

import { API_URL } from "@/lib/api";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import ModalPortal from "@/components/ModalPortal";
import {
  Plus, X, Check, Trash2, Edit2, Eye, EyeOff, Lock, Clock, ArrowUp, ArrowDown,
  Images, LayoutGrid, Ticket, BellRing, FileText, RefreshCw, Send, Mail, Smartphone,
  ImagePlus, ExternalLink, Save, Loader2,
} from "lucide-react";

// ─── Reusable image picker (uploads to backend → R2, returns URL) ───
function ImageUploadField({ label, value, onChange, aspect = "square" }: {
  label: string; value: string; onChange: (url: string) => void; aspect?: "square" | "wide";
}) {
  const { token } = useAuth();
  const [uploading, setUploading] = useState(false);
  const preview = value ? (value.startsWith("/uploads") ? `${API_URL}${value}` : value) : "";
  const box = aspect === "wide" ? "w-40 h-24" : "w-20 h-20";

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${API_URL}/api/upload?type=categories`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form,
      });
      if (res.ok) { const d = await res.json(); onChange(d.url); }
      else { const e = await res.json().catch(() => ({})); alert(e.error || "Upload failed"); }
    } catch (e) { console.error(e); alert("Upload failed"); }
    finally { setUploading(false); }
  };

  return (
    <div>
      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">{label}</label>
      <div className="flex items-center gap-3">
        <label className={`${box} rounded-2xl border-2 border-dashed border-slate-200 hover:border-violet-300 bg-slate-50 flex items-center justify-center cursor-pointer overflow-hidden shrink-0 transition-colors`}>
          {preview
            ? <img src={preview} alt="preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            : <ImagePlus size={22} className="text-slate-300" />}
          <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
        </label>
        <div className="text-[10px] font-bold text-slate-400 font-inter">
          {uploading ? <span className="text-violet-600 animate-pulse">Uploading…</span> : (preview ? "Click the image to change it" : "Click to upload")}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════ TYPES ═══════════════════
interface AppModule {
  id: string; type: string; refId?: string | null; label: string; labelAr?: string | null;
  icon?: string | null; color?: string | null; link?: string | null;
  visible: boolean; locked: boolean; comingSoon: boolean; sortOrder: number;
}
interface AppSlide {
  id: string; type: string; title?: string | null; subtitle?: string | null; image: string;
  link?: string | null; promoCodeId?: string | null; visible: boolean; sortOrder: number;
}
interface AppPromo {
  id: string; code: string; description?: string | null; scope: string; discountType: string;
  discountValue: number; expiresAt?: string | null; isActive: boolean; showInApp: boolean; appBanner?: string | null;
}
interface AppNotif {
  id: string; title: string; body: string; channel: string; audience: string;
  imageUrl?: string | null; link?: string | null; sentCount: number; sentAt: string;
}
interface LegalPage { slug: string; title: string; content: string; updatedAt?: string | null; }
interface Cat { id: string; name: string; image?: string | null; }

const MODULE_TYPES = [
  { value: "taxi", label: "Taxi (vertical)" },
  { value: "food", label: "Food (vertical)" },
  { value: "services", label: "Services (vertical)" },
  { value: "truck", label: "Truck (vertical)" },
  { value: "service_category", label: "Service category" },
  { value: "truck_category", label: "Truck category" },
  { value: "custom", label: "Custom link" },
];

const isImg = (v?: string | null) => !!v && (v.startsWith("http") || v.startsWith("/uploads"));
const imgSrc = (v: string) => (v.startsWith("/uploads") ? `${API_URL}${v}` : v);

// ═══════════════════ MAIN ═══════════════════
export default function MobileAppDashboard({ activePage }: { activePage: string }) {
  const { token } = useAuth();
  const auth = useCallback(() => ({ Authorization: `Bearer ${token}` }), [token]);
  const jsonAuth = useCallback(() => ({ "Content-Type": "application/json", Authorization: `Bearer ${token}` }), [token]);

  const [modules, setModules] = useState<AppModule[]>([]);
  const [slides, setSlides] = useState<AppSlide[]>([]);
  const [promos, setPromos] = useState<AppPromo[]>([]);
  const [notifs, setNotifs] = useState<AppNotif[]>([]);
  const [legal, setLegal] = useState<LegalPage[]>([]);
  const [serviceCats, setServiceCats] = useState<Cat[]>([]);
  const [truckCats, setTruckCats] = useState<Cat[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 3500); };

  const fetchAll = useCallback(async () => {
    try {
      const h = { headers: auth() };
      const [m, s, p, n, l, sc, tc] = await Promise.all([
        fetch(`${API_URL}/api/app/admin/modules`, h),
        fetch(`${API_URL}/api/app/admin/slides`, h),
        fetch(`${API_URL}/api/promos`, h),
        fetch(`${API_URL}/api/app/admin/notifications`, h),
        fetch(`${API_URL}/api/app/admin/legal`, h),
        fetch(`${API_URL}/api/categories`, h),
        fetch(`${API_URL}/api/truck/categories`, h),
      ]);
      if (m.ok) setModules(await m.json());
      if (s.ok) setSlides(await s.json());
      if (p.ok) setPromos(await p.json());
      if (n.ok) setNotifs(await n.json());
      if (l.ok) setLegal(await l.json());
      if (sc.ok) setServiceCats(await sc.json());
      if (tc.ok) setTruckCats(await tc.json());
    } catch (e) { console.error("Mobile fetch error:", e); }
  }, [auth]);

  useEffect(() => { if (token) fetchAll(); }, [token, fetchAll]);

  const post = async (path: string, body?: object) => {
    const res = await fetch(`${API_URL}${path}`, { method: "POST", headers: jsonAuth(), body: JSON.stringify(body ?? {}) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { showToast(`⚠ ${data.error || "Action failed"}`); return null; }
    fetchAll(); return data;
  };
  const put = async (path: string, body: object) => {
    const res = await fetch(`${API_URL}${path}`, { method: "PUT", headers: jsonAuth(), body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { showToast(`⚠ ${data.error || "Failed"}`); return null; }
    fetchAll(); return data;
  };
  const del = async (path: string) => {
    const res = await fetch(`${API_URL}${path}`, { method: "DELETE", headers: auth() });
    if (res.ok) { fetchAll(); showToast("Deleted ✓"); } else { const d = await res.json().catch(() => ({})); showToast(`⚠ ${d.error || "Failed"}`); }
  };

  const view = () => {
    if (activePage === "modules") return <ModulesPage modules={modules} serviceCats={serviceCats} truckCats={truckCats} post={post} put={put} del={del} showToast={showToast} />;
    if (activePage === "app-promos") return <PromosPage promos={promos} slides={slides.filter(s => s.type === "promo")} put={put} post={post} del={del} showToast={showToast} />;
    if (activePage === "notifications") return <NotificationsPage notifs={notifs} post={post} del={del} />;
    if (activePage === "legal") return <LegalPagesPage pages={legal} put={put} showToast={showToast} />;
    return <SlidesPage slides={slides.filter(s => s.type === "home")} put={put} post={post} del={del} />;
  };

  return (
    <div className="relative">
      {toast && (
        <div className="fixed top-24 right-8 z-[60] animate-fadeIn bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-800">
          <Smartphone size={16} className="text-violet-400" />
          <span className="text-xs font-bold font-inter">{toast}</span>
        </div>
      )}
      {view()}
    </div>
  );
}

// ═══════════════════ SLIDES (home carousel) ═══════════════════
function SlidesPage({ slides, put, post, del }: {
  slides: AppSlide[]; put: (p: string, b: object) => Promise<any>; post: (p: string, b?: object) => Promise<any>; del: (p: string) => void;
}) {
  const [editing, setEditing] = useState<AppSlide | null>(null);
  const [showNew, setShowNew] = useState(false);
  const sorted = [...slides].sort((a, b) => a.sortOrder - b.sortOrder);

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir; if (j < 0 || j >= sorted.length) return;
    const a = sorted[i], b = sorted[j];
    put(`/api/app/admin/slides/${a.id}`, { sortOrder: b.sortOrder });
    put(`/api/app/admin/slides/${b.id}`, { sortOrder: a.sortOrder });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fadeIn pb-16 text-left">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tighter text-slate-800 uppercase">Home Slides</h1>
          <p className="text-sm text-slate-400 font-medium font-inter">The banner carousel shown at the top of the app home screen</p>
        </div>
        <button onClick={() => setShowNew(true)} className="px-5 py-2.5 bg-violet-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-violet-700 shadow-lg shadow-violet-600/20 cursor-pointer flex items-center gap-2"><Plus size={14} /> New Slide</button>
      </div>

      {sorted.length === 0 && <EmptyState icon={Images} text="No slides yet. Add your first banner." />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {sorted.map((s, i) => (
          <div key={s.id} className={`bg-white border rounded-[2rem] overflow-hidden shadow-sm ${s.visible ? "border-slate-100" : "border-slate-100 opacity-60"}`}>
            <div className="relative h-40 bg-slate-100">
              {s.image && <img src={imgSrc(s.image)} alt={s.title || "slide"} className="w-full h-full object-cover" />}
              {!s.visible && <span className="absolute top-3 left-3 text-[9px] font-black uppercase px-2 py-1 bg-slate-900/80 text-white rounded-lg">Hidden</span>}
            </div>
            <div className="p-5 space-y-3">
              <div>
                <p className="text-sm font-black text-slate-800">{s.title || "—"}</p>
                <p className="text-[11px] font-medium text-slate-400 font-inter">{s.subtitle || ""}</p>
                {s.link && <p className="text-[10px] font-bold text-violet-500 truncate mt-1">{s.link}</p>}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => move(i, -1)} disabled={i === 0} className="w-8 h-8 rounded-lg border border-slate-100 flex items-center justify-center text-slate-500 disabled:opacity-30 hover:bg-slate-50 cursor-pointer"><ArrowUp size={13} /></button>
                <button onClick={() => move(i, 1)} disabled={i === sorted.length - 1} className="w-8 h-8 rounded-lg border border-slate-100 flex items-center justify-center text-slate-500 disabled:opacity-30 hover:bg-slate-50 cursor-pointer"><ArrowDown size={13} /></button>
                <button onClick={() => put(`/api/app/admin/slides/${s.id}`, { visible: !s.visible })} className="w-8 h-8 rounded-lg border border-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-50 cursor-pointer">{s.visible ? <Eye size={13} /> : <EyeOff size={13} />}</button>
                <div className="flex-1" />
                <button onClick={() => setEditing(s)} className="w-8 h-8 rounded-lg hover:bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-500 cursor-pointer"><Edit2 size={13} /></button>
                <button onClick={() => { if (confirm("Delete this slide?")) del(`/api/app/admin/slides/${s.id}`); }} className="w-8 h-8 rounded-lg hover:bg-rose-50 flex items-center justify-center border border-slate-100 text-rose-500 cursor-pointer"><Trash2 size={13} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {(showNew || editing) && (
        <ModalPortal><SlideModal slide={editing} type="home" onClose={() => { setShowNew(false); setEditing(null); }}
          onSave={async (f) => { const r = editing ? await put(`/api/app/admin/slides/${editing.id}`, f) : await post(`/api/app/admin/slides`, f); if (r) { setShowNew(false); setEditing(null); } }} /></ModalPortal>
      )}
    </div>
  );
}

function SlideModal({ slide, type, onClose, onSave }: { slide: AppSlide | null; type: string; onClose: () => void; onSave: (f: object) => void; }) {
  const [title, setTitle] = useState(slide?.title ?? "");
  const [subtitle, setSubtitle] = useState(slide?.subtitle ?? "");
  const [image, setImage] = useState(slide?.image ?? "");
  const [link, setLink] = useState(slide?.link ?? "");
  const [visible, setVisible] = useState(slide?.visible ?? true);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeIn p-4">
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto space-y-5 relative text-left">
        <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400 cursor-pointer"><X size={18} /></button>
        <h2 className="text-xl font-black text-slate-800 uppercase">{slide ? "Edit Slide" : "New Slide"}</h2>
        <ImageUploadField label="Banner Image *" value={image} onChange={setImage} aspect="wide" />
        <Field label="Title"><input value={title} onChange={e => setTitle(e.target.value)} className={inputCls} placeholder="Big offer this week" /></Field>
        <Field label="Subtitle"><input value={subtitle} onChange={e => setSubtitle(e.target.value)} className={inputCls} placeholder="Up to 30% off" /></Field>
        <Field label="Link / deep link (optional)"><input value={link} onChange={e => setLink(e.target.value)} className={inputCls} placeholder="rafik://taxi or https://…" /></Field>
        <Toggle checked={visible} onChange={setVisible} label="Visible in app" />
        <button onClick={() => { if (!image) return alert("Please upload a banner image"); onSave({ type, title, subtitle, image, link, visible }); }} className={saveBtnCls}><Check size={16} /> Save</button>
      </div>
    </div>
  );
}

// ═══════════════════ MODULES (home grid icons) ═══════════════════
function ModulesPage({ modules, serviceCats, truckCats, post, put, del, showToast }: {
  modules: AppModule[]; serviceCats: Cat[]; truckCats: Cat[];
  post: (p: string, b?: object) => Promise<any>; put: (p: string, b: object) => Promise<any>; del: (p: string) => void; showToast: (m: string) => void;
}) {
  const [editing, setEditing] = useState<AppModule | null>(null);
  const [showNew, setShowNew] = useState(false);
  const sorted = [...modules].sort((a, b) => a.sortOrder - b.sortOrder);

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir; if (j < 0 || j >= sorted.length) return;
    const a = sorted[i], b = sorted[j];
    put(`/api/app/admin/modules/${a.id}`, { sortOrder: b.sortOrder });
    put(`/api/app/admin/modules/${b.id}`, { sortOrder: a.sortOrder });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fadeIn pb-16 text-left">
      <div className="flex justify-between items-start flex-wrap gap-3">
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tighter text-slate-800 uppercase">App Icons</h1>
          <p className="text-sm text-slate-400 font-medium font-inter">The service grid on the app home — choose what shows, hide, lock, or mark “coming soon”</p>
        </div>
        <div className="flex gap-2">
          <button onClick={async () => { const r = await post(`/api/app/admin/modules/sync`); if (r) showToast(`Synced — ${r.added} added ✓`); }} className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-200 cursor-pointer flex items-center gap-2"><RefreshCw size={14} /> Sync from services</button>
          <button onClick={() => setShowNew(true)} className="px-5 py-2.5 bg-violet-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-violet-700 shadow-lg shadow-violet-600/20 cursor-pointer flex items-center gap-2"><Plus size={14} /> New Icon</button>
        </div>
      </div>

      {sorted.length === 0 && <EmptyState icon={LayoutGrid} text="No icons yet. Use “Sync from services” to auto-fill, or add your own." />}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {sorted.map((m, i) => (
          <div key={m.id} className={`bg-white border rounded-[2rem] p-5 shadow-sm relative ${m.visible ? "border-slate-100" : "border-slate-100 opacity-60"}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden text-3xl" style={{ background: m.color || "#F1F5F9" }}>
                {isImg(m.icon) ? <img src={imgSrc(m.icon!)} alt={m.label} className="w-full h-full object-cover" /> : <span>{m.icon || "📦"}</span>}
              </div>
              <div className="flex gap-1">
                <button onClick={() => setEditing(m)} className="w-7 h-7 rounded-lg hover:bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-500 cursor-pointer"><Edit2 size={12} /></button>
                <button onClick={() => { if (confirm(`Delete "${m.label}"?`)) del(`/api/app/admin/modules/${m.id}`); }} className="w-7 h-7 rounded-lg hover:bg-rose-50 flex items-center justify-center border border-slate-100 text-rose-500 cursor-pointer"><Trash2 size={12} /></button>
              </div>
            </div>
            <p className="text-sm font-black text-slate-800 tracking-tight truncate">{m.label}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase">{m.type.replace("_", " ")}</p>
            <div className="mt-3 flex flex-wrap gap-1">
              {!m.visible && <Badge cls="bg-slate-100 text-slate-500">Hidden</Badge>}
              {m.locked && <Badge cls="bg-amber-50 text-amber-700"><Lock size={9} /> Locked</Badge>}
              {m.comingSoon && <Badge cls="bg-violet-50 text-violet-700"><Clock size={9} /> Soon</Badge>}
            </div>
            <div className="mt-3 flex items-center gap-1.5 border-t border-slate-50 pt-3">
              <button onClick={() => move(i, -1)} disabled={i === 0} className="w-7 h-7 rounded-lg border border-slate-100 flex items-center justify-center text-slate-500 disabled:opacity-30 hover:bg-slate-50 cursor-pointer"><ArrowUp size={12} /></button>
              <button onClick={() => move(i, 1)} disabled={i === sorted.length - 1} className="w-7 h-7 rounded-lg border border-slate-100 flex items-center justify-center text-slate-500 disabled:opacity-30 hover:bg-slate-50 cursor-pointer"><ArrowDown size={12} /></button>
              <button onClick={() => put(`/api/app/admin/modules/${m.id}`, { visible: !m.visible })} title="Show / hide" className="w-7 h-7 rounded-lg border border-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-50 cursor-pointer">{m.visible ? <Eye size={12} /> : <EyeOff size={12} />}</button>
              <button onClick={() => put(`/api/app/admin/modules/${m.id}`, { locked: !m.locked })} title="Lock" className={`w-7 h-7 rounded-lg border flex items-center justify-center cursor-pointer ${m.locked ? "border-amber-200 text-amber-600 bg-amber-50" : "border-slate-100 text-slate-500 hover:bg-slate-50"}`}><Lock size={12} /></button>
              <button onClick={() => put(`/api/app/admin/modules/${m.id}`, { comingSoon: !m.comingSoon })} title="Coming soon" className={`w-7 h-7 rounded-lg border flex items-center justify-center cursor-pointer ${m.comingSoon ? "border-violet-200 text-violet-600 bg-violet-50" : "border-slate-100 text-slate-500 hover:bg-slate-50"}`}><Clock size={12} /></button>
            </div>
          </div>
        ))}
      </div>

      {(showNew || editing) && (
        <ModalPortal><ModuleModal module={editing} serviceCats={serviceCats} truckCats={truckCats} onClose={() => { setShowNew(false); setEditing(null); }}
          onSave={async (f) => { const r = editing ? await put(`/api/app/admin/modules/${editing.id}`, f) : await post(`/api/app/admin/modules`, f); if (r) { setShowNew(false); setEditing(null); } }} /></ModalPortal>
      )}
    </div>
  );
}

function ModuleModal({ module, serviceCats, truckCats, onClose, onSave }: {
  module: AppModule | null; serviceCats: Cat[]; truckCats: Cat[]; onClose: () => void; onSave: (f: object) => void;
}) {
  const [type, setType] = useState(module?.type ?? "custom");
  const [refId, setRefId] = useState(module?.refId ?? "");
  const [label, setLabel] = useState(module?.label ?? "");
  const [labelAr, setLabelAr] = useState(module?.labelAr ?? "");
  const [icon, setIcon] = useState(module?.icon ?? "");
  const [color, setColor] = useState(module?.color ?? "");
  const [link, setLink] = useState(module?.link ?? "");
  const [visible, setVisible] = useState(module?.visible ?? true);
  const [locked, setLocked] = useState(module?.locked ?? false);
  const [comingSoon, setComingSoon] = useState(module?.comingSoon ?? false);

  const cats = type === "service_category" ? serviceCats : type === "truck_category" ? truckCats : [];
  const needsCat = type === "service_category" || type === "truck_category";
  const iconIsImage = isImg(icon);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeIn p-4">
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto space-y-5 relative text-left">
        <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400 cursor-pointer"><X size={18} /></button>
        <h2 className="text-xl font-black text-slate-800 uppercase">{module ? "Edit Icon" : "New Icon"}</h2>

        <Field label="Type">
          <select value={type} onChange={e => { const t = e.target.value; setType(t); setRefId(""); }} className={inputCls}>
            {MODULE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </Field>

        {needsCat && (
          <Field label="Which category">
            <select value={refId ?? ""} onChange={e => {
              const id = e.target.value; setRefId(id);
              const c = cats.find(x => x.id === id);
              if (c) { if (!label) setLabel(c.name); if (!icon && c.image) setIcon(c.image); }
            }} className={inputCls}>
              <option value="">— select —</option>
              {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
        )}

        <Field label="Label *"><input value={label} onChange={e => setLabel(e.target.value)} className={inputCls} placeholder="Taxi" /></Field>
        <Field label="Arabic label (optional)"><input value={labelAr} onChange={e => setLabelAr(e.target.value)} className={inputCls} dir="rtl" placeholder="سيارة أجرة" /></Field>

        <ImageUploadField label="Icon image (optional)" value={iconIsImage ? icon : ""} onChange={setIcon} />
        <Field label="…or emoji icon">
          <input value={iconIsImage ? "" : icon} onChange={e => setIcon(e.target.value)} className={inputCls} placeholder="🚕" maxLength={4} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Accent color (optional)"><input value={color} onChange={e => setColor(e.target.value)} className={inputCls} placeholder="#EDE9FE" /></Field>
          {type === "custom" && <Field label="Link"><input value={link} onChange={e => setLink(e.target.value)} className={inputCls} placeholder="rafik://…" /></Field>}
        </div>

        <div className="space-y-2 pt-1">
          <Toggle checked={visible} onChange={setVisible} label="Show in app" />
          <Toggle checked={locked} onChange={setLocked} label="Locked (visible but not tappable)" />
          <Toggle checked={comingSoon} onChange={setComingSoon} label="“Coming soon” badge" />
        </div>

        <button onClick={() => { if (!label.trim()) return alert("Label is required"); if (needsCat && !refId) return alert("Please pick a category"); onSave({ type, refId: needsCat ? refId : null, label, labelAr, icon, color, link, visible, locked, comingSoon }); }} className={saveBtnCls}><Check size={16} /> Save</button>
      </div>
    </div>
  );
}

// ═══════════════════ PROMOS (which show in app + promo slides) ═══════════════════
function PromosPage({ promos, slides, put, post, del, showToast }: {
  promos: AppPromo[]; slides: AppSlide[];
  put: (p: string, b: object) => Promise<any>; post: (p: string, b?: object) => Promise<any>; del: (p: string) => void; showToast: (m: string) => void;
}) {
  const [editing, setEditing] = useState<AppSlide | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [banner, setBanner] = useState<AppPromo | null>(null);

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fadeIn pb-16 text-left">
      <div className="space-y-2">
        <h1 className="text-3xl font-black tracking-tighter text-slate-800 uppercase">App Promos</h1>
        <p className="text-sm text-slate-400 font-medium font-inter">Choose which promo codes appear on the app’s Promo page, and manage promo banners</p>
      </div>

      {/* Which promos show in app */}
      <section className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm">
        <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider mb-4">Promo codes shown in the app</h2>
        <div className="space-y-2">
          {promos.length === 0 && <p className="text-xs text-slate-400 font-inter">No promo codes yet — create them under any vertical’s “Promo Codes” page.</p>}
          {promos.map(p => (
            <div key={p.id} className="flex items-center gap-3 p-3 rounded-2xl border border-slate-100 hover:bg-slate-50/50">
              <span className="font-black text-slate-800 text-sm">{p.code}</span>
              <Badge cls="bg-slate-100 text-slate-500">{p.scope}</Badge>
              <span className="text-[11px] text-slate-400 font-inter">{p.discountType === "PERCENTAGE" ? `${p.discountValue}%` : `${p.discountValue} DZD`}</span>
              {!p.isActive && <Badge cls="bg-rose-50 text-rose-600">Inactive</Badge>}
              <div className="flex-1" />
              <button onClick={() => setBanner(p)} className="text-[10px] font-black uppercase text-slate-500 hover:text-violet-600 flex items-center gap-1 cursor-pointer"><ImagePlus size={12} /> {p.appBanner ? "Banner" : "Add banner"}</button>
              <Toggle checked={p.showInApp} onChange={(v) => put(`/api/promos/${p.id}`, { showInApp: v })} label={p.showInApp ? "Shown" : "Hidden"} />
            </div>
          ))}
        </div>
      </section>

      {/* Promo slides */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider">Promo banners (carousel on the promo page)</h2>
          <button onClick={() => setShowNew(true)} className="px-4 py-2 bg-violet-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-violet-700 cursor-pointer flex items-center gap-2"><Plus size={13} /> New Banner</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {slides.length === 0 && <EmptyState icon={Ticket} text="No promo banners yet." />}
          {[...slides].sort((a, b) => a.sortOrder - b.sortOrder).map(s => (
            <div key={s.id} className={`bg-white border rounded-[2rem] overflow-hidden shadow-sm ${s.visible ? "border-slate-100" : "border-slate-100 opacity-60"}`}>
              <div className="h-36 bg-slate-100">{s.image && <img src={imgSrc(s.image)} alt="" className="w-full h-full object-cover" />}</div>
              <div className="p-4 flex items-center gap-2">
                <div className="min-w-0"><p className="text-sm font-black text-slate-800 truncate">{s.title || "—"}</p><p className="text-[10px] text-slate-400 truncate">{s.subtitle}</p></div>
                <div className="flex-1" />
                <button onClick={() => put(`/api/app/admin/slides/${s.id}`, { visible: !s.visible })} className="w-8 h-8 rounded-lg border border-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-50 cursor-pointer">{s.visible ? <Eye size={13} /> : <EyeOff size={13} />}</button>
                <button onClick={() => setEditing(s)} className="w-8 h-8 rounded-lg border border-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-50 cursor-pointer"><Edit2 size={13} /></button>
                <button onClick={() => { if (confirm("Delete this banner?")) del(`/api/app/admin/slides/${s.id}`); }} className="w-8 h-8 rounded-lg border border-slate-100 flex items-center justify-center text-rose-500 hover:bg-rose-50 cursor-pointer"><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {(showNew || editing) && (
        <ModalPortal><SlideModal slide={editing} type="promo" onClose={() => { setShowNew(false); setEditing(null); }}
          onSave={async (f) => { const r = editing ? await put(`/api/app/admin/slides/${editing.id}`, f) : await post(`/api/app/admin/slides`, f); if (r) { setShowNew(false); setEditing(null); } }} /></ModalPortal>
      )}

      {banner && (
        <ModalPortal><BannerModal promo={banner} onClose={() => setBanner(null)}
          onSave={async (url) => { const r = await put(`/api/promos/${banner.id}`, { appBanner: url }); if (r) { setBanner(null); showToast("Banner saved ✓"); } }} /></ModalPortal>
      )}
    </div>
  );
}

function BannerModal({ promo, onClose, onSave }: { promo: AppPromo; onClose: () => void; onSave: (url: string) => void; }) {
  const [img, setImg] = useState(promo.appBanner ?? "");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeIn p-4">
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto space-y-5 relative text-left">
        <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400 cursor-pointer"><X size={18} /></button>
        <h2 className="text-xl font-black text-slate-800 uppercase">Banner — {promo.code}</h2>
        <ImageUploadField label="Promo card banner" value={img} onChange={setImg} aspect="wide" />
        <button onClick={() => onSave(img)} className={saveBtnCls}><Check size={16} /> Save Banner</button>
      </div>
    </div>
  );
}

// ═══════════════════ NOTIFICATIONS ═══════════════════
function NotificationsPage({ notifs, post, del }: {
  notifs: AppNotif[]; post: (p: string, b?: object) => Promise<any>; del: (p: string) => void;
}) {
  const { token } = useAuth();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [chApp, setChApp] = useState(true);
  const [chPush, setChPush] = useState(false);
  const [chEmail, setChEmail] = useState(false);
  const [audience, setAudience] = useState("all");
  const [link, setLink] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<{ mailConfigured: boolean; pushConfigured: boolean; devices: number } | null>(null);

  // Test-email tool
  const [testTo, setTestTo] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/app/admin/status`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null).then(setStatus).catch(() => {});
  }, [token]);

  const send = async () => {
    if (!title.trim() || !body.trim()) return alert("Title and message are required");
    const channels = [chApp && "app", chPush && "push", chEmail && "email"].filter(Boolean) as string[];
    if (!channels.length) return alert("Pick at least one channel");
    setSending(true);
    const r = await post(`/api/app/admin/notifications`, { title, body, channels, audience, link });
    setSending(false);
    if (!r) return;
    setTitle(""); setBody(""); setLink("");
    const lines: string[] = [];
    if (r.wantEmail) {
      if (!r.mailConfigured) lines.push("• Email NOT sent — SMTP not configured on the server.");
      else if (r.failedCount) lines.push(`• Email: ${r.sentCount}/${r.recipientCount} sent, ${r.failedCount} failed (${r.mailError || "?"}).`);
      else lines.push(`• Email sent to ${r.sentCount} recipient(s).`);
    }
    if (r.wantPush) {
      if (!r.pushConfigured) lines.push("• Push NOT sent — Firebase not configured on the server.");
      else lines.push(`• Push: ${r.pushSent}/${r.pushTargets} device(s)${r.pushFailed ? `, ${r.pushFailed} failed` : ""}.`);
    }
    alert(lines.length ? lines.join("\n") : "Saved to the in-app feed ✅");
  };

  const sendTest = async () => {
    if (!testTo.trim()) return;
    setTesting(true); setTestResult(null);
    try {
      const res = await fetch(`${API_URL}/api/app/admin/test-email`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ to: testTo }),
      });
      const d = await res.json().catch(() => ({}));
      if (d.ok) setTestResult(`✅ ${d.message}`);
      else setTestResult(`⚠ ${d.error || d.message || "Failed"}${d.code ? ` [${d.code}]` : ""}`);
    } catch { setTestResult("⚠ Network error reaching the server"); }
    finally { setTesting(false); }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-fadeIn pb-16 text-left">
      <div className="space-y-2">
        <h1 className="text-3xl font-black tracking-tighter text-slate-800 uppercase">Notifications</h1>
        <p className="text-sm text-slate-400 font-medium font-inter">Send an in-app announcement or an email blast to your users</p>
      </div>

      <div className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm space-y-5">
        <Field label="Title *"><input value={title} onChange={e => setTitle(e.target.value)} className={inputCls} placeholder="New feature is live!" /></Field>
        <Field label="Message *"><textarea value={body} onChange={e => setBody(e.target.value)} rows={4} className={inputCls} placeholder="Write your announcement…" /></Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Channels">
            <div className="flex flex-wrap gap-2">
              <ChannelChk on={chApp} set={setChApp} icon={Smartphone} label="In-app" />
              <ChannelChk on={chPush} set={setChPush} icon={BellRing} label="Push" bad={!!status && !status.pushConfigured} />
              <ChannelChk on={chEmail} set={setChEmail} icon={Mail} label="Email" bad={!!status && !status.mailConfigured} />
            </div>
          </Field>
          <Field label="Audience">
            <select value={audience} onChange={e => setAudience(e.target.value)} className={inputCls}>
              <option value="all">Everyone</option>
              <option value="clients">Clients</option>
              <option value="workers">Workers</option>
              <option value="drivers">Drivers</option>
            </select>
          </Field>
        </div>
        <Field label="Link (optional)"><input value={link} onChange={e => setLink(e.target.value)} className={inputCls} placeholder="rafik://promos or https://…" /></Field>
        {chEmail && status && !status.mailConfigured && (
          <p className="text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 font-inter">Email is not configured — add SMTP settings to the backend <code>.env</code> and restart. Emails won’t send until then.</p>
        )}
        {chPush && status && !status.pushConfigured && (
          <p className="text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 font-inter">Push is not configured — add the Firebase service-account key to the backend <code>.env</code> and restart. See the setup steps.</p>
        )}
        {chPush && status?.pushConfigured && <p className="text-[11px] font-bold text-slate-400 font-inter">{status.devices} device(s) registered for push.</p>}
        <button onClick={send} disabled={sending} className={saveBtnCls}>{sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} {sending ? "Sending…" : "Send notification"}</button>
      </div>

      {/* Verify email setup */}
      <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm space-y-3">
        <div className="flex items-center gap-2"><Mail size={16} className="text-violet-600" /><h2 className="text-sm font-black text-slate-700 uppercase tracking-wider">Test your email setup</h2></div>
        <p className="text-[11px] text-slate-400 font-inter">Send one email to yourself to confirm the SMTP settings in the backend <code>.env</code> actually work. The exact error is shown if it fails.</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input value={testTo} onChange={e => setTestTo(e.target.value)} type="email" placeholder="your@email.com" className={`${inputCls} flex-1`} />
          <button onClick={sendTest} disabled={testing} className="px-5 py-3 bg-slate-800 text-white rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-slate-900 cursor-pointer flex items-center justify-center gap-2 shrink-0">{testing ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Send test</button>
        </div>
        {testResult && <p className={`text-[12px] font-bold font-inter break-words ${testResult.startsWith("✅") ? "text-emerald-600" : "text-rose-600"}`}>{testResult}</p>}
      </div>

      <section>
        <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider mb-4">History</h2>
        <div className="space-y-2">
          {notifs.length === 0 && <EmptyState icon={BellRing} text="No notifications sent yet." />}
          {notifs.map(n => (
            <div key={n.id} className="bg-white border border-slate-100 rounded-2xl p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">{n.channel === "email" ? <Mail size={15} /> : n.channel === "both" ? <Send size={15} /> : <Smartphone size={15} />}</div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-slate-800">{n.title}</p>
                <p className="text-[12px] text-slate-500 font-inter">{n.body}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{new Date(n.sentAt).toLocaleString()} · {n.audience} · {n.channel}{n.sentCount ? ` · ${n.sentCount} emailed` : ""}</p>
              </div>
              <button onClick={() => { if (confirm("Delete from history?")) del(`/api/app/admin/notifications/${n.id}`); }} className="w-8 h-8 rounded-lg border border-slate-100 flex items-center justify-center text-rose-500 hover:bg-rose-50 cursor-pointer shrink-0"><Trash2 size={13} /></button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ═══════════════════ LEGAL PAGES ═══════════════════
function LegalPagesPage({ pages, put, showToast }: {
  pages: LegalPage[]; put: (p: string, b: object) => Promise<any>; showToast: (m: string) => void;
}) {
  const order = ["privacy-policy", "terms", "delete-account", "support"];
  const sorted = order.map(slug => pages.find(p => p.slug === slug)).filter(Boolean) as LegalPage[];
  const [active, setActive] = useState(order[0]);
  const current = sorted.find(p => p.slug === active) || { slug: active, title: active, content: "" };
  const [title, setTitle] = useState(current.title);
  const [content, setContent] = useState(current.content);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const p = sorted.find(x => x.slug === active);
    setTitle(p?.title || ""); setContent(p?.content || "");
  }, [active, pages]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async () => {
    setSaving(true);
    const r = await put(`/api/app/admin/legal/${active}`, { title, content });
    setSaving(false);
    if (r) showToast("Page saved ✓");
  };
  const publicUrl = `${API_URL}/${active}`.replace("/api", "");

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fadeIn pb-16 text-left">
      <div className="space-y-2">
        <h1 className="text-3xl font-black tracking-tighter text-slate-800 uppercase">Legal Pages</h1>
        <p className="text-sm text-slate-400 font-medium font-inter">The open pages the Play Store requires. These are public — no login needed.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {order.map(slug => (
          <button key={slug} onClick={() => setActive(slug)} className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider border cursor-pointer ${active === slug ? "bg-violet-600 text-white border-violet-600" : "bg-white text-slate-500 border-slate-100 hover:bg-slate-50"}`}>{slug.replace("-", " ")}</button>
        ))}
      </div>

      <div className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm space-y-5">
        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5">
          <ExternalLink size={13} />
          <span>Public URL:</span>
          <a href={`/${active}`} target="_blank" className="text-violet-600 hover:underline break-all">{`/${active}`}</a>
        </div>
        <Field label="Page title"><input value={title} onChange={e => setTitle(e.target.value)} className={inputCls} /></Field>
        <Field label="Content (Markdown supported)"><textarea value={content} onChange={e => setContent(e.target.value)} rows={18} className={`${inputCls} font-mono text-[12px] leading-relaxed`} /></Field>
        <button onClick={save} disabled={saving} className={saveBtnCls}>{saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Page</button>
      </div>
    </div>
  );
}

// ═══════════════════ SHARED UI BITS ═══════════════════
const inputCls = "w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:border-violet-200";
const saveBtnCls = "w-full py-4 bg-violet-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-violet-700 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">{label}</label>{children}</div>;
}
function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex items-center gap-2 cursor-pointer">
      <span className={`w-10 h-6 rounded-full transition-colors relative shrink-0 ${checked ? "bg-violet-600" : "bg-slate-200"}`}>
        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${checked ? "left-[1.15rem]" : "left-0.5"}`} />
      </span>
      <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">{label}</span>
    </button>
  );
}
function Badge({ cls, children }: { cls: string; children: React.ReactNode }) {
  return <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg inline-flex items-center gap-1 ${cls}`}>{children}</span>;
}
function EmptyState({ icon: Icon, text }: { icon: React.ComponentType<{ size?: number; className?: string }>; text: string }) {
  return (
    <div className="border-2 border-dashed border-slate-200 rounded-[2rem] py-16 flex flex-col items-center justify-center text-slate-300 gap-3">
      <Icon size={40} />
      <p className="text-xs font-bold text-slate-400 font-inter">{text}</p>
    </div>
  );
}
function ChannelChk({ on, set, icon: Icon, label, bad }: { on: boolean; set: (v: boolean) => void; icon: React.ComponentType<{ size?: number }>; label: string; bad?: boolean }) {
  return (
    <button type="button" onClick={() => set(!on)} className={`px-3.5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider border flex items-center gap-1.5 cursor-pointer ${on ? "bg-violet-600 text-white border-violet-600" : "bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100"}`}>
      <Icon size={13} /> {label}
      {on && <Check size={12} />}
      {bad && <span title="Not configured on the server" className="w-2 h-2 rounded-full bg-amber-400" />}
    </button>
  );
}
