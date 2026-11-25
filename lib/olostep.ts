import { readCache, urlKey, writeCache } from "@/lib/agent/cache";
import { olostepLive } from "@/lib/agent/settings";

// Step 2: read a web page as text (markdown) with Olostep.
// Looks in the cache first. A new read only happens when OLOSTEP_LIVE=on,
// because Olostep credits are very limited.

export type PageRead =
  | { status: "read"; url: string; markdown: string }
  | { status: "failed"; url: string; error: string } // the site didn't open
  | { status: "not_read"; url: string }; // not cached and live reads are off

export async function readPage(url: string): Promise<PageRead> {
  const key = `olostep:${urlKey(url)}`;
  const cached = await readCache<{ markdown?: string | null; error?: string | null }>(key);
  if (cached) {
    return cached.ok && cached.data.markdown
      ? { status: "read", url, markdown: cached.data.markdown }
      : { status: "failed", url, error: cached.data.error ?? "Site did not open" };
  }
  if (!olostepLive() || !process.env.OLOSTEP_API_KEY) return { status: "not_read", url };

  try {
    const res = await fetch("https://api.olostep.com/v1/scrapes", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OLOSTEP_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ url_to_scrape: url, formats: ["markdown"] }),
      signal: AbortSignal.timeout(60_000),
    });
    const json = await res.json().catch(() => ({}));
    const markdown: string | undefined = json?.result?.markdown_content;
    if (res.ok && markdown) {
      await writeCache(key, "olostep", true, { url, markdown });
      return { status: "read", url, markdown };
    }
    const error = json?.error?.message ?? json?.message ?? `Olostep answered ${res.status}`;
    // Only remember real "site is down" answers, not our own account problems.
    if (res.status < 500 && res.status !== 401 && res.status !== 402 && res.status !== 429) {
      await writeCache(key, "olostep", false, { url, error });
    }
    return { status: "failed", url, error };
  } catch (e) {
    return { status: "failed", url, error: e instanceof Error ? e.message : "Read failed" };
  }
}
