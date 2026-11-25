// All model calls go through here (Gemini, server only).
// askJson sends a prompt and asks Gemini to answer in a fixed JSON shape,
// so the code can check the answer instead of parsing free text.
// Model: GEMINI_MODEL if set, else "gemini-flash-latest", Google's name for
// its current Flash model. (A fixed name like gemini-2.5-flash stopped working
// for new keys by 25 Nov 2026, so the default follows Google's latest.)

export const geminiModel = () => process.env.GEMINI_MODEL || "gemini-flash-latest";

// If that model is busy, the next one in this list is tried.
const backups = ["gemini-flash-lite-latest", "gemini-3.5-flash"];

const lowOnly = new Set<string>(); // models that said no to "minimal" thinking

export function hasGemini(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

export async function askJson<T>(prompt: string, schema: object, opts: { temperature?: number } = {}): Promise<T> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set");
  // Thinking as little as each model allows: these are short, rule-checked
  // texts, and full thinking made each email take 20–50 seconds. Models that
  // refuse "minimal" are remembered and asked for "low" instead.
  const post = (model: string, thinkingLevel: string) =>
    fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: schema,
          temperature: opts.temperature ?? 0.4,
          thinkingConfig: { thinkingLevel },
        },
      }),
      signal: AbortSignal.timeout(30_000),
    }).catch(() => null); // a timeout or network error counts as "busy"
  const send = async (model: string) => {
    if (!lowOnly.has(model)) {
      const res = await post(model, "minimal");
      if (res?.status !== 400) return res;
      const err = await res.clone().json().catch(() => ({}));
      if (!/thinking/i.test(err?.error?.message ?? "")) return res;
      lowOnly.add(model);
    }
    return post(model, "low");
  };

  // Busy (429/503/timeout) or retired (404)? Try the next model. After going
  // through the list once, wait a few seconds and go through it again, since
  // "busy" on the free plan usually clears within a minute.
  const models = [geminiModel(), ...backups.filter((m) => m !== geminiModel())];
  const retired = new Set<string>();
  let res: Response | null = null;
  outer: for (const pause of [0, 5000]) {
    if (pause) await new Promise((r) => setTimeout(r, pause));
    for (const model of models) {
      if (retired.has(model)) continue;
      res = await send(model);
      if (res && ![404, 429, 503].includes(res.status)) break outer;
      if (res?.status === 404) retired.add(model);
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  if (!res) throw new Error("Gemini didn't answer in time. Try again in a minute.");
  const json = await res.json().catch(() => ({}));
  if ([429, 503].includes(res.status)) throw new Error("Gemini is busy or over its free limit right now. Try again in a minute.");
  if (!res.ok) throw new Error(`Gemini: ${json?.error?.message ?? res.status}`);
  const text: string | undefined = json?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("");
  if (!text) throw new Error("Gemini gave an empty answer");
  return JSON.parse(text) as T;
}
