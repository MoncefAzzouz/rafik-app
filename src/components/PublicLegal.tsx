"use client";

import { API_URL } from "@/lib/api";
import { useEffect, useState } from "react";

interface LegalData { slug: string; title: string; content: string; updatedAt?: string | null; }

// Render inline **bold** inside a line.
function inline(text: string, key: number) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**")
          ? <strong key={`${key}-${i}`} className="font-bold text-slate-900">{p.slice(2, -2)}</strong>
          : <span key={`${key}-${i}`}>{p}</span>
      )}
    </>
  );
}

// Minimal, dependency-free Markdown → React (headings, lists, paragraphs, bold).
function Markdown({ src }: { src: string }) {
  const lines = src.replace(/\r/g, "").split("\n");
  const blocks: React.ReactNode[] = [];
  let list: string[] = [];
  const flushList = () => {
    if (list.length) {
      blocks.push(
        <ul key={`ul-${blocks.length}`} className="list-disc pl-6 space-y-1.5 my-4 text-slate-600">
          {list.map((li, i) => <li key={i}>{inline(li, i)}</li>)}
        </ul>
      );
      list = [];
    }
  };
  lines.forEach((raw, idx) => {
    const line = raw.trimEnd();
    if (/^###\s+/.test(line)) { flushList(); blocks.push(<h3 key={idx} className="text-lg font-black text-slate-800 mt-6 mb-2">{inline(line.replace(/^###\s+/, ""), idx)}</h3>); }
    else if (/^##\s+/.test(line)) { flushList(); blocks.push(<h2 key={idx} className="text-xl font-black text-slate-800 mt-8 mb-3">{inline(line.replace(/^##\s+/, ""), idx)}</h2>); }
    else if (/^#\s+/.test(line)) { flushList(); blocks.push(<h1 key={idx} className="text-3xl font-black tracking-tight text-slate-900 mt-2 mb-4">{inline(line.replace(/^#\s+/, ""), idx)}</h1>); }
    else if (/^[-*]\s+/.test(line)) { list.push(line.replace(/^[-*]\s+/, "")); }
    else if (line.trim() === "") { flushList(); }
    else { flushList(); blocks.push(<p key={idx} className="text-slate-600 leading-relaxed my-3">{inline(line, idx)}</p>); }
  });
  flushList();
  return <>{blocks}</>;
}

export default function PublicLegal({ slug }: { slug: string }) {
  const [data, setData] = useState<LegalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let live = true;
    fetch(`${API_URL}/api/app/legal/${slug}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => { if (live) { setData(d); setLoading(false); } })
      .catch(() => { if (live) { setError(true); setLoading(false); } });
    return () => { live = false; };
  }, [slug]);

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-slate-100 bg-white/90 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center gap-3">
          <span className="text-xl font-black tracking-tighter uppercase text-[#0F766E]">RAFIK</span>
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">Legal</span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-12">
        {loading && <p className="text-slate-400 font-medium">Loading…</p>}
        {error && <p className="text-slate-500">This page is not available right now. Please try again later.</p>}
        {data && (
          <article>
            {!data.content && <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-4">{data.title}</h1>}
            {data.content ? <Markdown src={data.content} /> : <p className="text-slate-500">This page has not been written yet.</p>}
            {data.updatedAt && <p className="text-xs text-slate-400 mt-10 pt-6 border-t border-slate-100">Last updated {new Date(data.updatedAt).toLocaleDateString()}</p>}
          </article>
        )}
      </div>

      <footer className="border-t border-slate-100 py-8 text-center">
        <p className="text-xs text-slate-400">© {new Date().getFullYear()} Rafik · Sétif, Algérie</p>
      </footer>
    </main>
  );
}
