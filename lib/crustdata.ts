import { readCache, writeCache } from "@/lib/agent/cache";
import { CRUSTDATA_MAX_PER_CALL, crustdataLive } from "@/lib/agent/settings";
import type { BusinessType } from "@/lib/business-types";

// Step 1: find businesses with Crustdata company search.
// Costs 0.03 credits per business returned, so it only runs when
// CRUSTDATA_LIVE=on, asks for at most 20 at a time, and remembers where it
// stopped (the "cursor"), so the next search gets new businesses, not the same ones.

const BASE = "https://api.crustdata.com";
const headers = () => ({
  Authorization: `Bearer ${process.env.CRUSTDATA_API_KEY}`,
  "x-api-version": "2025-11-01",
  "Content-Type": "application/json",
});

export type FoundCompany = {
  crustdataId: string;
  name: string;
  website: string | null;
  description: string | null;
  size: string | null;
};

// Free: turns "Nagpur" into the exact place names Crustdata uses.
export async function cityValues(city: string): Promise<string[]> {
  const key = `crustdata_city:${city.trim().toLowerCase()}`;
  const cached = await readCache<string[]>(key);
  if (cached) return cached.data;
  const res = await fetch(`${BASE}/company/search/autocomplete`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ field: "locations.headquarters", query: city.trim(), limit: 10 }),
  });
  if (!res.ok) throw new Error(`Crustdata autocomplete answered ${res.status}`);
  const json = await res.json();
  const name = city.trim().toLowerCase();
  const values: string[] = (json.suggestions ?? []).map((s: { value: string }) => s.value).filter((v: string) => v.toLowerCase().startsWith(`${name},`));
  await writeCache(key, "crustdata", true, values);
  return values;
}

type SearchState = { cursor: string | null; done: boolean };

// Asks Crustdata for the next batch of businesses for this type and city.
// Returns [] when live calls are off or there are no more.
export async function findCompanies(type: BusinessType, city: string, want: number): Promise<{ companies: FoundCompany[]; spent: boolean }> {
  if (!crustdataLive() || !process.env.CRUSTDATA_API_KEY || type.industries.length === 0) return { companies: [], spent: false };
  const places = await cityValues(city);
  if (places.length === 0) return { companies: [], spent: false };

  const stateKey = `crustdata_search:${type.label}|${city.trim().toLowerCase()}`;
  const state = (await readCache<SearchState>(stateKey))?.data ?? { cursor: null, done: false };
  if (state.done) return { companies: [], spent: false };

  const body: Record<string, unknown> = {
    filters: {
      op: "and",
      conditions: [
        { field: "locations.headquarters", type: "in", value: places },
        { field: "basic_info.industries", type: "in", value: type.industries },
        { field: "basic_info.employee_count_range", type: "in", value: ["1", "1-10", "2-10", "11-50"] },
        { field: "basic_info.website", type: "!=", value: "" },
      ],
    },
    limit: Math.min(Math.max(want, 1), CRUSTDATA_MAX_PER_CALL),
    fields: ["crustdata_company_id", "basic_info.name", "basic_info.website", "basic_info.primary_domain", "basic_info.employee_count_range", "basic_info.description", "locations.headquarters"],
  };
  if (state.cursor) body.cursor = state.cursor;

  const res = await fetch(`${BASE}/company/search`, { method: "POST", headers: headers(), body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Crustdata search answered ${res.status}: ${json?.message ?? json?.error ?? ""}`);

  type Raw = { crustdata_company_id: number; basic_info?: { name?: string; website?: string; primary_domain?: string; description?: string; employee_count_range?: string } };
  const raw: Raw[] = json.companies ?? [];
  for (const c of raw) await writeCache(`crustdata_company:${c.crustdata_company_id}`, "crustdata", true, c);
  await writeCache(stateKey, "crustdata", true, { cursor: json.next_cursor ?? null, done: !json.next_cursor } satisfies SearchState);

  const keyword = type.keyword?.toLowerCase();
  const companies = raw
    .map((c) => ({
      crustdataId: String(c.crustdata_company_id),
      name: c.basic_info?.name ?? "",
      website: c.basic_info?.website || (c.basic_info?.primary_domain ? `https://${c.basic_info.primary_domain}` : null),
      description: c.basic_info?.description ?? null,
      size: c.basic_info?.employee_count_range ?? null,
    }))
    .filter((c) => c.name && (!keyword || `${c.name} ${c.description ?? ""}`.toLowerCase().includes(keyword)));
  return { companies, spent: true };
}
