// All model calls go through here (Gemini, server only).
// askJson sends a prompt and asks Gemini to answer in a fixed JSON shape,
// so the code can check the answer instead of parsing free text.
// Model: GEMINI_MODEL if set, else a fast Flash model.

export const geminiModel = () => process.env.GEMINI_MODEL || "gemini-2.5-flash";

export function hasGemini(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

export async function askJson<T>(prompt: string, schema: object, opts: { temperature?: number } = {}): Promise<T> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set");
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${geminiModel()}:generateContent`, {
    method: "POST",
    headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json", responseSchema: schema, temperature: opts.temperature ?? 0.4 },
    }),
    signal: AbortSignal.timeout(60_000),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Gemini: ${json?.error?.message ?? res.status}`);
  const text: string | undefined = json?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("");
  if (!text) throw new Error("Gemini gave an empty answer");
  return JSON.parse(text) as T;
}
