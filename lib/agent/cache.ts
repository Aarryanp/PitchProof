import { createAdminClient } from "@/lib/supabase/admin";

// Saved replies from paid or slow tools (Olostep, Crustdata, PageSpeed,
// Google Places), in the Supabase table fetch_cache. Every tool call looks
// here first and saves its answer here, so we never pay for the same thing
// twice. Only server code can read the table (it has no row-level policies).

export type CacheSource = "olostep" | "crustdata" | "pagespeed" | "google_places";

// The same address written a few ways (http/https, www, a trailing slash)
// gives the same key.
export function urlKey(url: string): string {
  return url.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/+$/, "");
}

export async function readCache<T>(key: string): Promise<{ ok: boolean; data: T } | null> {
  const { data } = await createAdminClient().from("fetch_cache").select("ok, data").eq("key", key).maybeSingle();
  return data ? { ok: data.ok as boolean, data: data.data as T } : null;
}

export async function writeCache(key: string, source: CacheSource, ok: boolean, data: unknown): Promise<void> {
  await createAdminClient().from("fetch_cache").upsert({ key, source, ok, data, fetched_at: new Date().toISOString() });
}

// All pages we've already read for one website (home, contact, about),
// so the contact step can look for an email without paying for a new read.
export async function cachedPagesFor(url: string): Promise<string[]> {
  const domain = urlKey(url).split("/")[0];
  const { data } = await createAdminClient()
    .from("fetch_cache")
    .select("data")
    .eq("source", "olostep")
    .eq("ok", true)
    .like("key", `olostep:${domain.replace(/[%_]/g, "\\$&")}%`);
  return (data ?? []).map((r) => (r.data as { markdown?: string }).markdown ?? "").filter(Boolean);
}
