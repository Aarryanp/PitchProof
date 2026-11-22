// Copies the results we already paid for (21 Nov tests) into the Supabase
// cache table fetch_cache, so the agent reuses them instead of paying again.
// Run once:  node --env-file=.env.local scripts/seed-cache.mjs <folder with the crustdata-test JSON files>
// Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY. Safe to run twice (it keeps existing rows).
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const dir = process.argv[2];
if (!dir) throw new Error("Give the folder with olostep-cache-home.json etc.");
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });
const read = (f) => JSON.parse(readFileSync(join(dir, f), "utf8"));
// Must match urlKey() in lib/agent/cache.ts.
const urlKey = (u) => u.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/+$/, "");

const rows = new Map();
for (const f of ["olostep-cache-home.json", "olostep-cache-contact.json"]) {
  for (const [url, v] of Object.entries(read(f))) {
    const key = `olostep:${urlKey(url)}`;
    if (!rows.has(key)) rows.set(key, { key, source: "olostep", ok: Boolean(v.ok && v.md), data: v.ok ? { url, markdown: v.md } : { url, error: v.err } });
  }
}
for (const [name, v] of Object.entries(read("google-places-cache.json"))) {
  rows.set(`places:${name.toLowerCase()}`, { key: `places:${name.toLowerCase()}`, source: "google_places", ok: true, data: v });
}
const raw = read("nagpur-health-search-raw.json");
for (const c of raw.companies ?? []) {
  rows.set(`crustdata_company:${c.crustdata_company_id}`, { key: `crustdata_company:${c.crustdata_company_id}`, source: "crustdata", ok: true, data: c });
}
// Where the 21 Nov clinics search stopped, so a live search continues from there.
rows.set("crustdata_search:Clinics and hospitals|nagpur", { key: "crustdata_search:Clinics and hospitals|nagpur", source: "crustdata", ok: true, data: { cursor: raw.next_cursor ?? null, done: !raw.next_cursor } });

const { error } = await db.from("fetch_cache").upsert([...rows.values()], { onConflict: "key", ignoreDuplicates: true });
if (error) throw error;
console.log(`Saved ${rows.size} cached results.`);
