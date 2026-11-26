import { readCache, urlKey, writeCache } from "@/lib/agent/cache";

// Step 3: measure a website on a phone with Google PageSpeed Insights.
// Free, but it needs PAGESPEED_API_KEY (the shared quota is used up).
// We keep only the numbers we use, not the whole report, and cache them.

export type SpeedReport = {
  url: string;
  finalUrl: string | null;
  performance: number | null; // 0–100
  seo: number | null; // 0–100
  loadSeconds: number | null; // Largest Contentful Paint: when the main content shows
  hasViewport: boolean | null; // false = not set up for phones
  hasTitle: boolean | null;
  hasDescription: boolean | null;
  https: boolean | null;
  pageMB: number | null; // everything the home page downloads, in megabytes
  topFixes: SpeedFix[]; // Google's own list of fixes, with the time each could save
};

// One fix from Google's report, in plain words, with Google's estimate of how
// much sooner the main content would show. Estimates overlap, so never add them up.
export type SpeedFix = { fix: string; seconds: number };

// Plain names for Google's fix ids. Anything not listed keeps Google's title.
const PLAIN: Record<string, string> = {
  "unused-javascript": "Remove code the page loads but never uses",
  "unused-css-rules": "Remove unused styling code",
  "unminified-css": "Compress the styling code",
  "unminified-javascript": "Compress the code",
  "image-delivery-insight": "Shrink and resize the images",
  "uses-optimized-images": "Shrink and resize the images",
  "modern-image-formats": "Shrink and resize the images",
  "uses-responsive-images": "Shrink and resize the images",
  "offscreen-images": "Load images only when they're needed",
  "render-blocking-resources": "Stop files from holding up the first view",
  "render-blocking-insight": "Stop files from holding up the first view",
  redirects: "Cut the extra redirects when the site opens",
  "document-latency-insight": "Make the server answer faster",
  "server-response-time": "Make the server answer faster",
  "font-display-insight": "Show text while fonts load",
  "third-parties-insight": "Trim heavy add-ons from other companies",
};

export type SpeedResult =
  | { status: "measured"; report: SpeedReport }
  | { status: "failed"; error: string } // PageSpeed could not open the site
  | { status: "unavailable"; error: string }; // no key or quota: say so, don't guess

type Audit = { score: number | null; numericValue?: number; title?: string; metricSavings?: { LCP?: number }; details?: { overallSavingsMs?: number } };

export async function measure(url: string): Promise<SpeedResult> {
  const key = `pagespeed:${urlKey(url)}`;
  const cached = await readCache<SpeedReport | { error: string }>(key);
  // Reports saved before 27 Nov have no fix list; measure those again (PageSpeed is free).
  if (cached && (!cached.ok || "topFixes" in (cached.data as object)))
    return cached.ok ? { status: "measured", report: cached.data as SpeedReport } : { status: "failed", error: (cached.data as { error: string }).error };

  const apiKey = process.env.PAGESPEED_API_KEY;
  if (!apiKey) return { status: "unavailable", error: "No PageSpeed key" };

  const q = new URLSearchParams({ url, strategy: "mobile", key: apiKey });
  q.append("category", "performance");
  q.append("category", "seo");
  try {
    const res = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${q}`, { signal: AbortSignal.timeout(90_000) });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const error: string = json?.error?.message ?? `PageSpeed answered ${res.status}`;
      // 400/500 with "unable to resolve" or "failed to load" means the site itself is broken.
      const siteProblem = /resolve|failed to load|ERRORED_DOCUMENT_REQUEST|FAILED_DOCUMENT_REQUEST|NO_FCP|timed out/i.test(error);
      if (siteProblem) {
        await writeCache(key, "pagespeed", false, { error });
        return { status: "failed", error };
      }
      return { status: "unavailable", error };
    }
    const lh = json.lighthouseResult ?? {};
    const audits: Record<string, Audit> = lh.audits ?? {};
    const pass = (id: string) => (audits[id] && audits[id].score !== null ? audits[id].score === 1 : null);
    const score = (id: string) => (typeof lh.categories?.[id]?.score === "number" ? Math.round(lh.categories[id].score * 100) : null);
    const lcp = audits["largest-contentful-paint"]?.numericValue;
    const finalUrl: string | null = lh.finalDisplayedUrl ?? lh.finalUrl ?? null;
    const report: SpeedReport = {
      url,
      finalUrl,
      performance: score("performance"),
      seo: score("seo"),
      loadSeconds: typeof lcp === "number" ? Math.round(lcp / 100) / 10 : null,
      hasViewport: pass("viewport"),
      hasTitle: pass("document-title"),
      hasDescription: pass("meta-description"),
      https: finalUrl ? finalUrl.startsWith("https://") : null,
      pageMB: typeof audits["total-byte-weight"]?.numericValue === "number" ? Math.round(audits["total-byte-weight"].numericValue / 100_000) / 10 : null,
      topFixes: speedFixes(audits),
    };
    await writeCache(key, "pagespeed", true, report);
    return { status: "measured", report };
  } catch (e) {
    return { status: "unavailable", error: e instanceof Error ? e.message : "PageSpeed failed" };
  }
}

// Google's fixes that would make the main content show at least half a second
// sooner, biggest first, one line per plain-word fix, at most three.
export function speedFixes(audits: Record<string, Audit>): SpeedFix[] {
  const best = new Map<string, number>();
  for (const [id, a] of Object.entries(audits)) {
    if (a.score === 1) continue; // already passing
    const ms = a.metricSavings?.LCP ?? a.details?.overallSavingsMs ?? 0;
    if (ms < 500) continue;
    const fix = PLAIN[id] ?? a.title ?? id;
    best.set(fix, Math.max(best.get(fix) ?? 0, ms));
  }
  return [...best.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([fix, ms]) => ({ fix, seconds: Math.round(ms / 100) / 10 }));
}

