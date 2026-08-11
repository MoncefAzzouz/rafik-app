"use client";

import { API_URL } from "@/lib/api";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import ModalPortal from "@/components/ModalPortal";
import {
  Users, Search, Plus, X, Edit2, Trash2, KeyRound, Ban, ShieldCheck, Check, Loader2,
} from "lucide-react";

interface AppUser {
  id: string; email: string; phone: string; fullName: string; role: string;
  wilaya?: string | null; commune?: string | null; address?: string | null; profileImage?: string | null;
  createdAt: string; bannedForever: boolean; bannedUntil?: string | null; banReason?: string | null; isBanned: boolean;
  professional?: { id: string; category: string; verified: boolean } | null;
}

const ROLES = ["ADMIN", "WORKER", "CLIENT", "RESTAURANT", "DRIVER", "CASHIER", "TRUCKER"];
const ROLE_META: Record<string, { label: string; cls: string }> = {
  ADMIN: { label: "Admin", cls: "bg-rose-50 text-rose-700 border-rose-200" },
  WORKER: { label: "Worker", cls: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  CLIENT: { label: "Client", cls: "bg-slate-50 text-slate-600 border-slate-200" },
  RESTAURANT: { label: "Restaurant", cls: "bg-orange-50 text-orange-700 border-orange-200" },
  DRIVER: { label: "Driver", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  CASHIER: { label: "Cashier", cls: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  TRUCKER: { label: "Trucker", cls: "bg-teal-50 text-teal-700 border-teal-200" },
};

const inputCls = "w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:border-indigo-200";
const saveBtn = "w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-700 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2";

export default function UsersPage() {
  const { token } = useAuth();
  const auth = useCallback(() => ({ Authorization: `Bearer ${token}` }), [token]);
  const jsonAuth = useCallback(() => ({ "Content-Type": "application/json", Authorization: `Bearer ${token}` }), [token]);

  const [users, setUsers] = useState<AppUser[]>([]);
  const [role, setRole] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 3500); };

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<AppUser | null>(null);
  const [pwUser, setPwUser] = useState<AppUser | null>(null);
  const [banUser, setBanUser] = useState<AppUser | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (role) qs.set("role", role);
      if (search) qs.set("search", search);
      const res = await fetch(`${API_URL}/api/users?${qs}`, { headers: auth() });
      if (res.ok) setUsers(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [auth, role, search]);

  useEffect(() => { if (token) { const t = setTimeout(fetchUsers, 250); return () => clearTimeout(t); } }, [token, fetchUsers]);

  const del = async (u: AppUser) => {
    if (!confirm(`Delete ${u.fullName}? This can't be undone.`)) return;
    const res = await fetch(`${API_URL}/api/users/${u.id}`, { method: "DELETE", headers: auth() });
    if (res.ok) { showToast("User deleted ✓"); fetchUsers(); }
    else { const d = await res.json().catch(() => ({})); showToast(`⚠ ${d.error || "Failed"}`); }
  };

  const save = async (path: string, method: string, body: object) => {
    const res = await fetch(`${API_URL}${path}`, { method, headers: jsonAuth(), body: JSON.stringify(body) });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) { showToast(`⚠ ${d.error || "Failed"}`); return null; }
    fetchUsers(); return d;
  };

  const banLabel = (u: AppUser) => {
    if (u.bannedForever) return "Banned";
    if (u.bannedUntil && new Date(u.bannedUntil) > new Date()) return `Until ${new Date(u.bannedUntil).toLocaleDateString()}`;
    return "";
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fadeIn pb-16 text-left">
      {toast && (
        <div className="fixed top-24 right-8 z-[60] animate-fadeIn bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-800">
          <Users size={16} className="text-indigo-400" /><span className="text-xs font-bold">{toast}</span>
        </div>
      )}

      <div className="flex justify-between items-start flex-wrap gap-3">
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tighter text-slate-800 uppercase">Users</h1>
          <p className="text-sm text-slate-400 font-medium">All accounts — clients, workers, drivers, restaurants, admins</p>
        </div>
        <button onClick={() => setAdding(true)} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 cursor-pointer flex items-center gap-2"><Plus size={14} /> Add User</button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, phone…" className="w-full pl-11 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:border-indigo-200" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <FilterChip active={role === ""} onClick={() => setRole("")}>All</FilterChip>
          {ROLES.map(r => <FilterChip key={r} active={role === r} onClick={() => setRole(r)}>{ROLE_META[r].label}</FilterChip>)}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-5 py-4">User</th>
                <th className="px-5 py-4">Role</th>
                <th className="px-5 py-4 hidden md:table-cell">Location</th>
                <th className="px-5 py-4 hidden lg:table-cell">Joined</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-400"><Loader2 className="animate-spin inline" size={18} /></td></tr>}
              {!loading && users.length === 0 && <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-400 text-xs font-bold">No users found</td></tr>}
              {!loading && users.map(u => (
                <tr key={u.id} className={`border-b border-slate-50 hover:bg-slate-50/50 ${u.isBanned ? "opacity-60" : ""}`}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs shrink-0">{u.fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}</div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-slate-800 truncate">{u.fullName}</p>
                        <p className="text-[11px] text-slate-400 truncate">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4"><span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg border ${ROLE_META[u.role]?.cls || "bg-slate-50 text-slate-500 border-slate-200"}`}>{ROLE_META[u.role]?.label || u.role}</span></td>
                  <td className="px-5 py-4 hidden md:table-cell text-[11px] font-bold text-slate-500">{[u.commune, u.wilaya].filter(Boolean).join(", ") || "—"}</td>
                  <td className="px-5 py-4 hidden lg:table-cell text-[11px] font-bold text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-4">
                    {u.isBanned
                      ? <span className="text-[9px] font-black uppercase px-2 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1"><Ban size={10} /> {banLabel(u)}</span>
                      : <span className="text-[9px] font-black uppercase px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">Active</span>}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 justify-end">
                      <IconBtn title="Edit" onClick={() => setEditing(u)}><Edit2 size={13} /></IconBtn>
                      <IconBtn title="Reset password" onClick={() => setPwUser(u)}><KeyRound size={13} /></IconBtn>
                      <IconBtn title={u.isBanned ? "Manage ban" : "Ban"} onClick={() => setBanUser(u)} danger={u.isBanned}>{u.isBanned ? <ShieldCheck size={13} /> : <Ban size={13} />}</IconBtn>
                      <IconBtn title="Delete" onClick={() => del(u)} danger><Trash2 size={13} /></IconBtn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {adding && <ModalPortal><UserModal onClose={() => setAdding(false)} onSave={async (f) => { const r = await save(`/api/users`, "POST", f); if (r) { setAdding(false); showToast("User created ✓"); } }} /></ModalPortal>}
      {editing && <ModalPortal><UserModal user={editing} onClose={() => setEditing(null)} onSave={async (f) => { const r = await save(`/api/users/${editing.id}`, "PUT", f); if (r) { setEditing(null); showToast("Saved ✓"); } }} /></ModalPortal>}
      {pwUser && <ModalPortal><PasswordModal user={pwUser} onClose={() => setPwUser(null)} onSave={async (pw) => { const r = await save(`/api/users/${pwUser.id}/password`, "PUT", { password: pw }); if (r) { setPwUser(null); showToast("Password updated ✓"); } }} /></ModalPortal>}
      {banUser && <ModalPortal><BanModal user={banUser} onClose={() => setBanUser(null)} onSave={async (body) => { const r = await save(`/api/users/${banUser.id}/ban`, "PUT", body); if (r) { setBanUser(null); showToast("Updated ✓"); } }} /></ModalPortal>}
    </div>
  );
}

// ── Add / Edit user ──
function UserModal({ user, onClose, onSave }: { user?: AppUser; onClose: () => void; onSave: (f: object) => void; }) {
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [role, setRole] = useState(user?.role ?? "CLIENT");
  const [wilaya, setWilaya] = useState(user?.wilaya ?? "");
  const [commune, setCommune] = useState(user?.commune ?? "");
  const [address, setAddress] = useState(user?.address ?? "");
  const [password, setPassword] = useState("");

  const submit = () => {
    if (!fullName.trim()) return alert("Full name is required");
    if (!email.trim() || !phone.trim()) return alert("Email and phone are required");
    const base = { fullName, email, phone, role, wilaya, commune, address };
    if (!user) {
      if (password.length < 6) return alert("Password must be at least 6 characters");
      onSave({ ...base, password });
    } else onSave(base);
  };

  return (
    <Overlay>
      <h2 className="text-xl font-black text-slate-800 uppercase">{user ? "Edit User" : "Add User"}</h2>
      <Field label="Full name *"><input value={fullName} onChange={e => setFullName(e.target.value)} className={inputCls} /></Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Email *"><input value={email} onChange={e => setEmail(e.target.value)} className={inputCls} type="email" /></Field>
        <Field label="Phone *"><input value={phone} onChange={e => setPhone(e.target.value)} className={inputCls} /></Field>
      </div>
      <Field label="Role">
        <select value={role} onChange={e => setRole(e.target.value)} className={inputCls}>
          {ROLES.map(r => <option key={r} value={r}>{ROLE_META[r].label}</option>)}
        </select>
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Wilaya"><input value={wilaya} onChange={e => setWilaya(e.target.value)} className={inputCls} /></Field>
        <Field label="Commune"><input value={commune} onChange={e => setCommune(e.target.value)} className={inputCls} /></Field>
      </div>
      <Field label="Address"><input value={address} onChange={e => setAddress(e.target.value)} className={inputCls} /></Field>
      {!user && <Field label="Password *"><input value={password} onChange={e => setPassword(e.target.value)} className={inputCls} type="text" placeholder="min 6 characters" /></Field>}
      <button onClick={submit} className={saveBtn}><Check size={16} /> {user ? "Save Changes" : "Create User"}</button>
    </Overlay>
  );
}

// ── Reset password ──
function PasswordModal({ user, onClose, onSave }: { user: AppUser; onClose: () => void; onSave: (pw: string) => void; }) {
  const [pw, setPw] = useState("");
  return (
    <Overlay onClose={onClose}>
      <h2 className="text-xl font-black text-slate-800 uppercase">Reset Password</h2>
      <p className="text-xs text-slate-400 font-medium -mt-2">For <span className="font-black text-slate-600">{user.fullName}</span></p>
      <Field label="New password"><input value={pw} onChange={e => setPw(e.target.value)} className={inputCls} type="text" placeholder="min 6 characters" /></Field>
      <button onClick={() => { if (pw.length < 6) return alert("Password must be at least 6 characters"); onSave(pw); }} className={saveBtn}><KeyRound size={16} /> Update Password</button>
    </Overlay>
  );
}

// ── Ban / suspend ──
function BanModal({ user, onClose, onSave }: { user: AppUser; onClose: () => void; onSave: (body: object) => void; }) {
  const [mode, setMode] = useState<"1m" | "3m" | "date" | "forever" | "unban">(user.isBanned ? "unban" : "1m");
  const [date, setDate] = useState("");
  const [reason, setReason] = useState(user.banReason ?? "");

  const submit = () => {
    if (mode === "unban") return onSave({ mode: "unban" });
    if (mode === "forever") return onSave({ mode: "forever", reason });
    let until: Date;
    if (mode === "date") { if (!date) return alert("Pick a date"); until = new Date(date); }
    else { until = new Date(); until.setMonth(until.getMonth() + (mode === "1m" ? 1 : 3)); }
    onSave({ mode: "until", until: until.toISOString(), reason });
  };

  const opt = (v: typeof mode, label: string) => (
    <button onClick={() => setMode(v)} className={`px-3 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider border cursor-pointer ${mode === v ? "bg-indigo-600 text-white border-indigo-600" : "bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100"}`}>{label}</button>
  );

  return (
    <Overlay onClose={onClose}>
      <h2 className="text-xl font-black text-slate-800 uppercase">{user.isBanned ? "Manage Ban" : "Ban User"}</h2>
      <p className="text-xs text-slate-400 font-medium -mt-2"><span className="font-black text-slate-600">{user.fullName}</span> {user.isBanned && <span className="text-rose-500">· currently suspended</span>}</p>
      <Field label="Duration">
        <div className="grid grid-cols-2 gap-2">
          {opt("1m", "1 month")}
          {opt("3m", "3 months")}
          {opt("date", "Until date")}
          {opt("forever", "Forever")}
          {user.isBanned && <div className="col-span-2">{opt("unban", "✓ Remove ban (unban)")}</div>}
        </div>
      </Field>
      {mode === "date" && <Field label="Suspend until"><input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputCls} /></Field>}
      {mode !== "unban" && <Field label="Reason (optional)"><input value={reason} onChange={e => setReason(e.target.value)} className={inputCls} placeholder="Why is this account suspended?" /></Field>}
      <button onClick={submit} className={`${saveBtn} ${mode === "unban" ? "bg-emerald-600 hover:bg-emerald-700" : mode === "forever" ? "bg-rose-600 hover:bg-rose-700" : ""}`}>
        {mode === "unban" ? <><ShieldCheck size={16} /> Remove Ban</> : <><Ban size={16} /> Apply Ban</>}
      </button>
    </Overlay>
  );
}

// ── Shared bits ──
function Overlay({ children, onClose }: { children: React.ReactNode; onClose?: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeIn p-4">
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto space-y-4 relative text-left">
        {onClose && <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400 cursor-pointer"><X size={18} /></button>}
        {children}
      </div>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">{label}</label>{children}</div>;
}
function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick} className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border cursor-pointer ${active ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-500 border-slate-100 hover:bg-slate-50"}`}>{children}</button>;
}
function IconBtn({ children, onClick, title, danger }: { children: React.ReactNode; onClick: () => void; title: string; danger?: boolean }) {
  return <button onClick={onClick} title={title} className={`w-8 h-8 rounded-lg flex items-center justify-center border border-slate-100 cursor-pointer ${danger ? "text-rose-500 hover:bg-rose-50" : "text-slate-500 hover:bg-slate-50"}`}>{children}</button>;
}
