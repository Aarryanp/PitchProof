// All model calls go through here (Gemini, server only).
// askJson sends a prompt and asks Gemini to answer in a fixed JSON shape,
// so the code can check the answer instead of parsing free text.
// Model: GEMINI_MODEL if set, else "gemini-flash-latest", Google's name for
// its current Flash model. (A fixed name like gemini-2.5-flash stopped working
// for new keys by 25 Nov 2026, so the default follows Google's latest.)

export const geminiModel = () => process.env.GEMINI_MODEL || "gemini-flash-latest";

// If that model is busy, the next one in this list is tried.
const backups = ["gemini-3.5-flash", "gemini-flash-lite-latest"];

export function hasGemini(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

export async function askJson<T>(prompt: string, schema: object, opts: { temperature?: number } = {}): Promise<T> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set");
  const send = (model: string) =>
    fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", responseSchema: schema, temperature: opts.temperature ?? 0.4 },
      }),
      signal: AbortSignal.timeout(60_000),
    });
  // "Busy, try again later" (429 or 503) or a retired model (404): wait a
  // moment and try the next model.
  const models = [geminiModel(), ...backups.filter((m) => m !== geminiModel())];
  let res = await send(models[0]);
  for (const model of models.slice(1)) {
    if (![404, 429, 503].includes(res.status)) break;
    await new Promise((r) => setTimeout(r, 1500));
    res = await send(model);
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Gemini: ${json?.error?.message ?? res.status}`);
  const text: string | undefined = json?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("");
  if (!text) throw new Error("Gemini gave an empty answer");
  return JSON.parse(text) as T;
}
