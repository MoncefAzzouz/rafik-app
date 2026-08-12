import { haversineKm } from './truck';
import { ALGERIA_WILAYAS } from './wilayas';

// ── Free distance + geocoding (no Google, no API key, no billing) ──
// - Road distance/duration: OSRM public demo server (openstreetmap-based).
// - Reverse geocode (which wilaya a point is in): Nominatim (OpenStreetMap).
// Both are free with fair-use limits (~1 req/sec for Nominatim). Fine for launch;
// for scale, self-host OSRM/Nominatim or swap in a keyed provider — the URLs are
// env-configurable (OSRM_URL, NOMINATIM_URL) so nothing else changes.

const OSRM_URL = () => process.env.OSRM_URL || 'https://router.project-osrm.org';
const NOMINATIM_URL = () => process.env.NOMINATIM_URL || 'https://nominatim.openstreetmap.org';
const UA = 'RafikApp/1.0 (freight; contact: support@rafik.app)';

async function fetchJson(url: string, headers?: Record<string, string>): Promise<any | null> {
  try {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(7000) });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

export interface RoadDistance { km: number; durationMin: number | null; source: 'osrm' | 'haversine'; }

// Real driving distance A→B. Falls back to straight-line (haversine) if OSRM is unreachable.
export async function roadDistanceKm(pLat: number, pLng: number, dLat: number, dLng: number): Promise<RoadDistance> {
  const url = `${OSRM_URL()}/route/v1/driving/${pLng},${pLat};${dLng},${dLat}?overview=false`;
  const data = await fetchJson(url);
  const route = data?.routes?.[0];
  if (route && typeof route.distance === 'number') {
    return { km: Math.round(route.distance / 100) / 10, durationMin: route.duration != null ? Math.round(route.duration / 60) : null, source: 'osrm' };
  }
  return { km: Math.round(haversineKm(pLat, pLng, dLat, dLng) * 10) / 10, durationMin: null, source: 'haversine' };
}

// Normalize a place name for loose matching (drop accents, punctuation, filler words).
function norm(s: string): string {
  return (s || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\b(wilaya|province|prefecture|district|de|du|des|d|el|the|of)\b/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

// Pre-normalized lookup of our 58 wilayas.
const WILAYA_INDEX: { key: string; name: string }[] = ALGERIA_WILAYAS.map((w) => ({ key: norm(w.name), name: w.name }));
// A few English/variant exonyms Nominatim may return.
const ALIASES: Record<string, string> = { algiers: 'Alger', oran: 'Oran', constantine: 'Constantine', annaba: 'Annaba', setif: 'Sétif' };

// Best-guess our canonical wilaya name from any place string.
export function matchWilaya(raw?: string | null): string | null {
  if (!raw) return null;
  const n = norm(raw);
  if (!n) return null;
  if (ALIASES[n]) return ALIASES[n];
  const exact = WILAYA_INDEX.find((w) => w.key === n);
  if (exact) return exact.name;
  // contains either way (e.g. "setif province" vs "setif")
  const partial = WILAYA_INDEX.find((w) => n.includes(w.key) || w.key.includes(n));
  return partial ? partial.name : null;
}

export interface ReverseResult { wilaya: string | null; commune: string | null; display: string | null; }

// Which wilaya (and commune, if any) a coordinate falls in.
export async function reverseWilaya(lat: number, lng: number): Promise<ReverseResult> {
  const url = `${NOMINATIM_URL()}/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=fr&zoom=10`;
  const data = await fetchJson(url, { 'User-Agent': UA });
  const a = data?.address || {};
  const wilaya = matchWilaya(a.state) || matchWilaya(a.province) || matchWilaya(a.county) || matchWilaya(a.region) || matchWilaya(a.city) || matchWilaya(a.town);
  const commune = a.city || a.town || a.village || a.municipality || a.suburb || null;
  return { wilaya, commune, display: data?.display_name || null };
}
